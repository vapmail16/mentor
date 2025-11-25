import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../test/utils';
import userEvent from '@testing-library/user-event';
import Search from './Search';
import * as searchService from '../services/api/search.service';

vi.mock('../services/api/search.service', () => ({
  default: {
    globalSearch: vi.fn(),
  },
}));

// Mock useToast
vi.mock('../hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('Search Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render search page', () => {
    render(<Search />);
    expect(screen.getByRole('heading', { name: /search/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/search for sessions/i)).toBeInTheDocument();
  });

  it('should perform search on form submit', async () => {
    const user = userEvent.setup();
    vi.mocked(searchService.default.globalSearch).mockResolvedValue({
      sessions: [],
      mentors: [],
      total: 0,
    });

    render(<Search />);

    const searchInput = screen.getByPlaceholderText(/search for sessions/i);
    await user.type(searchInput, 'test query');
    
    const searchButton = screen.getByRole('button', { name: /search/i });
    await user.click(searchButton);

    await waitFor(() => {
      expect(searchService.default.globalSearch).toHaveBeenCalledWith('test query', expect.any(Object));
    });
  });

  it('should display search results', async () => {
    const user = userEvent.setup();
    const mockResults = {
      sessions: [
        { id: '1', title: 'Session 1', description: 'Desc 1' },
      ],
      mentors: [],
      total: 1,
    };

    vi.mocked(searchService.default.globalSearch).mockResolvedValue(mockResults);

    render(<Search />);

    const searchInput = screen.getByPlaceholderText(/search for sessions/i);
    await user.type(searchInput, 'test');
    await user.click(screen.getByRole('button', { name: /search/i }));

    await waitFor(() => {
      expect(screen.getByText('Session 1')).toBeInTheDocument();
    });
  });
});

