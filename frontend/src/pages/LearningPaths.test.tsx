import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../test/utils';
import LearningPaths from './LearningPaths';
import * as learningPathsService from '../services/api/learningPaths.service';

vi.mock('../services/api/learningPaths.service', () => ({
  default: {
    getAllLearningPaths: vi.fn(),
  },
}));

// Mock useToast
vi.mock('../hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('LearningPaths Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render learning paths page', async () => {
    vi.mocked(learningPathsService.default.getAllLearningPaths).mockResolvedValue([]);

    render(<LearningPaths />);

    expect(screen.getByRole('heading', { name: /learning paths/i })).toBeInTheDocument();
    await waitFor(() => {
      expect(learningPathsService.default.getAllLearningPaths).toHaveBeenCalled();
    });
  });

  it('should display learning paths when loaded', async () => {
    const mockPaths = [
      {
        id: '1',
        title: 'Path 1',
        description: 'Description 1',
        estimated_hours: 10,
        difficulty_level: 'beginner',
      },
    ];

    vi.mocked(learningPathsService.default.getAllLearningPaths).mockResolvedValue(mockPaths);

    render(<LearningPaths />);

    await waitFor(() => {
      expect(screen.getByText('Path 1')).toBeInTheDocument();
    });
  });
});

