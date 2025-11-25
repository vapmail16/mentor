/**
 * Fetch utility with timeout support
 * Prevents DoS attacks from hanging external API calls
 */

/**
 * Fetch with timeout using AbortController
 * @param {string} url - URL to fetch
 * @param {Object} options - Fetch options including optional timeout
 * @returns {Promise<Response>}
 * @throws Error if timeout occurs or fetch fails
 */
export const fetchWithTimeout = async (
  url,
  options = {}
) => {
  const { timeout = 5000, ...fetchOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms: ${url}`);
    }
    throw error;
  }
};

