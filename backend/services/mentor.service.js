import { query, getClient } from '../config/database.js';
import { logger } from '../utils/logger.js';

/**
 * Get mentor by user ID
 */
export const getMentorByUserId = async (userId) => {
  try {
    const result = await query(
      `SELECT m.*, u.email, u.full_name, u.avatar_url
       FROM mentors m
       JOIN users u ON m.user_id = u.id
       WHERE m.user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  } catch (error) {
    logger.error('Get mentor by user ID error', error, { userId });
    throw error;
  }
};

/**
 * Get mentor by mentor ID
 */
export const getMentorById = async (mentorId) => {
  try {
    const result = await query(
      `SELECT m.*, u.email, u.full_name, u.avatar_url
       FROM mentors m
       JOIN users u ON m.user_id = u.id
       WHERE m.id = $1`,
      [mentorId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  } catch (error) {
    logger.error('Get mentor by ID error', error, { mentorId });
    throw error;
  }
};

/**
 * Create or update mentor profile
 */
export const upsertMentorProfile = async (userId, mentorData) => {
  try {
    const {
      bio,
      domains = [],
      specialties = [],
      languages = [],
      achievements = [],
      photo_url,
    } = mentorData;

    // Check if mentor profile exists
    const existing = await query(
      'SELECT id FROM mentors WHERE user_id = $1',
      [userId]
    );

    if (existing.rows.length > 0) {
      // Update existing profile
      const result = await query(
        `UPDATE mentors 
         SET bio = $1, domains = $2, specialties = $3, languages = $4, 
             achievements = $5, photo_url = $6, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $7
         RETURNING *`,
        [bio, domains, specialties, languages, achievements, photo_url, userId]
      );
      return result.rows[0];
    } else {
      // Create new profile
      const result = await query(
        `INSERT INTO mentors (user_id, bio, domains, specialties, languages, achievements, photo_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [userId, bio, domains, specialties, languages, achievements, photo_url]
      );
      return result.rows[0];
    }
  } catch (error) {
    logger.error('Upsert mentor profile error', error, { userId });
    throw error;
  }
};

/**
 * Get all mentors (with filters)
 */
export const getAllMentors = async (filters = {}) => {
  try {
    const { domain, verification_status, limit = 50, offset = 0 } = filters;

    let queryText = `
      SELECT m.*, u.email, u.full_name, u.avatar_url,
             COUNT(s.id) as session_count
      FROM mentors m
      JOIN users u ON m.user_id = u.id
      LEFT JOIN sessions s ON s.mentor_id = m.id AND s.is_published = TRUE
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    if (domain) {
      queryText += ` AND $${paramCount} = ANY(m.domains)`;
      params.push(domain);
      paramCount++;
    }

    if (verification_status) {
      queryText += ` AND m.verification_status = $${paramCount}`;
      params.push(verification_status);
      paramCount++;
    }

    queryText += `
      GROUP BY m.id, u.id
      ORDER BY m.created_at DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;

    params.push(limit, offset);

    const result = await query(queryText, params);
    return result.rows;
  } catch (error) {
    logger.error('Get all mentors error', error, { filters });
    throw error;
  }
};

/**
 * Update mentor verification status (admin only)
 */
export const updateMentorVerification = async (mentorId, verificationStatus, adminUserId) => {
  try {
    // Ensure verificationStatus is a valid string
    const status = String(verificationStatus).trim();
    
    // Update verified_at based on status
    const verifiedAt = status === 'verified' ? new Date() : null;
    
    // Use explicit type casting to avoid PostgreSQL type mismatch (TEXT vs VARCHAR)
    const result = await query(
      `UPDATE mentors 
       SET verification_status = $1::VARCHAR(50), 
           verified_at = $3,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2::UUID
       RETURNING *`,
      [status, mentorId, verifiedAt]
    );

    if (result.rows.length === 0) {
      throw new Error('Mentor not found');
    }

    logger.info('Mentor verification updated', {
      mentorId,
      verificationStatus,
      adminUserId,
    });

    return result.rows[0];
  } catch (error) {
    logger.error('Update mentor verification error', error, { mentorId, verificationStatus });
    throw error;
  }
};

/**
 * Get mentor analytics
 */
export const getMentorAnalytics = async (mentorId) => {
  try {
    const [sessionsResult, viewsResult, engagementResult] = await Promise.all([
      // Session count
      query(
        `SELECT COUNT(*) as total_sessions,
                COUNT(CASE WHEN is_published = TRUE THEN 1 END) as published_sessions
         FROM sessions
         WHERE mentor_id = $1`,
        [mentorId]
      ),
      // Total views
      query(
        `SELECT COALESCE(SUM(view_count), 0) as total_views
         FROM sessions
         WHERE mentor_id = $1`,
        [mentorId]
      ),
      // Engagement (comments + Q&A)
      query(
        `SELECT 
           (SELECT COUNT(*) FROM comments WHERE session_id IN (SELECT id FROM sessions WHERE mentor_id = $1)) +
           (SELECT COUNT(*) FROM qa_questions WHERE session_id IN (SELECT id FROM sessions WHERE mentor_id = $1)) as total_engagement
        `,
        [mentorId]
      ),
    ]);

    return {
      totalSessions: parseInt(sessionsResult.rows[0].total_sessions) || 0,
      publishedSessions: parseInt(sessionsResult.rows[0].published_sessions) || 0,
      totalViews: parseInt(viewsResult.rows[0].total_views) || 0,
      totalEngagement: parseInt(engagementResult.rows[0].total_engagement) || 0,
    };
  } catch (error) {
    logger.error('Get mentor analytics error', error, { mentorId });
    throw error;
  }
};

export default {
  getMentorByUserId,
  getMentorById,
  upsertMentorProfile,
  getAllMentors,
  updateMentorVerification,
  getMentorAnalytics,
};

