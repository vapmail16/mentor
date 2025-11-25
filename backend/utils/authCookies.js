/**
 * Cookie configuration for authentication tokens
 */
const COOKIE_NAME = 'auth_token';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
};

/**
 * Set authentication cookie
 */
export const setAuthCookie = (res, token) => {
  res.cookie(COOKIE_NAME, token, COOKIE_OPTIONS);
};

/**
 * Clear authentication cookie
 */
export const clearAuthCookie = (res) => {
  res.clearCookie(COOKIE_NAME, {
    ...COOKIE_OPTIONS,
    maxAge: 0,
  });
};

/**
 * Get token from request (cookie or header)
 */
export const getTokenFromRequest = (req) => {
  // Try cookie first
  if (req.cookies && req.cookies[COOKIE_NAME]) {
    return req.cookies[COOKIE_NAME];
  }

  // Try authorization header
  const authHeader = req.headers['authorization'];
  if (authHeader && typeof authHeader === 'string') {
    const [scheme, token] = authHeader.split(' ');
    if (scheme?.toLowerCase() === 'bearer' && token) {
      return token;
    }
  }

  return null;
};

