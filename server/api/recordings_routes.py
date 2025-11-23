# server/api/recordings_routes.py
from flask import request, jsonify, current_app
from . import api_bp
from ..models import recording_model

@api_bp.route('/recordings', methods=['POST'])
def create_recording_route():
    """
    Creates a new recording.
    Expects 'userId' and 'language' in the JSON body.
    """
    data = request.get_json()
    if not data or 'userId' not in data or 'language' not in data:
        return jsonify({"error": "Missing userId or language"}), 400
    
    try:
        recording_id = recording_model.create_recording(data['userId'], data['language'])
        return jsonify({"recordingId": recording_id}), 201
    except Exception as e:
        current_app.logger.error(f"Error creating recording: {e}")
        return jsonify({"error": "Failed to create recording"}), 500

@api_bp.route('/recordings/<string:recording_id>', methods=['GET'])
def get_recording_route(recording_id):
    """
    Retrieves a recording and its associated segments.
    """
    try:
        recording_doc = recording_model.get_recording(recording_id)
        if not recording_doc:
            return jsonify({"error": "Recording not found"}), 404
        
        segments = recording_model.get_segments_for_recording(recording_id)
        
        # Serialize documents to make them JSON-friendly
        serialized_recording = recording_model.serialize_document(recording_doc)
        serialized_segments = [recording_model.serialize_document(seg) for seg in segments]
        
        # Replace segment IDs with full segment documents
        serialized_recording['segments'] = serialized_segments
        
        return jsonify(serialized_recording)
    except Exception as e:
        current_app.logger.error(f"Error retrieving recording {recording_id}: {e}")
        return jsonify({"error": "Failed to retrieve recording"}), 500
