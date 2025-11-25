import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
let logsDirExists = false;
try {
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true, mode: 0o755 });
  }
  logsDirExists = true;
} catch (error) {
  // If we can't create logs directory (permission issues in Docker),
  // we'll fall back to console-only logging
  console.warn('Warning: Could not create logs directory, using console logging only:', error.message);
  logsDirExists = false;
}

// Custom format for logs
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta, null, 2)}`;
    }
    return msg;
  })
);

// Create logger instance
const transports = [];

// Only add file transports if logs directory exists and is writable
if (logsDirExists) {
  try {
    // Test write permissions
    fs.accessSync(logsDir, fs.constants.W_OK);
    transports.push(
      // Error log file
      new winston.transports.File({
        filename: path.join(logsDir, 'error.log'),
        level: 'error',
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      }),
      // Combined log file
      new winston.transports.File({
        filename: path.join(logsDir, 'combined.log'),
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      }),
      // Exception log file
      new winston.transports.File({
        filename: path.join(logsDir, 'exceptions.log'),
        handleExceptions: true,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      })
    );
  } catch (error) {
    console.warn('Warning: Logs directory is not writable, using console logging only:', error.message);
  }
}

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'mentor-platform' },
  transports,
});

// Add console transport for non-production environments
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
}

// Helper function to redact sensitive information
const redactSensitiveData = (data) => {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const sensitiveFields = ['password', 'password_hash', 'token', 'secret', 'api_key', 'authorization'];
  const redacted = { ...data };

  for (const field of sensitiveFields) {
    if (redacted[field]) {
      redacted[field] = '***REDACTED***';
    }
  }

  return redacted;
};

// Override logger methods to redact sensitive data
const originalLog = logger.log.bind(logger);
logger.log = function (level, message, meta, ...args) {
  const redactedMeta = meta ? redactSensitiveData(meta) : meta;
  return originalLog(level, message, redactedMeta, ...args);
};

export default logger;

