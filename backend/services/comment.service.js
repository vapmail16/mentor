import { query } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Create a comment
 */
export const createComment = async (userId, sessionId, commentData) => {
  try {
    const { content, parent_id } = commentData;

    const commentId = uuidv4();

    const result = await query(
      `INSERT INTO comments (id, session_id, user_id, parent_id, content)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [commentId, sessionId, userId, parent_id || null, content]
    );

    // Get full comment with user info
    const fullComment = await getCommentById(commentId);
    return fullComment;
  } catch (error) {
    logger.error('Create comment error', error, { userId, sessionId });
    throw error;
  }
};

/**
 * Get comment by ID
 */
export const getCommentById = async (commentId) => {
  try {
    const result = await query(
      `SELECT c.*, 
              u.full_name as user_name, u.avatar_url as user_avatar
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.id = $1`,
      [commentId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const comment = result.rows[0];

    // Get replies if this is a parent comment
    if (!comment.parent_id) {
      const repliesResult = await query(
        `SELECT c.*, 
                u.full_name as user_name, u.avatar_url as user_avatar
         FROM comments c
         JOIN users u ON c.user_id = u.id
         WHERE c.parent_id = $1
         ORDER BY c.created_at ASC`,
        [commentId]
      );
      comment.replies = repliesResult.rows;
    }

    return comment;
  } catch (error) {
    logger.error('Get comment by ID error', error, { commentId });
    throw error;
  }
};

/**
 * Get comments for a session
 */
export const getSessionComments = async (sessionId, filters = {}) => {
  try {
    const { limit = 50, offset = 0 } = filters;

    const result = await query(
      `SELECT c.*, 
              u.full_name as user_name, u.avatar_url as user_avatar
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.session_id = $1 AND c.parent_id IS NULL
       ORDER BY c.created_at DESC
       LIMIT $2 OFFSET $3`,
      [sessionId, limit, offset]
    );

    // Get replies for each comment
    const commentsWithReplies = await Promise.all(
      result.rows.map(async (comment) => {
        const repliesResult = await query(
          `SELECT c.*, 
                  u.full_name as user_name, u.avatar_url as user_avatar
           FROM comments c
           JOIN users u ON c.user_id = u.id
           WHERE c.parent_id = $1
           ORDER BY c.created_at ASC`,
          [comment.id]
        );
        comment.replies = repliesResult.rows;
        return comment;
      })
    );

    return commentsWithReplies;
  } catch (error) {
    logger.error('Get session comments error', error, { sessionId });
    throw error;
  }
};

/**
 * Like/unlike a comment
 */
export const toggleCommentLike = async (userId, commentId) => {
  try {
    // Check if already liked
    const existingResult = await query(
      `SELECT id FROM comment_likes 
       WHERE comment_id = $1 AND user_id = $2`,
      [commentId, userId]
    );

    if (existingResult.rows.length > 0) {
      // Unlike
      await query(
        `DELETE FROM comment_likes 
         WHERE comment_id = $1 AND user_id = $2`,
        [commentId, userId]
      );

      // Decrement like count
      await query(
        `UPDATE comments 
         SET like_count = GREATEST(like_count - 1, 0)
         WHERE id = $1`,
        [commentId]
      );

      return { liked: false };
    } else {
      // Like
      await query(
        `INSERT INTO comment_likes (id, comment_id, user_id)
         VALUES ($1, $2, $3)`,
        [uuidv4(), commentId, userId]
      );

      // Increment like count
      await query(
        `UPDATE comments 
         SET like_count = like_count + 1
         WHERE id = $1`,
        [commentId]
      );

      return { liked: true };
    }
  } catch (error) {
    logger.error('Toggle comment like error', error, { userId, commentId });
    throw error;
  }
};

/**
 * Report a comment
 */
export const reportComment = async (commentId) => {
  try {
    await query(
      `UPDATE comments 
       SET is_reported = TRUE, reported_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [commentId]
    );

    return { reported: true };
  } catch (error) {
    logger.error('Report comment error', error, { commentId });
    throw error;
  }
};

export default {
  createComment,
  getCommentById,
  getSessionComments,
  toggleCommentLike,
  reportComment,
};

