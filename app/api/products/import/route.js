import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAuthed } from "@/lib/supabaseAuthed";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyUser(req) {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "");
  if (!token) return null;
  const { data } = await supabaseAuthed(token).auth.getUser();
  return data?.user?.id || null;
}

async function ownsStore(userId, storeId) {
  const { data } = await supabaseAdmin
    .from("sellers_stores")
    .select("id")
    .eq("id", storeId)
    .eq("owner_id", userId)
    .maybeSingle();
  return !!data;
}

export async function POST(req) {
  const userId = await verifyUser(req);
  if (!userId) {
    return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  }

  const { storeId, products } = await req.json();
  if (!storeId || !Array.isArray(products) || products.length === 0) {
    return NextResponse.json({ error: "Nothing to import." }, { status: 400 });
  }
  if (!(await ownsStore(userId, storeId))) {
    return NextResponse.json({ error: "You don't own this store." }, { status: 403 });
  }

  let imported = 0;
  const errors = [];

  for (const p of products) {
    if (!p.title || !p.priceCents) {
      errors.push(`Skipped "${p.title || "untitled"}": missing title or price.`);
      continue;
    }

    const { data: product, error } = await supabaseAdmin
      .from("products")
      .insert({
        store_id: storeId,
        title: p.title,
        price_cents: p.priceCents,
        image_urls: p.imageUrls || [],
        description: p.description || null,
        tagline: p.tagline || null,
        category: p.category || null,
        tags: p.tags || [],
        inventory_count: p.variants?.length ? null : p.inventoryCount ?? null,
      })
      .select()
      .single();

    if (error) {
      errors.push(`Failed "${p.title}": ${error.message}`);
      continue;
    }

    if (p.variants?.length) {
      const variantRows = p.variants.map((v) => ({
        product_id: product.id,
        option_name: v.optionName,
        option_value: v.optionValue,
        inventory_count: v.inventoryCount ?? null,
      }));
      const { error: variantError } = await supabaseAdmin
        .from("product_variants")
        .insert(variantRows);
      if (variantError) {
        errors.push(`"${p.title}" imported but variants failed: ${variantError.message}`);
      }
    }

    imported++;
  }

  return NextResponse.json({ imported, total: products.length, errors });
}
