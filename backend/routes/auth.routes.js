import express from 'express';
import Joi from 'joi';
import authService from '../services/auth.service.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { setAuthCookie, clearAuthCookie } from '../utils/authCookies.js';
import { validatePasswordStrength, PASSWORD_REQUIREMENTS } from '../utils/passwordPolicy.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 login attempts per window
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation schemas
const registerSchema = Joi.object({
  email: Joi.string().email().max(255).required(),
  password: Joi.string().min(12).max(128).required().messages({
    'string.min': PASSWORD_REQUIREMENTS,
    'string.max': PASSWORD_REQUIREMENTS,
  }),
  fullName: Joi.string().min(2).max(100).required(),
  role: Joi.string().valid('guest', 'mentee', 'mentor', 'admin').default('mentee'),
  phone: Joi.string().optional(),
  mentorProfileData: Joi.object({
    bio: Joi.string().optional(),
    domains: Joi.array().items(Joi.string()).optional(),
    specialties: Joi.array().items(Joi.string()).optional(),
    languages: Joi.array().items(Joi.string()).optional(),
    achievements: Joi.array().items(Joi.string()).optional(),
  }).optional(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const updatePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(12).max(128).required().messages({
    'string.min': PASSWORD_REQUIREMENTS,
    'string.max': PASSWORD_REQUIREMENTS,
  }),
});

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', authLimiter, asyncHandler(async (req, res) => {
  // Validate input
  const { error, value } = registerSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: {
        message: error.details[0].message,
      },
    });
  }

  const passwordError = validatePasswordStrength(value.password);
  if (passwordError) {
    return res.status(400).json({
      success: false,
      error: {
        message: passwordError,
      },
    });
  }

  const { email, password, fullName, role, mentorProfileData } = value;

  // Register user
  const result = await authService.register(
    email,
    password,
    fullName,
    role,
    mentorProfileData
  );

  // Set auth cookie
  setAuthCookie(res, result.token);

  res.status(201).json({
    success: true,
    data: {
      user: {
        userId: result.userId,
        email: result.email,
        fullName: result.fullName,
        role: result.role,
      },
      emailConfirmationRequired: result.emailConfirmationRequired ?? false,
    },
  });
}));

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', loginLimiter, asyncHandler(async (req, res) => {
  // Validate input
  const { error, value } = loginSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: {
        message: error.details[0].message,
      },
    });
  }

  const { email, password } = value;

  // Login user
  const result = await authService.login(email, password);

  // Set auth cookie
  setAuthCookie(res, result.token);

  res.json({
    success: true,
    data: {
      user: {
        userId: result.userId,
        email: result.email,
        fullName: result.fullName,
        role: result.role,
      },
    },
  });
}));

/**
 * POST /api/auth/logout
 * Clear auth session cookie
 */
router.post('/logout', (req, res) => {
  clearAuthCookie(res);
  res.json({
    success: true,
    data: { success: true },
  });
});

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get('/me', authenticateToken, asyncHandler(async (req, res) => {
  const user = await authService.getUserById(req.user.userId);

  res.json({
    success: true,
    data: {
      userId: user.id,
      email: user.email,
      fullName: user.full_name,
      phone: user.phone,
      avatarUrl: user.avatar_url,
      bio: user.bio,
      role: user.role,
      emailConfirmed: user.email_confirmed,
      subscriptionStatus: user.subscription_status,
      createdAt: user.created_at,
    },
  });
}));

/**
 * PUT /api/auth/password
 * Update user password
 */
router.put('/password', authenticateToken, asyncHandler(async (req, res) => {
  // Validate input
  const { error, value } = updatePasswordSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: {
        message: error.details[0].message,
      },
    });
  }

  const passwordError = validatePasswordStrength(value.newPassword);
  if (passwordError) {
    return res.status(400).json({
      success: false,
      error: {
        message: passwordError,
      },
    });
  }

  const { currentPassword, newPassword } = value;

  // Update password
  await authService.updatePassword(req.user.userId, currentPassword, newPassword);

  res.json({
    success: true,
    data: { success: true },
  });
}));

/**
 * POST /api/auth/verify-token
 * Verify if token is valid
 */
router.post('/verify-token', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      valid: true,
      user: {
        userId: req.user.userId,
        email: req.user.email,
        role: req.user.role,
      },
    },
  });
});

/**
 * POST /api/auth/confirm-email
 * Confirm email address with token
 */
router.post('/confirm-email', asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Confirmation token is required',
      },
    });
  }

  const result = await authService.confirmEmail(token);
  setAuthCookie(res, result.token);

  res.json({
    success: true,
    data: {
      success: true,
      user: result.user,
    },
  });
}));

/**
 * POST /api/auth/resend-confirmation
 * Resend email confirmation
 */
router.post('/resend-confirmation', authLimiter, asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Email is required',
      },
    });
  }

  await authService.resendEmailConfirmation(email);

  res.json({
    success: true,
    data: { success: true },
  });
}));

export default router;

