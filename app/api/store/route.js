import { NextResponse } from "next/server";
import { supabaseAuthed } from "@/lib/supabaseAuthed";

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function POST(req) {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  }

  const supabase = supabaseAuthed(token);
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const userId = userData?.user?.id;

  if (userError || !userId) {
    return NextResponse.json({ error: "Your session has expired — please log in again." }, { status: 401 });
  }

  const { storeName, description } = await req.json();
  if (!storeName) {
    return NextResponse.json({ error: "Store name is required." }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("sellers_stores")
    .select("id")
    .eq("owner_id", userId)
    .maybeSingle();

  const payload = {
    owner_id: userId,
    store_name: storeName,
    store_slug: slugify(storeName),
    description: description || null,
  };

  const { data, error } = existing
    ? await supabase.from("sellers_stores").update(payload).eq("id", existing.id).select().single()
    : await supabase.from("sellers_stores").insert(payload).select().single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ store: data });
}
