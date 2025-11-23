You are a senior full-stack engineer specializing in:

• Frontend: React (prefer TypeScript)
• Backend: Flask (Python)
• Real-time systems with Socket.IO
• MongoDB
• Real-time streaming STT pipelines

Build a complete architecture and code plan for the following project. FOLLOW ALL REQUIREMENTS EXACTLY.

==================================================
PROJECT OBJECTIVE
==================================================
Build a web app that:

1. Records microphone audio in the browser.
2. Streams audio chunks to a Flask backend IN REAL TIME using Socket.IO (not raw WebSockets).
3. Transcribes speech live and sends interim + final transcripts back to frontend over Socket.IO.
4. Displays transcript in a Word-like live editable editor.
5. Users can type corrections while new transcript continues to arrive.
6. Playback must highlight each word in sync with audio, and clicking a word seeks to its timestamp.
7. Must implement custom word↔timestamp mapping logic (NO external alignment tools).

==================================================
TECH CONSTRAINTS (MUST USE)
==================================================
Frontend: React
Backend: Flask
Database: MongoDB
Real-time: Socket.IO
NO external forced alignment tools (WhisperX, MFA, Gentle, aeneas, ElevenLabs alignment, etc.)

Speech-to-Text provider: any streaming API allowed, but timestamps must be processed manually.

==================================================
END-TO-END FEATURES
==================================================

### 1. Recording & Streaming Flow (Real-Time)
Frontend:
- Use getUserMedia + MediaRecorder
- Chunk audio ~250ms
- Emit:
    socket.emit("start_transcription", { sessionId, sampleRate, encoding })
    socket.emit("audio_chunk", { sessionId, chunkBinary, seq })
    socket.emit("stop_transcription")

Backend:
- flask-socketio handles events
- On audio_chunk:
    → forward chunk to external STT stream
- When provider emits partial results:
    → emit "transcript_interim"
- When segment final:
    → emit "transcript_final"

UI:
- Show recording status + elapsed time

### 2. Live Editable Editor
- Use Slate or Lexical or contentEditable
- Each word represented as token with metadata
- Users can manually edit any text at any time
- New incoming tokens must merge safely

### 3. Token Data Model (Mandatory)
Each word = token:

{
  id: string,
  text: string,
  startTime: number,
  endTime: number | null,
  isFinal: boolean,
  isUserEdited: boolean
}

Store transcript as ordered array.

### 4. Conflict & Merge Strategy
Rules:
- Incoming interim tokens append or replace matching segment
- Final tokens overwrite interim versions only if isUserEdited=false
- If token is edited by user:
    - Preserve text
    - Preserve timestamps but mark desynced if mismatched
- Inserted tokens:
    - Timestamp by interpolation between neighbors
- Deleted tokens removed
- Large rewrites approximate timestamp distribution

### 5. Word ↔ Timestamp Mapping Logic (CUSTOM)
If STT gives only segment-level timestamps:
- Split segmentText into words
- Distribute timestamps proportionally by character length OR evenly

If STT returns word-timings:
- Use directly, but still wrap as tokens

Resync rules:
- Inserted between two tokens → interpolate
- Inserted at start/end → clamp or add small offsets
- Rewritten tokens → inherit nearest timestamps

### 6. Playback
- Use <audio> element
- Highlight active word based on currentTime
- timeupdate → find token where startTime <= t < nextStartTime
- Clicking a word:
    audio.currentTime = token.startTime

Also auto scroll into view (avoid jumpy scrolling).

### 7. Persistence
Store document in MongoDB:

recordings:
{
  recordingId: string,
  createdAt: ISODate,
  audioUrl: string,
  durationSeconds: number,
  tokens: [...tokenObjects]
}

Expose REST routes:

POST /api/recordings
GET /api/recordings/:id
PUT /api/recordings/:id

Load page should restore transcript + playback sync.

==================================================
NON-FUNCTIONAL REQUIREMENTS
==================================================
Performance:
- End-to-end latency under ~500ms
- Efficient reconciliation of tokens

Reliability:
- Socket.IO must auto-reconnect
- Handle streaming errors gracefully

Security:
- Never expose STT API keys to client
- Backend must proxy requests

Code Quality:
- Small functions, modular layers
- Comments + docstrings mandatory

==================================================
BACKEND SYSTEM DESIGN (FLASK + SOCKET.IO)
==================================================

Project structure:

backend/
  app.py
  config.py
  extensions/
    db.py            # Mongo client
    socketio.py      # flask_socketio instance
  sockets/
    transcription.py # socket event handlers
  services/
    transcription_service.py
    alignment_service.py
    storage_service.py
  adapters/
    stt_provider.py
  api/
    recordings.py
  models/
    recording_model.py

==================================================
SOCKET.IO EVENTS
==================================================

### CLIENT → SERVER
Event: start_transcription
Payload: { sessionId, language, sampleRate, encoding }

Event: audio_chunk
Payload: { sessionId, chunk, seq }

Event: stop_transcription
Payload: { sessionId }

### SERVER → CLIENT
Event: transcript_interim
Payload: { sessionId, segmentId, tokens }

Event: transcript_final
Payload: { sessionId, segmentId, tokens }

Event: transcription_error
Payload: { message }

### Example server code

@socketio.on("audio_chunk")
def handle_audio(data):
    transcription_service.stream_audio(data["sessionId"], data["chunk"])

socketio.emit("transcript_interim", {...}, room=session_id)

==================================================
FRONTEND ARCHITECTURE (REACT + SOCKET.IO)
==================================================

Project Structure:

frontend/src/
  components/
    TranscriptEditor.tsx
    PlaybackControls.tsx
    MicSelector.tsx
    RecordingControls.tsx
  hooks/
    useAudioRecorder.ts
    useTranscriptionSocket.ts
    usePlaybackSync.ts
    useTranscriptSync.ts
  services/
    transcriptionSocketService.ts
    apiClient.ts
  utils/
    tokenUtils.ts
    timestampUtils.ts
    diffUtils.ts
  types/
    transcript.ts

==================================================
REACT HOOKS (MUST IMPLEMENT)
==================================================

### useAudioRecorder
- Manages getUserMedia + MediaRecorder
- Emits chunks → socket.emit("audio_chunk")

### useTranscriptionSocket
- Handles socket.io connection lifecycle
- Events:
    onInterim(cb)
    onFinal(cb)

### useTranscriptSync
- Merges incoming tokens into editor state
- Preserves user edits
- Tracks isUserEdited

### usePlaybackSync
- Syncs audio time with tokens
- Handles click→seek

==================================================
END-TO-END FLOW
==================================================

1. User clicks Start Recording
2. Frontend:
   - getUserMedia
   - MediaRecorder start
   - socket.connect()
   - socket.emit("start_transcription")
3. Audio chunks stream to backend
4. Backend streams to STT → emits interim/final tokens
5. Editor updates live
6. Stop → save to DB
7. Load recording → replay + sync

==================================================
DEPLOYMENT REQUIREMENTS
==================================================
- Provide Dockerized or instructions to deploy backend + frontend + DB
- App must run at a public URL

==================================================
DELIVERABLES
==================================================
Produce:

1. High-level system architecture diagram
2. Low-level code structure
3. Full backend code (modular + commented)
4. Full frontend code (components + hooks)
5. MongoDB schema
6. Socket.IO event layer
7. Token manipulation logic
8. Word-sync playback implementation
9. Deployment instructions
10. Working end-to-end example

Follow the above **STRICTLY** and output structured code + explanations.


