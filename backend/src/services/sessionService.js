import { PrismaClient } from '@prisma/client';
import { PHASE_ORDER, PHASES, TIMERS } from '../config/constants.js';
import { generateCards } from './cardGenerator.js';
import { generateQuestions } from './questionGenerator.js';

const prisma = new PrismaClient();

export async function createSession(mode, distractionDuration) {
  const session = await prisma.session.create({
    data: {
      mode,
      phase: PHASES.MEMORIZE,
      memorizeDuration: TIMERS.MEMORIZE,
      distractionDuration: distractionDuration ?? TIMERS.DISTRACTION,
      recallDuration: TIMERS.RECALL,
    },
  });

  const cardsData = await generateCards(session.id);
  const cards = await prisma.$transaction(
    cardsData.map((c) => prisma.card.create({ data: c }))
  );

  const questionsData = generateQuestions(session.id, cards);
  await prisma.$transaction(
    questionsData.map((q) => prisma.question.create({ data: q }))
  );

  return prisma.session.findUnique({
    where: { id: session.id },
    include: { cards: { orderBy: { position: 'asc' } } },
  });
}

export async function getSession(id) {
  return prisma.session.findUnique({
    where: { id },
    include: { cards: { orderBy: { position: 'asc' } } },
  });
}

export async function advancePhase(id, newPhase, timeSpent) {
  const session = await prisma.session.findUnique({ where: { id } });
  if (!session) throw Object.assign(new Error('Session not found'), { status: 404 });

  const currentIdx = PHASE_ORDER.indexOf(session.phase);
  const newIdx = PHASE_ORDER.indexOf(newPhase);

  if (newIdx <= currentIdx) {
    throw Object.assign(new Error('Can only advance forward'), { status: 400 });
  }

  const data = { phase: newPhase };
  if (newPhase === PHASES.DISTRACTION && timeSpent != null) {
    data.memorizeTimeSpent = timeSpent;
  }
  if (newPhase === PHASES.COMPLETED && timeSpent != null) {
    data.recallTimeSpent = timeSpent;
  }

  return prisma.session.update({ where: { id }, data });
}

export async function getQuestions(sessionId, phase) {
  const questions = await prisma.question.findMany({
    where: { sessionId },
    orderBy: { position: 'asc' },
  });

  // Hide correct answers during RECALL in exam mode
  if (phase === PHASES.RECALL) {
    return questions.map(({ correctIndex, isCorrect, ...q }) => q);
  }

  return questions;
}

export async function submitAnswers(sessionId, answers, recallTimeSpent) {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { questions: true },
  });

  if (!session) throw Object.assign(new Error('Session not found'), { status: 404 });
  if (session.phase !== PHASES.RECALL) {
    throw Object.assign(new Error('Session is not in RECALL phase'), { status: 400 });
  }

  let score = 0;
  const answeredIds = new Set();

  for (const { questionId, selectedIndex } of answers) {
    const question = session.questions.find((q) => q.id === questionId);
    if (!question) continue;

    const isCorrect = selectedIndex === question.correctIndex;
    if (isCorrect) score++;
    answeredIds.add(questionId);

    await prisma.question.update({
      where: { id: questionId },
      data: { selectedIndex, isCorrect },
    });
  }

  // Mark unanswered questions as incorrect
  for (const q of session.questions) {
    if (!answeredIds.has(q.id)) {
      await prisma.question.update({
        where: { id: q.id },
        data: { selectedIndex: null, isCorrect: false },
      });
    }
  }

  await prisma.session.update({
    where: { id: sessionId },
    data: {
      phase: PHASES.COMPLETED,
      score,
      recallTimeSpent,
      completedAt: new Date(),
    },
  });

  return prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      cards: { orderBy: { position: 'asc' } },
      questions: { orderBy: { position: 'asc' } },
    },
  });
}

export async function deleteSession(id) {
  return prisma.session.delete({ where: { id } });
}
