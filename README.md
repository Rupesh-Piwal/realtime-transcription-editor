# Real-Time Transcription Editor

This project is a full-stack web application that records audio in the browser, streams it to a server, gets a live transcription from a Speech-to-Text (STT) service, and displays it in an editable rich text editor.

## Features

-   **Real-Time Audio Streaming**: Captures microphone audio and streams it to the server using WebSockets.
-   **Live Transcription**: The server forwards the audio to an STT provider (Deepgram) and relays the transcript back to the client.
-   **Editable Transcript**: The transcript is displayed in a Slate.js editor, allowing users to make corrections even while the transcription is in progress. User edits are preserved.
-   **Playback and Synchronization**: After recording, the audio can be played back. The corresponding word in the transcript is highlighted in sync with the audio.
-   **Click-to-Seek**: Clicking on any word in the transcript seeks the audio playback to that specific time.
-   **Data Persistence**: Recordings and their final transcripts are saved to a MongoDB database.

## Tech Stack

-   **Frontend**: React with TypeScript, Vite, Slate.js, WebSocket API
-   **Backend**: Python 3, Flask, Flask-Sock (for WebSockets)
-   **STT Provider**: Deepgram (via streaming WebSocket)
-   **Database**: MongoDB
-   **Audio Format**: `audio/webm` with Opus codec

## Project Structure

The repository is divided into two main parts:

-   `./server`: The Python Flask backend.
-   `./client`: The React/TypeScript frontend.

Each directory contains its own `README.md` with specific instructions for that part of the application.

---

## How to Run

You will need to run both the backend server and the frontend client simultaneously.

### 1. Backend Server

First, set up and run the Flask server.

1.  **Navigate to the server directory:*
    ```bash
    cd server
    ```

2.  **Create a virtual environment:*
    ```bash
    python -m venv venv
    ```

3.  **Activate the environment:*
    -   On macOS/Linux: `source venv/bin/activate`
    -   On Windows: `venv\Scripts\activate`

4.  **Install Python dependencies:*
    ```bash
    pip install -r requirements.txt
    ```

5.  **Set up environment variables:*
    Create a file named `.env` in the `server` directory and add your configuration details. See `server/README.md` for the required variables (you'll need a MongoDB URI and a Deepgram API key).
    ```
    # Example .env file
    SECRET_KEY=a_very_secret_string
    MONGO_URI=mongodb://localhost:27017/transcription_db
    DEEPGRAM_API_KEY=your_deepgram_api_key_here
    ```

6.  **Run the server:*
    ```bash
    python app.py
    ```
    The server will start on `http://127.0.0.1:5000`.

### 2. Frontend Client

Next, in a separate terminal, set up and run the React client.

1.  **Navigate to the client directory:*
    ```bash
    cd client
    ```

2.  **Install Node.js dependencies:*
    ```bash
    npm install
    ```

3.  **Run the development server:*
    ```bash
    npm run dev
    ```
    The client will start on `http://localhost:5173` (or another port if 5173 is busy).

### 3. Access the Application

Open your web browser and go to `http://localhost:5173`. You should see the application interface, ready to record.