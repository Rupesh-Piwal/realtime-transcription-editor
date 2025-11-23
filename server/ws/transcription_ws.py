# server/ws/transcription_ws.py
import json
import asyncio
from flask import current_app
from flask_sock import Sock
from . import ws_bp
from ..services.transcription_service import TranscriptionService

# Using a dictionary to keep track of active services per connection
# In a real-world scenario with multiple server instances, you'd use a
# distributed cache like Redis to map connections to services.
active_services = {}

def init_ws(sock: Sock):
    """
    Initializes the WebSocket endpoint for transcriptions.
    """
    @sock.route('/ws/transcription')
    def transcription_route(ws):
        service = None
        try:
            # First message should be a configuration message
            init_message = ws.receive(timeout=5)
            if init_message is None:
                current_app.logger.warning("WebSocket connection timed out before init message.")
                ws.close(reason=1008, message="Initialization message not received.")
                return

            init_data = json.loads(init_message)
            recording_id = init_data.get('recordingId')

            if not recording_id:
                current_app.logger.error("No recordingId provided in WebSocket init message.")
                ws.close(reason=1008, message="recordingId is required.")
                return
            
            current_app.logger.info(f"WebSocket connection opened for recordingId: {recording_id}")

            # Create and store the transcription service for this connection
            service = TranscriptionService(recording_id, ws)
            active_services[ws] = service

            # Start the transcription service (connects to STT, etc.)
            asyncio.run(service.start_transcription())

            # Main loop to receive audio chunks from the client
            while True:
                message = ws.receive()
                if message is None:
                    # Connection closed by client
                    current_app.logger.info(f"WebSocket client for {recording_id} closed the connection.")
                    break
                
                # Binary messages are audio chunks
                if isinstance(message, bytes):
                    asyncio.run(service.handle_audio_chunk(message))
                # Text messages are for control (e.g., 'stop')
                elif isinstance(message, str):
                    control_data = json.loads(message)
                    if control_data.get('type') == 'stop':
                        current_app.logger.info(f"Received 'stop' signal for {recording_id}.")
                        break # Exit the loop to trigger cleanup
        
        except Exception as e:
            current_app.logger.error(f"Error in WebSocket handler: {e}")
        
        finally:
            if service:
                current_app.logger.info(f"Cleaning up resources for recordingId: {service.recording_id}")
                asyncio.run(service.stop_transcription())
                if ws in active_services:
                    del active_services[ws]
            
            if not ws.closed:
                ws.close()
            current_app.logger.info("WebSocket connection closed and cleaned up.")
