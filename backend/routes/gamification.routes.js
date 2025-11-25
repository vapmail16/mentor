import express from 'express';
import gamificationService from '../services/gamification.service.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

/**
 * GET /api/gamification/badges
 * Get user's badges
 */
router.get('/badges', authenticateToken, asyncHandler(async (req, res) => {
  const badges = await gamificationService.getUserBadges(req.user.userId);

  res.json({
    success: true,
    data: badges,
  });
}));

/**
 * GET /api/gamification/streak
 * Get user's learning streak
 */
router.get('/streak', authenticateToken, asyncHandler(async (req, res) => {
  const streak = await gamificationService.getUserStreak(req.user.userId);

  res.json({
    success: true,
    data: streak,
  });
}));

export default router;

