"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

    setLoading(false);
    if (loginError) {
      setError(loginError.message);
      return;
    }
    router.push("/dashboard");
  }

  return (
    <main className="min-h-dvh flex items-center justify-center bg-ink text-parchment px-6">
      <form onSubmit={handleLogin} className="w-full max-w-sm">
        <h1 className="font-display text-2xl font-semibold mb-6">Log in</h1>

        <label className="block font-body text-sm text-slate mb-1">Email</label>
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 mb-4 font-body"
        />

        <label className="block font-body text-sm text-slate mb-1">Password</label>
        <input
          required
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 mb-6 font-body"
        />

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
