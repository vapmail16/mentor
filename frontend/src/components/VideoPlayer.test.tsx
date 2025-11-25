import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../test/utils';
import VideoPlayer from './VideoPlayer';

// Mock react-player
vi.mock('react-player', () => ({
  default: vi.fn(({ url, playing, onProgress }) => (
    <div data-testid="react-player" data-url={url} data-playing={playing}>
      Mock Video Player
      {onProgress && (
        <button onClick={() => onProgress({ played: 0.5, playedSeconds: 60 })}>
          Trigger Progress
        </button>
      )}
    </div>
  )),
}));

describe('VideoPlayer Component', () => {
  it('should render video player with url', () => {
    render(<VideoPlayer url="https://example.com/video.mp4" />);
    const player = screen.getByTestId('react-player');
    expect(player).toBeInTheDocument();
    expect(player).toHaveAttribute('data-url', 'https://example.com/video.mp4');
  });

  it('should call onProgress when provided', async () => {
    const onProgress = vi.fn();
    render(<VideoPlayer url="https://example.com/video.mp4" onProgress={onProgress} />);
    
    const triggerButton = screen.getByText('Trigger Progress');
    triggerButton.click();

    expect(onProgress).toHaveBeenCalledWith({ played: 0.5, playedSeconds: 60 });
  });
});

