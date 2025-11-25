/**
 * Escape HTML entities to prevent XSS attacks
 */
export const escapeHtml = (text) => {
  if (typeof text !== 'string') {
    return text;
  }

  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

