"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function DashboardOverview() {
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) return;

      const res = await fetch("/api/me/store", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      const { store: data } = await res.json();

      setStore(data);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <p className="font-body text-slate">Loading...</p>;

  if (!store) {
    return (
      <div>
        <p className="font-body text-slate mb-4">
          You haven't set up a store yet. Set one up to start listing
          products and posting videos.
        </p>
        <a
          href="/dashboard/store"
          className="inline-block bg-wick text-ink font-semibold px-6 py-3 rounded-full"
        >
          Set up your store
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white/5 rounded-xl p-5">
        <p className="font-mono text-xs text-slate uppercase tracking-wide mb-1">Store</p>
        <p className="font-display text-xl font-semibold">{store.store_name}</p>
        <p className="font-body text-sm text-slate mt-2">
          {store.approved ? "Live and visible to shoppers" : "Waiting on admin approval"}
        </p>
      </div>

      <div className="bg-white/5 rounded-xl p-5">
        <p className="font-mono text-xs text-slate uppercase tracking-wide mb-1">Payouts</p>
        <p className="font-body text-sm">
          {store.stripe_onboarded ? "Connected ✓" : "Not connected yet"}
        </p>
        {!store.stripe_onboarded && (
          <a href="/dashboard/store" className="text-wick text-sm underline mt-2 inline-block">
            Connect Stripe
          </a>
        )}
      </div>
    </div>
  );
}
