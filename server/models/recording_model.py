# server/models/recording_model.py
from bson import ObjectId
from flask import current_app
from pymongo.results import UpdateResult, InsertOneResult
from ..db import get_db
import datetime

def create_recording(user_id: str, language: str) -> str:
    """
    Creates a new recording document in the database.
    Returns the ID of the newly created recording.
    """
    db = get_db()
    recording_data = {
        "userId": user_id,
        "language": language,
        "createdAt": datetime.datetime.utcnow(),
        "updatedAt": datetime.datetime.utcnow(),
        "status": "in_progress",
        "audioPath": None,
        "durationMs": None,
        "finalText": None,
        "segments": []
    }
    result: InsertOneResult = db.recordings.insert_one(recording_data)
    return str(result.inserted_id)

def update_recording_status(recording_id: str, status: str, final_text: str = None, duration_ms: int = None, audio_path: str = None) -> UpdateResult:
    """
    Updates the status, final text, and duration of a recording.
    """
    db = get_db()
    update_fields = {
        "status": status,
        "updatedAt": datetime.datetime.utcnow()
    }
    if final_text is not None:
        update_fields["finalText"] = final_text
    if duration_ms is not None:
        update_fields["durationMs"] = duration_ms
    if audio_path is not None:
        update_fields["audioPath"] = audio_path
        
    return db.recordings.update_one(
        {"_id": ObjectId(recording_id)},
        {"$set": update_fields}
    )

def append_segment(recording_id: str, index: int, text: str, words: list, start: float, end: float, is_final: bool) -> str:
    """
    Appends a new transcript segment to the database.
    Returns the ID of the newly created segment.
    """
    db = get_db()
    segment_data = {
        "recordingId": ObjectId(recording_id),
        "index": index,
        "start": start,
        "end": end,
        "text": text,
        "words": words,
        "isFinal": is_final
    }
    result: InsertOneResult = db.transcript_segments.insert_one(segment_data)
    
    # Add the segment's ID to the recording's segments array
    db.recordings.update_one(
        {"_id": ObjectId(recording_id)},
        {"$push": {"segments": result.inserted_id}}
    )
    return str(result.inserted_id)

def get_recording(recording_id: str):
    """
    Retrieves a recording document by its ID.
    """
    db = get_db()
    return db.recordings.find_one({"_id": ObjectId(recording_id)})

def get_segments_for_recording(recording_id: str):
    """
    Retrieves all transcript segments for a given recording, sorted by index.
    """
    db = get_db()
    return list(db.transcript_segments.find({"recordingId": ObjectId(recording_id)}).sort("index", 1))

def serialize_document(doc):
    """
    Serializes a MongoDB document to a JSON-friendly format.
    Converts ObjectId to string.
    """
    if doc is None:
        return None
    doc['_id'] = str(doc['_id'])
    if 'segments' in doc:
        doc['segments'] = [str(oid) for oid in doc['segments']]
    if 'recordingId' in doc:
        doc['recordingId'] = str(doc['recordingId'])
    if 'createdAt' in doc:
        doc['createdAt'] = doc['createdAt'].isoformat()
    if 'updatedAt' in doc:
        doc['updatedAt'] = doc['updatedAt'].isoformat()
    return doc
