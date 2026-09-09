"use client";

import { useState, useRef, useEffect } from "react";
import { X, Check } from "lucide-react";

const FILTERS = [
  { key: "none", label: "Original", css: "none" },
  { key: "bw", label: "B&W", css: "grayscale(1)" },
  { key: "warm", label: "Warm", css: "sepia(0.25) saturate(1.3) brightness(1.05)" },
  { key: "cool", label: "Cool", css: "saturate(0.85) contrast(1.05) brightness(1.03)" },
  { key: "vintage", label: "Vintage", css: "sepia(0.4) contrast(0.9) brightness(0.92) saturate(1.1)" },
  { key: "punchy", label: "High contrast", css: "contrast(1.4) saturate(1.15)" },
];

function formatTime(sec) {
  if (!Number.isFinite(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function VideoEditor({ file, onCancel, onDone }) {
  const videoRef = useRef(null);
  const [previewUrl] = useState(() => URL.createObjectURL(file));
  const [duration, setDuration] = useState(0);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [filterKey, setFilterKey] = useState("none");
  const [processing, setProcessing] = useState(false);
  const [progressText, setProgressText] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  function handleLoadedMetadata() {
    const d = videoRef.current?.duration || 0;
    setDuration(d);
    setTrimEnd(d);
  }

  const activeFilter = FILTERS.find((f) => f.key === filterKey) || FILTERS[0];

  async function applyEdits() {
    setError("");
    if (trimEnd <= trimStart) {
      setError("End time must be after start time.");
      return;
    }
    setProcessing(true);
    setProgressText("Preparing...");

    try {
      const sourceVideo = document.createElement("video");
      sourceVideo.src = previewUrl;
      sourceVideo.muted = false;
      sourceVideo.playsInline = true;
      await new Promise((resolve, reject) => {
        sourceVideo.onloadedmetadata = resolve;
        sourceVideo.onerror = () => reject(new Error("Couldn't read the video file."));
      });

      const canvas = document.createElement("canvas");
      canvas.width = sourceVideo.videoWidth || 720;
      canvas.height = sourceVideo.videoHeight || 1280;
      const ctx = canvas.getContext("2d");
      ctx.filter = activeFilter.css;

      const canvasStream = canvas.captureStream(30);

      if (sourceVideo.captureStream) {
        const audioTracks = sourceVideo.captureStream().getAudioTracks();
        audioTracks.forEach((t) => canvasStream.addTrack(t));
      }

      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
        ? "video/webm;codecs=vp9,opus"
        : "video/webm";
      const recorder = new MediaRecorder(canvasStream, { mimeType });
      const chunks = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      const finished = new Promise((resolve) => {
        recorder.onstop = resolve;
      });

      setProgressText("Rendering...");
      sourceVideo.currentTime = trimStart;
      await new Promise((resolve) => {
        sourceVideo.onseeked = resolve;
      });

      recorder.start();

      let stopped = false;
      function drawFrame() {
        if (stopped) return;
        if (sourceVideo.currentTime >= trimEnd || sourceVideo.ended) {
          stopped = true;
          sourceVideo.pause();
          recorder.stop();
          return;
        }
        ctx.drawImage(sourceVideo, 0, 0, canvas.width, canvas.height);
        requestAnimationFrame(drawFrame);
      }

      await sourceVideo.play();
      requestAnimationFrame(drawFrame);

      await finished;

      const blob = new Blob(chunks, { type: "video/webm" });
      const editedFile = new File([blob], "edited-video.webm", { type: "video/webm" });

      setProcessing(false);
      onDone(editedFile);
    } catch (err) {
      setProcessing(false);
      setError(err.message || "Editing failed. You can still publish the original video.");
    }
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-body text-sm font-semibold">Edit video</p>
        <button type="button" onClick={onCancel} aria-label="Close editor">
          <X className="w-4 h-4 text-slate" />
        </button>
      </div>

      <video
        ref={videoRef}
        src={previewUrl}
        onLoadedMetadata={handleLoadedMetadata}
        controls
        playsInline
        style={{ filter: activeFilter.css }}
        className="w-full rounded-lg bg-black"
      />

      <div>
        <p className="font-body text-xs text-slate mb-2">
          Trim: {formatTime(trimStart)} – {formatTime(trimEnd)}
        </p>
        <label className="font-body text-xs text-slate">Start</label>
        <input
          type="range"
          min={0}
          max={duration}
          step={0.1}
          value={trimStart}
          onChange={(e) => setTrimStart(Math.min(parseFloat(e.target.value), trimEnd - 0.1))}
          className="w-full"
        />
        <label className="font-body text-xs text-slate">End</label>
        <input
          type="range"
          min={0}
          max={duration}
          step={0.1}
          value={trimEnd}
          onChange={(e) => setTrimEnd(Math.max(parseFloat(e.target.value), trimStart + 0.1))}
          className="w-full"
        />
      </div>

      <div>
        <p className="font-body text-xs text-slate mb-2">Filter</p>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilterKey(f.key)}
              className={`font-body text-xs font-semibold px-3 py-1.5 rounded-full ${
                filterKey === f.key ? "bg-wick text-ink" : "bg-white/10 text-parchment"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="font-body text-sm text-clay">{error}</p>}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={applyEdits}
          disabled={processing}
          className="flex-1 flex items-center justify-center gap-2 bg-wick text-ink font-semibold py-3 rounded-full disabled:opacity-60"
        >
          {processing ? progressText || "Working..." : (<><Check className="w-4 h-4" /> Apply edits</>)}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={processing}
          className="font-body text-sm text-slate underline"
        >
          Skip
        </button>
      </div>
    </div>
  );
}
