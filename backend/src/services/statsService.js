import prisma from '../lib/prisma.js';

export async function getSummary() {
  // Use aggregate to compute stats at the DB level instead of loading all rows
  const [agg, recentSix] = await Promise.all([
    prisma.session.aggregate({
      where: { phase: 'COMPLETED' },
      _count: { _all: true },
      _avg: { score: true },
      _max: { score: true },
    }),
    // Only fetch the 6 most recent scores for trend calculation
    prisma.session.findMany({
      where: { phase: 'COMPLETED' },
      select: { score: true },
      orderBy: { createdAt: 'desc' },
      take: 6,
    }),
  ]);

  const totalSessions = agg._count._all;
  if (totalSessions === 0) {
    return { totalSessions: 0, averageScore: 0, bestScore: 0, trend: 'neutral' };
  }

  const averageScore = Math.round((agg._avg.score ?? 0) * 10) / 10;
  const bestScore = agg._max.score ?? 0;

  // Trend: compare last 3 sessions average vs previous 3
  let trend = 'neutral';
  if (recentSix.length >= 6) {
    const scores = recentSix.map((s) => s.score ?? 0);
    const recent = (scores[0] + scores[1] + scores[2]) / 3;
    const previous = (scores[3] + scores[4] + scores[5]) / 3;
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
  // Use groupBy to aggregate at the DB level instead of loading every question
  const groups = await prisma.question.groupBy({
    by: ['fieldTested', 'isCorrect'],
    where: {
      session: { phase: 'COMPLETED' },
      isCorrect: { not: null },
    },
    _count: { _all: true },
  });

  // Combine the groupBy results into { field -> { total, correct } }
  const stats = {};
  for (const row of groups) {
    if (!stats[row.fieldTested]) {
      stats[row.fieldTested] = { total: 0, correct: 0 };
    }
    stats[row.fieldTested].total += row._count._all;
    if (row.isCorrect) {
      stats[row.fieldTested].correct += row._count._all;
    }
  }

  return Object.entries(stats).map(([field, { total, correct }]) => ({
    field,
    total,
    correct,
    accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
  }));
}
