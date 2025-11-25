import { v4 as uuidv4 } from 'uuid';

/**
 * Middleware to add a unique request ID to each request
 * This helps with tracing requests through logs
 */
export const requestIdMiddleware = (req, res, next) => {
  const requestId = req.headers['x-request-id'] || uuidv4();
  req.id = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
};

