"use client";

import { useState } from "react";
import { Search as SearchIcon, X } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import BottomNav from "@/components/BottomNav";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]);
  const [creators, setCreators] = useState([]);
  const [searched, setSearched] = useState(false);

  async function runSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);

    const term = "%" + query.trim() + "%";

    const storeRes = await supabase
      .from("sellers_stores")
      .select("id, store_name, store_slug, description, logo_url")
      .eq("approved", true)
      .or("store_name.ilike." + term + ",description.ilike." + term)
      .limit(10);

    const productRes = await supabase
      .from("products")
      .select("id, title, description, price_cents, image_urls, store_id")
      .eq("is_active", true)
      .eq("flagged", false)
      .or("title.ilike." + term + ",description.ilike." + term)
      .limit(10);

    const creatorRes = await supabase
      .from("profiles")
      .select("id, username, display_name")
      .eq("banned", false)
      .or("username.ilike." + term + ",display_name.ilike." + term)
      .limit(10);

    setStores(storeRes.data || []);
    setProducts(productRes.data || []);
    setCreators(creatorRes.data || []);
    setLoading(false);
  }

  function clearSearch() {
    setQuery("");
    setSearched(false);
    setStores([]);
    setProducts([]);
    setCreators([]);
  }

  return (
    <main className="min-h-dvh bg-ink text-parchment px-5 py-6 pb-28">
      <form onSubmit={runSearch} className="flex items-center gap-2 mb-6">
        <div className="flex-1 flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-3">
          <SearchIcon className="w-4 h-4 text-slate shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search stores, products, creators"
            className="bg-transparent outline-none font-body text-sm flex-1"
          />
          {query && (
            <button type="button" onClick={clearSearch} aria-label="Clear">
              <X className="w-4 h-4 text-slate" />
            </button>
          )}
        </div>
      </form>

      {loading && <p className="font-body text-slate text-sm">Searching...</p>}

      {!loading && searched && stores.length === 0 && products.length === 0 && creators.length === 0 && (
        <p className="font-body text-slate text-sm">No results.</p>
      )}

      {stores.length > 0 && (
        <div className="mb-6">
          <p className="font-mono text-xs text-slate uppercase tracking-wide mb-2">Stores</p>
          <div className="space-y-2">
            {stores.map((s) => (
              <div key={s.id} className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                <div className="w-10 h-10 rounded-full bg-clay flex items-center justify-center font-display font-semibold text-sm shrink-0">
                  {s.store_name ? s.store_name[0].toUpperCase() : "?"}
                </div>
                <div className="min-w-0">
                  <p className="font-body font-semibold text-sm truncate">{s.store_name}</p>
                  {s.description && (
                    <p className="font-body text-xs text-slate truncate">{s.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {products.length > 0 && (
        <div className="mb-6">
          <p className="font-mono text-xs text-slate uppercase tracking-wide mb-2">Products</p>
          <div className="space-y-2">
            {products.map((p) => (
              <div key={p.id} className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                {p.image_urls && p.image_urls[0] ? (
                  <img src={p.image_urls[0]} alt={p.title} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-white/10 shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-body font-semibold text-sm truncate">{p.title}</p>
                  <p className="font-mono text-xs text-slate">${(p.price_cents / 100).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {creators.length > 0 && (
        <div className="mb-6">
          <p className="font-mono text-xs text-slate uppercase tracking-wide mb-2">Creators</p>
          <div className="space-y-2">
            {creators.map((c) => (
              <div key={c.id} className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                <div className="w-10 h-10 rounded-full bg-clay flex items-center justify-center font-display font-semibold text-sm shrink-0">
                  {(c.display_name || c.username || "?")[0].toUpperCase()}
                </div>
                <p className="font-body font-semibold text-sm">{c.display_name || c.username}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <BottomNav />
    </main>
  );
}
