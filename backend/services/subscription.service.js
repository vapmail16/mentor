import { query, getClient } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { emailService } from './email.service.js';

/**
 * Get subscription by ID
 */
export const getSubscriptionById = async (subscriptionId) => {
  try {
    const result = await query(
      `SELECT * FROM subscriptions WHERE id = $1`,
      [subscriptionId]
    );

    if (result.rows.length === 0) {
      throw new Error('Subscription not found');
    }

    return result.rows[0];
  } catch (error) {
    logger.error('Get subscription by ID error', error, { subscriptionId });
    throw error;
  }
};

/**
 * Get subscription by Cashfree order ID
 */
export const getSubscriptionByOrderId = async (orderId) => {
  try {
    const result = await query(
      `SELECT * FROM subscriptions WHERE cashfree_order_id = $1`,
      [orderId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  } catch (error) {
    logger.error('Get subscription by order ID error', error, { orderId });
    throw error;
  }
};

/**
 * Create a new subscription
 */
export const createSubscription = async (subscriptionData) => {
  try {
    const {
      user_id,
      plan_type,
      amount,
      currency = 'INR',
      cashfree_order_id,
    } = subscriptionData;

    // Calculate expiry date based on plan type
    const expiresAt = new Date();
    if (plan_type === 'monthly') {
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    } else if (plan_type === 'annual') {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    } else if (plan_type === 'student') {
      expiresAt.setMonth(expiresAt.getMonth() + 1); // Student plans are monthly
    } else {
      // Corporate plans have custom expiry
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    }

    const result = await query(
      `INSERT INTO subscriptions 
       (user_id, plan_type, amount, currency, cashfree_order_id, payment_status, started_at, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, $7)
       RETURNING *`,
      [
        user_id,
        plan_type,
        amount,
        currency,
        cashfree_order_id,
        'pending',
        expiresAt,
      ]
    );

    return result.rows[0];
  } catch (error) {
    logger.error('Create subscription error', error, { subscriptionData });
    throw error;
  }
};

/**
 * Update subscription
 */
export const updateSubscription = async (subscriptionId, updates) => {
  try {
    const allowedFields = ['payment_status', 'payment_verified', 'cashfree_payment_id', 'cashfree_signature', 'status'];
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

    values.push(subscriptionId);
    const result = await query(
      `UPDATE subscriptions 
       SET ${setClause.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new Error('Subscription not found');
    }

    return result.rows[0];
  } catch (error) {
    logger.error('Update subscription error', error, { subscriptionId, updates });
    throw error;
  }
};

/**
 * Update user subscription status
 */
export const updateUserSubscriptionStatus = async (userId, status, expiresAt = null) => {
  try {
    const updates = {
      subscription_status: status,
    };

    if (expiresAt) {
      const result = await query(
        `UPDATE users 
         SET subscription_status = $1, subscription_expires_at = $2, updated_at = CURRENT_TIMESTAMP
         WHERE id = $3
         RETURNING *`,
        [status, expiresAt, userId]
      );
      return result.rows[0];
    } else {
      const result = await query(
        `UPDATE users 
         SET subscription_status = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING *`,
        [status, userId]
      );
      return result.rows[0];
    }
  } catch (error) {
    logger.error('Update user subscription status error', error, { userId, status });
    throw error;
  }
};

/**
 * Get user's active subscription
 */
export const getUserActiveSubscription = async (userId) => {
  try {
    const result = await query(
      `SELECT * FROM subscriptions 
       WHERE user_id = $1 
       AND payment_status = 'completed' 
       AND payment_verified = TRUE
       AND expires_at > CURRENT_TIMESTAMP
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  } catch (error) {
    logger.error('Get user active subscription error', error, { userId });
    throw error;
  }
};

/**
 * Get all user subscriptions
 */
export const getUserSubscriptions = async (userId) => {
  try {
    const result = await query(
      `SELECT * FROM subscriptions 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [userId]
    );

    return result.rows;
  } catch (error) {
    logger.error('Get user subscriptions error', error, { userId });
    throw error;
  }
};

export default {
  getSubscriptionById,
  getSubscriptionByOrderId,
  createSubscription,
  updateSubscription,
  updateUserSubscriptionStatus,
  getUserActiveSubscription,
  getUserSubscriptions,
};

