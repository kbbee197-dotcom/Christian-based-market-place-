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

export default function PlaybackSettingsPage() {
  const [defaultSoundOn, setDefaultSoundOn] = useState(false);
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
        .select("default_sound_on")
        .eq("id", uid)
        .single();

      setDefaultSoundOn(!!data?.default_sound_on);
      setLoading(false);
    }
    load();
  }, []);

  async function toggle() {
    const next = !defaultSoundOn;
    setDefaultSoundOn(next);
    await supabase.from("profiles").update({ default_sound_on: next }).eq("id", userId);
  }

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-ink text-slate font-body">
        Loading...
      </div>
    );
  }

  return (
    <main className="min-h-dvh bg-ink text-parchment px-5 pt-6 pb-28">
      <div className="flex items-center gap-3 mb-6">
        <a href="/settings/account" aria-label="Back to settings">
          <ChevronLeft className="w-6 h-6 text-parchment" />
        </a>
        <h1 className="font-display text-lg font-semibold">Playback</h1>
      </div>

      <div className="bg-white/5 rounded-xl">
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <p className="font-body text-sm">Sound on by default</p>
            <p className="font-body text-xs text-slate mt-1">
              Videos play with sound right away instead of waiting for a tap.
            </p>
          </div>
          <Toggle checked={defaultSoundOn} onChange={toggle} />
        </div>
      </div>

      <BottomNav />
    </main>
  );
}
