"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);

  async function load() {
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
      ))}
      {users.length === 0 && <p className="font-body text-slate text-sm">No users yet.</p>}
    </div>
  );
}
