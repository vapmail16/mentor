import express from 'express';
import mentorService from '../services/mentor.service.js';
import { authenticateToken, requireAdmin, requireMentor } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

/**
 * GET /api/mentors
 * Get all mentors (public)
 */
router.get('/', asyncHandler(async (req, res) => {
  const { domain, verification_status, limit, offset } = req.query;

  const mentors = await mentorService.getAllMentors({
    domain,
    verification_status,
    limit: limit ? parseInt(limit) : undefined,
    offset: offset ? parseInt(offset) : undefined,
  });

  res.json({
    success: true,
    data: mentors,
  });
}));

/**
 * GET /api/mentors/:id
 * Get mentor by ID (public)
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const mentor = await mentorService.getMentorById(id);

  if (!mentor) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'Mentor not found',
      },
    });
  }

  res.json({
    success: true,
    data: mentor,
  });
}));

/**
 * GET /api/mentors/profile/me
 * Get current user's mentor profile (mentor only)
 */
router.get('/profile/me', authenticateToken, requireMentor, asyncHandler(async (req, res) => {
  const mentor = await mentorService.getMentorByUserId(req.user.userId);

  if (!mentor) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'Mentor profile not found',
      },
    });
  }

  res.json({
    success: true,
    data: mentor,
  });
}));

/**
 * PUT /api/mentors/profile/me
 * Update current user's mentor profile (mentor only)
 */
router.put('/profile/me', authenticateToken, requireMentor, asyncHandler(async (req, res) => {
  const { bio, domains, specialties, languages, achievements, photo_url } = req.body;

  const mentor = await mentorService.upsertMentorProfile(req.user.userId, {
    bio,
    domains: Array.isArray(domains) ? domains : [],
    specialties: Array.isArray(specialties) ? specialties : [],
    languages: Array.isArray(languages) ? languages : [],
    achievements: Array.isArray(achievements) ? achievements : [],
    photo_url,
  });

  res.json({
    success: true,
    data: mentor,
  });
}));

/**
 * GET /api/mentors/:id/analytics
 * Get mentor analytics (mentor or admin only)
 */
router.get('/:id/analytics', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if user is the mentor or admin
  const mentor = await mentorService.getMentorById(id);
  if (!mentor) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'Mentor not found',
      },
    });
  }

  if (req.user.role !== 'admin' && mentor.user_id !== req.user.userId) {
    return res.status(403).json({
      success: false,
      error: {
        message: 'Access denied',
      },
    });
  }

  const analytics = await mentorService.getMentorAnalytics(id);

  res.json({
    success: true,
    data: analytics,
  });
}));

/**
 * PUT /api/mentors/:id/verification
 * Update mentor verification status (admin only)
 */
router.put('/:id/verification', authenticateToken, requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { verification_status } = req.body;

  if (!['pending', 'verified', 'rejected'].includes(verification_status)) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Invalid verification status',
      },
    });
  }

  const mentor = await mentorService.updateMentorVerification(
    id,
    verification_status,
    req.user.userId
  );

  res.json({
    success: true,
    data: mentor,
  });
}));

export default router;

