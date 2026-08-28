"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("orders")
        .select("id, status, total_cents, created_at, store:sellers_stores(store_name)")
        .order("created_at", { ascending: false });
      setOrders(data || []);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-dvh bg-ink text-slate font-body flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <main className="min-h-dvh bg-ink text-parchment px-5 py-6">
      <a href="/feed" className="font-body text-sm text-slate underline">
        ← Back to feed
      </a>
      <h1 className="font-display text-2xl font-semibold mt-4 mb-6">Your orders</h1>

      {orders.length === 0 ? (
        <p className="font-body text-slate">No orders yet.</p>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <div key={o.id} className="bg-white/5 rounded-xl p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="font-body font-semibold text-sm">{o.store?.store_name}</p>
                <span className="font-mono text-xs uppercase text-wick">{o.status}</span>
              </div>
              <p className="font-mono text-xs text-slate">
                ${(o.total_cents / 100).toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
