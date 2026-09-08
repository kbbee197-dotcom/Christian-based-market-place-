"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const CATEGORIES = ["Apparel", "Home Goods", "Accessories", "Books", "Art", "Other"];
const FULFILLMENT_OPTIONS = [
  { value: "ships", label: "Ships nationwide" },
  { value: "pickup", label: "Local pickup only" },
  { value: "both", label: "Both shipping and local pickup" },
];

export default function ApplyToSellPage() {
  const [storeName, setStoreName] = useState("");
  const [description, setDescription] = useState("");
  const [sellsCategory, setSellsCategory] = useState("");
  const [fulfillmentMethod, setFulfillmentMethod] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [faithStatement, setFaithStatement] = useState("");
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
      body: JSON.stringify({
        storeName,
        description,
        sellsCategory,
        fulfillmentMethod,
        contactEmail,
        contactPhone,
        portfolioUrl,
        faithStatement,
      }),
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
            We&apos;ll review your store and let you know once it&apos;s approved.
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

        <div>
          <label className="block font-body text-sm text-slate mb-1">What do you sell?</label>
          <select
            required
            value={sellsCategory}
            onChange={(e) => setSellsCategory(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 font-body"
          >
            <option value="">Choose a category</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-body text-sm text-slate mb-1">How will you fulfill orders?</label>
          <select
            required
            value={fulfillmentMethod}
            onChange={(e) => setFulfillmentMethod(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 font-body"
          >
            <option value="">Choose an option</option>
            {FULFILLMENT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-body text-sm text-slate mb-1">Contact email</label>
          <input
            required
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 font-body"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className="block font-body text-sm text-slate mb-1">Phone number</label>
          <input
            required
            type="tel"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 font-body"
            placeholder="(555) 555-5555"
          />
        </div>

        <div>
          <label className="block font-body text-sm text-slate mb-1">
            Link to your work (optional)
          </label>
          <p className="font-body text-xs text-slate mb-1">
            Instagram, Etsy, a website — anywhere we can see examples. Don&apos;t have one yet? No problem, just leave this blank.
          </p>
          <input
            value={portfolioUrl}
            onChange={(e) => setPortfolioUrl(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 font-body"
            placeholder="https://instagram.com/yourshop"
          />
        </div>

        <div>
          <label className="block font-body text-sm text-slate mb-1">
            How does your faith shape what you make? (optional)
          </label>
          <textarea
            value={faithStatement}
            onChange={(e) => setFaithStatement(e.target.value)}
            rows={3}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 font-body"
            placeholder="Share a bit, if you'd like."
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
