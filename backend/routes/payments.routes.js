import express from 'express';
import crypto from 'crypto';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';
import { fetchWithTimeout } from '../utils/fetchWithTimeout.js';
import { verifyCashfreeIP, preventWebhookReplay, logWebhookAttempt } from '../middleware/webhookSecurity.js';
import subscriptionService from '../services/subscription.service.js';
import { query, getClient } from '../config/database.js';
import { emailService } from '../services/email.service.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limiting
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
  message: 'Too many payment requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

const webhookLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 webhook requests per minute
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * POST /api/payments/create-order
 * Create a Cashfree order for subscription
 */
router.post('/create-order', authenticateToken, paymentLimiter, asyncHandler(async (req, res) => {
  const requestId = req.id;
  const { plan_type, amount } = req.body;

  // Validate input
  const validPlans = ['monthly', 'annual', 'student', 'corporate'];
  if (!plan_type || !validPlans.includes(plan_type)) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Invalid plan type. Must be one of: monthly, annual, student, corporate',
      },
    });
  }

  if (!amount || typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Invalid amount',
      },
    });
  }

  logger.info('Creating Cashfree subscription order', {
    requestId,
    userId: req.user.userId,
    planType: plan_type,
    amount,
  });

  // Get Cashfree credentials
  const cashfreeAppId = process.env.CASHFREE_APP_ID;
  const cashfreeSecretKey = process.env.CASHFREE_SECRET_KEY;

  if (!cashfreeAppId || !cashfreeSecretKey) {
    throw new Error('Cashfree credentials not configured');
  }

  // Get user data including phone number
  const userResult = await query(
    'SELECT id, email, full_name, phone FROM users WHERE id = $1',
    [req.user.userId]
  );

  if (userResult.rows.length === 0) {
    throw new Error('User not found');
  }

  const user = userResult.rows[0];

  // Cashfree requires phone number - use user's phone or a default test number
  let customerPhone = user.phone;
  if (!customerPhone) {
    customerPhone = '919876543210'; // Default test number
    logger.warn('User phone number not found, using default test number', {
      requestId,
      userId: req.user.userId,
    });
  }

  // Ensure phone number is in correct format (remove any spaces, dashes, etc.)
  customerPhone = customerPhone.replace(/[\s\-\(\)]/g, '');

  // Create order data
  const orderId = `sub_${req.user.userId}_${Date.now()}`;
  const orderAmount = amount * 100; // Convert to paise
  const orderData = {
    order_id: orderId,
    order_amount: orderAmount,
    order_currency: 'INR',
    customer_details: {
      customer_id: req.user.userId,
      customer_email: user.email,
      customer_name: user.full_name || user.email,
      customer_phone: customerPhone,
    },
    order_meta: {
      return_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/success`,
      notify_url: `${process.env.BACKEND_URL || 'http://localhost:3001'}/api/payments/webhook`,
    },
    order_note: `Subscription: ${plan_type}`,
  };

  // Determine Cashfree API URL (sandbox vs production)
  const isTestMode = cashfreeAppId.startsWith('TEST') || cashfreeSecretKey.includes('_test_');
  const cashfreeApiUrl = isTestMode
    ? 'https://sandbox.cashfree.com/pg/orders'
    : 'https://api.cashfree.com/pg/orders';

  logger.info('Using Cashfree API', {
    requestId,
    url: cashfreeApiUrl,
    isTestMode,
  });

  // Create Cashfree order with timeout
  const response = await fetchWithTimeout(
    cashfreeApiUrl,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-version': '2023-08-01',
        'x-client-id': cashfreeAppId,
        'x-client-secret': cashfreeSecretKey,
      },
      body: JSON.stringify(orderData),
      timeout: 10000, // 10 second timeout
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    logger.error('Cashfree API error', new Error(errorText), {
      requestId,
      userId: req.user.userId,
      status: response.status,
      errorBody: errorText,
    });
    throw new Error(`Cashfree API error: ${response.status} ${response.statusText}`);
  }

  const cashfreeOrder = await response.json();

  logger.info('Cashfree order created', {
    requestId,
    userId: req.user.userId,
    orderId: cashfreeOrder.order_id,
  });

  // Create subscription record
  let subscription;
  try {
    subscription = await subscriptionService.createSubscription({
      user_id: req.user.userId,
      plan_type,
      amount,
      currency: 'INR',
      cashfree_order_id: cashfreeOrder.order_id,
    });

    logger.info('Subscription record created', {
      requestId,
      userId: req.user.userId,
      subscriptionId: subscription.id,
    });
  } catch (dbError) {
    logger.error('Database error creating subscription', dbError, {
      requestId,
      userId: req.user.userId,
      orderId: cashfreeOrder.order_id,
    });
    // Don't fail the payment if DB is slow - webhook will handle it
  }

  res.json({
    success: true,
    data: {
      orderId: cashfreeOrder.order_id,
      amount: cashfreeOrder.order_amount / 100, // Convert back to rupees
      currency: cashfreeOrder.order_currency,
      paymentSessionId: cashfreeOrder.payment_session_id,
      subscriptionId: subscription?.id,
    },
  });
}));

/**
 * POST /api/payments/verify-payment
 * Verify payment signature (client-side verification)
 */
router.post('/verify-payment', authenticateToken, paymentLimiter, asyncHandler(async (req, res) => {
  const requestId = req.id;
  const { order_id, payment_id, signature } = req.body;

  if (!order_id || !payment_id || !signature) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Missing required fields: order_id, payment_id, signature',
      },
    });
  }

  logger.info('Verifying payment', {
    requestId,
    userId: req.user.userId,
    orderId: order_id,
  });

  // Verify signature
  const cashfreeSecretKey = process.env.CASHFREE_SECRET_KEY;
  if (!cashfreeSecretKey) {
    throw new Error('Cashfree secret not configured');
  }

  const message = `${order_id}${payment_id}${cashfreeSecretKey}`;
  const expectedSignature = crypto
    .createHash('sha256')
    .update(message)
    .digest('hex');

  if (expectedSignature !== signature) {
    logger.warn('Payment signature verification failed', {
      requestId,
      userId: req.user.userId,
      orderId: order_id,
    });
    return res.status(400).json({
      success: false,
      error: {
        message: 'Invalid payment signature',
      },
    });
  }

  logger.info('Payment signature verified successfully', {
    requestId,
    userId: req.user.userId,
  });

  res.json({
    success: true,
    data: {
      verified: true,
    },
  });
}));

/**
 * POST /api/payments/webhook
 * Cashfree webhook handler
 */
router.post('/webhook',
  webhookLimiter,
  verifyCashfreeIP,
  logWebhookAttempt,
  preventWebhookReplay,
  asyncHandler(async (req, res) => {
    try {
      const payload = req.body;
      const signature = req.headers['x-webhook-signature'];
      const requestId = req.id;

      // Verify webhook signature
      const cashfreeSecretKey = process.env.CASHFREE_SECRET_KEY;
      if (!cashfreeSecretKey) {
        throw new Error('Cashfree secret not configured');
      }

      const expectedSignature = crypto
        .createHmac('sha256', cashfreeSecretKey)
        .update(JSON.stringify(payload))
        .digest('hex');

      if (signature !== expectedSignature) {
        logger.warn('Webhook signature verification failed', { requestId });
        return res.status(400).json({
          success: false,
          error: {
            message: 'Invalid webhook signature',
          },
        });
      }

      const event = payload.type;
      logger.info('Webhook event received', {
        requestId,
        event,
      });

      // Handle payment success event
      if (event === 'PAYMENT_SUCCESS_WEBHOOK') {
        const orderId = payload.data.order.order_id;
        const paymentId = payload.data.payment.cf_payment_id;

        logger.info('Processing payment via webhook', {
          requestId,
          paymentId,
          orderId,
        });

        // Find the subscription record
        const subscription = await subscriptionService.getSubscriptionByOrderId(orderId);
        
        if (!subscription) {
          logger.warn('Subscription not found for order', {
            requestId,
            orderId,
          });
          return res.status(404).json({
            success: false,
            error: {
              message: 'Subscription not found',
            },
          });
        }

        // Update subscription status using transaction
        const client = await getClient();
        try {
          await client.query('BEGIN');

          // Update subscription
          await subscriptionService.updateSubscription(subscription.id, {
            payment_status: 'completed',
            payment_verified: true,
            cashfree_payment_id: paymentId,
            cashfree_signature: signature,
          });

          // Update user subscription status
          await subscriptionService.updateUserSubscriptionStatus(
            subscription.user_id,
            'active',
            subscription.expires_at
          );

          await client.query('COMMIT');

          logger.info('Subscription activated successfully', {
            requestId,
            subscriptionId: subscription.id,
            userId: subscription.user_id,
          });
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        } finally {
          client.release();
        }

        // Get user for email
        const userResult = await query(
          'SELECT email, full_name FROM users WHERE id = $1',
          [subscription.user_id]
        );

        if (userResult.rows.length > 0) {
          const user = userResult.rows[0];

          // Send subscription confirmation email (async)
          emailService.sendSubscriptionConfirmationEmail(
            user.email,
            user.full_name,
            subscription.plan_type,
            subscription.amount
          ).catch((error) => {
            logger.error('Error sending subscription confirmation email', error, {
              requestId,
              userId: subscription.user_id,
            });
          });
        }

        logger.info('Successfully processed payment via webhook', {
          requestId,
          orderId,
          paymentId,
        });
      }

      res.json({
        success: true,
        status: 'success',
      });
    } catch (error) {
      const requestId = req.id;
      logger.error('Error in webhook', error, { requestId });
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to process webhook',
        },
      });
    }
  })
);

/**
 * GET /api/payments/subscriptions
 * Get user's subscriptions
 */
router.get('/subscriptions', authenticateToken, asyncHandler(async (req, res) => {
  const subscriptions = await subscriptionService.getUserSubscriptions(req.user.userId);

  res.json({
    success: true,
    data: subscriptions,
  });
}));

/**
 * GET /api/payments/subscription/active
 * Get user's active subscription
 */
router.get('/subscription/active', authenticateToken, asyncHandler(async (req, res) => {
  const subscription = await subscriptionService.getUserActiveSubscription(req.user.userId);

  if (!subscription) {
    return res.json({
      success: true,
      data: null,
    });
  }

  res.json({
    success: true,
    data: subscription,
  });
}));

export default router;

