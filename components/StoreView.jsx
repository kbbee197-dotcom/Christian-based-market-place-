"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, X, Plus } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function StoreView({ store, products }) {
  const router = useRouter();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [messaging, setMessaging] = useState(false);

  async function messageSeller() {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) {
      router.push("/login");
      return;
    }
    if (userId === store.owner_id) return;

    setMessaging(true);
    const { data: convo, error } = await supabase
      .from("conversations")
      .upsert(
        { shopper_id: userId, vendor_id: store.owner_id, store_id: store.id },
        { onConflict: "shopper_id,vendor_id" }
      )
      .select()
      .single();
    setMessaging(false);

    if (!error && convo) {
      router.push(`/messages/${convo.id}`);
    }
  }

  return (
    <main className="min-h-dvh bg-ink text-parchment px-5 pt-6 pb-10">
      <a href="/feed" aria-label="Back to feed" className="inline-block mb-4">
        <ChevronLeft className="w-6 h-6 text-parchment" />
      </a>

      <div className="flex items-center gap-3 mb-2">
        {store.logo_url && (
          <img src={store.logo_url} alt="" className="w-14 h-14 rounded-full object-cover" />
        )}
        <div>
          <h1 className="font-display text-xl font-semibold">{store.store_name}</h1>
          {store.sells_category && (
            <p className="font-body text-xs text-slate">{store.sells_category}</p>
          )}
        </div>
      </div>
      {store.description && (
        <p className="font-body text-sm text-slate mb-4">{store.description}</p>
      )}

      <button
        onClick={messageSeller}
        disabled={messaging}
        className="bg-white/10 text-parchment font-body text-sm font-semibold px-4 py-2 rounded-full mb-6 disabled:opacity-60"
      >
        {messaging ? "Opening..." : "Message this seller"}
      </button>

      <div className="grid grid-cols-2 gap-3">
        {products.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelectedProduct(p)}
            className="bg-white/5 rounded-xl overflow-hidden text-left"
          >
            {p.image_urls?.[0] ? (
              <img src={p.image_urls[0]} alt="" className="w-full aspect-square object-cover" />
            ) : (
              <div className="w-full aspect-square bg-white/10" />
            )}
            <div className="p-3">
              <p className="font-body text-sm font-semibold truncate">{p.title}</p>
              <p className="font-mono text-xs text-slate">
                ${(p.price_cents / 100).toFixed(2)}
                {p.inventory_count === 0 && <span className="text-clay"> · Sold out</span>}
              </p>
            </div>
          </button>
        ))}
      </div>

      {products.length === 0 && (
        <p className="font-body text-sm text-slate">This store hasn't listed any products yet.</p>
      )}

      <AnimatePresence>
        {selectedProduct && (
          <StoreProductDrawer product={selectedProduct} onClose={() => setSelectedProduct(null)} />
        )}
      </AnimatePresence>
    </main>
  );
}

function StoreProductDrawer({ product, onClose }) {
  const [activeImage, setActiveImage] = useState(0);
  const [variants, setVariants] = useState([]);
  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const [added, setAdded] = useState(false);
  const [needsLogin, setNeedsLogin] = useState(false);
  const images = product.images_urls?.length ? product.images_urls : product.image_urls;

  useEffect(() => {
    let active = true;
    supabase
      .from("product_variants")
      .select("*")
      .eq("product_id", product.id)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (active) setVariants(data || []);
      });
    return () => {
      active = false;
    };
  }, [product.id]);

  const selectedVariant = variants.find((v) => v.id === selectedVariantId) || null;
  const outOfStock = selectedVariant
    ? selectedVariant.inventory_count === 0
    : variants.length === 0 && product.inventory_count === 0;
  const needsSelection = variants.length > 0 && !selectedVariantId;

  async function addToCart() {
    const { data } = await supabase.auth.getUser();
    const userId = data?.user?.id;
    if (!userId) {
      setNeedsLogin(true);
      return;
    }

    await supabase.from("cart_items").upsert(
      { user_id: userId, product_id: product.id, variant_id: selectedVariantId || null, quantity: 1 },
      { onConflict: "user_id,product_id,variant_id" }
    );
    setAdded(true);
  }

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="fixed inset-x-0 bottom-0 z-30 bg-parchment text-ink rounded-t-3xl px-6 pt-5 pb-8 max-h-[85dvh] overflow-y-auto"
    >
      <div className="w-10 h-1 bg-ink/15 rounded-full mx-auto mb-5" />

      {images?.length > 0 && (
        <div className="mb-4">
          <img
            src={images[activeImage]}
            alt={product.title}
            className="w-full aspect-square object-cover rounded-2xl mb-2"
          />
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {images.map((url, i) => (
                <button key={url} onClick={() => setActiveImage(i)}>
                  <img
                    src={url}
                    alt=""
                    className={`w-14 h-14 rounded-lg object-cover ${
                      i === activeImage ? "ring-2 ring-ink" : "opacity-60"
                    }`}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex items-start justify-between mb-1">
        <h3 className="font-display text-xl font-semibold">{product.title}</h3>
        <button onClick={onClose} aria-label="Close" className="p-1 shrink-0">
          <X className="w-5 h-5" />
        </button>
      </div>

      {product.tagline && <p className="font-body text-sm text-ink/60 mb-3">{product.tagline}</p>}

      <p className="font-display text-2xl font-semibold mb-4">
        ${(product.price_cents / 100).toFixed(2)}
      </p>

      {product.category && (
        <span className="inline-block bg-ink/5 text-xs font-semibold px-3 py-1 rounded-full mb-3">
          {product.category}
        </span>
      )}

      {product.description && (
        <p className="font-body text-sm text-ink/80 mb-4 whitespace-pre-wrap">{product.description}</p>
      )}

      {product.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-6">
          {product.tags.map((tag) => (
            <span key={tag} className="font-mono text-xs text-ink/50">#{tag}</span>
          ))}
        </div>
      )}

      {variants.length > 0 && (
        <div className="mb-5">
          <p className="font-body text-xs font-semibold text-ink/60 mb-2">{variants[0].option_name}</p>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => (
              <button
                key={v.id}
                onClick={() => setSelectedVariantId(v.id)}
                disabled={v.inventory_count === 0}
                className={`font-body text-sm px-4 py-2 rounded-full border disabled:opacity-40 disabled:line-through ${
                  selectedVariantId === v.id
                    ? "bg-ink text-parchment border-ink"
                    : "bg-transparent text-ink border-ink/20"
                }`}
              >
                {v.option_value}
              </button>
            ))}
          </div>
        </div>
      )}

      {needsLogin && (
        <p className="font-body text-sm text-clay mb-3">
          <a href="/login" className="underline">Log in</a> to add items to your cart.
        </p>
      )}

      <button
        onClick={addToCart}
        disabled={outOfStock || needsSelection}
        className="w-full flex items-center justify-center gap-2 bg-ink text-parchment font-semibold py-3.5 rounded-full disabled:opacity-40"
      >
        {outOfStock
          ? "Sold out"
          : needsSelection
          ? `Select ${variants[0]?.option_name?.toLowerCase() || "an option"}`
          : added
          ? "Added to cart ✓"
          : (<><Plus className="w-4 h-4" /> Add to cart</>)}
      </button>
    </motion.div>
  );
}
