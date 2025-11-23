// client/src/state/editorState.ts
import { Editor, Transforms, Element, Node, Path } from "slate";
import {
  WordElement,
  TranscriptUpdateMessage,
  CustomText,
  TranscriptSegment,
} from "../types/transcript";

// Initial editor value
export const initialEditorState: TranscriptSegment[] = [
  {
    type: "segment",
    id: "segment-0",
    children: [
      {
        type: "word",
        id: "word-0",
        start: 0,
        end: 0,
        trusted: true,
        children: [{ text: "" }],
      },
    ],
  },
];

/**
 * Applies transcript updates from server into slate editor structure.
 * Simplified: replaces segment instead of merging.
 */
export const applyTranscriptUpdate = (
  currentVal: TranscriptSegment[],
  update: TranscriptUpdateMessage
): TranscriptSegment[] => {
  const newValue = [...currentVal];
  const segmentIndex = update.segmentIndex;

  // Convert WS words into Slate WordElement nodes
  const newWords: WordElement[] = update.words.map((word, index) => ({
    type: "word",
    id: `${update.segmentIndex}-${index}`,
    start: word.start,
    end: word.end,
    trusted: true,
    children: [{ text: word.text + " " }], // Text goes ONLY in children
  }));

  const placeholderWord: WordElement = {
    type: "word",
    id: "placeholder",
    start: 0,
    end: 0,
    trusted: true,
    children: [{ text: "" }],
  };

  const newSegment: TranscriptSegment = {
    type: "segment",
    id: `segment-${segmentIndex}`,
    children: newWords.length > 0 ? newWords : [placeholderWord],
  };

  // Insert or replace segment
  if (segmentIndex >= newValue.length) {
    newValue.push(newSegment);
  } else {
    newValue[segmentIndex] = newSegment;
  }

  // If final, create empty segment after
  if (update.isFinal && segmentIndex + 1 === newValue.length) {
    newValue.push({
      type: "segment",
      id: `segment-${segmentIndex + 1}`,
      children: [
        {
          type: "word",
          id: "placeholder-next",
          start: 0,
          end: 0,
          trusted: true,
          children: [{ text: "" }],
        },
      ],
    });
  }

  return newValue;
};

/**
 * Marks a word element as untrusted based on edits.
 * node must be passed *with its path*, not raw element.
 */
export const markWordsAsUntrusted = (
  editor: Editor,
  node: WordElement,
  path: Path
) => {
  const currentText = Node.string(node); // final rendered text

  // If modified (compared against stored state), mark as untrusted
  // For now, ANY edit marks untrusted
  Transforms.setNodes(editor, { trusted: false }, { at: path });
};

/**
 * Helper: Extract all words from editor value
 */
export const getAllWords = (value: Element[]): WordElement[] => {
  const words: WordElement[] = [];
  for (const segment of value) {
    if (segment.type === "segment") {
      for (const word of segment.children) {
        if (word.type === "word") {
          words.push(word);
        }
      }
    }
  }
  return words;
};
