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

async function ownsProduct(userId, productId) {
  const { data } = await supabaseAdmin
    .from("products")
    .select("id, sellers_stores!inner(owner_id)")
    .eq("id", productId)
    .eq("sellers_stores.owner_id", userId)
    .maybeSingle();
  return !!data;
}

export async function POST(req) {
  const userId = await verifyUser(req);
  if (!userId) {
    return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  }

  const { productId, optionName, optionValue, inventoryCount } = await req.json();
  if (!productId || !optionName || !optionValue) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }
  if (!(await ownsProduct(userId, productId))) {
    return NextResponse.json({ error: "You don't own this product." }, { status: 403 });
  }

  const { data, error } = await supabaseAdmin
    .from("product_variants")
    .insert({
      product_id: productId,
      option_name: optionName,
      option_value: optionValue,
      inventory_count: inventoryCount === "" || inventoryCount == null ? null : inventoryCount,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ variant: data });
}

export async function DELETE(req) {
  const userId = await verifyUser(req);
  if (!userId) {
    return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  }

  const { variantId, productId } = await req.json();
  if (!variantId || !productId) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }
  if (!(await ownsProduct(userId, productId))) {
    return NextResponse.json({ error: "You don't own this product." }, { status: 403 });
  }

  const { error } = await supabaseAdmin.from("product_variants").delete().eq("id", variantId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
