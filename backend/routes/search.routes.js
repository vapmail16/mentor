import express from 'express';
import searchService from '../services/search.service.js';
import { optionalAuth } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

/**
 * GET /api/search
 * Global search across sessions and mentors
 */
router.get('/', optionalAuth, asyncHandler(async (req, res) => {
  const { q, type, mentor_id, language, difficulty_level, topic_id, limit = 20 } = req.query;

  if (!q || q.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Search query is required',
      },
    });
  }

  const results = await searchService.globalSearch(q.trim(), {
    type,
    limit: parseInt(limit),
  });

  res.json({
    success: true,
    data: results,
  });
}));

/**
 * GET /api/search/sessions
 * Search sessions only
 */
router.get('/sessions', optionalAuth, asyncHandler(async (req, res) => {
  const { q, mentor_id, language, difficulty_level, topic_id, limit = 50, offset = 0 } = req.query;

  if (!q || q.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Search query is required',
      },
    });
  }

  const sessions = await searchService.searchSessions(q.trim(), {
    mentor_id,
    language,
    difficulty_level,
    topic_id,
    limit: parseInt(limit),
    offset: parseInt(offset),
  });

  res.json({
    success: true,
    data: sessions,
  });
}));

/**
 * GET /api/search/mentors
 * Search mentors only
 */
router.get('/mentors', optionalAuth, asyncHandler(async (req, res) => {
  const { q, domain, limit = 50, offset = 0 } = req.query;

  if (!q || q.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Search query is required',
      },
    });
  }

  const mentors = await searchService.searchMentors(q.trim(), {
    domain,
    limit: parseInt(limit),
    offset: parseInt(offset),
  });

  res.json({
    success: true,
    data: mentors,
  });
}));

export default router;

