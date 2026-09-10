"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AdminUsers() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [adminId, setAdminId] = useState(null);
  const [messaging, setMessaging] = useState(null);

  async function load() {
    const { data: userData } = await supabase.auth.getUser();
    setAdminId(userData?.user?.id || null);

    const { data } = await supabase
      .from("profiles")
      .select("id, display_name, role, banned")
      .order("created_at", { ascending: false });
    setUsers(data || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleBan(id, banned) {
    await supabase.from("profiles").update({ banned: !banned }).eq("id", id);
    load();
  }

  async function messageUser(userIdToMessage) {
    if (!adminId || userIdToMessage === adminId) return;
    setMessaging(userIdToMessage);

    const { data: convo, error } = await supabase
      .from("admin_conversations")
      .upsert(
        { admin_id: adminId, user_id: userIdToMessage },
        { onConflict: "admin_id,user_id" }
      )
      .select()
      .single();

    setMessaging(null);

    if (!error && convo) {
      router.push(`/messages/${convo.id}`);
    }
  }

  return (
    <div className="space-y-3 max-w-md">
      {users.map((u) => (
        <div key={u.id} className="bg-white/5 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="font-body font-semibold text-sm">{u.display_name || "(no name)"}</p>
            <p className="font-mono text-xs text-slate">
              {u.role === "admin" ? "Admin" : "User"}
              {u.banned ? " — Suspended" : ""}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {u.id !== adminId && (
              <button
                onClick={() => messageUser(u.id)}
                disabled={messaging === u.id}
                className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white/10 text-parchment disabled:opacity-60"
              >
                {messaging === u.id ? "Opening..." : "Message"}
              </button>
            )}
            {u.role !== "admin" && (
              <button
                onClick={() => toggleBan(u.id, u.banned)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full ${
                  u.banned ? "bg-white/10 text-slate" : "bg-clay text-ink"
                }`}
              >
                {u.banned ? "Unsuspend" : "Suspend"}
              </button>
            )}
          </div>
        </div>
      ))}
      {users.length === 0 && <p className="font-body text-slate text-sm">No users yet.</p>}
    </div>
  );
}
