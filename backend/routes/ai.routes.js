import express from 'express';
import aiService from '../services/ai.service.js';
import { authenticateToken, requireAdmin, requireMentor } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

/**
 * POST /api/ai/process/:sessionId
 * Trigger AI processing for a session (admin or mentor only)
 */
router.post('/process/:sessionId', authenticateToken, asyncHandler(async (req, res) => {
  const { sessionId } = req.params;

  // Only admin or the session's mentor can trigger AI processing
  if (req.user.role !== 'admin' && req.user.role !== 'mentor') {
    return res.status(403).json({
      success: false,
      error: {
        message: 'Access denied. Only admins and mentors can trigger AI processing.',
      },
    });
  }

  try {
    // Process in background (don't wait)
    aiService.processSessionAI(sessionId, req.body).catch((error) => {
      logger.error('Background AI processing failed', error, {
        sessionId,
        userId: req.user.userId,
      });
    });

    res.json({
      success: true,
      message: 'AI processing started. This may take several minutes.',
    });
  } catch (error) {
    logger.error('Failed to start AI processing', error, {
      sessionId,
      userId: req.user.userId,
    });
    
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to start AI processing',
        details: error.message,
      },
    });
  }
}));

/**
 * GET /api/ai/content/:sessionId
 * Get AI-generated content for a session
 */
router.get('/content/:sessionId', asyncHandler(async (req, res) => {
  const { sessionId } = req.params;

  const content = await aiService.getAIContent(sessionId);

  res.json({
    success: true,
    data: content,
  });
}));

export default router;

