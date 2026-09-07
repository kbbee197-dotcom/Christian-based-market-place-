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

  const { storeId, title, priceCents, imageUrls, description, tagline, category, tags, inventoryCount } = await req.json();
  if (!storeId || !title || !priceCents) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }
  if (!(await ownsStore(userId, storeId))) {
    return NextResponse.json({ error: "You don't own this store." }, { status: 403 });
  }

  const { data, error } = await supabaseAdmin
    .from("products")
    .insert({
      store_id: storeId,
      title,
      price_cents: priceCents,
      image_urls: imageUrls || [],
      description: description || null,
      tagline: tagline || null,
      category: category || null,
      tags: tags || [],
      inventory_count: inventoryCount,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ product: data });
}

export async function PATCH(req) {
  const userId = await verifyUser(req);
  if (!userId) {
    return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  }

  const { productId, storeId, title, priceCents, imageUrls, description, tagline, category, tags, inventoryCount, isActive } = await req.json();
  if (!productId || !storeId) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }
  if (!(await ownsStore(userId, storeId))) {
    return NextResponse.json({ error: "You don't own this store." }, { status: 403 });
  }

  const { data, error } = await supabaseAdmin
    .from("products")
    .update({
      title,
      price_cents: priceCents,
      image_urls: imageUrls || [],
      description: description || null,
      tagline: tagline || null,
      category: category || null,
      tags: tags || [],
      inventory_count: inventoryCount,
      is_active: isActive === undefined ? true : isActive,
    })
    .eq("id", productId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ product: data });
}

export async function DELETE(req) {
  const userId = await verifyUser(req);
  if (!userId) {
    return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  }

  const { productId, storeId } = await req.json();
  if (!productId || !storeId) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }
  if (!(await ownsStore(userId, storeId))) {
    return NextResponse.json({ error: "You don't own this store." }, { status: 403 });
  }

  const { error } = await supabaseAdmin.from("products").delete().eq("id", productId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
