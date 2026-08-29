import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAuthed } from "@/lib/supabaseAuthed";

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Full-access client, used only after we've independently verified the
// caller's identity below. This avoids relying on the database's own
// row-level security check recognizing the caller's login token, which
// this project has had trouble with after a signing-key change.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  }

  // Verify identity using the caller's own token — this call independently
  // confirms who is making the request before we touch the database.
  const supabaseCheck = supabaseAuthed(token);
  const { data: userData, error: userError } = await supabaseCheck.auth.getUser();
  const userId = userData?.user?.id;

  if (userError || !userId) {
    return NextResponse.json({ error: "Your session has expired — please log in again." }, { status: 401 });
  }

  const { storeName, description } = await req.json();
  if (!storeName) {
    return NextResponse.json({ error: "Store name is required." }, { status: 400 });
  }

  const { data: existing } = await supabaseAdmin
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
    ? await supabaseAdmin.from("sellers_stores").update(payload).eq("id", existing.id).select().single()
    : await supabaseAdmin.from("sellers_stores").insert(payload).select().single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ store: data });
}
