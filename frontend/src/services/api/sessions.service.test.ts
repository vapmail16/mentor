import { describe, it, expect, vi, beforeEach } from 'vitest';
import sessionsService from './sessions.service';
import * as http from './http';

vi.mock('./http', () => ({
  fetchWithAuth: vi.fn(),
  parseJsonResponse: vi.fn(),
}));

describe('Sessions Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllSessions', () => {
    it('should fetch all sessions', async () => {
      const mockSessions = [
        { id: '1', title: 'Session 1' },
        { id: '2', title: 'Session 2' },
      ];

      vi.mocked(http.fetchWithAuth).mockResolvedValue({} as any);
      vi.mocked(http.parseJsonResponse).mockResolvedValue(mockSessions);

      const result = await sessionsService.getAllSessions();

      expect(http.fetchWithAuth).toHaveBeenCalled();
      expect(result).toEqual(mockSessions);
    });

    it('should include filters in query params', async () => {
      vi.mocked(http.fetchWithAuth).mockResolvedValue({} as any);
      vi.mocked(http.parseJsonResponse).mockResolvedValue([]);

      await sessionsService.getAllSessions({
        language: 'en',
        difficulty_level: 'beginner',
        limit: 10,
      });

      const callArgs = vi.mocked(http.fetchWithAuth).mock.calls[0][0];
      expect(callArgs).toContain('language=en');
      expect(callArgs).toContain('difficulty_level=beginner');
      expect(callArgs).toContain('limit=10');
    });
  });

  describe('getSessionById', () => {
    it('should fetch session by id', async () => {
      const mockSession = { id: '1', title: 'Session 1' };

      vi.mocked(http.fetchWithAuth).mockResolvedValue({} as any);
      vi.mocked(http.parseJsonResponse).mockResolvedValue(mockSession);

      const result = await sessionsService.getSessionById('1');

      expect(http.fetchWithAuth).toHaveBeenCalledWith('/sessions/1');
      expect(result).toEqual(mockSession);
    });
  });
});

