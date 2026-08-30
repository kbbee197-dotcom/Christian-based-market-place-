"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);

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

  async function becomeVendor() {
    setSwitching(true);
    const { data: userData } = await supabase.auth.getUser();
    await supabase
      .from("profiles")
      .update({ account_type: "vendor" })
      .eq("id", userData.user.id);
    router.push("/dashboard/store");
  }

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
    <div className="min-h-dvh bg-ink text-parchment px-5 py-6">
      <h1 className="font-display text-2xl font-semibold mb-6">Account</h1>

      <div className="bg-white/5 rounded-xl p-5 mb-4 space-y-1">
        <p className="font-body text-sm text-slate">Username</p>
        <p className="font-body font-semibold">{profile?.username || profile?.display_name}</p>
      </div>

      <div className="bg-white/5 rounded-xl p-5 mb-4 space-y-1">
        <p className="font-body text-sm text-slate">Email</p>
        <p className="font-body font-semibold">{email}</p>
      </div>

      <div className="bg-white/5 rounded-xl p-5 mb-4 space-y-1">
        <p className="font-body text-sm text-slate">Account type</p>
        <p className="font-body font-semibold capitalize">{profile?.account_type}</p>
      </div>

      {profile?.account_type !== "vendor" && (
        <div className="bg-white/5 rounded-xl p-5 mb-4">
          <p className="font-body text-sm text-slate mb-3">
            Want to sell your own products or videos?
          </p>
          <button
            onClick={becomeVendor}
            disabled={switching}
            className="bg-wick text-ink font-semibold px-6 py-3 rounded-full disabled:opacity-60"
          >
            {switching ? "Setting up..." : "Start selling"}
          </button>
        </div>
      )}

      <button
        onClick={logout}
        className="w-full bg-white/5 text-clay font-semibold py-3 rounded-full mt-2"
      >
        Log out
      </button>
    </div>
  );
}
