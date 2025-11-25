/**
 * Webhook security middleware
 * Validates IP addresses and prevents replay attacks
 */

import { logger } from '../utils/logger.js';
import { query } from '../config/database.js';

// Cashfree IP whitelist (update with actual IPs from Cashfree documentation)
// These are example IPs - you should get the actual list from Cashfree support
const CASHFREE_IPS = [
  '52.66.147.72',
  '13.235.21.107',
  // Add more Cashfree webhook IPs here
  // You can get the complete list from: https://docs.cashfree.com/docs/webhooks
];

/**
 * Verify that webhook request comes from Cashfree IP
 */
export const verifyCashfreeIP = (req, res, next) => {
  // Get client IP (considering proxies)
  const clientIP = req.ip || 
                   (req.headers['x-forwarded-for']?.split(',')[0]?.trim()) ||
                   req.socket.remoteAddress ||
                   'unknown';

  // In production, verify IP is from Cashfree
  if (process.env.NODE_ENV === 'production') {
    // Check if IP is in whitelist
    const isAllowed = CASHFREE_IPS.some(allowedIP => {
      // Support CIDR notation if needed
      if (allowedIP.includes('/')) {
        // Simple CIDR check (for production, use ipaddr.js library)
        return clientIP.startsWith(allowedIP.split('/')[0]);
      }
      return clientIP === allowedIP;
    });

    if (!isAllowed) {
      const requestId = req.id;
      logger.warn('Webhook from unauthorized IP', {
        requestId,
        ip: clientIP,
        userAgent: req.headers['user-agent'],
      });
      return res.status(403).json({ error: 'Unauthorized IP' });
    }
  }

  // In development, allow all IPs but log them
  if (process.env.NODE_ENV === 'development') {
    logger.debug('Webhook IP check (development mode)', {
      ip: clientIP,
      allowed: true,
    });
  }

  next();
};

/**
 * Check if webhook was already processed
 */
const isWebhookProcessed = async (webhookId) => {
  try {
    const result = await query(
      `SELECT EXISTS(SELECT 1 FROM processed_webhooks WHERE webhook_id = $1)`,
      [webhookId]
    );
    return result.rows[0].exists;
  } catch (error) {
    logger.error('Error checking webhook status', error, { webhookId });
    return false; // Fail open to prevent service disruption
  }
};

/**
 * Record webhook as processed
 */
const recordWebhookProcessed = async (webhookId, orderId, paymentId) => {
  try {
    await query(
      `INSERT INTO processed_webhooks (webhook_id, order_id, payment_id, processed_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (webhook_id) DO NOTHING`,
      [webhookId, orderId, paymentId]
    );
  } catch (error) {
    logger.error('Error recording webhook', error, { webhookId, orderId, paymentId });
    // Don't throw - logging failure shouldn't block webhook processing
  }
};

/**
 * Prevent webhook replay attacks using database
 */
export const preventWebhookReplay = async (req, res, next) => {
  try {
    const payload = req.body;
    
    // Generate unique webhook ID from payload
    const webhookId = payload.webhook_id || 
                     `${payload.data?.order?.order_id || ''}-${payload.data?.payment?.cf_payment_id || ''}` ||
                     `${payload.type || ''}-${Date.now()}`;

    if (!webhookId) {
      return res.status(400).json({ error: 'Invalid webhook payload' });
    }

    // Check if webhook was already processed
    const processed = await isWebhookProcessed(webhookId);
    if (processed) {
      const requestId = req.id;
      logger.warn('Duplicate webhook detected', {
        requestId,
        webhookId,
        ip: req.ip,
      });
      return res.json({ 
        status: 'success',
        message: 'Webhook already processed' 
      });
    }

    // Record webhook as processed
    const orderId = payload.data?.order?.order_id || null;
    const paymentId = payload.data?.payment?.cf_payment_id || null;
    await recordWebhookProcessed(webhookId, orderId, paymentId);

    // Attach webhook ID to request for logging
    req.webhookId = webhookId;
    next();
  } catch (error) {
    logger.error('Error in webhook replay prevention', error);
    // Fail open to prevent service disruption
    next();
  }
};

/**
 * Log all webhook attempts for security monitoring
 */
export const logWebhookAttempt = (req, res, next) => {
  const requestId = req.id;
  const signature = req.headers['x-webhook-signature'];
  
  logger.info('Webhook received', {
    requestId,
    ip: req.ip,
    signature: signature ? `${signature.substring(0, 10)}...` : 'missing',
    orderId: req.body?.data?.order?.order_id,
    event: req.body?.type,
    userAgent: req.headers['user-agent'],
  });

  next();
};

