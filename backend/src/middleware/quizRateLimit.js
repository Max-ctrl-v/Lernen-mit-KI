const hits = new Map(); // ip -> { count, resetAt }

const MAX_QUIZZES = 5;
const WINDOW_MS = 60 * 60 * 1000; // 1 hour

// Periodically clean up expired entries to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of hits) {
    if (now > entry.resetAt) hits.delete(ip);
  }
}, WINDOW_MS).unref();

export function quizRateLimit(req, res, next) {
  // Only accept bypass code from POST body (never query params — those get logged)
  const bypassCode = req.body?.bypassCode;
  if (bypassCode === process.env.RATE_LIMIT_BYPASS_CODE) {
    return next();
  }

  const ip = req.ip || req.connection?.remoteAddress || 'unknown';
  const now = Date.now();

  let entry = hits.get(ip);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + WINDOW_MS };
    hits.set(ip, entry);
  }

  entry.count++;

  if (entry.count > MAX_QUIZZES) {
    const minutesLeft = Math.ceil((entry.resetAt - now) / 60000);
    return res.status(429).json({
      error: `Limit erreicht (${MAX_QUIZZES} Quizze pro Stunde). Versuche es in ${minutesLeft} Min. erneut — oder gib den Code ein.`,
      rateLimited: true,
      minutesLeft,
    });
  }

  next();
}
