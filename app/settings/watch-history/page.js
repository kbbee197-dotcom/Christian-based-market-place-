"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import BottomNav from "@/components/BottomNav";

export default function WatchHistoryPage() {
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
        .from("watch_history")
        .select(
          `
          watched_at,
          post:videos_posts (
            id, caption, thumbnail_url,
            creator:profiles!videos_posts_creator_id_fkey (username, display_name)
          )
        `
        )
        .eq("user_id", userId)
        .order("watched_at", { ascending: false })
        .limit(50);

      setItems(data || []);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <main className="min-h-dvh bg-ink text-parchment px-5 py-6 pb-28">
      <h1 className="font-display text-lg font-semibold mb-6">Watch history</h1>

      {loading && <p className="font-body text-slate text-sm">Loading...</p>}

      {!loading && items.length === 0 && (
        <p className="font-body text-slate text-sm">No watch history yet.</p>
      )}

      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
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
              <p className="font-body text-sm truncate">
                {item.post?.caption || "No caption"}
              </p>
              <p className="font-mono text-xs text-slate">
                {item.post?.creator?.display_name || item.post?.creator?.username || "Unknown"}
                {" · "}
                {new Date(item.watched_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      <BottomNav />
    </main>
  );
}
