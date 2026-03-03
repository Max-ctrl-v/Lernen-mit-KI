const attempts = new Map(); // ip -> { count, resetAt }

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 60 * 1000; // 1 minute

// Periodically clean up expired entries to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of attempts) {
    if (now > entry.resetAt) attempts.delete(ip);
  }
}, WINDOW_MS).unref();

export function loginRateLimit(req, res, next) {
  const ip = req.ip || req.connection?.remoteAddress || 'unknown';
  const now = Date.now();

  let entry = attempts.get(ip);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + WINDOW_MS };
    attempts.set(ip, entry);
  }

  entry.count++;

  if (entry.count > MAX_ATTEMPTS) {
    const secondsLeft = Math.ceil((entry.resetAt - now) / 1000);
    return res.status(429).json({
      error: `Zu viele Anmeldeversuche. Versuche es in ${secondsLeft} Sekunden erneut.`,
    });
  }

  next();
}
