/**
 * Centralized error handler middleware
 */
export function errorHandler(err, req, res, next) {
  console.error('[Server Error]:', err);

  const statusCode = err.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
}

