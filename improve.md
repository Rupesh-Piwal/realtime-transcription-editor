You are an expert full stack engineer. Build a complete ready to run project from scratch with the following requirements and constraints.

Goal
Build a small full stack web app that
• Records audio in the browser
• Streams encoded audio chunks to a server over a WebSocket
• server forwards audio to a streaming STT provider Deepgram example
• STT returns partial and final transcripts with word level timestamps
• client shows a live editable rich text transcript where user edits are never lost
• We maintain a mapping between word and time for audio playback current word is highlighted and clicking a word seeks audio to that word time
• Recordings and transcripts are stored in MongoDB
• Audio is stored as a webm opus file on the server local disk

Tech stack
• Frontend(client) React with TypeScript using Vite React TS template
• Use navigator mediaDevices getUserMedia for mic access
• Use MediaRecorder for audio encoding mime type audio webm codecs opus
• Use native WebSocket API for streaming audio chunks and receiving transcript updates
• Use Slate as a rich text editor for the transcript
• Backend(server) Python 3 Flask for REST APIs with WebSocket support Flask Sock or similar
• STT client Deepgram via streaming WebSocket but keep abstraction so provider can be swapped later
• Database MongoDB using pymongo
• Transport raw WebSockets binary frames client to server for audio text JSON frames server to client for transcript updates and control events

Folder structure of the repo


server

app.py
config.py
db.py

routes
init.py
recordings_routes.py

models
init.py
recording_model.py

stt
init.py
deepgram_client.py

ws
init.py
transcription_ws.py

services
init.py
transcription_service.py

utils
init.py
time_utils.py

recordings folder to store webm files
requirements.txt
README.md

client
index.html
vite.config.ts
tsconfig.json
package.json

src
main.tsx
App.tsx

components
DeviceSelector.tsx
RecorderController.tsx
TranscriptionSocketClient.tsx
TranscriptEditor.tsx
PlaybackController.tsx

hooks
useRecordingTimer.ts
useTranscriptionSocket.ts
useWordTimeSync.ts

state
editorState.ts

api
recordingsApi.ts

types
transcript.ts

utils
wordMap.ts
formatting.ts

styles
global.css
README.md

Root README.md describing how to start server and client

Data models Mongo
recordings collection
_id ObjectId
userId string
createdAt ISODate
updatedAt ISODate
status in_progress completed aborted
audioPath string path like recordings rec001.webm
language string
durationMs number optional
finalText string full transcript
segments array of ObjectId references to transcript_segments

transcript_segments collection
_id ObjectId
recordingId ObjectId reference to recordings
index number segment index
start number seconds
end number seconds
text string
words array of objects with id text start end trusted boolean
isFinal boolean

In server recording_model.py implement helper functions
create_recording user_id language -> recording_id
update_recording_status recording_id status finalText optional durationMs optional
append_segment recording_id index text words start end isFinal
get_recording recording_id
get_segments_for_recording recording_id

REST API
POST /api/recordings body userId language creates a recording with status in_progress returns recordingId
GET /api/recordings/<id> returns recording document and its segments sorted by index

WebSocket endpoint /ws/transcription behavior
• On connect expect recordingId via query or initial JSON
• Create Deepgram STT client session bound to this WebSocket
• Binary messages are opus webm chunks forwarded to Deepgram
• Text messages are control messages type start and type stop
• For each STT result send text JSON to client of shape
type transcript_update
recordingId string
segmentIndex number
transcript string
words array of Word
isFinal boolean
start number
end number
• Optionally send session_ended messages when completed
• Also write audio chunks into recordings/<recordingId>.webm and update recording audioPath and durationMs at the end

Deepgram client implementation in server stt deepgram_client.py
• Class DeepgramClient with methods init connect send_audio_chunk listen_loop close
• connect opens WebSocket to Deepgram listen endpoint with encoding opus and configured sample rate
• listen_loop reads Deepgram messages parses partial and final transcripts extracts word timestamps normalizes into internal payload with transcript words start end isFinal and calls a callback
• On final segments save segment data to Mongo via recording_model helper functions

Client behavior details
• DeviceSelector.tsx enumerates audioinput devices with navigator.mediaDevices.enumerateDevices and lets user choose deviceId
• RecorderController.tsx uses getUserMedia and MediaRecorder with mimeType audio webm codecs opus starts and stops recording opens WebSocket to server and streams binary audio chunks in ondataavailable
• useRecordingTimer.ts returns elapsedMs as recording timer
• useTranscriptionSocket.ts manages the lifecycle of the WebSocket connection and invokes a callback with TranscriptUpdateMessage when receiving transcript_update events
• editorState.ts defines pure helper functions initializeEditorState applyTranscriptUpdate markWordsProtected enforcing the conflict policy user edits always win
• TranscriptEditor.tsx uses Slate with TypeScript types to render segments and words as nodes with wordId and handles user edits by marking affected words as protected
• wordMap.ts maintains a dictionary from wordId to Word and is used by PlaybackController
• PlaybackController.tsx renders an audio element highlights active word based on currentTime and seeks to a word when clicked

Conflict policy
• User edits always win over STT text
• For edited words never overwrite text but allow STT to adjust timestamps slightly
• For untouched words STT can update both text and timestamps
• For user inserted words generate new wordId trusted false and interpolate timestamps between neighbors or after last word

Code quality and output format
• Use clear descriptive names
• Add comments where logic is non obvious especially WebSockets STT merge logic and timestamp interpolation
• Keep components small and focused and use pure functions for transformations
• Output all necessary source files for both backend and frontend as if they exist in the described file paths
• For each file start with a comment with its path for example
// server/app.py
// client/src/components/RecorderController.tsx
• Do not include long prose between files only short comments at file tops

At the end include a How to run section in root README.md
Server create virtualenv pip install -r server/requirements.txt set env vars run python server/app.py
client cd client npm install npm run dev

Generate the full codebase according to this specification.