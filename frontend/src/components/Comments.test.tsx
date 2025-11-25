import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../test/utils';
import Comments from './Comments';
import * as commentsService from '../services/api/comments.service';

vi.mock('../services/api/comments.service', () => ({
  default: {
    getSessionComments: vi.fn(),
    createComment: vi.fn(),
    toggleLike: vi.fn(),
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
    user: { id: '1', fullName: 'Test User' },
    loading: false,
  }),
}));

describe('Comments Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render comments component', async () => {
    vi.mocked(commentsService.default.getSessionComments).mockResolvedValue([]);

    render(<Comments sessionId="session-1" />);

    expect(screen.getByRole('heading', { name: /comments/i })).toBeInTheDocument();
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText(/loading comments/i)).not.toBeInTheDocument();
    });
    
    // Verify service was called
    expect(commentsService.default.getSessionComments).toHaveBeenCalled();
  });

  it('should display comments when loaded', async () => {
    const mockComments = [
      {
        id: '1',
        content: 'Great session!',
        user: { full_name: 'User 1' },
        created_at: new Date().toISOString(),
        like_count: 5,
      },
    ];

    vi.mocked(commentsService.default.getSessionComments).mockResolvedValue(mockComments);

    render(<Comments sessionId="session-1" />);

    await waitFor(() => {
      expect(screen.getByText('Great session!')).toBeInTheDocument();
    });
  });

  it('should show empty state when no comments', async () => {
    vi.mocked(commentsService.default.getSessionComments).mockResolvedValue([]);

    render(<Comments sessionId="session-1" />);

    await waitFor(() => {
      expect(screen.getByText(/no comments yet/i)).toBeInTheDocument();
    });
  });
});

