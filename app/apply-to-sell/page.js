"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function ApplyToSellPage() {
  const router = useRouter();
  const [storeName, setStoreName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function submitApplication(e) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    const res = await fetch("/api/store", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ storeName, description }),
    });
    const json = await res.json();

    setSaving(false);
    if (!res.ok) {
      setMessage(json.error || "Something went wrong.");
    } else {
      setSubmitted(true);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-dvh bg-ink text-parchment flex items-center justify-center px-6 text-center">
        <div>
          <p className="font-display text-xl font-semibold mb-2">Application submitted!</p>
          <p className="font-body text-slate text-sm mb-6">
            We'll review your store and let you know once it's approved.
          </p>
          <a href="/feed" className="text-wick underline font-body text-sm">
            Back to feed
          </a>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-dvh bg-ink text-parchment px-6 py-8">
      <a href="/settings" className="font-body text-sm text-slate underline">
        ← Back
      </a>
      <h1 className="font-display text-2xl font-semibold mt-4 mb-2">Apply to sell</h1>
      <p className="font-body text-sm text-slate mb-6">
        Tell us about your store. An admin will review your application before you can start listing products.
      </p>

      <form onSubmit={submitApplication} className="space-y-4 max-w-sm">
        <div>
          <label className="block font-body text-sm text-slate mb-1">Store name</label>
          <input
            required
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 font-body"
            placeholder="Hannah's Hearth"
          />
        </div>
        <div>
          <label className="block font-body text-sm text-slate mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 font-body"
            placeholder="What do you make, and what makes it yours?"
          />
        </div>
        {message && <p className="font-body text-sm text-clay">{message}</p>}
        <button
          disabled={saving}
          className="bg-wick text-ink font-semibold px-6 py-3 rounded-full disabled:opacity-60"
        >
          {saving ? "Submitting..." : "Submit application"}
        </button>
      </form>
    </main>
  );
}
