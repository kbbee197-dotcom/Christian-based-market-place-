"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function StorePage() {
  const [userId, setUserId] = useState(null);
  const [store, setStore] = useState(null);
  const [storeName, setStoreName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData?.user?.id;
      if (!uid) return;
      setUserId(uid);

      const { data } = await supabase
        .from("sellers_stores")
        .select("*")
        .eq("owner_id", uid)
        .maybeSingle();

      if (data) {
        setStore(data);
        setStoreName(data.store_name);
        setDescription(data.description || "");
      }
    }
    load();
  }, []);

  async function saveStore(e) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const payload = {
      owner_id: userId,
      store_name: storeName,
      store_slug: slugify(storeName),
      description,
    };

    const { data, error } = store
      ? await supabase
          .from("sellers_stores")
          .update(payload)
          .eq("id", store.id)
          .select()
          .single()
      : await supabase.from("sellers_stores").insert(payload).select().single();

    setSaving(false);
    if (error) {
      setMessage(error.message);
    } else {
      setStore(data);
      setMessage("Saved.");
    }
  }

  async function connectStripe() {
    const { data: userData } = await supabase.auth.getUser();
    const res = await fetch("/api/stripe/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sellerId: store?.id,
        email: userData?.user?.email,
        returnUrl: `${window.location.origin}/dashboard`,
        refreshUrl: `${window.location.origin}/dashboard/store`,
      }),
    });
    const json = await res.json();
    if (json.url) window.location.href = json.url;
  }

  return (
    <div className="max-w-md">
      <form onSubmit={saveStore} className="space-y-4 mb-8">
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
        {message && <p className="font-body text-sm text-wick">{message}</p>}
        <button
          disabled={saving}
          className="bg-wick text-ink font-semibold px-6 py-3 rounded-full disabled:opacity-60"
        >
          {saving ? "Saving..." : store ? "Save changes" : "Create store"}
        </button>
      </form>

      {store && (
        <div className="bg-white/5 rounded-xl p-5">
          <p className="font-mono text-xs text-slate uppercase tracking-wide mb-2">Payouts</p>
          <p className="font-body text-sm text-slate mb-4">
            {store.stripe_onboarded
              ? "Your Stripe account is connected."
              : "Connect a Stripe account so you can get paid directly."}
          </p>
          {!store.stripe_onboarded && (
            <button
              onClick={connectStripe}
              className="bg-parchment text-ink font-semibold px-6 py-3 rounded-full"
            >
              Connect Stripe
            </button>
          )}
        </div>
      )}
    </div>
  );
}
