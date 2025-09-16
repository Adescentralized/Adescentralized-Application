export function errorHandler(err, req, res, next) {
  console.error('[API ERROR]', err);
  const status = err.status || 500;
  res.status(status).json({ ok: false, error: err.message || 'internal_error' });
}
