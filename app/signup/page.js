"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // Create the matching public profile row.
    if (data.user) {
      await supabase.from("profiles").insert({
        id: data.user.id,
        username,
        display_name: username,
      });
    }

    setLoading(false);
    router.push("/dashboard");
  }

  return (
    <main className="min-h-dvh flex items-center justify-center bg-ink text-parchment px-6">
      <form onSubmit={handleSignup} className="w-full max-w-sm">
        <h1 className="font-display text-2xl font-semibold mb-6">Create your account</h1>

        <label className="block font-body text-sm text-slate mb-1">Username</label>
        <input
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 mb-4 font-body"
          placeholder="hannahs_hearth"
        />

        <label className="block font-body text-sm text-slate mb-1">Email</label>
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 mb-4 font-body"
          placeholder="you@example.com"
        />

        <label className="block font-body text-sm text-slate mb-1">Password</label>
        <input
          required
          type="password"
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 mb-6 font-body"
          placeholder="At least 6 characters"
        />

        {error && <p className="text-clay text-sm mb-4">{error}</p>}

        <button
          disabled={loading}
          className="w-full bg-wick text-ink font-semibold py-3 rounded-full disabled:opacity-60"
        >
          {loading ? "Creating account..." : "Sign up"}
        </button>

        <p className="font-body text-sm text-slate text-center mt-5">
          Already have an account? <a href="/login" className="text-wick underline">Log in</a>
        </p>
      </form>
    </main>
  );
}
