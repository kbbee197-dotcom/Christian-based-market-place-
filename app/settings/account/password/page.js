"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { ChevronLeft } from "lucide-react";
import BottomNav from "@/components/BottomNav";

export default function ChangePasswordPage() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(e) {
    e.preventDefault();
    setMessage("");

    if (newPassword.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage("Passwords don't match.");
      return;
    }

    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSaving(false);

    if (error) {
      setMessage("Couldn't update password: " + error.message);
    } else {
      setMessage("Password updated!");
      setNewPassword("");
      setConfirmPassword("");
    }
  }

  return (
    <main className="min-h-dvh bg-ink text-parchment px-5 pt-6 pb-28">
      <div className="flex items-center gap-3 mb-6">
        <a href="/settings/account" aria-label="Back to settings">
          <ChevronLeft className="w-6 h-6 text-parchment" />
        </a>
        <h1 className="font-display text-lg font-semibold">Change password</h1>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block font-body text-sm text-slate mb-1">New password</label>
          <input
            type="password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 font-body"
          />
        </div>
        <div>
          <label className="block font-body text-sm text-slate mb-1">Confirm new password</label>
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 font-body"
          />
        </div>

        {message && <p className="font-body text-sm text-clay">{message}</p>}

        <button
          disabled={saving}
          className="bg-wick text-ink font-semibold px-6 py-3 rounded-full disabled:opacity-60"
        >
          {saving ? "Saving..." : "Update password"}
        </button>
      </form>

      <BottomNav />
    </main>
  );
}
