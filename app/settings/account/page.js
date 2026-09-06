"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import BottomNav from "@/components/BottomNav";

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

      <div className="bg-white/5 rounded-xl mb-4 divide-y divide-white/10">
        <a href="/settings/watch-history" className="block font-body text-sm px-5 py-4">
          Watch history
        </a>
        <a href="/settings/comment-history" className="block font-body text-sm px-5 py-4">
          Comment history
        </a>
      </div>

      {profile?.account_type !== "vendor" && (
        <div className="bg-white/5 rounded-xl p-5 mb-4">
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
      )}

      <button
        onClick={logout}
        className="w-full bg-white/5 text-clay font-semibold py-3 rounded-full mt-2"
      >
        Log out
      </button>
      <BottomNav />
    </div>
  );
}
