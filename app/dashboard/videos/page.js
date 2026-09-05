"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Trash2 } from "lucide-react";

async function authHeaders() {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

export default function VideosPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function loadPosts() {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("videos_posts")
      .select("id, caption, thumbnail_url, created_at, visibility")
      .eq("creator_id", userId)
      .order("created_at", { ascending: false });

    setPosts(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadPosts();
  }, []);

  const VISIBILITY_CYCLE = { public: "followers", followers: "private", private: "public" };

  async function toggleVisibility(id, currentVisibility) {
    setMessage("");
    const nextVisibility = VISIBILITY_CYCLE[currentVisibility] || "public";
    const headers = await authHeaders();
    const res = await fetch("/api/videos", {
      method: "PATCH",
      headers,
      body: JSON.stringify({ postId: id, visibility: nextVisibility }),
    });
    const json = await res.json();

    if (!res.ok) {
      setMessage(json.error || "Something went wrong.");
      return;
    }

    loadPosts();
  }

  async function deletePost(id) {
    setMessage("");
    const headers = await authHeaders();
    const res = await fetch("/api/videos", {
      method: "DELETE",
      headers,
      body: JSON.stringify({ postId: id }),
    });
    const json = await res.json();

    if (!res.ok) {
      setMessage(json.error || "Something went wrong.");
      return;
    }

    loadPosts();
  }

  return (
    <div className="max-w-md">
      <h2 className="font-display text-lg font-semibold mb-4">Your videos</h2>

      {loading && <p className="font-body text-sm text-slate">Loading...</p>}

      {message && <p className="font-body text-sm text-clay mb-4">{message}</p>}

      {!loading && posts.length === 0 && (
        <p className="font-body text-sm text-slate">
          You haven't posted any videos yet.
        </p>
      )}

      <div className="space-y-3">
        {posts.map((p) => (
          <div key={p.id} className="flex items-center gap-3 bg-white/5 rounded-xl p-4">
            {p.thumbnail_url ? (
              <img
                src={p.thumbnail_url}
                alt=""
                className="w-14 h-14 rounded-lg object-cover shrink-0"
              />
            ) : (
              <div className="w-14 h-14 rounded-lg bg-white/10 shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-body text-sm truncate">
                {p.caption || "No caption"}
              </p>
              <p className="font-mono text-xs text-slate">
                {new Date(p.created_at).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={() => toggleVisibility(p.id, p.visibility)}
              className={`font-body text-xs font-semibold px-3 py-1.5 rounded-full border shrink-0 ${
                p.visibility === "public"
                  ? "border-wick text-wick"
                  : p.visibility === "followers"
                  ? "border-clay text-clay"
                  : "border-slate/40 text-slate"
              }`}
            >
              {p.visibility === "public" ? "Public" : p.visibility === "followers" ? "Followers" : "Private"}
            </button>
            <button onClick={() => deletePost(p.id)} aria-label="Delete video">
              <Trash2 className="w-4 h-4 text-clay" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
