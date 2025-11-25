import { describe, it, expect, vi, beforeEach } from 'vitest';
import authService from './auth.service';
import * as http from './http';

// Mock the http module
vi.mock('./http', () => ({
  fetchWithAuth: vi.fn(),
  parseJsonResponse: vi.fn(),
}));

describe('Auth Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear localStorage
    localStorage.clear();
  });

  describe('signUp', () => {
    it('should call API with correct data', async () => {
      const mockUser = {
        userId: '123',
        email: 'test@example.com',
        role: 'mentee' as const,
        fullName: 'Test User',
      };

      const mockResponse = { user: mockUser };
      vi.mocked(http.fetchWithAuth).mockResolvedValue(mockResponse as any);
      vi.mocked(http.parseJsonResponse).mockResolvedValue(mockResponse);

      const result = await authService.signUp(
        'test@example.com',
        'Password123!',
        'Test User',
        'mentee'
      );

      expect(http.fetchWithAuth).toHaveBeenCalled();
      expect(result.user).toBeTruthy();
      expect(result.user?.email).toBe('test@example.com');
    });
  });

  describe('signIn', () => {
    it('should call login API and store user in localStorage', async () => {
      const mockUser = {
        userId: '123',
        email: 'test@example.com',
        role: 'mentee' as const,
        fullName: 'Test User',
      };

      const mockResponse = { user: mockUser };
      vi.mocked(http.fetchWithAuth).mockResolvedValue(mockResponse as any);
      vi.mocked(http.parseJsonResponse).mockResolvedValue(mockResponse);

      const result = await authService.signIn('test@example.com', 'Password123!');

      expect(http.fetchWithAuth).toHaveBeenCalled();
      expect(result.user).toBeTruthy();
      expect(localStorage.getItem('mentor_user')).toBeTruthy();
    });
  });

  describe('signOut', () => {
    it('should call logout API and clear localStorage', async () => {
      localStorage.setItem('mentor_user', JSON.stringify({ userId: '123' }));

      vi.mocked(http.fetchWithAuth).mockResolvedValue({} as any);
      vi.mocked(http.parseJsonResponse).mockResolvedValue({});

      await authService.signOut();

      expect(http.fetchWithAuth).toHaveBeenCalled();
      expect(localStorage.getItem('mentor_user')).toBeNull();
    });
  });
});

