import { useEffect, useRef, useState } from 'react';
import ReactPlayer from 'react-player';
import { extractYouTubeVideoId, buildYouTubeEmbedUrl } from '@/utils/youtube';

interface VideoPlayerProps {
  url: string;
  onProgress?: (progress: { played: number; playedSeconds: number }) => void;
  onEnded?: () => void;
}

export default function VideoPlayer({ url, onProgress, onEnded }: VideoPlayerProps) {
  const playerRef = useRef<ReactPlayer>(null);

  // Extract YouTube video ID if it's a YouTube URL
  const youtubeVideoId = extractYouTubeVideoId(url);
  
  // Build YouTube embed URL if it's a YouTube video
  const embedUrl = youtubeVideoId ? buildYouTubeEmbedUrl(youtubeVideoId) : null;

  return (
    <div className="relative w-full bg-black rounded-lg overflow-hidden aspect-video">
      {embedUrl ? (
        // Use direct YouTube iframe for better compatibility and YouTube-like appearance
        <iframe
          src={embedUrl}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          title="YouTube video player"
          frameBorder="0"
        />
      ) : (
        // Use ReactPlayer for non-YouTube videos
        <ReactPlayer
          ref={playerRef}
          url={url}
          width="100%"
          height="100%"
          controls={true}
          onProgress={onProgress}
          onEnded={onEnded}
        />
      )}
    </div>
  );
}

