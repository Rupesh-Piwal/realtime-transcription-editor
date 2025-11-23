# client/README.md

# Real-Time Transcription Client

This is the frontend for the real-time transcription editor, built with React, TypeScript, and Vite.

## Features

-   **Microphone Access:** Uses `navigator.mediaDevices.getUserMedia` to access the user's microphone.
-   **Audio Recording:** Uses `MediaRecorder` to capture and encode audio into `webm/opus` format.
-   **Live Streaming:** Streams audio chunks to the backend via a native WebSocket connection.
-   **Rich Text Editor:** Uses [Slate.js](https://www.slatejs.org/) to display the live transcript, allowing for user edits.
-   **Playback Synchronization:** After recording, allows playback of the audio with real-time highlighting of the spoken words.
-   **Click-to-Seek:** Clicking on a word in the transcript seeks the audio playback to that word's timestamp.

## Setup and Development

1.  **Install dependencies:**
    Make sure you have Node.js and npm installed.
    ```bash
    npm install
    ```

2.  **Run the development server:**
    ```bash
    npm run dev
    ```
    This will start the Vite development server, usually on `http://localhost:5173`. The app will be available in your browser at this address.

    The development server is configured to proxy API (`/api/*`) and WebSocket (`/ws/*`) requests to the backend server running on `http://127.0.0.1:5000`. Ensure the backend server is running for the application to function correctly.

## Building for Production

To create a production build of the application:
```bash
npm run build
```
This command will type-check the code and then bundle it into the `dist` directory. You can then serve the contents of the `dist` directory with any static file server.