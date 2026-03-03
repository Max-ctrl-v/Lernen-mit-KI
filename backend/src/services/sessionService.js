import prisma from '../lib/prisma.js';
import { PHASE_ORDER, PHASES, TIMERS } from '../config/constants.js';
import { generateCards } from './cardGenerator.js';
import { generateQuestions } from './questionGenerator.js';

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

  // Use createMany instead of N individual creates — 1 INSERT instead of 8
  await prisma.card.createMany({ data: cardsData });

  // Fetch the created cards (needed by questionGenerator for IDs)
  const cards = await prisma.card.findMany({
    where: { sessionId: session.id },
    orderBy: { position: 'asc' },
  });

  const questionsData = generateQuestions(session.id, cards);

  // Use createMany instead of N individual creates — 1 INSERT instead of 25
  await prisma.question.createMany({ data: questionsData });

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

// Lightweight fetch that only grabs phase — used by questions route
export async function getSessionPhase(id) {
  return prisma.session.findUnique({
    where: { id },
    select: { id: true, phase: true },
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
  // Use select to exclude sensitive fields at the DB level during RECALL
  if (phase === PHASES.RECALL) {
    return prisma.question.findMany({
      where: { sessionId },
      orderBy: { position: 'asc' },
      select: {
        id: true,
        sessionId: true,
        position: true,
        questionText: true,
        fieldTested: true,
        targetCardId: true,
        options: true,
        selectedIndex: true,
        // correctIndex and isCorrect intentionally excluded
      },
    });
  }

  return prisma.question.findMany({
    where: { sessionId },
    orderBy: { position: 'asc' },
  });
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

  // Build a lookup map instead of using .find() in a loop (O(n) -> O(1) per lookup)
  const questionMap = new Map(session.questions.map((q) => [q.id, q]));

  let score = 0;
  const answeredIds = new Set();
  const updates = [];

  for (const { questionId, selectedIndex } of answers) {
    const question = questionMap.get(questionId);
    if (!question) continue;

    const isCorrect = selectedIndex === question.correctIndex;
    if (isCorrect) score++;
    answeredIds.add(questionId);

    updates.push(prisma.question.update({
      where: { id: questionId },
      data: { selectedIndex, isCorrect },
    }));
  }

  // Mark unanswered questions as incorrect
  for (const q of session.questions) {
    if (!answeredIds.has(q.id)) {
      updates.push(prisma.question.update({
        where: { id: q.id },
        data: { selectedIndex: null, isCorrect: false },
      }));
    }
  }

  updates.push(prisma.session.update({
    where: { id: sessionId },
    data: {
      phase: PHASES.COMPLETED,
      score,
      recallTimeSpent,
      completedAt: new Date(),
    },
  }));

  await prisma.$transaction(updates);

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
