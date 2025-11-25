import authService from '../services/auth.service.js';
import { getTokenFromRequest } from '../utils/authCookies.js';

/**
 * Extract token from request (cookie or header)
 */
function extractToken(req) {
  return getTokenFromRequest(req);
}

/**
 * Authenticate JWT token
 */
export const authenticateToken = async (req, res, next) => {
  try {
    const token = extractToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Access denied. No token provided.',
        },
      });
    }

    const user = authService.verifyToken(token);
    req.user = user; // { userId, email, role }
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      error: {
        message: 'Access denied. Invalid or expired token.',
      },
    });
  }
};

/**
 * Require specific role
 */
export const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required',
        },
      });
    }

    if (req.user.role !== role) {
      return res.status(403).json({
        success: false,
        error: {
          message: `Insufficient permissions. Required role: ${role}`,
        },
      });
    }

    next();
  };
};

/**
 * Require mentor role
 */
export const requireMentor = requireRole('mentor');

/**
 * Require admin role
 */
export const requireAdmin = requireRole('admin');

/**
 * Require mentee role (paid user)
 */
export const requireMentee = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Authentication required',
      },
    });
  }

  // Mentee or admin can access
  if (req.user.role !== 'mentee' && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: {
        message: 'Subscription required. Please subscribe to access this content.',
      },
    });
  }

  next();
};

/**
 * Optional authentication (doesn't fail if no token)
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const token = extractToken(req);

    if (token) {
      const user = authService.verifyToken(token);
      req.user = user;
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

