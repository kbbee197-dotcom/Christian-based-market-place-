"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Trash2 } from "lucide-react";

export default function AdminProducts() {
  const [products, setProducts] = useState([]);

  async function load() {
    const { data } = await supabase
      .from("products")
      .select("id, title, flagged")
      .order("created_at", { ascending: false });
    setProducts(data || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleFlag(id, flagged) {
    await supabase.from("products").update({ flagged: !flagged }).eq("id", id);
    load();
  }

  async function remove(id) {
    await supabase.from("products").delete().eq("id", id);
    load();
  }

  return (
    <div className="space-y-3 max-w-md">
      {products.map((p) => (
        <div key={p.id} className="bg-white/5 rounded-xl p-4 flex items-center justify-between">
          <p className="font-body text-sm truncate max-w-[150px]">{p.title}</p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => toggleFlag(p.id, p.flagged)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full ${
                p.flagged ? "bg-clay text-ink" : "bg-white/10 text-slate"
              }`}
            >
              {p.flagged ? "Flagged" : "Flag"}
            </button>
            <button onClick={() => remove(p.id)} aria-label="Delete">
              <Trash2 className="w-4 h-4 text-clay" />
            </button>
          </div>
        </div>
      ))}
      {products.length === 0 && <p className="font-body text-slate text-sm">No products yet.</p>}
    </div>
  );
}
