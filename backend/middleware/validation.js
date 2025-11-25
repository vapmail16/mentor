/**
 * Validation utilities for common input types
 */

/**
 * Validate email format
 */
export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return null;
  }
  const trimmed = email.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return null;
  }
  return trimmed.toLowerCase();
};

/**
 * Validate UUID format
 */
export const validateUUID = (id) => {
  if (!id || typeof id !== 'string') {
    return false;
  }
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

/**
 * Validate phone number (basic validation)
 */
export const validatePhone = (phone) => {
  if (!phone || typeof phone !== 'string') {
    return null;
  }
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  // Basic validation: 10-15 digits
  if (digits.length >= 10 && digits.length <= 15) {
    return digits;
  }
  return null;
};

/**
 * Sanitize string input
 */
export const sanitizeString = (input, maxLength = 1000) => {
  if (typeof input !== 'string') {
    return '';
  }
  return input.trim().substring(0, maxLength);
};

