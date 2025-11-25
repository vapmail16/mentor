import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../test/utils';
import Sessions from './Sessions';
import * as sessionsService from '../services/api/sessions.service';

vi.mock('../services/api/sessions.service', () => ({
  default: {
    getAllSessions: vi.fn(),
  },
}));

// Mock useToast
vi.mock('../hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: '1', role: 'mentee', fullName: 'Test User' },
    loading: false,
  }),
}));

describe('Sessions Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render sessions page', async () => {
    vi.mocked(sessionsService.default.getAllSessions).mockResolvedValue([]);

    render(<Sessions />);

    expect(screen.getByText(/browse sessions/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(sessionsService.default.getAllSessions).toHaveBeenCalled();
    });
  });

  it('should display sessions when loaded', async () => {
    const mockSessions = [
      {
        id: '1',
        title: 'Test Session 1',
        description: 'Description 1',
        duration_minutes: 30,
        language: 'en',
        mentor: { full_name: 'Mentor 1' },
      },
    ];

    vi.mocked(sessionsService.default.getAllSessions).mockResolvedValue(mockSessions);

    render(<Sessions />);

    await waitFor(() => {
      expect(screen.getByText('Test Session 1')).toBeInTheDocument();
    });
  });

  it('should show loading state', () => {
    vi.mocked(sessionsService.default.getAllSessions).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<Sessions />);
    expect(screen.getByText(/loading sessions/i)).toBeInTheDocument();
  });

  it('should show empty state when no sessions', async () => {
    vi.mocked(sessionsService.default.getAllSessions).mockResolvedValue([]);

    render(<Sessions />);

    await waitFor(() => {
      expect(screen.getByText(/no sessions found/i)).toBeInTheDocument();
    });
  });
});
