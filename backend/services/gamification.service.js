import { query, getClient } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Update learning streak
 */
export const updateLearningStreak = async (userId) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get current streak
    const streakResult = await query(
      'SELECT * FROM learning_streaks WHERE user_id = $1',
      [userId]
    );

    let streak;
    if (streakResult.rows.length === 0) {
      // Create new streak
      const streakId = uuidv4();
      const insertResult = await query(
        `INSERT INTO learning_streaks (id, user_id, current_streak, longest_streak, last_activity_date)
         VALUES ($1, $2, 1, 1, $3)
         RETURNING *`,
        [streakId, userId, today]
      );
      streak = insertResult.rows[0];
    } else {
      streak = streakResult.rows[0];
      const lastActivity = streak.last_activity_date 
        ? new Date(streak.last_activity_date)
        : null;

      if (!lastActivity || lastActivity < today) {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (lastActivity && lastActivity.getTime() === yesterday.getTime()) {
          // Continue streak
          const newStreak = streak.current_streak + 1;
          const updateResult = await query(
            `UPDATE learning_streaks 
             SET current_streak = $1,
                 longest_streak = GREATEST(longest_streak, $1),
                 last_activity_date = $2,
                 updated_at = CURRENT_TIMESTAMP
             WHERE user_id = $3
             RETURNING *`,
            [newStreak, today, userId]
          );
          streak = updateResult.rows[0];
        } else if (!lastActivity || lastActivity < yesterday) {
          // Reset streak
          const updateResult = await query(
            `UPDATE learning_streaks 
             SET current_streak = 1,
                 last_activity_date = $1,
                 updated_at = CURRENT_TIMESTAMP
             WHERE user_id = $2
             RETURNING *`,
            [today, userId]
          );
          streak = updateResult.rows[0];
        }
      }
    }

    // Check for streak badges
    await checkAndAwardBadges(userId, 'streak', streak.current_streak);

    return streak;
  } catch (error) {
    logger.error('Update learning streak error', error, { userId });
    throw error;
  }
};

/**
 * Check and award badges based on criteria
 */
export const checkAndAwardBadges = async (userId, badgeType, value) => {
  try {
    // Get available badges for this type
    const badgesResult = await query(
      `SELECT * FROM badges WHERE badge_type = $1`,
      [badgeType]
    );

    // Check if user already has the badge
    const userBadgesResult = await query(
      `SELECT badge_id FROM user_badges WHERE user_id = $1`,
      [userId]
    );

    const existingBadgeIds = new Set(userBadgesResult.rows.map(r => r.badge_id));

    for (const badge of badgesResult.rows) {
      if (existingBadgeIds.has(badge.id)) {
        continue; // User already has this badge
      }

      // Check criteria
      const criteria = badge.criteria || {};
      let shouldAward = false;

      switch (badgeType) {
        case 'streak':
          shouldAward = value >= (criteria.days || 0);
          break;
        case 'sessions_completed':
          shouldAward = value >= (criteria.count || 0);
          break;
        case 'first_video':
          shouldAward = value >= 1;
          break;
        default:
          shouldAward = false;
      }

      if (shouldAward) {
        await awardBadge(userId, badge.id);
        logger.info('Badge awarded', { userId, badgeId: badge.id, badgeName: badge.name });
      }
    }
  } catch (error) {
    logger.error('Check and award badges error', error, { userId, badgeType, value });
    // Don't throw - badge checking should not block other operations
  }
};

/**
 * Award a badge to a user
 */
export const awardBadge = async (userId, badgeId) => {
  try {
    const result = await query(
      `INSERT INTO user_badges (id, user_id, badge_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, badge_id) DO NOTHING
       RETURNING *`,
      [uuidv4(), userId, badgeId]
    );

    return result.rows[0] || null;
  } catch (error) {
    logger.error('Award badge error', error, { userId, badgeId });
    throw error;
  }
};

/**
 * Get user badges
 */
export const getUserBadges = async (userId) => {
  try {
    const result = await query(
      `SELECT ub.*, b.name, b.description, b.icon_url, b.badge_type
       FROM user_badges ub
       JOIN badges b ON ub.badge_id = b.id
       WHERE ub.user_id = $1
       ORDER BY ub.earned_at DESC`,
      [userId]
    );

    return result.rows;
  } catch (error) {
    logger.error('Get user badges error', error, { userId });
    throw error;
  }
};

/**
 * Get user streak
 */
export const getUserStreak = async (userId) => {
  try {
    const result = await query(
      'SELECT * FROM learning_streaks WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return {
        current_streak: 0,
        longest_streak: 0,
        last_activity_date: null,
      };
    }

    return result.rows[0];
  } catch (error) {
    logger.error('Get user streak error', error, { userId });
    throw error;
  }
};

/**
 * Initialize default badges
 */
export const initializeDefaultBadges = async () => {
  try {
    const defaultBadges = [
      {
        name: 'First Video',
        description: 'Completed your first video session',
        icon_url: null,
        badge_type: 'first_video',
        criteria: { count: 1 },
      },
      {
        name: '10 Sessions Completed',
        description: 'Completed 10 mentorship sessions',
        icon_url: null,
        badge_type: 'sessions_completed',
        criteria: { count: 10 },
      },
      {
        name: '7-Day Streak',
        description: 'Maintained a 7-day learning streak',
        icon_url: null,
        badge_type: 'streak',
        criteria: { days: 7 },
      },
      {
        name: '30-Day Streak',
        description: 'Maintained a 30-day learning streak',
        icon_url: null,
        badge_type: 'streak',
        criteria: { days: 30 },
      },
    ];

    for (const badge of defaultBadges) {
      await query(
        `INSERT INTO badges (id, name, description, icon_url, badge_type, criteria)
         SELECT $1, $2, $3, $4, $5, $6
         WHERE NOT EXISTS (SELECT 1 FROM badges WHERE badge_type = $5 AND name = $2)`,
        [
          uuidv4(),
          badge.name,
          badge.description,
          badge.icon_url,
          badge.badge_type,
          JSON.stringify(badge.criteria),
        ]
      );
    }

    logger.info('Default badges initialized');
  } catch (error) {
    logger.error('Initialize default badges error', error);
    throw error;
  }
};

/**
 * Track session completion for badges
 */
export const trackSessionCompletion = async (userId, sessionId) => {
  try {
    // Get completed sessions count
    const countResult = await query(
      `SELECT COUNT(*) as count FROM watch_history
       WHERE user_id = $1 AND progress_percentage >= 90`,
      [userId]
    );

    const completedCount = parseInt(countResult.rows[0].count) || 0;

    // Check for first video badge
    if (completedCount === 1) {
      await checkAndAwardBadges(userId, 'first_video', 1);
    }

    // Check for sessions completed badges
    await checkAndAwardBadges(userId, 'sessions_completed', completedCount);

    // Update streak
    await updateLearningStreak(userId);
  } catch (error) {
    logger.error('Track session completion error', error, { userId, sessionId });
    // Don't throw - gamification tracking should not block session completion
  }
};

export default {
  updateLearningStreak,
  checkAndAwardBadges,
  awardBadge,
  getUserBadges,
  getUserStreak,
  initializeDefaultBadges,
  trackSessionCompletion,
};

