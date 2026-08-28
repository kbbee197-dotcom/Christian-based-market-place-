"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Trash2 } from "lucide-react";

export default function CartPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [message, setMessage] = useState("");

  async function loadCart() {
    const { data } = await supabase
      .from("cart_items")
      .select("id, quantity, product:products(id, title, price_cents, store_id)")
      .order("created_at", { ascending: false });
    setItems(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadCart();
  }, []);

  async function removeItem(id) {
    await supabase.from("cart_items").delete().eq("id", id);
    loadCart();
  }

  async function checkout() {
    setCheckingOut(true);
    setMessage("");
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    setCheckingOut(false);

    if (json.url) {
      window.location.href = json.url;
    } else {
      setMessage(json.error || "Something went wrong.");
    }
  }

  const total = items.reduce((sum, i) => sum + i.product.price_cents * i.quantity, 0);
  const multiSeller = items.some((i) => i.product.store_id !== items[0]?.product.store_id);

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
      <h1 className="font-display text-2xl font-semibold mt-4 mb-6">Your cart</h1>

      {items.length === 0 ? (
        <p className="font-body text-slate">Your cart is empty.</p>
      ) : (
        <>
          <div className="space-y-3 mb-8">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between bg-white/5 rounded-xl p-4"
              >
                <div>
                  <p className="font-body font-semibold text-sm">{item.product.title}</p>
                  <p className="font-mono text-xs text-slate">
                    ${(item.product.price_cents / 100).toFixed(2)} × {item.quantity}
                  </p>
                </div>
                <button onClick={() => removeItem(item.id)} aria-label="Remove">
                  <Trash2 className="w-4 h-4 text-clay" />
                </button>
              </div>
            ))}
          </div>

          <p className="font-display text-xl font-semibold mb-3">
            Total: ${(total / 100).toFixed(2)}
          </p>

          {multiSeller && (
            <p className="font-body text-xs text-slate mb-3">
              Items are from more than one seller — checkout processes one
              seller at a time. You'll come back here for the rest after the
              first payment.
            </p>
          )}

          {message && <p className="font-body text-sm text-clay mb-3">{message}</p>}

          <button
            onClick={checkout}
            disabled={checkingOut}
            className="w-full bg-wick text-ink font-semibold py-3.5 rounded-full disabled:opacity-60"
          >
            {checkingOut ? "Redirecting to payment..." : "Checkout"}
          </button>
        </>
      )}
    </main>
  );
}
