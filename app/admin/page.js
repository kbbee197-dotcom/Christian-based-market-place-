"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AdminStores() {
  const [stores, setStores] = useState([]);

  async function load() {
    const { data } = await supabase
      .from("sellers_stores")
      .select("*")
      .order("created_at", { ascending: false });
    setStores(data || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleApproved(id, approved, ownerId) {
    const newApproved = !approved;
    await supabase.from("sellers_stores").update({ approved: newApproved }).eq("id", id);

    // Approving a store also grants vendor status. Unapproving does not
    // strip it back to shopper, since the person already had access —
    // suspend their account instead if you need to fully revoke access.
    if (newApproved && ownerId) {
      await supabase.from("profiles").update({ account_type: "vendor" }).eq("id", ownerId);
    }

    load();
  }

  return (
    <div className="space-y-3 max-w-md">
      {stores.map((s) => (
        <div key={s.id} className="bg-white/5 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="font-body font-semibold text-sm">{s.store_name}</p>
            <p className="font-mono text-xs text-slate">
              {s.approved ? "Approved — visible to shoppers" : "Pending review"}
            </p>
          </div>
          <button
            onClick={() => toggleApproved(s.id, s.approved, s.owner_id)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full ${
              s.approved ? "bg-white/10 text-slate" : "bg-wick text-ink"
            }`}
          >
            {s.approved ? "Unapprove" : "Approve"}
          </button>
        </div>
      ))}
      {stores.length === 0 && <p className="font-body text-slate text-sm">No stores yet.</p>}
    </div>
  );
}
