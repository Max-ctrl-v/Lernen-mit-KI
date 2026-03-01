export function errorHandler(err, req, res, next) {
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.path} — ${err.message}`);

  const status = err.status || 500;

  // Only expose error details for client errors (4xx)
  // Hide internal details for server errors (5xx)
  const message = status < 500
    ? err.message
    : 'Ein interner Fehler ist aufgetreten.';

  res.status(status).json({ error: message });
}
