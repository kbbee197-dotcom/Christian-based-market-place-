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
    return NextResponse.json({ error: "Your session has expired — please log in again." }, { status: 401 });
  }

  const { productId, videoUrl, thumbnailUrl, caption } = await req.json();
  if (!videoUrl) {
    return NextResponse.json({ error: "Missing video." }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("videos_posts")
    .insert({
      creator_id: userId,
      product_id: productId || null,
      video_url: videoUrl,
      thumbnail_url: thumbnailUrl || null,
      caption: caption || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ post: data });
}
