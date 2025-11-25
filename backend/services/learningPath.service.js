import { query, getClient } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

/**
 * Create a learning path
 */
export const createLearningPath = async (createdBy, pathData) => {
  try {
    const {
      title,
      description,
      session_ids = [],
      difficulty_level = 'beginner',
      estimated_duration,
    } = pathData;

    const pathId = uuidv4();

    const result = await query(
      `INSERT INTO learning_paths 
       (id, title, description, created_by, session_ids, difficulty_level, estimated_duration)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [pathId, title, description, createdBy, session_ids, difficulty_level, estimated_duration]
    );

    return result.rows[0];
  } catch (error) {
    logger.error('Create learning path error', error, { createdBy });
    throw error;
  }
};

/**
 * Get learning path by ID
 */
export const getLearningPathById = async (pathId) => {
  try {
    const result = await query(
      `SELECT lp.*, 
              u.full_name as creator_name,
              u.avatar_url as creator_avatar
       FROM learning_paths lp
       JOIN users u ON lp.created_by = u.id
       WHERE lp.id = $1`,
      [pathId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const path = result.rows[0];

    // Get session details
    if (path.session_ids && path.session_ids.length > 0) {
      const sessionsResult = await query(
        `SELECT id, title, description, duration, difficulty_level, language
         FROM sessions
         WHERE id = ANY($1::uuid[])
         ORDER BY array_position($1::uuid[], id)`,
        [path.session_ids]
      );
      path.sessions = sessionsResult.rows;
    }

    return path;
  } catch (error) {
    logger.error('Get learning path by ID error', error, { pathId });
    throw error;
  }
};

/**
 * Get all learning paths
 */
export const getAllLearningPaths = async (filters = {}) => {
  try {
    const { is_published = true, created_by, difficulty_level, limit = 50, offset = 0 } = filters;

    let queryText = `
      SELECT lp.*, u.full_name as creator_name
      FROM learning_paths lp
      JOIN users u ON lp.created_by = u.id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    if (is_published !== undefined) {
      queryText += ` AND lp.is_published = $${paramCount}`;
      params.push(is_published);
      paramCount++;
    }

    if (created_by) {
      queryText += ` AND lp.created_by = $${paramCount}`;
      params.push(created_by);
      paramCount++;
    }

    if (difficulty_level) {
      queryText += ` AND lp.difficulty_level = $${paramCount}`;
      params.push(difficulty_level);
      paramCount++;
    }

    queryText += `
      ORDER BY lp.created_at DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;

    params.push(limit, offset);

    const result = await query(queryText, params);
    return result.rows;
  } catch (error) {
    logger.error('Get all learning paths error', error, { filters });
    throw error;
  }
};

/**
 * Get user's progress on a learning path
 */
export const getUserLearningPathProgress = async (userId, pathId) => {
  try {
    const result = await query(
      `SELECT * FROM user_learning_path_progress
       WHERE user_id = $1 AND learning_path_id = $2`,
      [userId, pathId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  } catch (error) {
    logger.error('Get user learning path progress error', error, { userId, pathId });
    throw error;
  }
};

/**
 * Update user progress on learning path
 */
export const updateLearningPathProgress = async (userId, pathId, sessionId) => {
  try {
    const client = await getClient();

    try {
      await client.query('BEGIN');

      // Get current progress
      const progressResult = await client.query(
        `SELECT * FROM user_learning_path_progress
         WHERE user_id = $1 AND learning_path_id = $2`,
        [userId, pathId]
      );

      // Get learning path to check session_ids
      const pathResult = await client.query(
        'SELECT session_ids FROM learning_paths WHERE id = $1',
        [pathId]
      );

      if (pathResult.rows.length === 0) {
        throw new Error('Learning path not found');
      }

      const sessionIds = pathResult.rows[0].session_ids || [];
      const completedSessions = progressResult.rows[0]?.completed_sessions || [];

      // Add session to completed if not already there
      if (!completedSessions.includes(sessionId)) {
        completedSessions.push(sessionId);
      }

      // Calculate progress percentage
      const progressPercentage = sessionIds.length > 0
        ? Math.round((completedSessions.length / sessionIds.length) * 100)
        : 0;

      // Check if path is completed
      const isCompleted = progressPercentage >= 100 && completedSessions.length === sessionIds.length;

      // Upsert progress
      if (progressResult.rows.length === 0) {
        // Create new progress record
        await client.query(
          `INSERT INTO user_learning_path_progress
           (id, user_id, learning_path_id, completed_sessions, progress_percentage, started_at, completed_at)
           VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, $6)`,
          [
            uuidv4(),
            userId,
            pathId,
            completedSessions,
            progressPercentage,
            isCompleted ? new Date() : null,
          ]
        );
      } else {
        // Update existing progress
        await client.query(
          `UPDATE user_learning_path_progress
           SET completed_sessions = $1,
               progress_percentage = $2,
               completed_at = CASE WHEN $3 THEN CURRENT_TIMESTAMP ELSE completed_at END,
               updated_at = CURRENT_TIMESTAMP
           WHERE user_id = $4 AND learning_path_id = $5`,
          [completedSessions, progressPercentage, isCompleted, userId, pathId]
        );
      }

      await client.query('COMMIT');

      // If completed, trigger certificate generation
      if (isCompleted) {
        await generateCertificate(userId, pathId).catch((error) => {
          logger.error('Certificate generation failed', error, { userId, pathId });
        });
      }

      return {
        completedSessions,
        progressPercentage,
        isCompleted,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('Update learning path progress error', error, { userId, pathId });
    throw error;
  }
};

/**
 * Generate certificate for completed learning path
 */
export const generateCertificate = async (userId, pathId) => {
  try {
    // Check if certificate already exists
    const existingCert = await query(
      `SELECT * FROM certificates
       WHERE user_id = $1 AND learning_path_id = $2`,
      [userId, pathId]
    );

    if (existingCert.rows.length > 0) {
      return existingCert.rows[0];
    }

    // Get user and learning path details
    const [userResult, pathResult] = await Promise.all([
      query('SELECT id, full_name, email FROM users WHERE id = $1', [userId]),
      query('SELECT id, title FROM learning_paths WHERE id = $1', [pathId]),
    ]);

    if (userResult.rows.length === 0 || pathResult.rows.length === 0) {
      throw new Error('User or learning path not found');
    }

    const user = userResult.rows[0];
    const path = pathResult.rows[0];

    // Generate certificate number
    const certificateNumber = `CERT-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    // Generate QR code data (URL to verify certificate)
    const qrCodeData = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/certificate/verify/${certificateNumber}`;

    // TODO: Generate actual QR code image and PDF
    // For now, store the data
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodeData)}`;
    const pdfUrl = null; // TODO: Generate PDF certificate

    const certificateId = uuidv4();

    const result = await query(
      `INSERT INTO certificates
       (id, user_id, learning_path_id, certificate_number, qr_code_url, pdf_url, issued_at)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
       RETURNING *`,
      [certificateId, userId, pathId, certificateNumber, qrCodeUrl, pdfUrl]
    );

    // Send certificate email
    const { emailService } = await import('./email.service.js');
    await emailService.sendCertificateEmail(
      user.email,
      user.full_name,
      pdfUrl || qrCodeUrl,
      path.title
    ).catch((error) => {
      logger.error('Failed to send certificate email', error, { userId, pathId });
    });

    logger.info('Certificate generated', { certificateId, userId, pathId });

    return result.rows[0];
  } catch (error) {
    logger.error('Generate certificate error', error, { userId, pathId });
    throw error;
  }
};

/**
 * Get user's certificates
 */
export const getUserCertificates = async (userId) => {
  try {
    const result = await query(
      `SELECT c.*, lp.title as learning_path_title
       FROM certificates c
       JOIN learning_paths lp ON c.learning_path_id = lp.id
       WHERE c.user_id = $1
       ORDER BY c.issued_at DESC`,
      [userId]
    );

    return result.rows;
  } catch (error) {
    logger.error('Get user certificates error', error, { userId });
    throw error;
  }
};

/**
 * Verify certificate by certificate number
 */
export const verifyCertificate = async (certificateNumber) => {
  try {
    const result = await query(
      `SELECT c.*, 
              u.full_name as user_name,
              lp.title as learning_path_title
       FROM certificates c
       JOIN users u ON c.user_id = u.id
       JOIN learning_paths lp ON c.learning_path_id = lp.id
       WHERE c.certificate_number = $1`,
      [certificateNumber]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  } catch (error) {
    logger.error('Verify certificate error', error, { certificateNumber });
    throw error;
  }
};

export default {
  createLearningPath,
  getLearningPathById,
  getAllLearningPaths,
  getUserLearningPathProgress,
  updateLearningPathProgress,
  generateCertificate,
  getUserCertificates,
  verifyCertificate,
};

