"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function UploadPage() {
  const [userId, setUserId] = useState(null);
  const [products, setProducts] = useState([]);
  const [productId, setProductId] = useState("");
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progressLabel, setProgressLabel] = useState("");
  const [message, setMessage] = useState("");

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

  async function uploadToCloudinary(videoFile) {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    const formData = new FormData();
    formData.append("file", videoFile);
    formData.append("upload_preset", preset);
    formData.append("resource_type", "video");

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`,
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
      const uploaded = await uploadToCloudinary(file);
      setProgressLabel("Publishing post...");

      const { data: sessionData } = await supabase.auth.getSession();
      const authToken = sessionData?.session?.access_token;

      const res = await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({
          productId: productId || null,
          videoUrl: uploaded.secure_url,
          thumbnailUrl: uploaded.secure_url.replace(/\.[a-z0-9]+$/, ".jpg"),
          caption,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to publish.");

      setMessage("Published! Check the feed.");
      setCaption("");
      setFile(null);
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
          <label className="block font-body text-sm text-slate mb-1">Video file</label>
          <input
            required
            type="file"
            accept="video/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="w-full font-body text-sm"
          />
        </div>

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
