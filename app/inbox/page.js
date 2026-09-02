"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import BottomNav from "@/components/BottomNav";

const TYPE_TEXT = {
  like: "liked your post",
  follow: "started following you",
  comment: "commented on your post",
  order: "placed an order",
};

export default function InboxPage() {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [debugError, setDebugError] = useState(null);

  useEffect(() => {
    loadNotifications();
  }, []);

  async function loadNotifications() {
    setLoading(true);

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    setDebugError("userId: " + JSON.stringify(userId));
    if (!userId) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("notifications")
      .select("id, type, read, created_at, actor:profiles!notifications_actor_id_fkey(username, display_name)")
      .eq("recipient_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      setDebugError(JSON.stringify(error));
    }

    setNotifications(data || []);
    setLoading(false);

    const unreadIds = (data || []).filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length > 0) {
      await supabase.from("notifications").update({ read: true }).in("id", unreadIds);
    }
  }

  return (
    <main className="min-h-dvh bg-ink text-parchment px-5 py-6 pb-28">
      <h1 className="font-display text-lg font-semibold mb-6">Inbox</h1>

      {loading && <p className="font-body text-slate text-sm">Loading...</p>}

      {debugError && (
        <p className="font-mono text-xs text-red-400 mb-4 break-all">{debugError}</p>
      )}

      {!loading && notifications.length === 0 && (
        <p className="font-body text-slate text-sm">No notifications yet.</p>
      )}

      <div className="space-y-2">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={
              "flex items-center gap-3 rounded-xl p-3 " +
              (n.read ? "bg-white/5" : "bg-white/10")
            }
          >
            <div className="w-10 h-10 rounded-full bg-clay flex items-center justify-center font-display font-semibold text-sm shrink-0">
              {(n.actor?.display_name || n.actor?.username || "?")[0].toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-body text-sm truncate">
                <span className="font-semibold">
                  {n.actor?.display_name || n.actor?.username || "Someone"}
                </span>{" "}
                {TYPE_TEXT[n.type] || "sent a notification"}
              </p>
              <p className="font-mono text-xs text-slate">
                {new Date(n.created_at).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      <BottomNav />
    </main>
  );
}
