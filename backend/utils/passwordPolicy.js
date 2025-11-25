/**
 * Password policy requirements
 */
export const PASSWORD_REQUIREMENTS = 'Password must be at least 12 characters long and contain uppercase, lowercase, number, and special character';

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {string|null} - Error message if invalid, null if valid
 */
export const validatePasswordStrength = (password) => {
  if (!password || typeof password !== 'string') {
    return 'Password is required';
  }

  if (password.length < 12) {
    return PASSWORD_REQUIREMENTS;
  }

  if (password.length > 128) {
    return 'Password must be less than 128 characters';
  }

  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    return PASSWORD_REQUIREMENTS;
  }

  // Check for at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    return PASSWORD_REQUIREMENTS;
  }

  // Check for at least one number
  if (!/[0-9]/.test(password)) {
    return PASSWORD_REQUIREMENTS;
  }

  // Check for at least one special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return PASSWORD_REQUIREMENTS;
  }

  return null;
};

