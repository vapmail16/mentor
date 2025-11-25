// CRITICAL: Set environment variables BEFORE any imports
// This must be at the very top, before dotenv.config() runs
if (!process.env.DB_HOST) process.env.DB_HOST = 'localhost';
if (!process.env.DB_NAME) process.env.DB_NAME = 'mentor_platform';
if (!process.env.DB_USER) process.env.DB_USER = 'user';
if (!process.env.DB_PASSWORD) process.env.DB_PASSWORD = '';
if (!process.env.JWT_SECRET) process.env.JWT_SECRET = 'test-secret-key-minimum-32-characters-long-for-testing-purposes-only';
if (!process.env.NODE_ENV) process.env.NODE_ENV = 'test';
if (!process.env.FRONTEND_URL) process.env.FRONTEND_URL = 'http://localhost:5173';
if (!process.env.BACKEND_URL) process.env.BACKEND_URL = 'http://localhost:3001';
if (!process.env.PORT) process.env.PORT = '3002';

// Now import the server after env vars are set
import app from '../../server.js';

export default app;

