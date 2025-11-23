// client/src/components/RecorderController.tsx
import React, { useState, useRef } from 'react';
import { Mic, Square, AlertCircle } from 'lucide-react';
import { DeviceSelector } from './DeviceSelector';
import { formatMilliseconds } from '../utils/formatting';
import { useRecordingTimer } from '../hooks/useRecordingTimer';
import { createRecording } from '../api/recordingsApi';

interface RecorderControllerProps {
  onStartRecording: (recordingId: string, audioStream: MediaStream, socket: WebSocket) => void;
  onStopRecording: () => void;
  isRecording: boolean;
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  socket: WebSocket | null;
  connectSocket: (recordingId: string) => void;
  disconnectSocket: () => void;
}

const AUDIO_MIME_TYPE = 'audio/webm; codecs=opus';
const TIMESLICE_MS = 500; // Stream audio chunks every 500ms

export const RecorderController: React.FC<RecorderControllerProps> = ({
  onStartRecording,
  onStopRecording,
  isRecording,
  status,
  socket,
  connectSocket,
  disconnectSocket,
}) => {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const elapsedMs = useRecordingTimer(isRecording);

  const handleStartRecording = async () => {
    if (!selectedDeviceId) {
      setError('No audio device selected.');
      return;
    }
    setError(null);

    try {
      // 1. Create a recording session on the server
      const recordingId = await createRecording('user-123', 'en'); // TODO: Replace with actual user/language
      
      // 2. Get audio stream from the selected device
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: { exact: selectedDeviceId } },
      });
      mediaStreamRef.current = stream;

      // 3. Connect to the WebSocket server
      connectSocket(recordingId);

      // 4. Create MediaRecorder instance
      const recorder = new MediaRecorder(stream, { mimeType: AUDIO_MIME_TYPE });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0 && socket && socket.readyState === WebSocket.OPEN) {
          // Send audio chunk to the server
          socket.send(event.data);
        }
      };

      recorder.onstop = () => {
        // Stop all tracks to release the microphone
        stream.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
        onStopRecording(); // Update parent state
        disconnectSocket();
      };
      
      recorder.start(TIMESLICE_MS);
      onStartRecording(recordingId, stream, socket!); // Notify parent component

    } catch (err) {
      console.error("Failed to start recording:", err);
      setError(`Failed to start recording: ${err instanceof Error ? err.message : String(err)}`);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      disconnectSocket();
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      // onstop event will handle the rest
    }
  };

  return (
    <div className="card">
      <h2>1. Record Audio</h2>
      <div className="controls-container">
        <DeviceSelector
          onDeviceSelect={setSelectedDeviceId}
          disabled={isRecording}
        />
        <div className="recording-status">
          {isRecording && (
            <>
              <div className="recording-dot" />
              <span>{formatMilliseconds(elapsedMs)}</span>
            </>
          )}
        </div>
        {!isRecording ? (
          <button
            className="button button-primary"
            onClick={handleStartRecording}
            disabled={!selectedDeviceId || status === 'connecting'}
          >
            <Mic size={18} /> Start Recording
          </button>
        ) : (
          <button
            className="button button-secondary"
            onClick={handleStopRecording}
          >
            <Square size={18} /> Stop Recording
          </button>
        )}
      </div>
      {error && (
        <p style={{ color: 'var(--error-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={16} /> {error}
        </p>
      )}
       {status === 'error' && (
        <p style={{ color: 'var(--error-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={16} /> WebSocket connection error. Please try again.
        </p>
      )}
    </div>
  );
};
