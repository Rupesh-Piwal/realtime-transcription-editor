// client/src/components/PlaybackController.tsx
import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Rewind } from 'lucide-react';

interface PlaybackControllerProps {
  recordingId: string | null;
  onTimeUpdate: (time: number) => void;
}

export const PlaybackController: React.FC<PlaybackControllerProps> = ({ recordingId, onTimeUpdate }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [canPlay, setCanPlay] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const audioSrc = recordingId ? `/recordings/${recordingId}.webm` : undefined;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      onTimeUpdate(audio.currentTime);
    };
    
    const handleCanPlay = () => setCanPlay(true);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [onTimeUpdate]);
  
  // Reset state when recordingId changes
  useEffect(() => {
    setIsPlaying(false);
    setCanPlay(false);
  }, [recordingId]);

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleRewind = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };
  
  // Public method to seek audio, could be exposed via a ref if needed by parent
  const seekTo = (time: number) => {
    if (audioRef.current) {
        audioRef.current.currentTime = time;
    }
  };
  // This hook makes seekTo available to parent components, e.g. for clicking on words
  // React.useImperativeHandle(ref, () => ({ seekTo }));

  if (!recordingId) {
    return null; // Don't render if there's no recording
  }

  return (
    <div className="card">
      <h2>3. Playback</h2>
      <audio ref={audioRef} src={audioSrc} preload="auto" />
      <div className="playback-controls">
        <button
          className="button button-secondary"
          onClick={handleRewind}
          disabled={!canPlay}
        >
          <Rewind size={18} />
        </button>
        <button
          className="button button-primary"
          onClick={togglePlayPause}
          disabled={!canPlay}
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        {canPlay && audioRef.current && (
          <span>
            {new Date(audioRef.current.currentTime * 1000).toISOString().substr(14, 5)} / {new Date(audioRef.current.duration * 1000).toISOString().substr(14, 5)}
          </span>
        )}
      </div>
    </div>
  );
};
