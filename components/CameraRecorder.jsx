"use client";

import { useEffect, useRef, useState } from "react";
import { X, RotateCcw, Circle, Square, RefreshCw } from "lucide-react";

export default function CameraRecorder({ onCapture, onCancel }) {
  const videoRef = useRef(null);
  const previewRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  const [facingMode, setFacingMode] = useState("user");
  const [stream, setStream] = useState(null);
  const [maxDuration, setMaxDuration] = useState(60);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [facingMode]);

  async function startCamera() {
    setError("");
    stopCamera();
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: true,
      });
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
      }
    } catch (err) {
      setError("Couldn't access camera. Check your browser permissions.");
    }
  }

  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
  }

  function startRecording() {
    if (!stream) return;
    chunksRef.current = [];
    setElapsed(0);
    setRecordedBlob(null);

    const recorder = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp8,opus" });
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      setRecordedBlob(blob);
      stopCamera();
    };

    recorder.start();
    setRecording(true);

    timerRef.current = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1;
        if (next >= maxDuration) {
          stopRecording();
        }
        return next;
      });
    }, 1000);
  }

  function stopRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    clearInterval(timerRef.current);
    setRecording(false);
  }

  function retake() {
    setRecordedBlob(null);
    setElapsed(0);
    startCamera();
  }

  function usePhoto() {
    if (recordedBlob) {
      const file = new File([recordedBlob], "recording-" + Date.now() + ".webm", { type: "video/webm" });
      onCapture(file);
    }
  }

  function flipCamera() {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="flex items-center justify-between px-4 py-3">
        <button onClick={onCancel} aria-label="Close">
          <X className="w-6 h-6 text-white" />
        </button>
        {!recordedBlob && !recording && (
          <div className="flex gap-2">
            {[15, 60].map((d) => (
              <button
                key={d}
                onClick={() => setMaxDuration(d)}
                className={maxDuration === d ? "px-3 py-1 rounded-full text-xs font-semibold bg-wick text-ink" : "px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-white"}
              >
                {d}s
              </button>
            ))}
          </div>
        )}
        {!recordedBlob && (
          <button onClick={flipCamera} aria-label="Flip camera">
            <RefreshCw className="w-6 h-6 text-white" />
          </button>
        )}
        {recordedBlob && <div className="w-6" />}
      </div>

      <div className="flex-1 relative flex items-center justify-center bg-black">
        {error && (
          <p className="text-white font-body text-sm text-center px-6">{error}</p>
        )}

        {!recordedBlob && !error && (
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        )}

        {recordedBlob && (
          <video
            ref={previewRef}
            src={URL.createObjectURL(recordedBlob)}
            autoPlay
            loop
            playsInline
            className="w-full h-full object-cover"
          />
        )}

        {recording && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-clay text-white text-xs font-semibold px-3 py-1 rounded-full">
            {elapsed}s / {maxDuration}s
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-8 py-8 bg-black">
        {recordedBlob ? (
          <div className="flex items-center gap-8">
            <button onClick={retake} className="flex flex-col items-center gap-1 text-white">
              <RotateCcw className="w-6 h-6" />
              <span className="font-body text-xs">Retake</span>
            </button>
            <button onClick={usePhoto} className="bg-wick text-ink font-semibold px-8 py-3 rounded-full">
              Use this
            </button>
          </div>
        ) : (
          <button
            onClick={recording ? stopRecording : startRecording}
            disabled={!!error}
            className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center"
          >
            {recording ? (
              <Square className="w-6 h-6 text-clay fill-clay" />
            ) : (
              <Circle className="w-12 h-12 text-clay fill-clay" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
