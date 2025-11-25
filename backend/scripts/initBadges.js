import dotenv from 'dotenv';
import { query } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

async function initializeBadges() {
  try {
    logger.info('Initializing default badges...');

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
        name: 'Topic Master',
        description: 'Completed all sessions in a topic',
        icon_url: null,
        badge_type: 'topic_master',
        criteria: { topics_completed: 1 },
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
      {
        name: 'Mentor Favorite',
        description: 'Received recognition from a mentor',
        icon_url: null,
        badge_type: 'mentor_favorite',
        criteria: {},
      },
    ];

    for (const badge of defaultBadges) {
      const result = await query(
        `SELECT id FROM badges WHERE badge_type = $1 AND name = $2`,
        [badge.badge_type, badge.name]
      );

      if (result.rows.length === 0) {
        await query(
          `INSERT INTO badges (id, name, description, icon_url, badge_type, criteria)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            uuidv4(),
            badge.name,
            badge.description,
            badge.icon_url,
            badge.badge_type,
            JSON.stringify(badge.criteria),
          ]
        );
        logger.info(`Created badge: ${badge.name}`);
      } else {
        logger.info(`Badge already exists: ${badge.name}`);
      }
    }

    logger.info('Default badges initialization completed');
    process.exit(0);
  } catch (error) {
    logger.error('Failed to initialize badges', error);
    process.exit(1);
  }
}

initializeBadges();

