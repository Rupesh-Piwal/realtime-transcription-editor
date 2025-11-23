// client/src/types/transcript.ts
import { BaseEditor } from "slate";
import { ReactEditor } from "slate-react";

// Represents a single incoming word from backend with timing
export type Word = {
  id: string; // unique identifier for the word
  text: string; // raw text from STT
  start: number; // start time in seconds
  end: number; // end time in seconds
  trusted: boolean; // false if edited by user
};

// Slate element representing a segment
export type TranscriptSegment = {
  type: "segment";
  id: string;
  children: WordElement[];
};

// Slate element representing a timed word
export type WordElement = {
  type: "word";
  id: string;
  start: number;
  end: number;
  trusted: boolean;
  children: CustomText[]; // actual display text stored inside children
};

// Slate text node
export type CustomText = {
  text: string;
  bold?: boolean;
};

// Extend Slate types for editor
declare module "slate" {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor;
    Element: TranscriptSegment | WordElement;
    Text: CustomText;
  }
}

// WebSocket message describing incoming transcript updates
export interface TranscriptUpdateMessage {
  type: "transcript_update";
  recordingId: string;
  segmentIndex: number;
  transcript: string;
  words: Word[];
  isFinal: boolean;
  start: number;
  end: number;
}
