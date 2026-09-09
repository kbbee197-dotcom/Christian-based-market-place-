"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import BottomNav from "@/components/BottomNav";

export default function MessagesListPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData?.user?.id;
      if (!uid) {
        router.replace("/login");
        return;
      }
      setUserId(uid);

      const { data } = await supabase
        .from("conversations")
        .select(
          `
          id, last_message_at,
          shopper:profiles!conversations_shopper_id_fkey(id, username, display_name, avatar_url),
          vendor:profiles!conversations_vendor_id_fkey(id, username, display_name, avatar_url)
        `
        )
        .or(`shopper_id.eq.${uid},vendor_id.eq.${uid}`)
        .order("last_message_at", { ascending: false });

      setConversations(data || []);
      setLoading(false);
    }
    load();
  }, [router]);

  return (
    <main className="min-h-dvh bg-ink text-parchment px-5 py-6 pb-28">
      <h1 className="font-display text-lg font-semibold mb-6">Messages</h1>

      {loading && <p className="font-body text-slate text-sm">Loading...</p>}

      {!loading && conversations.length === 0 && (
        <p className="font-body text-slate text-sm">No conversations yet.</p>
      )}

      <div className="space-y-2">
        {conversations.map((c) => {
          const other = c.shopper?.id === userId ? c.vendor : c.shopper;
          return (
            <a
              key={c.id}
              href={`/messages/${c.id}`}
              className="flex items-center gap-3 bg-white/5 rounded-xl p-3"
            >
              {other?.avatar_url ? (
                <img src={other.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-clay flex items-center justify-center font-display font-semibold text-sm shrink-0">
                  {(other?.display_name || other?.username || "?")[0].toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-body text-sm font-semibold truncate">
                  {other?.display_name || other?.username || "Unknown"}
                </p>
                <p className="font-mono text-xs text-slate">
                  {new Date(c.last_message_at).toLocaleString()}
                </p>
              </div>
            </a>
          );
        })}
      </div>

      <BottomNav />
    </main>
  );
}
