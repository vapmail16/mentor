import express from 'express';
import sessionService from '../services/session.service.js';
import mentorService from '../services/mentor.service.js';
import { authenticateToken, requireMentor, requireAdmin, requireMentee, optionalAuth } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

/**
 * GET /api/sessions
 * Get all sessions (public, filtered for non-subscribers)
 */
router.get('/', optionalAuth, asyncHandler(async (req, res) => {
  const {
    mentor_id,
    language,
    difficulty_level,
    topic_id,
    search,
    limit = 50,
    offset = 0,
  } = req.query;

  // Non-authenticated users or guests only see published sessions
  // Mentees/admins see all sessions they have access to
  const isPublished = req.user?.role === 'admin' ? undefined : true;

  const sessions = await sessionService.getAllSessions({
    mentor_id,
    language,
    difficulty_level,
    topic_id,
    is_published: isPublished,
    search,
    limit: parseInt(limit),
    offset: parseInt(offset),
  });

  // Filter content based on subscription status for non-subscribers
  const filteredSessions = sessions.map(session => {
    const hasAccess = req.user && (
      req.user.role === 'admin' ||
      req.user.subscriptionStatus === 'active' ||
      req.user.role === 'mentor'
    );

    if (!hasAccess) {
      // Non-subscribers see limited info
      return {
        ...session,
        main_video_url: null, // Hide video URL
        audio_file_url: null,
      };
    }

    return session;
  });

  res.json({
    success: true,
    data: filteredSessions,
  });
}));

/**
 * GET /api/sessions/:id
 * Get session by ID
 */
router.get('/:id', optionalAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const session = await sessionService.getSessionById(id, req.user?.userId || null);

  if (!session) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'Session not found',
      },
    });
  }

  // Check access
  const hasAccess = req.user && (
    req.user.role === 'admin' ||
    req.user.subscriptionStatus === 'active' ||
    req.user.role === 'mentor' ||
    session.mentor_id === (await mentorService.getMentorByUserId(req.user.userId))?.id
  );

  // Non-subscribers can see preview but not full content
  if (!hasAccess && !session.is_published) {
    return res.status(403).json({
      success: false,
      error: {
        message: 'Subscription required to access this session',
      },
    });
  }

  // Hide sensitive data for non-subscribers
  if (!hasAccess) {
    session.main_video_url = null;
    session.audio_file_url = null;
    session.ai_content = session.ai_content.filter(
      ac => ac.content_type === 'summary' || ac.content_type === 'auto_tags'
    );
  }

  res.json({
    success: true,
    data: session,
  });
}));

/**
 * POST /api/sessions
 * Create a new session (mentor or admin only)
 */
router.post('/', authenticateToken, requireMentor, asyncHandler(async (req, res) => {
  const mentor = await mentorService.getMentorByUserId(req.user.userId);

  if (!mentor) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'Mentor profile not found',
      },
    });
  }

  const session = await sessionService.createSession(mentor.id, req.body);

  res.status(201).json({
    success: true,
    data: session,
  });
}));

/**
 * Middleware to allow mentor or admin
 */
const requireMentorOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: { message: 'Authentication required' },
    });
  }
  if (req.user.role !== 'mentor' && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: { message: 'Insufficient permissions. Mentor or admin role required.' },
    });
  }
  next();
};

/**
 * POST /api/sessions/:id/short-videos
 * Add short video to session (mentor or admin only)
 */
router.post('/:id/short-videos', authenticateToken, requireMentorOrAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const video = await sessionService.addShortVideo(id, req.body);

  res.status(201).json({
    success: true,
    data: video,
  });
}));

/**
 * PUT /api/sessions/short-videos/:id
 * Update short video (mentor or admin only)
 */
router.put('/short-videos/:id', authenticateToken, requireMentorOrAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const video = await sessionService.updateShortVideo(id, req.body);

  res.json({
    success: true,
    data: video,
  });
}));

/**
 * DELETE /api/sessions/short-videos/:id
 * Delete short video (mentor or admin only)
 */
router.delete('/short-videos/:id', authenticateToken, requireMentorOrAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;

  await sessionService.deleteShortVideo(id);

  res.json({
    success: true,
    message: 'Short video deleted successfully',
  });
}));

/**
 * PUT /api/sessions/:id
 * Update session (mentor or admin only)
 */
router.put('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Get session to check ownership
  const session = await sessionService.getSessionById(id);
  if (!session) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'Session not found',
      },
    });
  }

  // Check permissions
  const mentor = await mentorService.getMentorByUserId(req.user.userId);
  const canEdit = req.user.role === 'admin' || (mentor && mentor.id === session.mentor_id);

  if (!canEdit) {
    return res.status(403).json({
      success: false,
      error: {
        message: 'You do not have permission to edit this session',
      },
    });
  }

  const updatedSession = await sessionService.updateSession(id, req.body);

  res.json({
    success: true,
    data: updatedSession,
  });
}));

/**
 * DELETE /api/sessions/:id
 * Delete session (mentor or admin only)
 */
router.delete('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Get session to check ownership
  const session = await sessionService.getSessionById(id);
  if (!session) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'Session not found',
      },
    });
  }

  // Check permissions
  const mentor = await mentorService.getMentorByUserId(req.user.userId);
  const canDelete = req.user.role === 'admin' || (mentor && mentor.id === session.mentor_id);

  if (!canDelete) {
    return res.status(403).json({
      success: false,
      error: {
        message: 'You do not have permission to delete this session',
      },
    });
  }

  await sessionService.deleteSession(id);

  res.json({
    success: true,
    message: 'Session deleted successfully',
  });
}));


/**
 * POST /api/sessions/:id/watch
 * Update watch history (authenticated users only)
 */
router.post('/:id/watch', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { watched_duration, total_duration } = req.body;

  if (!watched_duration || !total_duration) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'watched_duration and total_duration are required',
      },
    });
  }

  const history = await sessionService.updateWatchHistory(
    req.user.userId,
    id,
    parseInt(watched_duration),
    parseInt(total_duration)
  );

  res.json({
    success: true,
    data: history,
  });
}));

export default router;

