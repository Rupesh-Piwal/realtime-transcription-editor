// client/src/utils/wordMap.ts
import { Word } from '../types/transcript';

/**
 * A utility class to maintain a mapping between word IDs and their data.
 * This is useful for quick lookups, especially for playback synchronization.
 */
export class WordMap {
  private map: Map<string, Word> = new Map();

  /**
   * Updates the map with a list of words.
   * @param words - An array of Word objects.
   */
  public update(words: Word[]): void {
    words.forEach(word => {
      this.map.set(word.id, word);
    });
  }

  /**
   * Retrieves a word by its ID.
   * @param id - The ID of the word to retrieve.
   * @returns The Word object or undefined if not found.
   */
  public get(id: string): Word | undefined {
    return this.map.get(id);
  }

  /**
   * Finds the word that corresponds to a given audio time.
   * @param time - The current time of the audio playback in seconds.
   * @returns The active Word object or null if no word matches the time.
   */
  public findWordAtTime(time: number): Word | null {
    // This is a simple linear search. For very long transcripts,
    // a more optimized approach (like a binary search on a sorted array of words)
    // might be more efficient.
    for (const word of this.map.values()) {
      if (time >= word.start && time <= word.end) {
        return word;
      }
    }
    return null;
  }
  
  /**
   * Gets all words as an array, sorted by start time.
   */
  public getAllSorted(): Word[] {
    return Array.from(this.map.values()).sort((a, b) => a.start - b.start);
  }

  /**
   * Clears all words from the map.
   */
  public clear(): void {
    this.map.clear();
  }
}
