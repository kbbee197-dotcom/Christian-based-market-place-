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

async function notify({ recipientId, actorId, type, postId = null, orderId = null }) {
  console.log("notify() called with:", { recipientId, actorId, type, postId, orderId });
  if (!recipientId || recipientId === actorId) {
    console.log("notify() skipped: missing recipientId or recipientId === actorId");
    return;
  }
  const { error } = await supabaseAdmin.from("notifications").insert({
    recipient_id: recipientId,
    actor_id: actorId,
    type,
    post_id: postId,
    order_id: orderId,
  });
  if (error) {
    console.log("notify() insert ERROR:", error.message);
  } else {
    console.log("notify() insert SUCCESS");
  }
}

export async function POST(req) {
  const userId = await verifyUser(req);
  if (!userId) {
    return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  }

  const { type, postId, creatorId, productId, body, on } = await req.json();

  if (type === "like") {
    if (on) {
      await supabaseAdmin.from("likes").upsert({ user_id: userId, post_id: postId });

      const { data: post, error: postLookupError } = await supabaseAdmin
        .from("videos_posts")
        .select("creator_id")
        .eq("id", postId)
        .single();

      console.log("like: post lookup result:", post, "error:", postLookupError?.message);

      if (post) {
        await notify({
          recipientId: post.creator_id,
          actorId: userId,
          type: "like",
          postId,
        });
      }
    } else {
      await supabaseAdmin.from("likes").delete().eq("user_id", userId).eq("post_id", postId);
    }
    return NextResponse.json({ success: true });
  }

  if (type === "follow") {
    if (on) {
      await supabaseAdmin.from("follows").upsert({ follower_id: userId, creator_id: creatorId });

      await notify({
        recipientId: creatorId,
        actorId: userId,
        type: "follow",
      });
    } else {
      await supabaseAdmin.from("follows").delete().eq("follower_id", userId).eq("creator_id", creatorId);
    }
    return NextResponse.json({ success: true });
  }

  if (type === "cart") {
    const { data, error } = await supabaseAdmin
      .from("cart_items")
      .upsert(
        { user_id: userId, product_id: productId, quantity: 1 },
        { onConflict: "user_id,product_id" }
      )
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ item: data });
  }

  if (type === "comment") {
    const { data, error } = await supabaseAdmin
      .from("comments")
      .insert({ post_id: postId, author_id: userId, body })
      .select("id, body, created_at, author:profiles(username, display_name)")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    const { data: post } = await supabaseAdmin
      .from("videos_posts")
      .select("creator_id")
      .eq("id", postId)
      .single();

    if (post) {
      await notify({
        recipientId: post.creator_id,
        actorId: userId,
        type: "comment",
        postId,
      });
    }

    return NextResponse.json({ comment: data });
  }

  return NextResponse.json({ error: "Unknown action type." }, { status: 400 });
}
