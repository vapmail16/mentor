import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { testConnection } from './config/database.js';
import { logger } from './utils/logger.js';
import { requestIdMiddleware } from './middleware/requestId.js';
import { errorHandler } from './middleware/errorHandler.js';

// Load environment variables
dotenv.config();

// Validate critical environment variables (skip in test mode)
if (process.env.NODE_ENV !== 'test') {
  const requiredEnvVars = [
    'JWT_SECRET',
    'DB_HOST',
    'DB_NAME',
    'DB_USER',
    'DB_PASSWORD',
  ];

  const missing = requiredEnvVars.filter(v => !process.env[v]);
  if (missing.length > 0) {
    logger.error('Missing required environment variables', { missing });
    process.exit(1);
  }
}

// Validate JWT secret strength (skip in test mode)
if (process.env.NODE_ENV !== 'test') {
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    logger.error('JWT_SECRET must be at least 32 characters long');
    process.exit(1);
  }
}

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Trust proxy configuration
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
} else {
  app.set('trust proxy', false);
}

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "https://sdk.cashfree.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.cashfree.com", "https://sandbox.cashfree.com", "https://api.resend.com"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Request ID middleware (must be early in the chain)
app.use(requestIdMiddleware);

// Health check endpoint
app.get('/health', async (req, res) => {
  const dbStatus = await testConnection();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: dbStatus ? 'connected' : 'disconnected',
    environment: process.env.NODE_ENV || 'development',
  });
});

// API routes
import authRoutes from './routes/auth.routes.js';
import paymentRoutes from './routes/payments.routes.js';
import mentorRoutes from './routes/mentors.routes.js';
import sessionRoutes from './routes/sessions.routes.js';
import aiRoutes from './routes/ai.routes.js';
import learningPathRoutes from './routes/learningPaths.routes.js';
import commentRoutes from './routes/comments.routes.js';
import qaRoutes from './routes/qa.routes.js';
import gamificationRoutes from './routes/gamification.routes.js';
import searchRoutes from './routes/search.routes.js';

app.use('/api/auth', authRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/mentors', mentorRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/learning-paths', learningPathRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/qa', qaRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/search', searchRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server (skip in test mode)
const startServer = async () => {
  // Don't start server in test mode
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      logger.warn('Database connection failed, but server will start anyway. Connections will be retried.');
    }

    app.listen(PORT, () => {
      logger.info(`Server started successfully`, {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        frontendUrl: FRONTEND_URL,
        databaseConnected: dbConnected,
      });
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections (skip in test mode)
if (process.env.NODE_ENV !== 'test') {
  process.on('unhandledRejection', (error) => {
    logger.error('Unhandled promise rejection', error);
    process.exit(1);
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception', error);
    process.exit(1);
  });

  startServer();
}

export default app;

