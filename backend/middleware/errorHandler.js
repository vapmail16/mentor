import { logger } from '../utils/logger.js';

/**
 * Custom error class for application errors
 */
export class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Global error handling middleware
 * Must be the last middleware in the chain
 */
export const errorHandler = (err, req, res, next) => {
  const requestId = req.id || 'unknown';
  
  // Log the error with context
  logger.error('Request error', err, {
    requestId,
    userId: req.user?.userId,
    endpoint: req.path,
    method: req.method,
    ip: req.ip,
  });

  // Determine status code
  const statusCode = err.statusCode || 500;
  
  // Determine error message
  let message = 'An error occurred. Please try again later.';
  if (err.isOperational || process.env.NODE_ENV === 'development') {
    message = err.message || message;
  }

  // Prepare error response
  const errorResponse = {
    success: false,
    error: {
      message,
      requestId,
      ...(process.env.NODE_ENV === 'development' && {
        stack: err.stack,
        details: err,
      }),
    },
  };

  res.status(statusCode).json(errorResponse);
};

