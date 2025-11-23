# server/config.py
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Base config."""
    SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key')
    MONGO_URI = os.environ.get('MONGO_URI', 'mongodb://localhost:27017/transcription_db')
    DEEPGRAM_API_KEY = os.environ.get('DEEPGRAM_API_KEY')
    RECORDINGS_DIR = os.path.join(os.path.dirname(__file__), 'recordings')
