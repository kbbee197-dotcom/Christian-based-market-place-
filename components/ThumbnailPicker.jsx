"use client";

import { useEffect, useRef, useState } from "react";

export default function ThumbnailPicker({ file, onSelect }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function handleLoadedMetadata() {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || 0);
      captureFrame();
    }
  }

  function handleSeek(e) {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  }

  function captureFrame() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          setPreviewUrl(url);
          const thumbFile = new File([blob], "thumbnail.jpg", { type: "image/jpeg" });
          onSelect(thumbFile);
        }
      },
      "image/jpeg",
      0.9
    );
  }

  if (!videoUrl) return null;

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
      <p className="font-body text-sm text-slate">Pick a cover photo from your video</p>

      <video
        ref={videoRef}
        src={videoUrl}
        onLoadedMetadata={handleLoadedMetadata}
        onSeeked={captureFrame}
        className="hidden"
        muted
        playsInline
      />
      <canvas ref={canvasRef} className="hidden" />

      {previewUrl && (
        <img src={previewUrl} alt="Cover preview" className="w-full max-w-[200px] rounded-lg mx-auto" />
      )}

      {duration > 0 && (
        <input
          type="range"
          min={0}
          max={duration}
          step={0.1}
          value={currentTime}
          onChange={handleSeek}
          className="w-full accent-wick"
        />
      )}
    </div>
  );
}
