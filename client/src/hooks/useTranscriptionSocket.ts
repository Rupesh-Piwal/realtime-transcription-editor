// client/src/hooks/useTranscriptionSocket.ts
import { useState, useEffect, useRef, useCallback } from "react";
import { TranscriptUpdateMessage } from "../types/transcript";

type SocketStatus = "disconnected" | "connecting" | "connected" | "error";

interface UseTranscriptionSocketResult {
  status: SocketStatus;
  error: string | null;
  socket: WebSocket | null;
  connect: (recordingId: string) => void;
  disconnect: () => void;
}

// const WEBSOCKET_URL = `ws://${window.location.host}/ws/transcription`;

const WEBSOCKET_URL = `ws://127.0.0.1:5000/ws/transcription`;

/**
 * Manages the lifecycle of a WebSocket connection for transcription.
 * @param onTranscriptUpdate - Callback function to handle incoming transcript updates.
 */
export const useTranscriptionSocket = (
  onTranscriptUpdate: (message: TranscriptUpdateMessage) => void
): UseTranscriptionSocketResult => {
  const [status, setStatus] = useState<SocketStatus>("disconnected");
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  const connect = useCallback(
    (recordingId: string) => {
      if (socketRef.current) {
        console.warn("WebSocket connection already exists.");
        return;
      }

      setStatus("connecting");
      setError(null);

      const ws = new WebSocket(WEBSOCKET_URL);
      socketRef.current = ws;

      ws.onopen = () => {
        console.log("WebSocket connection established.");
        // Send initialization message with recordingId
        ws.send(JSON.stringify({ recordingId }));
        setStatus("connected");
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === "transcript_update") {
            onTranscriptUpdate(message as TranscriptUpdateMessage);
          } else if (message.type === "session_ended") {
            console.log(
              "Transcription session ended by server:",
              message.reason
            );
            disconnect();
          } else if (message.type === "error") {
            console.error("WebSocket error from server:", message.message);
            setError(message.message);
            setStatus("error");
          }
        } catch (e) {
          console.error("Failed to parse WebSocket message:", e);
        }
      };

      ws.onerror = (ev) => {
        console.error("WebSocket error:", ev);
        setError("WebSocket connection failed.");
        setStatus("error");
      };

      ws.onclose = (event) => {
        console.log("WebSocket connection closed:", event.reason);
        socketRef.current = null;
        setStatus((prevStatus) => {
          if (prevStatus !== "error") {
            return "disconnected";
          }
          return prevStatus;
        });
      };
    },
    [onTranscriptUpdate]
  );

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      if (socketRef.current.readyState === WebSocket.OPEN) {
        // Send a 'stop' message before closing
        socketRef.current.send(JSON.stringify({ type: "stop" }));
      }
      socketRef.current.close(1000, "Client requested disconnect.");
      socketRef.current = null;
      setStatus("disconnected");
    }
  }, []);

  // Ensure disconnection on component unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        disconnect();
      }
    };
  }, [disconnect]);

  return { status, error, socket: socketRef.current, connect, disconnect };
};
