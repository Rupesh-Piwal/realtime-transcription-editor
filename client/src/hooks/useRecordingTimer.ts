// client/src/hooks/useRecordingTimer.ts
import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * A custom hook to manage a timer for recording.
 * @param isRecording - A boolean indicating if the recording is active.
 * @returns The elapsed time in milliseconds.
 */
export const useRecordingTimer = (isRecording: boolean): number => {
  const [elapsedMs, setElapsedMs] = useState(0);
  const intervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now() - elapsedMs;
    intervalRef.current = window.setInterval(() => {
      if (startTimeRef.current) {
        setElapsedMs(Date.now() - startTimeRef.current);
      }
    }, 10); // Update every 10ms for a smoother timer
  }, [elapsedMs]);

  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isRecording) {
      startTimer();
    } else {
      stopTimer();
    }
    // Cleanup on unmount
    return () => stopTimer();
  }, [isRecording, startTimer, stopTimer]);
  
  // Effect to reset timer when recording stops and starts again
  useEffect(() => {
    if (!isRecording) {
      setElapsedMs(0);
    }
  }, [isRecording]);

  return elapsedMs;
};
