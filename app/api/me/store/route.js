import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAuthed } from "@/lib/supabaseAuthed";

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

  const { data: userData } = await supabaseAuthed(token).auth.getUser();
  const userId = userData?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Your session has expired." }, { status: 401 });
  }

  const { data: store } = await supabaseAdmin
    .from("sellers_stores")
    .select("*")
    .eq("owner_id", userId)
    .maybeSingle();

  return NextResponse.json({ store: store || null });
}
