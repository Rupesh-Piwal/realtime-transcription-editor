// client/src/utils/formatting.ts

/**
 * Formats a duration in milliseconds into a MM:SS.ms string.
 * @param ms - The duration in milliseconds.
 * @returns A formatted string (e.g., "01:23.456").
 */
export const formatMilliseconds = (ms: number): string => {
  const totalSeconds = ms / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const milliseconds = Math.floor(ms % 1000);

  const paddedMinutes = String(minutes).padStart(2, '0');
  const paddedSeconds = String(seconds).padStart(2, '0');
  const paddedMilliseconds = String(milliseconds).padStart(3, '0');

  return `${paddedMinutes}:${paddedSeconds}.${paddedMilliseconds}`;
};
