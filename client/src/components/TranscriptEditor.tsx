// client/src/components/TranscriptEditor.tsx
import React, { useMemo, useCallback } from 'react';
import { createEditor, Descendant, Editor, Element as SlateElement } from 'slate';
import { Slate, Editable, withReact, RenderElementProps, RenderLeafProps } from 'slate-react';
import { WordElement } from '../types/transcript';

interface TranscriptEditorProps {
  value: Descendant[];
  onChange: (value: Descendant[]) => void;
  activeWordId: string | null;
  onWordClick: (word: WordElement) => void;
}

export const TranscriptEditor: React.FC<TranscriptEditorProps> = ({ value, onChange, activeWordId, onWordClick }) => {
  // useMemo is critical for performance with Slate, preventing re-renders.
  const editor = useMemo(() => withReact(createEditor()), []);

  const renderElement = useCallback(({ attributes, children, element }: RenderElementProps) => {
    switch (element.type) {
      case 'segment':
        return <div {...attributes} style={{ marginBottom: '1em' }}>{children}</div>;
      case 'word':
        const isClickable = element.end > 0;
        return (
          <span
            {...attributes}
            data-word-id={element.id}
            className={`word ${activeWordId === element.id ? 'active' : ''} ${isClickable ? 'editable' : ''}`}
            onClick={() => isClickable && onWordClick(element as WordElement)}
          >
            {children}
          </span>
        );
      default:
        return <span {...attributes}>{children}</span>;
    }
  }, [activeWordId, onWordClick]);

  const renderLeaf = useCallback(({ attributes, children, leaf }: RenderLeafProps) => {
    // Basic formatting example (can be extended)
    if (leaf.bold) {
      return <strong {...attributes}>{children}</strong>;
    }
    return <span {...attributes}>{children}</span>;
  }, []);
  
  const handleEditorChange = (newValue: Descendant[]) => {
    // This is where you can implement the conflict policy logic.
    // For now, we'll just pass the changes up.
    // A more complex implementation would check which words were edited.
    onChange(newValue);
  };

  return (
    <div className="card">
      <h2>2. Live Transcript</h2>
      <div className="editor-wrapper">
        <Slate editor={editor} initialValue={value} onValueChange={handleEditorChange}>
          <Editable
            renderElement={renderElement}
            renderLeaf={renderLeaf}
            readOnly={false} // Make the editor editable
            placeholder="Transcript will appear here..."
          />
        </Slate>
      </div>
    </div>
  );
};
