"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import CameraRecorder from "@/components/CameraRecorder";
import ThumbnailPicker from "@/components/ThumbnailPicker";

export default function UploadPage() {
  const [userId, setUserId] = useState(null);
  const [products, setProducts] = useState([]);
  const [productId, setProductId] = useState("");
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progressLabel, setProgressLabel] = useState("");
  const [message, setMessage] = useState("");
  const [showCamera, setShowCamera] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState(null);

  useEffect(() => {
    async function load() {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) return;

      const { data: userData } = await supabase.auth.getUser();
      setUserId(userData?.user?.id);

      const storeRes = await fetch("/api/me/store", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      const { store } = await storeRes.json();

      if (store) {
        const { data: prods } = await supabase
          .from("products")
          .select("id, title")
          .eq("store_id", store.id);
        setProducts(prods || []);
      }
    }
    load();
  }, []);

  async function uploadToCloudinary(mediaFile, resourceType) {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    const formData = new FormData();
    formData.append("file", mediaFile);
    formData.append("upload_preset", preset);
    formData.append("resource_type", resourceType);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
      { method: "POST", body: formData }
    );
    if (!res.ok) throw new Error("Upload to Cloudinary failed");
    return res.json();
  }

  async function handlePublish(e) {
    e.preventDefault();
    if (!file) {
      setMessage("Choose a video first.");
      return;
    }
    setUploading(true);
    setMessage("");
    setProgressLabel("Uploading video...");

    try {
      const uploaded = await uploadToCloudinary(file, "video");

      let thumbnailUrl = uploaded.secure_url.replace(/\.[a-z0-9]+$/, ".jpg");
      if (thumbnailFile) {
        setProgressLabel("Uploading cover photo...");
        const uploadedThumb = await uploadToCloudinary(thumbnailFile, "image");
        thumbnailUrl = uploadedThumb.secure_url;
      }

      setProgressLabel("Publishing post...");

      const { data: sessionData } = await supabase.auth.getSession();
      const authToken = sessionData?.session?.access_token;

      const res = await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({
          productId: productId || null,
          videoUrl: uploaded.secure_url,
          thumbnailUrl,
          caption,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to publish.");

      setMessage("Published! Check the feed.");
      setCaption("");
      setFile(null);
      setThumbnailFile(null);
      setProductId("");
    } catch (err) {
      setMessage(err.message);
    } finally {
      setUploading(false);
      setProgressLabel("");
    }
  }

  return (
    <div className="max-w-md">
      <form onSubmit={handlePublish} className="space-y-4">
        <div>
          <label className="block font-body text-sm text-slate mb-1">Video</label>
          {file ? (
            <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg px-4 py-3">
              <span className="font-body text-sm truncate max-w-[200px]">{file.name}</span>
              <button
                type="button"
                onClick={() => setFile(null)}
                className="font-body text-xs text-clay underline"
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowCamera(true)}
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 font-body text-sm"
              >
                Record video
              </button>
              <label className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 font-body text-sm text-center cursor-pointer">
                Choose file
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="hidden"
                />
              </label>
            </div>
          )}
        </div>

        {showCamera && (
          <CameraRecorder
            onCapture={(capturedFile) => {
              setFile(capturedFile);
              setShowCamera(false);
            }}
            onCancel={() => setShowCamera(false)}
          />
        )}

        {file && (
          <ThumbnailPicker file={file} onSelect={setThumbnailFile} />
        )}

        <div>
          <label className="block font-body text-sm text-slate mb-1">Caption</label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={2}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 font-body"
            placeholder="Tell shoppers what this is"
          />
        </div>

        <div>
          <label className="block font-body text-sm text-slate mb-1">
            Tag a product (optional)
          </label>
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 font-body"
          >
            <option value="">No product</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
          {products.length === 0 && (
            <p className="font-body text-xs text-slate mt-1">
              Add a product on the Products tab to tag it in a video.
            </p>
          )}
        </div>

        {message && <p className="font-body text-sm text-wick">{message}</p>}

        <button
          disabled={uploading}
          className="bg-wick text-ink font-semibold px-6 py-3 rounded-full disabled:opacity-60"
        >
          {uploading ? progressLabel || "Working..." : "Publish"}
        </button>
      </form>
    </div>
  );
}
