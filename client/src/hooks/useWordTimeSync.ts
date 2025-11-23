// client/src/hooks/useWordTimeSync.ts
import { useState, useMemo } from 'react';
import { WordMap } from '../utils/wordMap';
import { WordElement } from '../types/transcript';

/**
 * A hook to synchronize audio playback time with the active word in the transcript.
 * @param allWords - An array of all word elements from the editor.
 * @returns An object containing the word map, the active word ID, and a handler for time updates.
 */
export const useWordTimeSync = (allWords: WordElement[]) => {
  const [activeWordId, setActiveWordId] = useState<string | null>(null);

  // useMemo ensures the WordMap is not recreated on every render,
  // only when the words themselves change.
  const wordMap = useMemo(() => {
    const map = new WordMap();
    // The WordMap expects `Word` type, but we have `WordElement`. They are compatible.
    map.update(allWords);
    return map;
  }, [allWords]);

  const handleTimeUpdate = (time: number) => {
    const activeWord = wordMap.findWordAtTime(time);
    if (activeWord) {
      setActiveWordId(activeWord.id);
    } else {
      setActiveWordId(null);
    }
  };

  return { wordMap, activeWordId, handleTimeUpdate };
};
