import prisma from '../lib/prisma.js';
import fs from 'fs/promises';
import { extractText } from './textExtractor.js';
import { generateQuizQuestions } from './quizGenerator.js';
import { generateImage } from './imageGenerator.js';

// Simple concurrency limiter — avoids flooding the DALL-E API
function limitConcurrency(tasks, concurrency) {
  const results = new Array(tasks.length);
  let nextIndex = 0;

  async function runNext() {
    while (nextIndex < tasks.length) {
      const idx = nextIndex++;
      results[idx] = await tasks[idx]();
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, tasks.length) }, () => runNext());
  return Promise.all(workers).then(() => results);
}

// Shared select to exclude extractedText from API responses
const quizSelect = {
  id: true, title: true, sourceFile: true, sourceType: true,
  questionCount: true, maxScore: true, score: true,
  status: true, createdAt: true, completedAt: true,
};

const quizWithQuestions = {
  select: {
    ...quizSelect,
    questions: { orderBy: { position: 'asc' } },
  },
};

export async function createQuiz(file, questionCount, skipImages = false) {
  const ext = file.originalname.split('.').pop().toLowerCase();
  const sourceType = ext === 'pdf' ? 'pdf' : ext === 'txt' ? 'txt' : 'image';

  const extractedText = await extractText(file.path, sourceType);

  // Delete the uploaded source file immediately — no longer needed after extraction
  fs.unlink(file.path).catch(err => console.warn('Failed to delete upload:', err.message));

  if (!extractedText || extractedText.trim().length < 50) {
    const err = new Error('Nicht genügend Text im Dokument gefunden. Bitte lade ein anderes Dokument hoch.');
    err.status = 400;
    throw err;
  }

  // Truncate once here — quizGenerator.sanitizeInput no longer needs to re-truncate
  const truncated = extractedText.slice(0, 12000);
  const questions = await generateQuizQuestions(truncated, questionCount);

  if (!Array.isArray(questions) || questions.length === 0) {
    const err = new Error('Fehler beim Erstellen der Fragen. Bitte versuche es erneut.');
    err.status = 500;
    throw err;
  }

  // Generate images with concurrency limit of 3 to avoid DALL-E rate limits
  let imageUrls;
  if (skipImages) {
    imageUrls = questions.map(() => null);
  } else {
    const tasks = questions.map((q) => () =>
      q.imagePrompt ? generateImage(q.imagePrompt) : Promise.resolve(null)
    );
    imageUrls = await limitConcurrency(tasks, 3);
  }

  const title = file.originalname.replace(/\.[^.]+$/, '');

  const quiz = await prisma.quiz.create({
    data: {
      title,
      sourceFile: '(deleted after processing)',
      sourceType,
      extractedText: truncated,
      questionCount: questions.length,
      maxScore: questions.length,
      status: 'READY',
      questions: {
        create: questions.map((q, idx) => ({
          position: idx + 1,
          questionText: q.questionText,
          options: JSON.stringify(q.options),
          correctIndex: q.correctIndex,
          explanation: q.explanation,
          imageUrl: imageUrls[idx] || null,
        })),
      },
    },
    ...quizWithQuestions,
  });

  return quiz;
}

export async function getQuiz(id) {
  return prisma.quiz.findUnique({
    where: { id },
    ...quizWithQuestions,
  });
}

export async function retakeQuiz(quizId) {
  // Skip the separate existence check — just run the updates directly.
  // If the quiz does not exist, the update will throw P2025 which we catch.
  try {
    await Promise.all([
      prisma.quizQuestion.updateMany({
        where: { quizId },
        data: { selectedIndex: null, isCorrect: null },
      }),
      prisma.quiz.update({
        where: { id: quizId },
        data: { status: 'READY', score: null, completedAt: null },
      }),
    ]);
  } catch (err) {
    if (err.code === 'P2025') return null;
    throw err;
  }

  return prisma.quiz.findUnique({
    where: { id: quizId },
    ...quizWithQuestions,
  });
}

export async function submitQuizAnswers(quizId, answers) {
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    select: { id: true, questions: { select: { id: true, correctIndex: true } } },
  });

  if (!quiz) {
    const err = new Error('Quiz nicht gefunden');
    err.status = 404;
    throw err;
  }

  // Build a lookup map instead of using .find() in a loop
  const questionMap = new Map(quiz.questions.map((q) => [q.id, q]));

  let score = 0;
  const updates = [];

  for (const { questionId, selectedIndex } of answers) {
    const question = questionMap.get(questionId);
    if (!question) continue;

    const isCorrect = selectedIndex === question.correctIndex;
    if (isCorrect) score++;

    updates.push(prisma.quizQuestion.update({
      where: { id: questionId },
      data: { selectedIndex, isCorrect },
    }));
  }

  const answeredIds = new Set(answers.map((a) => a.questionId));
  for (const q of quiz.questions) {
    if (!answeredIds.has(q.id)) {
      updates.push(prisma.quizQuestion.update({
        where: { id: q.id },
        data: { selectedIndex: null, isCorrect: false },
      }));
    }
  }

  updates.push(prisma.quiz.update({
    where: { id: quizId },
    data: { status: 'COMPLETED', score, completedAt: new Date() },
  }));

  await prisma.$transaction(updates);

  return prisma.quiz.findUnique({
    where: { id: quizId },
    ...quizWithQuestions,
  });
}

export async function getQuizHistory(page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  const [quizzes, total] = await Promise.all([
    prisma.quiz.findMany({
      where: { status: 'COMPLETED' },
      select: {
        id: true, title: true, score: true, maxScore: true,
        questionCount: true, createdAt: true, completedAt: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.quiz.count({ where: { status: 'COMPLETED' } }),
  ]);
  return { quizzes, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function deleteQuiz(id) {
  return prisma.quiz.delete({ where: { id } });
}
