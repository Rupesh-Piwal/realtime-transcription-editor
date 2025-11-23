# server/README.md
# Real-Time Transcription Server

This is the backend for the real-time transcription editor. It's a Flask application that handles:
- REST APIs for managing recordings.
- A WebSocket endpoint for streaming audio and receiving transcriptions.
- Integration with an STT (Speech-to-Text) provider (Deepgram).
- Storing recordings and transcripts in MongoDB.

## Setup

1.  **Create a virtual environment:**
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows, use `venv\Scripts\activate`
    ```

2.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the `server` directory and add the following:
    ```
    # A secret key for Flask sessions and other security-related needs.
    SECRET_KEY=your_super_secret_key

    # The connection URI for your MongoDB database.
    MONGO_URI=mongodb://localhost:27017/transcription_db

    # Your API key from Deepgram.
    DEEPGRAM_API_KEY=your_deepgram_api_key
    ```

## Running the Server

To run the Flask development server:
```bash
python app.py
```
The server will start on `http://127.0.0.1:5000`.

**Note:** The Flask development server is not suitable for production. For deployment, use a production-ready WSGI server like Gunicorn or uWSGI.
