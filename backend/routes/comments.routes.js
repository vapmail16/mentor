import express from 'express';
import commentService from '../services/comment.service.js';
import { authenticateToken, requireAdmin, optionalAuth } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

/**
 * GET /api/comments/session/:sessionId
 * Get comments for a session (public)
 */
router.get('/session/:sessionId', optionalAuth, asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const { limit = 50, offset = 0 } = req.query;

  const comments = await commentService.getSessionComments(sessionId, {
    limit: parseInt(limit),
    offset: parseInt(offset),
  });

  res.json({
    success: true,
    data: comments,
  });
}));

/**
 * POST /api/comments
 * Create a comment (authenticated users only)
 */
router.post('/', authenticateToken, asyncHandler(async (req, res) => {
  const { session_id, content, parent_id } = req.body;

  if (!session_id || !content) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'session_id and content are required',
      },
    });
  }

  const comment = await commentService.createComment(req.user.userId, session_id, {
    content,
    parent_id,
  });

  res.status(201).json({
    success: true,
    data: comment,
  });
}));

/**
 * POST /api/comments/:id/like
 * Like/unlike a comment (authenticated users only)
 */
router.post('/:id/like', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await commentService.toggleCommentLike(req.user.userId, id);

  res.json({
    success: true,
    data: result,
  });
}));

/**
 * POST /api/comments/:id/report
 * Report a comment (authenticated users only)
 */
router.post('/:id/report', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;

  await commentService.reportComment(id);

  res.json({
    success: true,
    message: 'Comment reported successfully',
  });
}));

export default router;

