"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Trash2, Pencil } from "lucide-react";

async function authHeaders() {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

export default function ProductsPage() {
  const [storeId, setStoreId] = useState(null);
  const [products, setProducts] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function loadProducts(sid) {
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("store_id", sid)
      .order("created_at", { ascending: false });
    setProducts(data || []);
  }

  useEffect(() => {
    async function load() {
      const headers = await authHeaders();
      const res = await fetch("/api/me/store", { method: "POST", headers });
      const json = await res.json();

      if (json.store) {
        setStoreId(json.store.id);
        loadProducts(json.store.id);
      }
    }
    load();
  }, []);

  function startEdit(p) {
    setEditingId(p.id);
    setTitle(p.title);
    setPrice((p.price_cents / 100).toString());
    setImageUrl(p.image_urls?.[0] || "");
  }

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setPrice("");
    setImageUrl("");
  }

  async function saveProduct(e) {
    e.preventDefault();
    if (!storeId) {
      setMessage("Set up your store first, on the Store tab.");
      return;
    }
    setSaving(true);
    setMessage("");

    const headers = await authHeaders();
    const priceCents = Math.round(parseFloat(price) * 100);

    const res = editingId
      ? await fetch("/api/products", {
          method: "PATCH",
          headers,
          body: JSON.stringify({ productId: editingId, storeId, title, priceCents, imageUrl }),
        })
      : await fetch("/api/products", {
          method: "POST",
          headers,
          body: JSON.stringify({ storeId, title, priceCents, imageUrl }),
        });

    const json = await res.json();
    setSaving(false);

    if (!res.ok) {
      setMessage(json.error || "Something went wrong.");
    } else {
      resetForm();
      loadProducts(storeId);
    }
  }

  async function deleteProduct(id) {
    const headers = await authHeaders();
    await fetch("/api/products", {
      method: "DELETE",
      headers,
      body: JSON.stringify({ productId: id, storeId }),
    });
    if (editingId === id) resetForm();
    loadProducts(storeId);
  }

  return (
    <div className="max-w-md">
      <form onSubmit={saveProduct} className="space-y-4 mb-8">
        <div>
          <label className="block font-body text-sm text-slate mb-1">Product name</label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 font-body"
            placeholder="Beeswax Trio Set"
          />
        </div>
        <div>
          <label className="block font-body text-sm text-slate mb-1">Price (USD)</label>
          <input
            required
            type="number"
            step="0.01"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 font-body"
            placeholder="24.00"
          />
        </div>
        <div>
          <label className="block font-body text-sm text-slate mb-1">Image URL (optional for now)</label>
          <input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 font-body"
            placeholder="https://..."
          />
        </div>
        {message && <p className="font-body text-sm text-clay">{message}</p>}
        <div className="flex gap-3">
          <button disabled={saving} className="bg-wick text-ink font-semibold px-6 py-3 rounded-full disabled:opacity-60">
            {saving ? "Saving..." : editingId ? "Save changes" : "Add product"}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className="font-body text-sm text-slate underline">
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="space-y-3">
        {products.map((p) => (
          <div key={p.id} className="flex items-center justify-between bg-white/5 rounded-xl p-4">
            <div>
              <p className="font-body font-semibold text-sm">{p.title}</p>
              <p className="font-mono text-xs text-slate">${(p.price_cents / 100).toFixed(2)}</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => startEdit(p)} aria-label="Edit product">
                <Pencil className="w-4 h-4 text-slate" />
              </button>
              <button onClick={() => deleteProduct(p.id)} aria-label="Delete product">
                <Trash2 className="w-4 h-4 text-clay" />
              </button>
            </div>
          </div>
        ))}
        {products.length === 0 && <p className="font-body text-sm text-slate">No products yet.</p>}
      </div>
    </div>
  );
}
