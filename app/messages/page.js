"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import BottomNav from "@/components/BottomNav";

export default function MessagesListPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData?.user?.id;
      if (!uid) {
        router.replace("/login");
        return;
      }

      const { data: convos } = await supabase
        .from("conversations")
        .select(
          `
          id, last_message_at,
          shopper:profiles!conversations_shopper_id_fkey(id, username, display_name, avatar_url),
          vendor:profiles!conversations_vendor_id_fkey(id, username, display_name, avatar_url)
        `
        )
        .or(`shopper_id.eq.${uid},vendor_id.eq.${uid}`);

      const { data: adminConvos } = await supabase
        .from("admin_conversations")
        .select(
          `
          id, last_message_at,
          admin:profiles!admin_conversations_admin_id_fkey(id, username, display_name, avatar_url),
          user:profiles!admin_conversations_user_id_fkey(id, username, display_name, avatar_url)
        `
        )
        .or(`admin_id.eq.${uid},user_id.eq.${uid}`);

      const normalConvos = (convos || []).map((c) => {
        const other = c.shopper?.id === uid ? c.vendor : c.shopper;
        return { id: c.id, lastMessageAt: c.last_message_at, other, isAdmin: false };
      });

      const normalAdminConvos = (adminConvos || []).map((c) => {
        const other = c.admin?.id === uid ? c.user : c.admin;
        return { id: c.id, lastMessageAt: c.last_message_at, other, isAdmin: true };
      });

      const merged = [...normalConvos, ...normalAdminConvos].sort(
        (a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt)
      );

      setItems(merged);
      setLoading(false);
    }
    load();
  }, [router]);

  return (
    <main className="min-h-dvh bg-ink text-parchment px-5 py-6 pb-28">
      <h1 className="font-display text-lg font-semibold mb-6">Messages</h1>

      {loading && <p className="font-body text-slate text-sm">Loading...</p>}

      {!loading && items.length === 0 && (
        <p className="font-body text-slate text-sm">No conversations yet.</p>
      )}

      <div className="space-y-2">
        {items.map((item) => (
          <a
            key={item.id}
            href={`/messages/${item.id}`}
            className="flex items-center gap-3 bg-white/5 rounded-xl p-3"
          >
            {item.other?.avatar_url ? (
              <img src={item.other.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-clay flex items-center justify-center font-display font-semibold text-sm shrink-0">
                {(item.other?.display_name || item.other?.username || "?")[0].toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="font-body text-sm font-semibold truncate">
                {item.other?.display_name || item.other?.username || "Unknown"}
                {item.isAdmin && (
                  <span className="ml-2 font-mono text-[10px] text-wick uppercase">Admin</span>
                )}
              </p>
              <p className="font-mono text-xs text-slate">
                {new Date(item.lastMessageAt).toLocaleString()}
              </p>
            </div>
          </a>
        ))}
      </div>

      <BottomNav />
    </main>
  );
}
