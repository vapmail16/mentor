import { query } from '../config/database.js';
import { logger } from '../utils/logger.js';

/**
 * Search sessions by text
 */
export const searchSessions = async (searchQuery, filters = {}) => {
  try {
    const { mentor_id, language, difficulty_level, topic_id, limit = 50, offset = 0 } = filters;

    let queryText = `
      SELECT s.*, 
             m.domains, m.specialties,
             u.full_name as mentor_name, u.avatar_url as mentor_avatar,
             ts_rank(s.search_vector, plainto_tsquery('english', $1)) as rank
      FROM sessions s
      JOIN mentors m ON s.mentor_id = m.id
      JOIN users u ON m.user_id = u.id
      WHERE s.is_published = TRUE
        AND (
          s.search_vector @@ plainto_tsquery('english', $1)
          OR s.title ILIKE $2
          OR s.description ILIKE $3
        )
    `;

    const params = [searchQuery, `%${searchQuery}%`, `%${searchQuery}%`];
    let paramCount = 4;

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

    queryText += `
      ORDER BY rank DESC, s.published_at DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;

    params.push(limit, offset);

    const result = await query(queryText, params);
    return result.rows;
  } catch (error) {
    logger.error('Search sessions error', error, { searchQuery, filters });
    throw error;
  }
};

/**
 * Search mentors by text
 */
export const searchMentors = async (searchQuery, filters = {}) => {
  try {
    const { domain, verification_status = 'verified', limit = 50, offset = 0 } = filters;

    let queryText = `
      SELECT m.*, 
             u.full_name, u.avatar_url,
             ts_rank(m.search_vector, plainto_tsquery('english', $1)) as rank
      FROM mentors m
      JOIN users u ON m.user_id = u.id
      WHERE m.verification_status = $2
        AND (
          m.search_vector @@ plainto_tsquery('english', $1)
          OR u.full_name ILIKE $3
          OR m.bio ILIKE $3
        )
    `;

    const params = [searchQuery, verification_status, `%${searchQuery}%`];
    let paramCount = 4;

    if (domain) {
      queryText += ` AND $${paramCount} = ANY(m.domains)`;
      params.push(domain);
      paramCount++;
    }

    queryText += `
      ORDER BY rank DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;

    params.push(limit, offset);

    const result = await query(queryText, params);
    return result.rows;
  } catch (error) {
    logger.error('Search mentors error', error, { searchQuery, filters });
    throw error;
  }
};

/**
 * Search across all content types
 */
export const globalSearch = async (searchQuery, filters = {}) => {
  try {
    const { type, limit = 20 } = filters;

    const results = {
      sessions: [],
      mentors: [],
    };

    if (!type || type === 'sessions') {
      results.sessions = await searchSessions(searchQuery, { limit: Math.floor(limit / 2) });
    }

    if (!type || type === 'mentors') {
      results.mentors = await searchMentors(searchQuery, { limit: Math.floor(limit / 2) });
    }

    return results;
  } catch (error) {
    logger.error('Global search error', error, { searchQuery, filters });
    throw error;
  }
};

export default {
  searchSessions,
  searchMentors,
  globalSearch,
};

