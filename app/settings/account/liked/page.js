"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { ChevronLeft } from "lucide-react";
import BottomNav from "@/components/BottomNav";

export default function LikedVideosPage() {
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
        .from("likes")
        .select(
          `
          created_at,
          post:videos_posts (
            id, caption, thumbnail_url,
            creator:profiles!videos_posts_creator_id_fkey (username, display_name)
          )
        `
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);

      setItems(data || []);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <main className="min-h-dvh bg-ink text-parchment px-5 pt-6 pb-28">
      <div className="flex items-center gap-3 mb-6">
        <a href="/settings/account" aria-label="Back to settings">
          <ChevronLeft className="w-6 h-6 text-parchment" />
        </a>
        <h1 className="font-display text-lg font-semibold">Liked videos</h1>
      </div>

      {loading && <p className="font-body text-slate text-sm">Loading...</p>}

      {!loading && items.length === 0 && (
        <p className="font-body text-slate text-sm">No liked videos yet.</p>
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
              </p>
            </div>
          </div>
        ))}
      </div>

      <BottomNav />
    </main>
  );
}
