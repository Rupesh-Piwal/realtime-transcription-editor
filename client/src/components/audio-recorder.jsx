import { useState, useRef, useEffect } from "react";

const AudioRecorder = () => {
  const [permissionStatus, setPermissionStatus] = useState("idle");
  const [errorMessage, setErrorMessage] = useState(null);

  const [audioDevices, setAudioDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");

  const [isRecording, setIsRecording] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const mediaStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);

  useEffect(() => {
    let intervalId = null;

    if (isRecording) {
      intervalId = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isRecording]);

  function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (totalSeconds % 60).toString().padStart(2, "0");

    return `${minutes}:${seconds}`;
  }
  //   -------------------------------

  async function loadAudioDevices() {
    if (!navigator.mediaDevices?.enumerateDevices) {
      setErrorMessage("Device enumeration is not supported in this browser.");
      return;
    }

    const devices = await navigator.mediaDevices.enumerateDevices();
    const mics = devices.filter((d) => d.kind === "audioinput");

    setAudioDevices(mics);

    // If no selected device yet, pick the first one
    if (!selectedDeviceId && mics.length > 0) {
      setSelectedDeviceId(mics[0].deviceId);
    }
  }

  // ------------------------------------------

  async function requestMicrophone(deviceIdOptional) {
    try {
      setErrorMessage(null);

      // 1. Build constraints
      const constraints = {
        audio: deviceIdOptional
          ? { deviceId: { exact: deviceIdOptional } }
          : true,
        video: false,
      };

      // 2. Ask for media
      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      // 3. Store stream in ref
      if (mediaStreamRef.current) {
        // stop old tracks if any
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      mediaStreamRef.current = stream;

      // 4. Update permission status
      setPermissionStatus("granted");

      // 5. After we have stream, we can enumerate devices (more accurate labels)
      await loadAudioDevices();
    } catch (err) {
      console.error(err);

      if (err.name === "NotAllowedError") {
        setPermissionStatus("denied");
        setErrorMessage(
          "Microphone access was denied. Please allow it in your browser settings."
        );
      } else if (err.name === "NotFoundError") {
        setPermissionStatus("error");
        setErrorMessage("No microphone devices found.");
      } else {
        setPermissionStatus("error");
        setErrorMessage("Failed to access microphone: " + err.message);
      }
    }
  }

  //   -------------------------------------------

  // HANDLE-START
  async function handleStart() {
    try {
      // 1. Ensure we have stream (for current deviceId)
      await requestMicrophone(selectedDeviceId);

      const stream = mediaStreamRef.current;
      if (!stream) {
        setErrorMessage("No audio stream available.");
        return;
      }

      // 2. Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      // Optional: collect audio data if you want to save or playback later
      const chunks = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        console.log("Recorded blob", blob);
        // You can emit this via props, or store in state if needed.
      };

      // 3. Start recording
      mediaRecorder.start();

      setIsRecording(true);
      setElapsedSeconds(0);
    } catch (err) {
      console.error(err);
      setErrorMessage("Failed to start recording: " + err.message);
    }
  }
  // ------------------------------------------
  // HANDLE-STOP
  function handleStop() {
    try {
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
      }

      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }

      setIsRecording(false);
    } catch (err) {
      console.error(err);
      setErrorMessage("Failed to stop recording: " + err.message);
    }
  }

  return (
    <div>
      <h2>Audio Recorder</h2>
      {/* Device dropdown */}
      <label>
        Microphone:
        <select
          value={selectedDeviceId}
          onChange={(e) => setSelectedDeviceId(e.target.value)}
          disabled={audioDevices.length === 0 || isRecording}
        >
          {audioDevices.length === 0 && <option>No microphone found</option>}

          {audioDevices.map((device) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label || `Microphone ${device.deviceId}`}
            </option>
          ))}
        </select>
      </label>

      {/* Status / errors */}
      {errorMessage && (
        <p style={{ color: "red", marginTop: "8px" }}>{errorMessage}</p>
      )}

      {/* Timer */}

      <div>
        <span>Elapsed: {formatTime(elapsedSeconds)}</span>
      </div>

      {/* Recording indicator */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {isRecording && (
          <span className="recording-dot" aria-label="Recording indicator" />
        )}
        <span>{isRecording ? "Recording..." : "Not recording"}</span>
      </div>

      {/* Start / Stop buttons */}
      <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
        <button
          onClick={handleStart}
          disabled={isRecording || permissionStatus === "denied"}
        >
          Start
        </button>

        <button onClick={handleStop} disabled={!isRecording}>
          Stop
        </button>
      </div>
    </div>
  );
};

export default AudioRecorder;
