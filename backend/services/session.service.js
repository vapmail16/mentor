import { query, getClient } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Get session by ID
 */
export const getSessionById = async (sessionId, userId = null) => {
  try {
    const result = await query(
      `SELECT s.*, 
              m.id as mentor_id, m.domains, m.specialties,
              u.full_name as mentor_name, u.avatar_url as mentor_avatar,
              (SELECT COUNT(*) FROM short_videos WHERE session_id = s.id) as short_video_count
       FROM sessions s
       JOIN mentors m ON s.mentor_id = m.id
       JOIN users u ON m.user_id = u.id
       WHERE s.id = $1`,
      [sessionId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const session = result.rows[0];

    // Get short videos
    const videosResult = await query(
      `SELECT * FROM short_videos 
       WHERE session_id = $1 
       ORDER BY order_index ASC`,
      [sessionId]
    );
    session.short_videos = videosResult.rows;

    // Get chapters
    const chaptersResult = await query(
      `SELECT * FROM chapters 
       WHERE session_id = $1 
       ORDER BY order_index ASC`,
      [sessionId]
    );
    session.chapters = chaptersResult.rows;

    // Get AI content
    const aiContentResult = await query(
      `SELECT * FROM ai_content 
       WHERE session_id = $1`,
      [sessionId]
    );
    session.ai_content = aiContentResult.rows;

    // Get watch history for user if provided
    if (userId) {
      const watchResult = await query(
        `SELECT * FROM watch_history 
         WHERE user_id = $1 AND session_id = $2`,
        [userId, sessionId]
      );
      session.watch_history = watchResult.rows[0] || null;
    }

    return session;
  } catch (error) {
    logger.error('Get session by ID error', error, { sessionId });
    throw error;
  }
};

/**
 * Get all sessions (with filters)
 */
export const getAllSessions = async (filters = {}) => {
  try {
    const {
      mentor_id,
      language,
      difficulty_level,
      topic_id,
      is_published, // Don't default to true - undefined means show all (for admins)
      limit = 50,
      offset = 0,
      search,
    } = filters;

    let queryText = `
      SELECT s.*, 
             m.domains, m.specialties,
             u.full_name as mentor_name, u.avatar_url as mentor_avatar
      FROM sessions s
      JOIN mentors m ON s.mentor_id = m.id
      JOIN users u ON m.user_id = u.id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    if (is_published !== undefined) {
      queryText += ` AND s.is_published = $${paramCount}`;
      params.push(is_published);
      paramCount++;
    }

    if (mentor_id) {
      queryText += ` AND s.mentor_id = $${paramCount}`;
      params.push(mentor_id);
      paramCount++;
    }

    if (language) {
      queryText += ` AND s.language = $${paramCount}`;
      params.push(language);
      paramCount++;
    }

    if (difficulty_level) {
      queryText += ` AND s.difficulty_level = $${paramCount}`;
      params.push(difficulty_level);
      paramCount++;
    }

    if (topic_id) {
      queryText += ` AND $${paramCount} = ANY(s.topics)`;
      params.push(topic_id);
      paramCount++;
    }

    if (search) {
      queryText += ` AND (
        s.title ILIKE $${paramCount} OR 
        s.description ILIKE $${paramCount}
      )`;
      params.push(`%${search}%`);
      paramCount++;
    }

    queryText += `
      ORDER BY s.published_at DESC NULLS LAST, s.created_at DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;

    params.push(limit, offset);

    const result = await query(queryText, params);
    return result.rows;
  } catch (error) {
    logger.error('Get all sessions error', error, { filters });
    throw error;
  }
};

/**
 * Create a new session
 */
export const createSession = async (mentorId, sessionData) => {
  try {
    const {
      title,
      description,
      language,
      difficulty_level = 'beginner',
      main_video_url,
      video_type = 'upload',
      youtube_video_id,
      download_allowed = false,
      topics = [],
      is_published = true, // Default to published so mentees can see sessions
    } = sessionData;

    const sessionId = uuidv4();

    const result = await query(
      `INSERT INTO sessions 
       (id, mentor_id, title, description, language, difficulty_level, 
        main_video_url, video_type, youtube_video_id, download_allowed, topics, is_published, published_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CASE WHEN $12 = TRUE THEN CURRENT_TIMESTAMP ELSE NULL END)
       RETURNING *`,
      [
        sessionId,
        mentorId,
        title,
        description,
        language,
        difficulty_level,
        main_video_url,
        video_type,
        youtube_video_id,
        download_allowed,
        topics,
        is_published,
      ]
    );

    return result.rows[0];
  } catch (error) {
    logger.error('Create session error', error, { mentorId });
    throw error;
  }
};

/**
 * Update session
 */
export const updateSession = async (sessionId, updates) => {
  try {
    const allowedFields = [
      'title',
      'description',
      'language',
      'difficulty_level',
      'main_video_url',
      'video_type',
      'youtube_video_id',
      'audio_file_url',
      'download_allowed',
      'topics',
      'is_published',
    ];

    const setClause = [];
    const values = [];
    let paramCount = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (allowedFields.includes(key)) {
        setClause.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (setClause.length === 0) {
      throw new Error('No valid fields to update');
    }

    // Set published_at if publishing
    if (updates.is_published === true) {
      setClause.push(`published_at = CASE WHEN published_at IS NULL THEN CURRENT_TIMESTAMP ELSE published_at END`);
    }

    values.push(sessionId);
    const result = await query(
      `UPDATE sessions 
       SET ${setClause.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new Error('Session not found');
    }

    return result.rows[0];
  } catch (error) {
    logger.error('Update session error', error, { sessionId, updates });
    throw error;
  }
};

/**
 * Delete session
 */
export const deleteSession = async (sessionId) => {
  try {
    await query('DELETE FROM sessions WHERE id = $1', [sessionId]);
    logger.info('Session deleted', { sessionId });
  } catch (error) {
    logger.error('Delete session error', error, { sessionId });
    throw error;
  }
};

/**
 * Add short video to session
 */
export const addShortVideo = async (sessionId, videoData) => {
  try {
    const {
      title,
      description,
      video_url,
      video_type = 'upload',
      youtube_video_id,
      duration,
      order_index = 0,
    } = videoData;

    const videoId = uuidv4();

    const result = await query(
      `INSERT INTO short_videos 
       (id, session_id, title, description, video_url, video_type, youtube_video_id, duration, order_index)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [videoId, sessionId, title, description, video_url, video_type, youtube_video_id, duration, order_index]
    );

    return result.rows[0];
  } catch (error) {
    logger.error('Add short video error', error, { sessionId });
    throw error;
  }
};

/**
 * Update short video
 */
export const updateShortVideo = async (shortVideoId, videoData) => {
  try {
    const {
      title,
      description,
      video_url,
      video_type,
      youtube_video_id,
      duration,
      order_index,
    } = videoData;

    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      values.push(title);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(description);
    }
    if (video_url !== undefined) {
      updates.push(`video_url = $${paramIndex++}`);
      values.push(video_url);
    }
    if (video_type !== undefined) {
      updates.push(`video_type = $${paramIndex++}`);
      values.push(video_type);
    }
    if (youtube_video_id !== undefined) {
      updates.push(`youtube_video_id = $${paramIndex++}`);
      values.push(youtube_video_id);
    }
    if (duration !== undefined) {
      updates.push(`duration = $${paramIndex++}`);
      values.push(duration);
    }
    if (order_index !== undefined) {
      updates.push(`order_index = $${paramIndex++}`);
      values.push(order_index);
    }

    if (updates.length === 0) {
      // No updates provided, just return the existing video
      const result = await query('SELECT * FROM short_videos WHERE id = $1', [shortVideoId]);
      if (result.rows.length === 0) {
        throw new Error('Short video not found');
      }
      return result.rows[0];
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(shortVideoId);

    const result = await query(
      `UPDATE short_videos 
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new Error('Short video not found');
    }

    return result.rows[0];
  } catch (error) {
    logger.error('Update short video error', error, { shortVideoId });
    throw error;
  }
};

/**
 * Delete short video
 */
export const deleteShortVideo = async (shortVideoId) => {
  try {
    const result = await query(
      'DELETE FROM short_videos WHERE id = $1 RETURNING *',
      [shortVideoId]
    );

    if (result.rows.length === 0) {
      throw new Error('Short video not found');
    }

    return result.rows[0];
  } catch (error) {
    logger.error('Delete short video error', error, { shortVideoId });
    throw error;
  }
};

/**
 * Update watch history
 */
export const updateWatchHistory = async (userId, sessionId, watchedDuration, totalDuration) => {
  try {
    const progressPercentage = totalDuration > 0
      ? Math.round((watchedDuration / totalDuration) * 100)
      : 0;

    const result = await query(
      `INSERT INTO watch_history (user_id, session_id, watched_duration, total_duration, progress_percentage, last_watched_at)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id, session_id)
       DO UPDATE SET
         watched_duration = GREATEST(watch_history.watched_duration, $3),
         total_duration = $4,
         progress_percentage = GREATEST(watch_history.progress_percentage, $5),
         last_watched_at = CURRENT_TIMESTAMP,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [userId, sessionId, watchedDuration, totalDuration, progressPercentage]
    );

    const history = result.rows[0];

    // Track gamification if session is completed (>=90% watched)
    if (progressPercentage >= 90) {
      try {
        const { trackSessionCompletion } = await import('./gamification.service.js');
        trackSessionCompletion(userId, sessionId).catch((error) => {
          logger.error('Failed to track session completion for gamification', error, { userId, sessionId });
        });
      } catch (importError) {
        // Ignore import errors - gamification is optional
      }
    }

    return history;
  } catch (error) {
    logger.error('Update watch history error', error, { userId, sessionId });
    throw error;
  }
};

export default {
  getSessionById,
  getAllSessions,
  createSession,
  updateSession,
  deleteSession,
  addShortVideo,
  updateShortVideo,
  deleteShortVideo,
  updateWatchHistory,
};

