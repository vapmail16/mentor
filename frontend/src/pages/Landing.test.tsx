import { describe, it, expect } from 'vitest';
import { render, screen } from '../test/utils';
import Landing from './Landing';

describe('Landing Page', () => {
  it('should render landing page content', () => {
    render(<Landing />);
    // Check for the main hero heading
    expect(screen.getByRole('heading', { name: /learn from industry experts/i })).toBeInTheDocument();
    // Check for features section heading
    expect(screen.getByRole('heading', { name: /why choose mentor platform/i })).toBeInTheDocument();
  });

  it('should have navigation links', () => {
    render(<Landing />);
    // Check for login/register links if they exist
    const links = screen.queryAllByRole('link');
    expect(links.length).toBeGreaterThan(0);
  });
});

