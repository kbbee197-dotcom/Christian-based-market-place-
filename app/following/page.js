"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import BottomNav from "@/components/BottomNav";

export default function FollowingPage() {
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("follows")
        .select("creator:profiles!follows_creator_id_fkey(id, username, display_name)")
        .eq("follower_id", userData.user.id);

      setCreators((data || []).map((row) => row.creator).filter(Boolean));
      setLoading(false);
    }
    load();
  }, []);

  return (
    <main className="min-h-dvh bg-ink text-parchment px-5 py-6 pb-28">
      <h1 className="font-display text-2xl font-semibold mb-6">Following</h1>

      {loading ? (
        <p className="font-body text-slate text-sm">Loading...</p>
      ) : creators.length === 0 ? (
        <p className="font-body text-slate text-sm">
          You're not following anyone yet. Follow creators from the feed to see them here.
        </p>
      ) : (
        <div className="space-y-3">
          {creators.map((c) => (
            <div key={c.id} className="flex items-center gap-3 bg-white/5 rounded-xl p-4">
              <div className="w-10 h-10 rounded-full bg-clay flex items-center justify-center font-display font-semibold text-sm">
                {(c.display_name || c.username || "?")[0]?.toUpperCase()}
              </div>
              <p className="font-body font-semibold text-sm">{c.display_name || c.username}</p>
            </div>
          ))}
        </div>
      )}

      <BottomNav />
    </main>
  );
}
