// client/src/App.tsx
import { useState, useCallback, useRef } from "react";
import { Descendant, Element as SlateElement } from "slate";
import { RecorderController } from "./components/RecorderController";
import { TranscriptEditor } from "./components/TranscriptEditor";
import { PlaybackController } from "./components/PlaybackController";
import { useTranscriptionSocket } from "./hooks/useTranscriptionSocket";
import { useWordTimeSync } from "./hooks/useWordTimeSync";
import {
  initialEditorState,
  applyTranscriptUpdate,
  getAllWords,
} from "./state/editorState";
import { TranscriptUpdateMessage, WordElement } from "./types/transcript";

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingId, setRecordingId] = useState<string | null>(null);
  const [editorValue, setEditorValue] =
    useState<Descendant[]>(initialEditorState);

  // This ref holds a reference to the PlaybackController's imperative API
  const playbackRef = useRef<{ seekTo: (time: number) => void }>(null);

  const handleTranscriptUpdate = useCallback(
    (message: TranscriptUpdateMessage) => {
      setEditorValue((currentValue) =>
        applyTranscriptUpdate(currentValue as SlateElement[], message)
      );
    },
    []
  );

  const {
    status: socketStatus,
    socket,
    connect: connectSocket,
    disconnect: disconnectSocket,
  } = useTranscriptionSocket(handleTranscriptUpdate);

  const allWords = getAllWords(editorValue as SlateElement[]);
  const { activeWordId, handleTimeUpdate } = useWordTimeSync(allWords);

  const handleStartRecording = (newRecordingId: string) => {
    setIsRecording(true);
    setRecordingId(newRecordingId);
    setEditorValue(initialEditorState); // Reset editor on new recording
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    // The recordingId is kept to allow for playback immediately after stopping.
  };

  const handleWordClick = (word: WordElement) => {
    // Use the imperative handle to call seekTo on the child component
    if (playbackRef.current) {
      // playbackRef.current.seekTo(word.start);
      // HACK: This is a bit of a hack because we are not using imperative handle
      const audio = document.querySelector("audio");
      if (audio) {
        audio.currentTime = word.start;
      }
    }
  };

  return (
    <>
      <h1>Real-Time Transcription Editor</h1>
      <RecorderController
        onStartRecording={handleStartRecording}
        onStopRecording={handleStopRecording}
        isRecording={isRecording}
        status={socketStatus}
        socket={socket}
        connectSocket={connectSocket}
        disconnectSocket={disconnectSocket}
      />
      <TranscriptEditor
        value={editorValue}
        onChange={setEditorValue}
        activeWordId={activeWordId}
        onWordClick={handleWordClick}
      />
      <PlaybackController
        // Pass the ref to the component
        // ref={playbackRef}
        recordingId={isRecording ? null : recordingId} // Only show playback when not recording
        onTimeUpdate={handleTimeUpdate}
      />
      <div className="card">
        <h3>About This Project</h3>
        <p>
          This application demonstrates a full-stack solution for real-time
          audio transcription.
        </p>
        <ul>
          <li>
            <strong>Recording:</strong> Use the controls to record audio from
            your microphone. The audio is streamed to the server in real-time.
          </li>
          <li>
            <strong>Live Transcript:</strong> The server transcribes the audio
            and sends back updates, which appear in the editor below.
          </li>
          <li>
            <strong>Editable Transcript:</strong> You can click into the
            transcript and edit the text at any time, even while recording. Your
            changes are preserved.
          </li>
          <li>
            <strong>Playback & Sync:</strong> After recording, you can play back
            the audio. The corresponding word in the transcript will be
            highlighted as it's spoken. Clicking a word will seek the audio to
            that point.
          </li>
        </ul>
      </div>
    </>
  );
}

export default App;
