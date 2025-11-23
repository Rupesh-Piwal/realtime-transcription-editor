# server/services/transcription_service.py
import os
import json
import asyncio
from flask import current_app
from ..stt.deepgram_client import DeepgramClient
from ..models import recording_model
from ..utils.time_utils import get_current_timestamp_ms

class TranscriptionService:
    """
    Manages the transcription process for a single WebSocket connection.
    This includes handling audio data, interacting with the STT provider,
    and saving results to the database.
    """
    def __init__(self, recording_id, client_ws):
        self.recording_id = recording_id
        self._client_ws = client_ws
        self._stt_client = DeepgramClient(recording_id, self._on_stt_transcript)
        self._audio_file = None
        self._audio_file_path = None
        self._segment_index = 0
        self._start_time_ms = None

    async def handle_audio_chunk(self, chunk: bytes):
        """
        Processes an incoming audio chunk.
        - Writes it to a local file.
        - Forwards it to the STT provider.
        """
        # Lazy open the audio file on first chunk
        if self._audio_file is None:
            recordings_dir = current_app.config['RECORDINGS_DIR']
            if not os.path.exists(recordings_dir):
                os.makedirs(recordings_dir)
            self._audio_file_path = os.path.join(recordings_dir, f"{self.recording_id}.webm")
            self._audio_file = open(self._audio_file_path, "wb")
            self._start_time_ms = get_current_timestamp_ms()
            current_app.logger.info(f"Started writing audio for {self.recording_id} to {self._audio_file_path}")

        self._audio_file.write(chunk)
        await self._stt_client.send_audio_chunk(chunk)

    async def start_transcription(self):
        """
        Initiates the connection to the STT provider and starts the listening loop.
        """
        try:
            await self._stt_client.connect()
            # Run the listen loop in the background
            asyncio.create_task(self._stt_client.listen_loop())
            current_app.logger.info(f"Transcription service started for recording {self.recording_id}")
        except Exception as e:
            current_app.logger.error(f"Failed to start STT client for {self.recording_id}: {e}")
            await self.send_error_to_client("Failed to start transcription service.")

    async def _on_stt_transcript(self, transcript_payload: dict):
        """
        Callback executed when the STT provider sends a transcript.
        - Saves the segment to the database.
        - Forwards the transcript to the client.
        """
        try:
            with current_app.app_context():
                # Save the final segment to MongoDB
                if transcript_payload['is_final']:
                    recording_model.append_segment(
                        recording_id=self.recording_id,
                        index=self._segment_index,
                        text=transcript_payload['transcript'],
                        words=transcript_payload['words'],
                        start=transcript_payload['start'],
                        end=transcript_payload['end'],
                        is_final=True
                    )
                    
                # Prepare payload for the client
                client_payload = {
                    "type": "transcript_update",
                    "recordingId": self.recording_id,
                    "segmentIndex": self._segment_index,
                    **transcript_payload
                }
                
                await self.send_to_client(json.dumps(client_payload))

                if transcript_payload.get('speech_final', False):
                     self._segment_index += 1

        except Exception as e:
            current_app.logger.error(f"Error in _on_stt_transcript for {self.recording_id}: {e}")
            await self.send_error_to_client("Error processing transcript.")

    async def stop_transcription(self):
        """
        Cleans up resources and finalizes the recording entry in the database.
        """
        current_app.logger.info(f"Stopping transcription for {self.recording_id}...")
        
        # Close connection to STT provider
        await self._stt_client.close()

        # Close the local audio file
        if self._audio_file:
            self._audio_file.close()
            self._audio_file = None
        
        # Calculate duration
        duration_ms = get_current_timestamp_ms() - self._start_time_ms if self._start_time_ms else 0
        
        try:
            # Finalize the recording in the database
            with current_app.app_context():
                # For simplicity, we'll just join the text of all final segments.
                # A more robust solution might rebuild the text considering edits.
                segments = recording_model.get_segments_for_recording(self.recording_id)
                final_text = " ".join([seg['text'] for seg in segments if seg['isFinal']])

                recording_model.update_recording_status(
                    recording_id=self.recording_id,
                    status="completed",
                    final_text=final_text,
                    duration_ms=duration_ms,
                    audio_path=self._audio_file_path
                )
            
            await self.send_to_client(json.dumps({
                "type": "session_ended",
                "recordingId": self.recording_id,
                "reason": "Transcription completed"
            }))

            current_app.logger.info(f"Transcription for {self.recording_id} completed successfully.")
        except Exception as e:
            current_app.logger.error(f"Error finalizing recording {self.recording_id}: {e}")
            await self.send_error_to_client("Error finalizing recording.")

    async def send_to_client(self, message: str):
        """Sends a text message to the connected client."""
        if self._client_ws:
            try:
                await self._client_ws.send(message)
            except Exception as e:
                current_app.logger.warning(f"Could not send message to client for {self.recording_id}: {e}")

    async def send_error_to_client(self, error_message: str):
        """Sends an error message to the client."""
        error_payload = json.dumps({
            "type": "error",
            "message": error_message
        })
        await self.send_to_client(error_payload)
