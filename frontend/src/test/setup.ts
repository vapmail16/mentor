import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock environment variables
import.meta.env.VITE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
import.meta.env.VITE_FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5173';

