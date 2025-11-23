# server/stt/deepgram_client.py
import asyncio
import json
from websockets.client import connect
from websockets.exceptions import ConnectionClosed
from flask import current_app

class DeepgramClient:
    """
    A WebSocket client for interacting with Deepgram's streaming STT service.
    """
    def __init__(self, recording_id, on_transcript_callback):
        self.recording_id = recording_id
        self._on_transcript_callback = on_transcript_callback
        self._api_key = current_app.config['DEEPGRAM_API_KEY']
        self._deepgram_ws = None
        self._is_connected = False

    async def connect(self):
        """
        Connects to the Deepgram streaming endpoint.
        """
        try:
            # TODO: Make encoding, sample_rate, etc. configurable
            uri = (
                f"wss://api.deepgram.com/v1/listen"
                f"?encoding=opus&sample_rate=48000&channels=1"
                f"&puncutation=true&interim_results=true&word_timestamps=true"
            )
            self._deepgram_ws = await connect(
                uri,
                extra_headers={"Authorization": f"Token {self._api_key}"}
            )
            self._is_connected = True
            current_app.logger.info(f"Deepgram connection established for recording {self.recording_id}")
        except Exception as e:
            self._is_connected = False
            current_app.logger.error(f"Failed to connect to Deepgram for {self.recording_id}: {e}")
            raise

    async def send_audio_chunk(self, chunk: bytes):
        """
        Sends an audio chunk to Deepgram if the connection is active.
        """
        if self._is_connected and self._deepgram_ws:
            try:
                await self._deepgram_ws.send(chunk)
            except ConnectionClosed as e:
                current_app.logger.warning(f"Deepgram connection closed while sending audio for {self.recording_id}. Code: {e.code}, Reason: {e.reason}")
                self._is_connected = False
            except Exception as e:
                current_app.logger.error(f"Error sending audio chunk to Deepgram for {self.recording_id}: {e}")
                self._is_connected = False
                # Depending on the error, you might want to handle reconnection here.

    async def listen_loop(self):
        """
        Listens for messages from Deepgram and processes them.
        """
        if not self._is_connected:
            current_app.logger.warning("listen_loop called but not connected to Deepgram.")
            return

        try:
            while self._is_connected:
                message = await self._deepgram_ws.recv()
                data = json.loads(message)
                
                # Check for errors from Deepgram
                if data.get('type') == 'Error':
                    current_app.logger.error(f"Deepgram error for {self.recording_id}: {data.get('description')}")
                    break

                if data.get('is_final', False) and 'channel' in data:
                    self._handle_transcript(data)

        except ConnectionClosed as e:
            current_app.logger.info(f"Deepgram connection gracefully closed for {self.recording_id}. Code: {e.code}, Reason: {e.reason}")
        except Exception as e:
            current_app.logger.error(f"Exception in Deepgram listen_loop for {self.recording_id}: {e}")
        finally:
            self._is_connected = False

    def _handle_transcript(self, data: dict):
        """
        Normalizes the transcript data and calls the provided callback.
        """
        try:
            alternatives = data.get('channel', {}).get('alternatives', [])
            if not alternatives:
                return

            # For simplicity, we'll always use the first alternative
            transcript_data = alternatives[0]
            transcript = transcript_data.get('transcript', '')
            words = transcript_data.get('words', [])
            
            if not transcript or not words:
                return

            start_time = words[0]['start']
            end_time = words[-1]['end']
            
            # Normalize the payload to be sent to our client and service
            payload = {
                'transcript': transcript,
                'words': [{
                    'id': f"word_{i}", # Client will need a unique ID
                    'text': word['word'],
                    'start': word['start'],
                    'end': word['end'],
                    'trusted': True # From STT, so initially trusted
                } for i, word in enumerate(words)],
                'start': start_time,
                'end': end_time,
                'is_final': data.get('is_final', False),
                'speech_final': data.get('speech_final', False)
            }
            
            # Use asyncio.create_task to call the async callback
            # This allows the callback to run without blocking the listen_loop
            asyncio.create_task(self._on_transcript_callback(payload))

        except Exception as e:
            current_app.logger.error(f"Error processing transcript for {self.recording_id}: {e}")

    async def close(self, reason='client requested close'):
        """
        Closes the WebSocket connection to Deepgram.
        """
        if self._is_connected and self._deepgram_ws:
            try:
                # Send a close message to Deepgram
                await self._deepgram_ws.send(json.dumps({'type': 'CloseStream'}))
                # Wait for Deepgram to close the connection
                await self._deepgram_ws.close(reason=reason)
            except ConnectionClosed:
                pass # Already closed
            except Exception as e:
                current_app.logger.error(f"Error during Deepgram close for {self.recording_id}: {e}")
            finally:
                self._is_connected = False
                current_app.logger.info(f"Deepgram connection closed for {self.recording_id}.")
