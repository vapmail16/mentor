import express from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { query } from '../config/database.js';
import { logger } from '../utils/logger.js';
import sessionService from '../services/session.service.js';
import mentorService from '../services/mentor.service.js';
import learningPathService from '../services/learningPath.service.js';
import subscriptionService from '../services/subscription.service.js';

const router = express.Router();

/**
 * GET /api/admin/stats
 * Get admin dashboard statistics
 */
router.get('/stats', authenticateToken, requireAdmin, asyncHandler(async (req, res) => {
  try {
    // Get total users
    const usersResult = await query('SELECT COUNT(*) as count FROM users');
    const totalUsers = parseInt(usersResult.rows[0].count);

    // Get active sessions (published)
    const sessionsResult = await query(
      'SELECT COUNT(*) as count FROM sessions WHERE is_published = TRUE'
    );
    const activeSessions = parseInt(sessionsResult.rows[0].count);

    // Get active mentors (verified)
    const mentorsResult = await query(
      `SELECT COUNT(*) as count FROM mentors m
       INNER JOIN users u ON m.user_id = u.id
       WHERE m.verification_status = 'verified'`
    );
    const activeMentors = parseInt(mentorsResult.rows[0].count);

    // Get active subscriptions
    const subscriptionsResult = await query(
      `SELECT COUNT(DISTINCT user_id) as count 
       FROM subscriptions 
       WHERE payment_status = 'completed' 
       AND expires_at > CURRENT_TIMESTAMP`
    );
    const activeSubscriptions = parseInt(subscriptionsResult.rows[0].count);

    res.json({
      success: true,
      data: {
        totalUsers,
        activeSessions,
        activeMentors,
        activeSubscriptions,
      },
    });
  } catch (error) {
    logger.error('Error fetching admin stats', error);
    throw error;
  }
}));

/**
 * GET /api/admin/users
 * Get all users with pagination and filters
 */
router.get('/users', authenticateToken, requireAdmin, asyncHandler(async (req, res) => {
  const { 
    search,
    role,
    subscription_status,
    email_confirmed,
    limit = 50,
    offset = 0 
  } = req.query;

  let whereConditions = [];
  let queryParams = [];
  let paramIndex = 1;

  if (search) {
    whereConditions.push(`(email ILIKE $${paramIndex} OR full_name ILIKE $${paramIndex})`);
    queryParams.push(`%${search}%`);
    paramIndex++;
  }

  if (role) {
    whereConditions.push(`role = $${paramIndex}`);
    queryParams.push(role);
    paramIndex++;
  }

  if (subscription_status) {
    whereConditions.push(`subscription_status = $${paramIndex}`);
    queryParams.push(subscription_status);
    paramIndex++;
  }

  if (email_confirmed !== undefined) {
    whereConditions.push(`email_confirmed = $${paramIndex}`);
    queryParams.push(email_confirmed === 'true');
    paramIndex++;
  }

  const whereClause = whereConditions.length > 0 
    ? `WHERE ${whereConditions.join(' AND ')}` 
    : '';

  queryParams.push(parseInt(limit));
  queryParams.push(parseInt(offset));

  // Get users
  const usersResult = await query(
    `SELECT 
       id, email, full_name, role, phone, 
       email_confirmed, subscription_status,
       created_at, last_login_at
     FROM users 
     ${whereClause}
     ORDER BY created_at DESC
     LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    queryParams
  );

  // Get total count (exclude limit and offset params)
  const countParams = queryParams.slice(0, -2);
  const countResult = await query(
    `SELECT COUNT(*) as count FROM users ${whereClause}`,
    countParams.length > 0 ? countParams : []
  );

  res.json({
    success: true,
    data: {
      users: usersResult.rows,
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit),
      offset: parseInt(offset),
    },
  });
}));

/**
 * POST /api/admin/users
 * Create user (admin only) - allows creating mentors with profile
 */
router.post('/users', authenticateToken, requireAdmin, asyncHandler(async (req, res) => {
  const { email, password, full_name, role, phone, mentorProfileData } = req.body;

  if (!email || !password || !full_name || !role) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Email, password, full_name, and role are required',
      },
    });
  }

  // Import auth service
  const authService = (await import('../services/auth.service.js')).default;
  const bcrypt = await import('bcryptjs');
  const { v4: uuidv4 } = await import('uuid');

  // Check if user exists
  const existingUser = await query(
    'SELECT id FROM users WHERE email = $1',
    [email.toLowerCase()]
  );

  if (existingUser.rows.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'User with this email already exists',
      },
    });
  }

  // Hash password
  const saltRounds = 12;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  // Create user
  const userId = uuidv4();
  const userResult = await query(
    `INSERT INTO users (id, email, password_hash, full_name, role, phone, email_confirmed)
     VALUES ($1, $2, $3, $4, $5, $6, TRUE)
     RETURNING id, email, full_name, role, phone, email_confirmed`,
    [userId, email.toLowerCase(), passwordHash, full_name, role, phone || null]
  );

  const user = userResult.rows[0];

  // Create mentor profile if role is mentor
  let mentorId = null;
  if (role === 'mentor') {
    const mentorResult = await query(
      `INSERT INTO mentors (user_id, bio, domains, specialties, languages, achievements, verification_status)
       VALUES ($1, $2, $3, $4, $5, $6, 'verified')
       RETURNING id`,
      [
        userId,
        mentorProfileData?.bio || null,
        mentorProfileData?.domains || [],
        mentorProfileData?.specialties || [],
        mentorProfileData?.languages || [],
        mentorProfileData?.achievements || [],
      ]
    );
    mentorId = mentorResult.rows[0].id;
  }

  res.status(201).json({
    success: true,
    data: {
      ...user,
      mentor_id: mentorId,
    },
  });
}));

/**
 * PUT /api/admin/users/:id
 * Update user (admin only)
 */
router.put('/users/:id', authenticateToken, requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role, subscription_status, email_confirmed } = req.body;

  const updates = [];
  const values = [];
  let paramIndex = 1;

  if (role !== undefined) {
    updates.push(`role = $${paramIndex}`);
    values.push(role);
    paramIndex++;
  }

  if (subscription_status !== undefined) {
    updates.push(`subscription_status = $${paramIndex}`);
    values.push(subscription_status);
    paramIndex++;
  }

  if (email_confirmed !== undefined) {
    updates.push(`email_confirmed = $${paramIndex}`);
    values.push(email_confirmed);
    paramIndex++;
  }

  if (updates.length === 0) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'No valid fields to update',
      },
    });
  }

  values.push(id);
  
  const result = await query(
    `UPDATE users 
     SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
     WHERE id = $${paramIndex}
     RETURNING id, email, full_name, role, subscription_status, email_confirmed`,
    values
  );

  if (result.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'User not found',
      },
    });
  }

  res.json({
    success: true,
    data: result.rows[0],
  });
}));

/**
 * GET /api/admin/subscriptions
 * Get all subscriptions with filters
 */
router.get('/subscriptions', authenticateToken, requireAdmin, asyncHandler(async (req, res) => {
  const { 
    status,
    plan_type,
    limit = 50,
    offset = 0 
  } = req.query;

  let whereConditions = [];
  let queryParams = [];
  let paramIndex = 1;

  if (status) {
    whereConditions.push(`payment_status = $${paramIndex}`);
    queryParams.push(status);
    paramIndex++;
  }

  if (plan_type) {
    whereConditions.push(`plan_type = $${paramIndex}`);
    queryParams.push(plan_type);
    paramIndex++;
  }

  const whereClause = whereConditions.length > 0 
    ? `WHERE ${whereConditions.join(' AND ')}` 
    : '';

  queryParams.push(parseInt(limit));
  queryParams.push(parseInt(offset));

  const subscriptionsResult = await query(
    `SELECT 
       s.*, 
       u.email, 
       u.full_name
     FROM subscriptions s
     INNER JOIN users u ON s.user_id = u.id
     ${whereClause}
     ORDER BY s.created_at DESC
     LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    queryParams
  );

  const countResult = await query(
    `SELECT COUNT(*) as count FROM subscriptions ${whereClause}`,
    queryParams.slice(0, -2)
  );

  res.json({
    success: true,
    data: {
      subscriptions: subscriptionsResult.rows,
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit),
      offset: parseInt(offset),
    },
  });
}));

/**
 * POST /api/admin/sessions
 * Create session for any mentor (admin only)
 */
router.post('/sessions', authenticateToken, requireAdmin, asyncHandler(async (req, res) => {
  const { mentor_id, title, description, language, difficulty_level, youtube_video_id, video_type, is_published } = req.body;

  if (!mentor_id || !title || !description || !language) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'mentor_id, title, description, and language are required',
      },
    });
  }

  // Verify mentor exists
  const mentorResult = await query('SELECT id FROM mentors WHERE id = $1', [mentor_id]);
  if (mentorResult.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'Mentor not found',
      },
    });
  }

  // Prepare session data
  const sessionData = {
    title,
    description,
    language,
    difficulty_level: difficulty_level || 'beginner',
    video_type: video_type || (youtube_video_id ? 'youtube' : 'upload'),
    youtube_video_id: youtube_video_id || null,
    main_video_url: youtube_video_id ? `https://www.youtube.com/watch?v=${youtube_video_id}` : null,
    is_published: is_published || false,
  };

  const session = await sessionService.createSession(mentor_id, sessionData);

  res.status(201).json({
    success: true,
    data: session,
  });
}));

export default router;

