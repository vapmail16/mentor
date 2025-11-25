import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../test/utils';
import AppNavigation from './layout/AppNavigation';

// Mock useAuth to return a user
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: '1', role: 'mentee', fullName: 'Test User' },
    loading: false,
  }),
}));

// Mock useToast
vi.mock('../hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock authService
vi.mock('../services/api', () => ({
  authService: {
    signOut: vi.fn().mockResolvedValue({ error: null }),
  },
}));

describe('AppNavigation Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render navigation with logo', () => {
    render(<AppNavigation />);
    expect(screen.getByText(/mentor platform/i)).toBeInTheDocument();
  });

  it('should render navigation structure', () => {
    render(<AppNavigation />);
    // Verify the navigation component renders successfully
    expect(screen.getByText(/mentor platform/i)).toBeInTheDocument();
    
    // The navigation should have a nav element
    const navElements = screen.queryAllByRole('navigation');
    expect(navElements.length).toBeGreaterThan(0);
  });
});
