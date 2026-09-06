"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import BottomNav from "@/components/BottomNav";

function Row({ href, label, value }) {
  return (
    <a href={href} className="flex items-center justify-between px-5 py-4">
      <span className="font-body text-sm">{label}</span>
      <span className="flex items-center gap-2">
        {value && <span className="font-body text-xs text-slate">{value}</span>}
        <ChevronRight className="w-4 h-4 text-slate" />
      </span>
    </a>
  );
}

export default function AccountSettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        router.replace("/login");
        return;
      }
      setEmail(userData.user.email);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("display_name, username, account_type")
        .eq("id", userData.user.id)
        .single();

      setProfile(profileData);
      setLoading(false);
    }
    load();
  }, [router]);

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-ink text-slate font-body">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-ink text-parchment px-5 pt-6 pb-28">
      <div className="flex items-center gap-3 mb-6">
        <a href="/settings" aria-label="Back to profile">
          <ChevronLeft className="w-6 h-6 text-parchment" />
        </a>
        <h1 className="font-display text-2xl font-semibold">Settings</h1>
      </div>

      <p className="font-mono text-xs text-slate uppercase tracking-wide mb-2">Account</p>
      <div className="bg-white/5 rounded-xl mb-6 divide-y divide-white/10">
        <Row href="/settings/account/password" label="Change password" />
        <Row href="/settings/account/blocked" label="Blocked accounts" />
      </div>

      <p className="font-mono text-xs text-slate uppercase tracking-wide mb-2">Notifications</p>
      <div className="bg-white/5 rounded-xl mb-6 divide-y divide-white/10">
        <Row href="/settings/account/notifications" label="Notification preferences" />
      </div>

      <p className="font-mono text-xs text-slate uppercase tracking-wide mb-2">Activity</p>
      <div className="bg-white/5 rounded-xl mb-6 divide-y divide-white/10">
        <Row href="/settings/watch-history" label="Watch history" />
        <Row href="/settings/comment-history" label="Comment history" />
        <Row href="/settings/account/liked" label="Liked videos" />
      </div>

      <p className="font-mono text-xs text-slate uppercase tracking-wide mb-2">Content</p>
      <div className="bg-white/5 rounded-xl mb-6 divide-y divide-white/10">
        <Row href="/settings/account/playback" label="Playback" />
      </div>

      {profile?.account_type !== "vendor" && (
        <>
          <p className="font-mono text-xs text-slate uppercase tracking-wide mb-2">Selling</p>
          <div className="bg-white/5 rounded-xl p-5 mb-6">
            <p className="font-body text-sm text-slate mb-3">
              Want to sell your own products or videos?
            </p>
            <a
              href="/apply-to-sell"
              className="inline-block bg-wick text-ink font-semibold px-6 py-3 rounded-full"
            >
              Apply to sell
            </a>
          </div>
        </>
      )}

      <p className="font-mono text-xs text-slate uppercase tracking-wide mb-2">Support</p>
      <div className="bg-white/5 rounded-xl mb-6 divide-y divide-white/10">
        <Row href="/settings/account/help" label="Help Center" />
        <Row href="/settings/account/terms" label="Terms and Policies" />
      </div>

      <p className="font-mono text-xs text-slate uppercase tracking-wide mb-2">Login</p>
      <button
        onClick={logout}
        className="w-full bg-white/5 text-clay font-semibold py-3 rounded-full mt-1"
      >
        Log out
      </button>

      <BottomNav />
    </div>
  );
}
