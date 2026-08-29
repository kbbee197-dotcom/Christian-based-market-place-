"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

async function authHeaders() {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

export default function StorePage() {
  const [store, setStore] = useState(null);
  const [storeName, setStoreName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [checkingStripe, setCheckingStripe] = useState(false);

  useEffect(() => {
    async function load() {
      const headers = await authHeaders();
      const storeRes = await fetch("/api/me/store", { method: "POST", headers });
      const { store: data } = await storeRes.json();

      if (data) {
        setStore(data);
        setStoreName(data.store_name);
        setDescription(data.description || "");

        if (data.stripe_account_id && !data.stripe_onboarded) {
          setCheckingStripe(true);
          const statusRes = await fetch("/api/stripe/status", { method: "POST", headers });
          const json = await statusRes.json();
          if (json.onboarded) {
            setStore((s) => ({ ...s, stripe_onboarded: true }));
          }
          setCheckingStripe(false);
        }
      }
    }
    load();
  }, []);

  async function saveStore(e) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const headers = await authHeaders();

    const res = await fetch("/api/store", {
      method: "POST",
      headers,
      body: JSON.stringify({ storeName, description }),
    });
    const json = await res.json();

    setSaving(false);
    if (!res.ok) {
      setMessage(json.error || "Something went wrong.");
    } else {
      setStore(json.store);
      setMessage("Saved.");
    }
  }

  async function connectStripe() {
    setCheckingStripe(true);
    setMessage("");
    try {
      const { data: userData } = await supabase.auth.getUser();
      const headers = await authHeaders();
      const res = await fetch("/api/stripe/connect", {
        method: "POST",
        headers,
        body: JSON.stringify({
          email: userData?.user?.email,
          returnUrl: `${window.location.origin}/dashboard/store`,
          refreshUrl: `${window.location.origin}/dashboard/store`,
        }),
      });
      const json = await res.json();
      if (json.url) {
        window.location.href = json.url;
      } else {
        setMessage(json.error || "Couldn't start Stripe connection.");
        setCheckingStripe(false);
      }
    } catch (err) {
      setMessage("Connection error: " + err.message);
      setCheckingStripe(false);
    }
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
            {checkingStripe
              ? "Checking Stripe status..."
              : store.stripe_onboarded
              ? "Your Stripe account is connected."
              : "Connect a Stripe account so you can get paid directly."}
          </p>
          {!store.stripe_onboarded && !checkingStripe && (
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
