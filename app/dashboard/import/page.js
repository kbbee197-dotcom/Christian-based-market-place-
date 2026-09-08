"use client";

import { useState, useEffect } from "react";
import Papa from "papaparse";
import { supabase } from "@/lib/supabaseClient";

const CATEGORIES = ["Apparel", "Home Goods", "Accessories", "Books", "Art", "Other"];

function mapCategory(raw) {
  if (!raw) return null;
  const lower = raw.toLowerCase();
  const match = CATEGORIES.find((c) => c.toLowerCase() === lower);
  return match || null;
}

function stripHtml(html) {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

async function authHeaders() {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

function parseShopify(rows) {
  const groups = {};
  const order = [];
  for (const row of rows) {
    const handle = row["Handle"];
    if (!handle) continue;
    if (!groups[handle]) {
      groups[handle] = [];
      order.push(handle);
    }
    groups[handle].push(row);
  }

  const products = [];
  for (const handle of order) {
    const groupRows = groups[handle];
    const first = groupRows.find((r) => r["Title"]) || groupRows[0];
    const title = first["Title"];
    if (!title) continue;

    const description = stripHtml(first["Body (HTML)"]);
    const category = mapCategory(first["Type"]);
    const tags = first["Tags"]
      ? first["Tags"].split(",").map((t) => t.trim()).filter(Boolean)
      : [];
    const images = [...new Set(groupRows.map((r) => r["Image Src"]).filter(Boolean))];

    const optionName = first["Option1 Name"];
    const hasRealVariants = optionName && optionName.toLowerCase() !== "title";

    let variants = [];
    let priceCents = null;
    let inventoryCount = null;

    if (hasRealVariants) {
      variants = groupRows
        .filter((r) => r["Option1 Value"])
        .map((r) => ({
          optionName,
          optionValue: r["Option1 Value"],
          inventoryCount:
            r["Variant Inventory Qty"] !== "" && r["Variant Inventory Qty"] != null
              ? parseInt(r["Variant Inventory Qty"], 10)
              : null,
        }));
      const firstPrice = groupRows.find((r) => r["Variant Price"])?.["Variant Price"];
      priceCents = firstPrice ? Math.round(parseFloat(firstPrice) * 100) : null;
    } else {
      const priceRaw = first["Variant Price"];
      priceCents = priceRaw ? Math.round(parseFloat(priceRaw) * 100) : null;
      const invRaw = first["Variant Inventory Qty"];
      inventoryCount = invRaw !== "" && invRaw != null ? parseInt(invRaw, 10) : null;
    }

    products.push({
      key: handle,
      title,
      priceCents,
      description,
      tagline: null,
      category,
      tags,
      images,
      inventoryCount,
      variants,
      selected: !!(title && priceCents),
    });
  }
  return products;
}

function parseGeneric(rows) {
  return rows
    .filter((r) => r["title"] || r["Title"])
    .map((r, i) => {
      const title = r["title"] || r["Title"];
      const priceRaw = r["price"] || r["Price"];
      const priceCents = priceRaw ? Math.round(parseFloat(priceRaw) * 100) : null;
      const description = r["description"] || r["Description"] || "";
      const tagline = r["tagline"] || r["Tagline"] || null;
      const category = mapCategory(r["category"] || r["Category"]);
      const tagsRaw = r["tags"] || r["Tags"];
      const tags = tagsRaw ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean) : [];
      const imageRaw = r["image_url"] || r["Image URL"] || r["image"];
      const images = imageRaw ? [imageRaw] : [];
      const invRaw = r["inventory"] || r["Inventory"];
      const inventoryCount = invRaw !== "" && invRaw != null ? parseInt(invRaw, 10) : null;

      return {
        key: `row-${i}`,
        title,
        priceCents,
        description,
        tagline,
        category,
        tags,
        images,
        inventoryCount,
        variants: [],
        selected: !!(title && priceCents),
      };
    });
}

export default function ImportPage() {
  const [storeId, setStoreId] = useState(null);
  const [parsed, setParsed] = useState([]);
  const [fileName, setFileName] = useState("");
  const [format, setFormat] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      const headers = await authHeaders();
      const res = await fetch("/api/me/store", { method: "POST", headers });
      const json = await res.json();
      if (json.store) setStoreId(json.store.id);
    }
    load();
  }, []);

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setMessage("");
    setResult(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields || [];
        const isShopify = headers.includes("Handle") && headers.includes("Variant Price");
        setFormat(isShopify ? "Shopify export" : "Generic template");
        const products = isShopify ? parseShopify(results.data) : parseGeneric(results.data);
        setParsed(products);
      },
      error: (err) => {
        setMessage("Couldn't read that file: " + err.message);
      },
    });
  }

  function toggleSelected(key) {
    setParsed((prev) => prev.map((p) => (p.key === key ? { ...p, selected: !p.selected } : p)));
  }

  function downloadTemplate() {
    const csv =
      "title,price,description,tagline,category,tags,image_url,inventory\n" +
      'Beeswax Candle,24.00,A hand-poured soy candle,Warm and cozy,Home Goods,"candle, gift",https://example.com/photo.jpg,10\n';
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "product-import-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function runImport() {
    if (!storeId) {
      setMessage("Set up your store first, on the Store tab.");
      return;
    }
    const selected = parsed.filter((p) => p.selected && p.title && p.priceCents);
    if (selected.length === 0) {
      setMessage("Nothing selected to import.");
      return;
    }

    setImporting(true);
    setMessage("");
    try {
      const headers = await authHeaders();
      const res = await fetch("/api/products/import", {
        method: "POST",
        headers,
        body: JSON.stringify({
          storeId,
          products: selected.map((p) => ({
            title: p.title,
            priceCents: p.priceCents,
            imageUrls: p.images,
            description: p.description,
            tagline: p.tagline,
            category: p.category,
            tags: p.tags,
            inventoryCount: p.inventoryCount,
            variants: p.variants,
          })),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setMessage(json.error || "Import failed.");
      } else {
        setResult(json);
        setParsed([]);
        setFileName("");
      }
    } catch (err) {
      setMessage("Error: " + err.message);
    } finally {
      setImporting(false);
    }
  }

  const selectedCount = parsed.filter((p) => p.selected).length;

  return (
    <div className="max-w-md space-y-6">
      <div>
        <h2 className="font-display text-lg font-semibold mb-1">Import products</h2>
        <p className="font-body text-sm text-slate">
          Upload a CSV exported from Shopify, or use our simple template for any other
          platform (Square, Etsy, a POS system, or your own spreadsheet).
        </p>
      </div>

      <button onClick={downloadTemplate} className="font-body text-sm text-wick underline">
        Download the generic template
      </button>

      <div>
        <label className="inline-block bg-white/10 text-parchment text-sm font-semibold px-4 py-2 rounded-full cursor-pointer">
          Choose CSV file
          <input type="file" accept=".csv" onChange={handleFile} className="hidden" />
        </label>
        {fileName && (
          <p className="font-body text-xs text-slate mt-2">
            {fileName} · detected as {format}
          </p>
        )}
      </div>

      {message && <p className="font-body text-sm text-clay">{message}</p>}

      {result && (
        <div className="bg-white/5 rounded-xl p-4">
          <p className="font-body text-sm font-semibold text-wick">
            Imported {result.imported} of {result.total} products.
          </p>
          {result.errors?.length > 0 && (
            <ul className="mt-2 space-y-1">
              {result.errors.map((err, i) => (
                <li key={i} className="font-body text-xs text-clay">{err}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {parsed.length > 0 && (
        <div className="space-y-3">
          <p className="font-body text-sm text-slate">
            {selectedCount} of {parsed.length} selected
          </p>
          <div className="space-y-2 max-h-[50vh] overflow-y-auto">
            {parsed.map((p) => (
              <label
                key={p.key}
                className="flex items-center gap-3 bg-white/5 rounded-xl p-3 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={p.selected}
                  onChange={() => toggleSelected(p.key)}
                  className="shrink-0"
                />
                {p.images?.[0] && (
                  <img src={p.images[0]} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-body text-sm font-semibold truncate">
                    {p.title || <span className="text-clay">Missing title</span>}
                  </p>
                  <p className="font-mono text-xs text-slate">
                    {p.priceCents != null ? (
                      `$${(p.priceCents / 100).toFixed(2)}`
                    ) : (
                      <span className="text-clay">Missing price</span>
                    )}
                    {p.variants?.length > 0 &&
                      ` · ${p.variants.length} variant${p.variants.length > 1 ? "s" : ""}`}
                  </p>
                </div>
              </label>
            ))}
          </div>
          <button
            onClick={runImport}
            disabled={importing || selectedCount === 0}
            className="w-full bg-wick text-ink font-semibold py-3 rounded-full disabled:opacity-60"
          >
            {importing
              ? "Importing..."
              : `Import ${selectedCount} product${selectedCount === 1 ? "" : "s"}`}
          </button>
        </div>
      )}
    </div>
  );
}
