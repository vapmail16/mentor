import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { query } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { emailService } from './email.service.js';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Lazy validation - only check when actually needed (not at module load for tests)
const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
  }
  return secret;
};

/**
 * Generate JWT token
 */
const generateToken = (userId, email, role) => {
  return jwt.sign(
    { userId, email, role },
    getJwtSecret(),
    { expiresIn: JWT_EXPIRES_IN }
  );
};

/**
 * Verify JWT token
 */
export const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, getJwtSecret());
    return {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

/**
 * Hash password
 */
const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

/**
 * Compare password with hash
 */
const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

/**
 * Generate email confirmation token
 */
const generateEmailToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Register a new user
 */
export const register = async (email, password, fullName, role = 'mentee', mentorProfileData = null) => {
  try {
    // Check if user already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      throw new Error('User with this email already exists');
    }

    // Validate role
    const validRoles = ['guest', 'mentee', 'mentor', 'admin'];
    if (!validRoles.includes(role)) {
      throw new Error('Invalid role');
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Generate email confirmation token
    const emailToken = generateEmailToken();
    const emailTokenExpires = new Date();
    emailTokenExpires.setHours(emailTokenExpires.getHours() + 24); // 24 hours

    // Create user
    const userId = uuidv4();
    const result = await query(
      `INSERT INTO users (id, email, password_hash, full_name, role, email_confirmation_token, email_confirmation_expires)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, email, full_name, role, email_confirmed, created_at`,
      [
        userId,
        email.toLowerCase(),
        passwordHash,
        fullName,
        role,
        emailToken,
        emailTokenExpires,
      ]
    );

    const user = result.rows[0];

    // Create mentor profile if role is mentor
    if (role === 'mentor' && mentorProfileData) {
      await query(
        `INSERT INTO mentors (user_id, bio, domains, specialties, languages, achievements)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          userId,
          mentorProfileData.bio || null,
          mentorProfileData.domains || [],
          mentorProfileData.specialties || [],
          mentorProfileData.languages || [],
          mentorProfileData.achievements || [],
        ]
      );
    }

    // Send welcome email with confirmation link
    try {
      const confirmationUrl = `${process.env.FRONTEND_URL}/confirm-email?token=${emailToken}`;
      await emailService.sendWelcomeEmail(email, fullName, confirmationUrl);
    } catch (emailError) {
      logger.error('Failed to send welcome email', emailError, { userId, email });
      // Don't fail registration if email fails
    }

    // Generate token
    const token = generateToken(user.id, user.email, user.role);

    logger.info('User registered successfully', {
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      userId: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      token,
      emailConfirmationRequired: !user.email_confirmed,
    };
  } catch (error) {
    logger.error('Registration error', error, { email, role });
    throw error;
  }
};

/**
 * Login user
 */
export const login = async (email, password) => {
  try {
    // Get user by email
    const userResult = await query(
      'SELECT id, email, password_hash, full_name, role, email_confirmed FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (userResult.rows.length === 0) {
      throw new Error('Invalid email or password');
    }

    const user = userResult.rows[0];

    // Verify password
    const passwordValid = await comparePassword(password, user.password_hash);
    if (!passwordValid) {
      throw new Error('Invalid email or password');
    }

    // Update last login
    await query(
      'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    // Generate token
    const token = generateToken(user.id, user.email, user.role);

    logger.info('User logged in successfully', {
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      userId: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      token,
    };
  } catch (error) {
    logger.error('Login error', error, { email });
    throw error;
  }
};

/**
 * Get user by ID
 */
export const getUserById = async (userId) => {
  try {
    const result = await query(
      `SELECT id, email, full_name, role, phone, avatar_url, bio, 
              email_confirmed, subscription_status, created_at, last_login_at
       FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    return result.rows[0];
  } catch (error) {
    logger.error('Get user by ID error', error, { userId });
    throw error;
  }
};

/**
 * Confirm email address
 */
export const confirmEmail = async (token) => {
  try {
    const result = await query(
      `SELECT id, email, full_name, role, email_confirmation_expires
       FROM users 
       WHERE email_confirmation_token = $1 AND email_confirmed = FALSE`,
      [token]
    );

    if (result.rows.length === 0) {
      throw new Error('Invalid or expired confirmation token');
    }

    const user = result.rows[0];

    // Check if token has expired
    if (new Date() > new Date(user.email_confirmation_expires)) {
      throw new Error('Confirmation token has expired');
    }

    // Update user
    await query(
      `UPDATE users 
       SET email_confirmed = TRUE, 
           email_confirmation_token = NULL,
           email_confirmation_expires = NULL
       WHERE id = $1`,
      [user.id]
    );

    // Generate token
    const jwtToken = generateToken(user.id, user.email, user.role);

    logger.info('Email confirmed successfully', {
      userId: user.id,
      email: user.email,
    });

    return {
      user: {
        userId: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
      },
      token: jwtToken,
    };
  } catch (error) {
    logger.error('Email confirmation error', error, { token: token.substring(0, 10) + '...' });
    throw error;
  }
};

/**
 * Resend email confirmation
 */
export const resendEmailConfirmation = async (email) => {
  try {
    const result = await query(
      `SELECT id, full_name, email_confirmed, email_confirmation_token, email_confirmation_expires
       FROM users WHERE email = $1`,
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    const user = result.rows[0];

    if (user.email_confirmed) {
      throw new Error('Email is already confirmed');
    }

    // Generate new token
    const emailToken = generateEmailToken();
    const emailTokenExpires = new Date();
    emailTokenExpires.setHours(emailTokenExpires.getHours() + 24);

    // Update user
    await query(
      `UPDATE users 
       SET email_confirmation_token = $1, 
           email_confirmation_expires = $2
       WHERE id = $3`,
      [emailToken, emailTokenExpires, user.id]
    );

    // Send confirmation email
    const confirmationUrl = `${process.env.FRONTEND_URL}/confirm-email?token=${emailToken}`;
    await emailService.sendWelcomeEmail(email, user.full_name, confirmationUrl);

    logger.info('Email confirmation resent', {
      userId: user.id,
      email: user.email,
    });
  } catch (error) {
    logger.error('Resend email confirmation error', error, { email });
    throw error;
  }
};

/**
 * Update password
 */
export const updatePassword = async (userId, currentPassword, newPassword) => {
  try {
    // Get user
    const userResult = await query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }

    const user = userResult.rows[0];

    // Verify current password
    const passwordValid = await comparePassword(currentPassword, user.password_hash);
    if (!passwordValid) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password
    await query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [newPasswordHash, userId]
    );

    logger.info('Password updated successfully', { userId });
  } catch (error) {
    logger.error('Update password error', error, { userId });
    throw error;
  }
};

/**
 * Delete user account
 */
export const deleteUser = async (userId) => {
  try {
    await query('DELETE FROM users WHERE id = $1', [userId]);

    logger.info('User account deleted', { userId });
  } catch (error) {
    logger.error('Delete user error', error, { userId });
    throw error;
  }
};

export default {
  register,
  login,
  getUserById,
  verifyToken,
  confirmEmail,
  resendEmailConfirmation,
  updatePassword,
  deleteUser,
};

