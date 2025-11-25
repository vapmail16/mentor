import express from 'express';
import qaService from '../services/qa.service.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

/**
 * GET /api/qa/session/:sessionId
 * Get questions for a session (public)
 */
router.get('/session/:sessionId', optionalAuth, asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const { is_answered, limit = 50, offset = 0 } = req.query;

  const questions = await qaService.getSessionQuestions(sessionId, {
    is_answered: is_answered === 'true' ? true : is_answered === 'false' ? false : undefined,
    limit: parseInt(limit),
    offset: parseInt(offset),
  });

  res.json({
    success: true,
    data: questions,
  });
}));

/**
 * GET /api/qa/:id
 * Get question by ID with answers (public)
 */
router.get('/:id', optionalAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const question = await qaService.getQuestionById(id);

  if (!question) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'Question not found',
      },
    });
  }

  res.json({
    success: true,
    data: question,
  });
}));

/**
 * POST /api/qa
 * Create a question (authenticated users only)
 */
router.post('/', authenticateToken, asyncHandler(async (req, res) => {
  const { session_id, question } = req.body;

  if (!session_id || !question) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'session_id and question are required',
      },
    });
  }

  const questionData = await qaService.createQuestion(req.user.userId, session_id, {
    question,
  });

  res.status(201).json({
    success: true,
    data: questionData,
  });
}));

/**
 * POST /api/qa/:id/answer
 * Answer a question (authenticated users only)
 */
router.post('/:id/answer', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { answer } = req.body;

  if (!answer) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'answer is required',
      },
    });
  }

  const answerData = await qaService.answerQuestion(req.user.userId, id, {
    answer,
  });

  res.status(201).json({
    success: true,
    data: answerData,
  });
}));

/**
 * POST /api/qa/vote
 * Vote on question or answer (authenticated users only)
 */
router.post('/vote', authenticateToken, asyncHandler(async (req, res) => {
  const { question_id, answer_id, vote_type } = req.body;

  if ((!question_id && !answer_id) || !vote_type) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Either question_id or answer_id, and vote_type are required',
      },
    });
  }

  const result = await qaService.vote(req.user.userId, question_id, answer_id, vote_type);

  res.json({
    success: true,
    data: result,
  });
}));

export default router;

