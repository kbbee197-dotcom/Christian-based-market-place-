"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { ChevronLeft } from "lucide-react";
import BottomNav from "@/components/BottomNav";

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={onChange}
      className={`w-11 h-6 rounded-full relative transition-colors ${
        checked ? "bg-wick" : "bg-white/20"
      }`}
    >
      <span
        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

export default function NotificationPreferencesPage() {
  const [prefs, setPrefs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData?.user?.id;
      if (!uid) {
        setLoading(false);
        return;
      }
      setUserId(uid);

      const { data } = await supabase
        .from("profiles")
        .select("notify_likes, notify_follows, notify_comments, notify_orders")
        .eq("id", uid)
        .single();

      setPrefs(data);
      setLoading(false);
    }
    load();
  }, []);

  async function toggle(field) {
    const next = { ...prefs, [field]: !prefs[field] };
    setPrefs(next);
    await supabase.from("profiles").update({ [field]: next[field] }).eq("id", userId);
  }

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-ink text-slate font-body">
        Loading...
      </div>
    );
  }

  const rows = [
    { field: "notify_likes", label: "Likes" },
    { field: "notify_follows", label: "New followers" },
    { field: "notify_comments", label: "Comments" },
    { field: "notify_orders", label: "Orders" },
  ];

  return (
    <main className="min-h-dvh bg-ink text-parchment px-5 pt-6 pb-28">
      <div className="flex items-center gap-3 mb-6">
        <a href="/settings/account" aria-label="Back to settings">
          <ChevronLeft className="w-6 h-6 text-parchment" />
        </a>
        <h1 className="font-display text-lg font-semibold">Notification preferences</h1>
      </div>

      <div className="bg-white/5 rounded-xl divide-y divide-white/10">
        {rows.map((row) => (
          <div key={row.field} className="flex items-center justify-between px-5 py-4">
            <span className="font-body text-sm">{row.label}</span>
            <Toggle checked={!!prefs?.[row.field]} onChange={() => toggle(row.field)} />
          </div>
        ))}
      </div>

      <BottomNav />
    </main>
  );
}
