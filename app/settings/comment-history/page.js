"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import BottomNav from "@/components/BottomNav";

export default function CommentHistoryPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("comments")
        .select(
          `
          id, body, created_at,
          post:videos_posts (
            id, caption, thumbnail_url
          )
        `
        )
        .eq("author_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);

      setItems(data || []);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <main className="min-h-dvh bg-ink text-parchment px-5 py-6 pb-28">
      <h1 className="font-display text-lg font-semibold mb-6">Comment history</h1>

      {loading && <p className="font-body text-slate text-sm">Loading...</p>}

      {!loading && items.length === 0 && (
        <p className="font-body text-slate text-sm">No comments yet.</p>
      )}

      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
            {item.post?.thumbnail_url ? (
              <img
                src={item.post.thumbnail_url}
                alt=""
                className="w-14 h-14 rounded-lg object-cover shrink-0"
              />
            ) : (
              <div className="w-14 h-14 rounded-lg bg-white/10 shrink-0" />
            )}
            <div className="min-w-0 flex-1">
              <p className="font-body text-sm truncate">{item.body}</p>
              <p className="font-mono text-xs text-slate">
                on "{item.post?.caption || "a video"}"
                {" · "}
                {new Date(item.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      <BottomNav />
    </main>
  );
}
