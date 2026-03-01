import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getSummary() {
  const sessions = await prisma.session.findMany({
    where: { phase: 'COMPLETED' },
    select: { score: true, maxScore: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });

  if (sessions.length === 0) {
    return { totalSessions: 0, averageScore: 0, bestScore: 0, trend: 'neutral' };
  }

  const scores = sessions.map((s) => s.score ?? 0);
  const totalSessions = sessions.length;
  const averageScore = Math.round((scores.reduce((a, b) => a + b, 0) / totalSessions) * 10) / 10;
  const bestScore = Math.max(...scores);

  // Trend: compare last 3 sessions average vs previous 3
  let trend = 'neutral';
  if (totalSessions >= 6) {
    const recent = scores.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
    const previous = scores.slice(3, 6).reduce((a, b) => a + b, 0) / 3;
    trend = recent > previous ? 'improving' : recent < previous ? 'declining' : 'neutral';
  }

  return { totalSessions, averageScore, bestScore, trend };
}

export async function getHistory(page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  const [sessions, total] = await Promise.all([
    prisma.session.findMany({
      where: { phase: 'COMPLETED' },
      select: {
        id: true,
        mode: true,
        score: true,
        maxScore: true,
        createdAt: true,
        completedAt: true,
        memorizeTimeSpent: true,
        recallTimeSpent: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.session.count({ where: { phase: 'COMPLETED' } }),
  ]);

  return { sessions, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getFieldPerformance() {
  const questions = await prisma.question.findMany({
    where: {
      session: { phase: 'COMPLETED' },
      isCorrect: { not: null },
    },
    select: { fieldTested: true, isCorrect: true },
  });

  const stats = {};
  for (const q of questions) {
    if (!stats[q.fieldTested]) {
      stats[q.fieldTested] = { total: 0, correct: 0 };
    }
    stats[q.fieldTested].total++;
    if (q.isCorrect) stats[q.fieldTested].correct++;
  }

  return Object.entries(stats).map(([field, { total, correct }]) => ({
    field,
    total,
    correct,
    accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
  }));
}
