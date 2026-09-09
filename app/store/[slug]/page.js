import { supabaseServer } from "@/lib/supabaseServer";
import StoreView from "@/components/StoreView";

export const revalidate = 0;

export default async function StorePage({ params }) {
  const supabase = supabaseServer();

  const { data: store } = await supabase
    .from("sellers_stores")
    .select("id, store_name, description, logo_url, sells_category")
    .eq("store_slug", params.slug)
    .eq("approved", true)
    .maybeSingle();

  if (!store) {
    return (
      <main className="min-h-dvh flex items-center justify-center bg-ink text-parchment px-6 text-center">
        <div>
          <p className="font-display text-xl font-semibold mb-2">Store not found</p>
          <a href="/feed" className="text-wick underline font-body text-sm">
            Back to feed
          </a>
        </div>
      </main>
    );
  }

  const { data: products } = await supabase
    .from("products")
    .select("id, title, price_cents, image_urls, description, tagline, category, tags, inventory_count")
    .eq("store_id", store.id)
    .eq("is_active", true)
    .eq("flagged", false)
    .order("created_at", { ascending: false });

  return <StoreView store={store} products={products || []} />;
}
