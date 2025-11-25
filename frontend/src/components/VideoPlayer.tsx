import { useEffect, useRef, useState } from 'react';
import ReactPlayer from 'react-player';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize } from 'lucide-react';

interface VideoPlayerProps {
  url: string;
  onProgress?: (progress: { played: number; playedSeconds: number }) => void;
  onEnded?: () => void;
}

export default function VideoPlayer({ url, onProgress, onEnded }: VideoPlayerProps) {
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const playerRef = useRef<ReactPlayer>(null);

  return (
    <div className="relative w-full bg-black rounded-lg overflow-hidden aspect-video">
      <ReactPlayer
        ref={playerRef}
        url={url}
        playing={playing}
        volume={volume}
        muted={muted}
        width="100%"
        height="100%"
        controls={true}
        onProgress={onProgress}
        onEnded={onEnded}
      />
    </div>
  );
}

