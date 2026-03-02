import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import { extractText } from './textExtractor.js';
import { generateQuizQuestions } from './quizGenerator.js';
import { generateImage } from './imageGenerator.js';

const prisma = new PrismaClient();

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
  fs.unlink(file.path).catch(() => {});

  if (!extractedText || extractedText.trim().length < 50) {
    const err = new Error('Nicht genügend Text im Dokument gefunden. Bitte lade ein anderes Dokument hoch.');
    err.status = 400;
    throw err;
  }

  const truncated = extractedText.slice(0, 12000);
  const questions = await generateQuizQuestions(truncated, questionCount);

  if (!Array.isArray(questions) || questions.length === 0) {
    const err = new Error('Fehler beim Erstellen der Fragen. Bitte versuche es erneut.');
    err.status = 500;
    throw err;
  }

  // Generate images in parallel for questions that have imagePrompt (unless skipped)
  let imageUrls;
  if (skipImages) {
    imageUrls = questions.map(() => null);
  } else {
    imageUrls = await Promise.all(
      questions.map((q) => q.imagePrompt ? generateImage(q.imagePrompt) : Promise.resolve(null))
    );
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
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: { questions: true },
  });

  if (!quiz) return null;

  // Reset all question answers
  await prisma.quizQuestion.updateMany({
    where: { quizId },
    data: { selectedIndex: null, isCorrect: null },
  });

  // Reset quiz status and score
  await prisma.quiz.update({
    where: { id: quizId },
    data: { status: 'READY', score: null, completedAt: null },
  });

  return prisma.quiz.findUnique({
    where: { id: quizId },
    ...quizWithQuestions,
  });
}

export async function submitQuizAnswers(quizId, answers) {
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: { questions: true },
  });

  if (!quiz) {
    const err = new Error('Quiz nicht gefunden');
    err.status = 404;
    throw err;
  }

  let score = 0;

  for (const { questionId, selectedIndex } of answers) {
    const question = quiz.questions.find((q) => q.id === questionId);
    if (!question) continue;

    const isCorrect = selectedIndex === question.correctIndex;
    if (isCorrect) score++;

    await prisma.quizQuestion.update({
      where: { id: questionId },
      data: { selectedIndex, isCorrect },
    });
  }

  const answeredIds = new Set(answers.map((a) => a.questionId));
  for (const q of quiz.questions) {
    if (!answeredIds.has(q.id)) {
      await prisma.quizQuestion.update({
        where: { id: q.id },
        data: { selectedIndex: null, isCorrect: false },
      });
    }
  }

  await prisma.quiz.update({
    where: { id: quizId },
    data: { status: 'COMPLETED', score, completedAt: new Date() },
  });

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
