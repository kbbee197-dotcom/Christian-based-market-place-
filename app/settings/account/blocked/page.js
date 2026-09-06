"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { ChevronLeft } from "lucide-react";
import BottomNav from "@/components/BottomNav";

export default function BlockedAccountsPage() {
  const [blocked, setBlocked] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [message, setMessage] = useState("");

  async function loadBlocked() {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("blocks")
      .select("id, blocked_id, profile:profiles!blocks_blocked_id_fkey(username, display_name)")
      .eq("blocker_id", userId)
      .order("created_at", { ascending: false });

    setBlocked(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadBlocked();
  }, []);

  async function searchUsers(e) {
    e.preventDefault();
    if (!query.trim()) return;

    const { data } = await supabase
      .from("profiles")
      .select("id, username, display_name")
      .or(`username.ilike.%${query.trim()}%,display_name.ilike.%${query.trim()}%`)
      .limit(10);

    setResults(data || []);
  }

  async function blockUser(blockedId) {
    setMessage("");
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) return;

    const { error } = await supabase
      .from("blocks")
      .insert({ blocker_id: userId, blocked_id: blockedId });

    if (error) {
      setMessage("Couldn't block: " + error.message);
      return;
    }

    setResults([]);
    setQuery("");
    loadBlocked();
  }

  async function unblockUser(id) {
    await supabase.from("blocks").delete().eq("id", id);
    loadBlocked();
  }

  return (
    <main className="min-h-dvh bg-ink text-parchment px-5 pt-6 pb-28">
      <div className="flex items-center gap-3 mb-6">
        <a href="/settings/account" aria-label="Back to settings">
          <ChevronLeft className="w-6 h-6 text-parchment" />
        </a>
        <h1 className="font-display text-lg font-semibold">Blocked accounts</h1>
      </div>

      <form onSubmit={searchUsers} className="mb-4 flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a username to block"
          className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2.5 font-body text-sm"
        />
        <button className="bg-wick text-ink font-semibold text-sm px-4 py-2.5 rounded-full">
          Search
        </button>
      </form>

      {message && <p className="font-body text-sm text-clay mb-3">{message}</p>}

      {results.length > 0 && (
        <div className="space-y-2 mb-6">
          {results.map((u) => (
            <div key={u.id} className="flex items-center justify-between bg-white/5 rounded-xl p-3">
              <p className="font-body text-sm">{u.display_name || u.username}</p>
              <button
                onClick={() => blockUser(u.id)}
                className="bg-clay text-ink text-xs font-semibold px-3 py-1.5 rounded-full"
              >
                Block
              </button>
            </div>
          ))}
        </div>
      )}

      <p className="font-mono text-xs text-slate uppercase tracking-wide mb-2">Blocked</p>

      {loading && <p className="font-body text-slate text-sm">Loading...</p>}

      {!loading && blocked.length === 0 && (
        <p className="font-body text-slate text-sm">No blocked accounts.</p>
      )}

      <div className="space-y-2">
        {blocked.map((b) => (
          <div key={b.id} className="flex items-center justify-between bg-white/5 rounded-xl p-3">
            <p className="font-body text-sm">
              {b.profile?.display_name || b.profile?.username || "Unknown"}
            </p>
            <button
              onClick={() => unblockUser(b.id)}
              className="font-body text-xs font-semibold text-wick"
            >
              Unblock
            </button>
          </div>
        ))}
      </div>

      <BottomNav />
    </main>
  );
}
