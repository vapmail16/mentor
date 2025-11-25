import express from 'express';
import learningPathService from '../services/learningPath.service.js';
import { authenticateToken, requireAdmin, optionalAuth } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

/**
 * GET /api/learning-paths
 * Get all learning paths (public)
 */
router.get('/', optionalAuth, asyncHandler(async (req, res) => {
  const { is_published = true, difficulty_level, limit, offset } = req.query;

  const paths = await learningPathService.getAllLearningPaths({
    is_published: req.user?.role === 'admin' ? undefined : is_published,
    difficulty_level,
    limit: limit ? parseInt(limit) : undefined,
    offset: offset ? parseInt(offset) : undefined,
  });

  res.json({
    success: true,
    data: paths,
  });
}));

/**
 * GET /api/learning-paths/:id
 * Get learning path by ID (public)
 */
router.get('/:id', optionalAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const path = await learningPathService.getLearningPathById(id);

  if (!path) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'Learning path not found',
      },
    });
  }

  // Get user progress if authenticated
  if (req.user) {
    const progress = await learningPathService.getUserLearningPathProgress(req.user.userId, id);
    path.user_progress = progress;
  }

  res.json({
    success: true,
    data: path,
  });
}));

/**
 * POST /api/learning-paths
 * Create a new learning path (admin or mentor only)
 */
router.post('/', authenticateToken, asyncHandler(async (req, res) => {
  // Only admin or mentor can create learning paths
  if (req.user.role !== 'admin' && req.user.role !== 'mentor') {
    return res.status(403).json({
      success: false,
      error: {
        message: 'Access denied. Only admins and mentors can create learning paths.',
      },
    });
  }

  const path = await learningPathService.createLearningPath(req.user.userId, req.body);

  res.status(201).json({
    success: true,
    data: path,
  });
}));

/**
 * POST /api/learning-paths/:id/progress
 * Update user progress on learning path
 */
router.post('/:id/progress', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { session_id } = req.body;

  if (!session_id) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'session_id is required',
      },
    });
  }

  const progress = await learningPathService.updateLearningPathProgress(
    req.user.userId,
    id,
    session_id
  );

  res.json({
    success: true,
    data: progress,
  });
}));

/**
 * GET /api/learning-paths/:id/progress
 * Get user's progress on learning path
 */
router.get('/:id/progress', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const progress = await learningPathService.getUserLearningPathProgress(req.user.userId, id);

  res.json({
    success: true,
    data: progress,
  });
}));

/**
 * GET /api/certificates
 * Get user's certificates
 */
router.get('/certificates/my', authenticateToken, asyncHandler(async (req, res) => {
  const certificates = await learningPathService.getUserCertificates(req.user.userId);

  res.json({
    success: true,
    data: certificates,
  });
}));

/**
 * GET /api/certificates/verify/:certificateNumber
 * Verify certificate (public)
 */
router.get('/certificates/verify/:certificateNumber', asyncHandler(async (req, res) => {
  const { certificateNumber } = req.params;

  const certificate = await learningPathService.verifyCertificate(certificateNumber);

  if (!certificate) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'Certificate not found',
      },
    });
  }

  res.json({
    success: true,
    data: certificate,
  });
}));

export default router;

