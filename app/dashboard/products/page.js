"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Trash2, Pencil, X } from "lucide-react";

const CATEGORIES = ["Apparel", "Home Goods", "Accessories", "Books", "Art", "Other"];

async function authHeaders() {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

async function uploadImageToCloudinary(file) {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", preset);
  formData.append("resource_type", "image");
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body: formData }
  );
  if (!res.ok) throw new Error("Image upload failed");
  const json = await res.json();
  return json.secure_url;
}

export default function ProductsPage() {
  const [storeId, setStoreId] = useState(null);
  const [products, setProducts] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [tagline, setTagline] = useState("");
  const [category, setCategory] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [imageUrls, setImageUrls] = useState([]);
  const [inventory, setInventory] = useState("");
  const [uploading, setUploading] = useState(false);
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
    setDescription(p.description || "");
    setTagline(p.tagline || "");
    setCategory(p.category || "");
    setTagsInput((p.tags || []).join(", "));
    setImageUrls(p.image_urls || []);
    setInventory(p.inventory_count != null ? String(p.inventory_count) : "");
  }

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setPrice("");
    setDescription("");
    setTagline("");
    setCategory("");
    setTagsInput("");
    setImageUrls([]);
    setInventory("");
  }

  async function handleImageSelect(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    setMessage("");
    try {
      const uploaded = [];
      for (const file of files.slice(0, 5 - imageUrls.length)) {
        const url = await uploadImageToCloudinary(file);
        uploaded.push(url);
      }
      setImageUrls((prev) => [...prev, ...uploaded]);
    } catch (err) {
      setMessage("Couldn't upload image: " + err.message);
    } finally {
      setUploading(false);
    }
  }

  function removeImage(url) {
    setImageUrls((prev) => prev.filter((u) => u !== url));
  }

  async function saveProduct(e) {
    e.preventDefault();
    if (!storeId) {
      setMessage("Set up your store first, on the Store tab.");
      return;
    }
    setSaving(true);
    setMessage("");

    try {
      const headers = await authHeaders();
      const priceCents = Math.round(parseFloat(price) * 100);
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const payload = {
        storeId,
        title,
        priceCents,
        imageUrls,
        description,
        tagline,
        category,
        tags,
        inventoryCount: inventory === "" ? null : parseInt(inventory, 10),
      };

      const res = editingId
        ? await fetch("/api/products", {
            method: "PATCH",
            headers,
            body: JSON.stringify({ productId: editingId, ...payload }),
          })
        : await fetch("/api/products", {
            method: "POST",
            headers,
            body: JSON.stringify(payload),
          });

      const json = await res.json();

      if (!res.ok) {
        setMessage(json.error || "Something went wrong.");
      } else {
        resetForm();
        loadProducts(storeId);
      }
    } catch (err) {
      setMessage("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(p) {
    const headers = await authHeaders();
    await fetch("/api/products", {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        productId: p.id,
        storeId,
        title: p.title,
        priceCents: p.price_cents,
        imageUrls: p.image_urls,
        description: p.description,
        tagline: p.tagline,
        category: p.category,
        tags: p.tags,
        inventoryCount: p.inventory_count,
        isActive: !p.is_active,
      }),
    });
    loadProducts(storeId);
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
          <label className="block font-body text-sm text-slate mb-1">Tagline</label>
          <input
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 font-body"
            placeholder="A quick one-liner for the feed"
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
          <label className="block font-body text-sm text-slate mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 font-body resize-none"
            placeholder="Materials, sizing, details shoppers should know"
          />
        </div>

        <div>
          <label className="block font-body text-sm text-slate mb-1">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 font-body"
          >
            <option value="">No category</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-body text-sm text-slate mb-1">Stock quantity (leave blank for unlimited)</label>
          <input
            type="number"
            min="0"
            value={inventory}
            onChange={(e) => setInventory(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 font-body"
            placeholder="Unlimited"
          />
        </div>

        <div>
          <label className="block font-body text-sm text-slate mb-1">Tags (comma separated)</label>
          <input
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 font-body"
            placeholder="handmade, faith, gift"
          />
        </div>

        <div>
          <label className="block font-body text-sm text-slate mb-1">Photos (up to 5)</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {imageUrls.map((url) => (
              <div key={url} className="relative">
                <img src={url} alt="" className="w-16 h-16 rounded-lg object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(url)}
                  className="absolute -top-1.5 -right-1.5 bg-clay rounded-full p-0.5"
                >
                  <X className="w-3 h-3 text-ink" />
                </button>
              </div>
            ))}
          </div>
          {imageUrls.length < 5 && (
            <label className="inline-block bg-white/10 text-parchment text-xs font-semibold px-4 py-2 rounded-full cursor-pointer">
              {uploading ? "Uploading..." : "Add photos"}
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                disabled={uploading}
                className="hidden"
              />
            </label>
          )}
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
            <div className="flex items-center gap-3 min-w-0">
              {p.image_urls?.[0] && (
                <img src={p.image_urls[0]} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
              )}
              <div className="min-w-0">
                <p className="font-body font-semibold text-sm truncate">{p.title}</p>
                <p className="font-mono text-xs text-slate">
                  ${(p.price_cents / 100).toFixed(2)}
                  {p.inventory_count != null && (
                    <span className={p.inventory_count === 0 ? "text-clay" : ""}>
                      {" · "}
                      {p.inventory_count === 0 ? "Sold out" : `${p.inventory_count} in stock`}
                    </span>
                  )}
                </p>
                <button
                  onClick={() => toggleActive(p)}
                  className={`inline-block mt-1 font-body text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    p.inventory_count === 0
                      ? "bg-white/10 text-slate"
                      : p.is_active
                      ? "bg-wick/20 text-wick"
                      : "bg-white/10 text-slate"
                  }`}
                >
                  {p.inventory_count === 0 ? "Sold out" : p.is_active ? "Active" : "Draft"}
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
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
