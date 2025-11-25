import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../test/utils';
import Mentors from './Mentors';
import * as mentorsService from '../services/api/mentors.service';

vi.mock('../services/api/mentors.service', () => ({
  default: {
    getAllMentors: vi.fn(),
  },
}));

// Mock useToast
vi.mock('../hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('Mentors Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render mentors page', async () => {
    vi.mocked(mentorsService.default.getAllMentors).mockResolvedValue([]);

    render(<Mentors />);

    expect(screen.getByText(/our mentors/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(mentorsService.default.getAllMentors).toHaveBeenCalled();
    });
  });

  it('should display mentors when loaded', async () => {
    const mockMentors = [
      {
        id: '1',
        full_name: 'Mentor 1',
        bio: 'Bio 1',
        verification_status: 'verified',
        domains: ['Technology'],
      },
    ];

    vi.mocked(mentorsService.default.getAllMentors).mockResolvedValue(mockMentors);

    render(<Mentors />);

    await waitFor(() => {
      expect(screen.getByText('Mentor 1')).toBeInTheDocument();
    });
  });
});

