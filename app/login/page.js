"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) {
      setLoading(false);
      setError(loginError.message);
      return;
    }

    const { data: userData } = await supabase.auth.getUser();
    let { data: profile } = await supabase
      .from("profiles")
      .select("banned, account_type")
      .eq("id", userData.user.id)
      .single();

    if (!profile) {
      const meta = userData.user.user_metadata || {};
      const { data: newProfile } = await supabase
        .from("profiles")
        .insert({
          id: userData.user.id,
          username: meta.username || userData.user.email,
          display_name: meta.username || userData.user.email,
          account_type: meta.account_type || "shopper",
        })
        .select()
        .single();
      profile = newProfile;
    }

    if (profile?.banned) {
      await supabase.auth.signOut();
      setLoading(false);
      setError("This account has been suspended. Contact support if you believe this is a mistake.");
      return;
    }

    setLoading(false);

    if (profile?.account_type === "vendor") {
      router.push("/dashboard");
    } else {
      router.push("/feed");
    }
  }

  return (
    <main className="min-h-dvh flex items-center justify-center bg-ink text-parchment px-6">
      <form onSubmit={handleLogin} className="w-full max-w-sm">
        <h1 className="font-display text-2xl font-semibold mb-6">Log in</h1>

        <label className="block font-body text-sm text-slate mb-1">Email</label>
        <input
          required
          type="email"
          name="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 mb-4 font-body"
        />

        <label className="block font-body text-sm text-slate mb-1">Password</label>
        <div className="relative mb-6">
        <input
          required
          type={showPassword ? "text" : "password"}
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 font-body"
        />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {error && <p className="text-clay text-sm mb-4">{error}</p>}

        <button
          disabled={loading}
          className="w-full bg-wick text-ink font-semibold py-3 rounded-full disabled:opacity-60"
        >
          {loading ? "Logging in..." : "Log in"}
        </button>

        <p className="font-body text-sm text-slate text-center mt-5">
          Need an account? <a href="/signup" className="text-wick underline">Sign up</a>
        </p>
      </form>
    </main>
  );
}
