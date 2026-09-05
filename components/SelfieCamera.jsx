"use client";

import { useEffect, useRef, useState } from "react";
import { X, RotateCcw, Camera } from "lucide-react";

export default function SelfieCamera({ onCapture, onCancel }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    startCamera();
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startCamera() {
    setError("");
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
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

  function takePhoto() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const url = canvas.toDataURL("image/jpeg", 0.9);
    setPhotoUrl(url);
    stopCamera();
  }

  function retake() {
    setPhotoUrl(null);
    startCamera();
  }

  function usePhoto() {
    if (!photoUrl) return;
    fetch(photoUrl)
      .then((res) => res.blob())
      .then((blob) => {
        const file = new File([blob], "selfie-" + Date.now() + ".jpg", { type: "image/jpeg" });
        onCapture(file);
      });
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col">
      <div className="flex items-center justify-between px-4 py-3">
        <button onClick={onCancel} aria-label="Close">
          <X className="w-6 h-6 text-white" />
        </button>
        <div className="w-6" />
      </div>

      <div className="flex-1 relative flex items-center justify-center bg-black">
        {error && (
          <p className="text-white font-body text-sm text-center px-6">{error}</p>
        )}

        {!photoUrl && !error && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        )}

        {photoUrl && (
          <img src={photoUrl} alt="Captured selfie" className="w-full h-full object-cover" />
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>

      <div className="flex items-center justify-center gap-8 pt-8 pb-[calc(env(safe-area-inset-bottom)+32px)] bg-black">
        {photoUrl ? (
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
            onClick={takePhoto}
            disabled={!!error}
            className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center"
          >
            <Camera className="w-7 h-7 text-white" />
          </button>
        )}
      </div>
    </div>
  );
}
