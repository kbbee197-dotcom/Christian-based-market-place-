import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAuthed } from "@/lib/supabaseAuthed";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyAdmin(req) {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "");
  if (!token) return null;

  const { data } = await supabaseAuthed(token).auth.getUser();
  const userId = data?.user?.id;
  if (!userId) return null;

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  return profile?.role === "admin" ? userId : null;
}

const SYSTEM_PROMPT_BASE = `You are a moderation assistant for the admin of a Christian-based marketplace app. You help the admin review vendor applications, flagged posts, flagged comments, and flagged products by giving your honest read on each — what looks fine, what looks concerning, and why.

You never take action yourself. You only give recommendations. The admin makes every final call on approving, denying, banning, or removing anything. Be direct and specific — reference the actual items you were given, don't speak in vague generalities. If something looks borderline, say so and explain the tradeoff rather than picking a side for the admin.`;

async function buildModerationContext() {
  const parts = [];

  const { data: pendingStores } = await supabaseAdmin
    .from("sellers_stores")
    .select(
      "store_name, description, sells_category, fulfillment_method, contact_email, contact_phone, portfolio_url, faith_statement, created_at"
    )
    .eq("approved", false)
    .order("created_at", { ascending: false })
    .limit(10);

  if (pendingStores?.length) {
    const lines = pendingStores.map(
      (s, i) =>
        `${i + 1}. "${s.store_name}" — sells: ${s.sells_category || "not specified"}, fulfillment: ${s.fulfillment_method || "not specified"}. Description: "${s.description || "none given"}". Contact: ${s.contact_email || "none"} / ${s.contact_phone || "none"}. Link: ${s.portfolio_url || "none provided"}. Faith statement: "${s.faith_statement || "none given"}".`
    );
    parts.push("PENDING VENDOR APPLICATIONS:\n" + lines.join("\n"));
  } else {
    parts.push("PENDING VENDOR APPLICATIONS: none right now.");
  }

  const { data: flaggedComments } = await supabaseAdmin
    .from("comments")
    .select("id, body, author_id, created_at")
    .eq("flagged", true)
    .order("created_at", { ascending: false })
    .limit(10);

  if (flaggedComments?.length) {
    const lines = flaggedComments.map((c, i) => `${i + 1}. "${c.body}" (id: ${c.id})`);
    parts.push("FLAGGED COMMENTS:\n" + lines.join("\n"));
  } else {
    parts.push("FLAGGED COMMENTS: none right now.");
  }

  const { data: flaggedProducts } = await supabaseAdmin
    .from("products")
    .select("id, title, description, tagline")
    .eq("flagged", true)
    .limit(10);

  if (flaggedProducts?.length) {
    const lines = flaggedProducts.map(
      (p, i) => `${i + 1}. "${p.title}" — ${p.tagline || p.description || "no description"} (id: ${p.id})`
    );
    parts.push("FLAGGED PRODUCTS:\n" + lines.join("\n"));
  } else {
    parts.push("FLAGGED PRODUCTS: none right now.");
  }

  const { data: flaggedPosts } = await supabaseAdmin
    .from("videos_posts")
    .select("id, caption, creator_id")
    .eq("flagged", true)
    .limit(10);

  if (flaggedPosts?.length) {
    const lines = flaggedPosts.map((p, i) => `${i + 1}. Caption: "${p.caption || "none"}" (id: ${p.id})`);
    parts.push("FLAGGED VIDEO POSTS:\n" + lines.join("\n"));
  } else {
    parts.push("FLAGGED VIDEO POSTS: none right now.");
  }

  return parts.join("\n\n");
}

export async function POST(req) {
  const adminId = await verifyAdmin(req);
  if (!adminId) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const { messages } = await req.json();
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "No message provided." }, { status: 400 });
  }

  const moderationContext = await buildModerationContext();
  const systemInstruction = `${SYSTEM_PROMPT_BASE}\n\nCURRENT MODERATION QUEUE:\n${moderationContext}`;

  const geminiContents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  try {
    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GOOGLE_GENERATIVE_AI_API_KEY,
        },
        body: JSON.stringify({
          contents: geminiContents,
          systemInstruction: { parts: [{ text: systemInstruction }] },
          generationConfig: { maxOutputTokens: 700 },
        }),
      }
    );

    const json = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { error: json.error?.message || "The AI assistant couldn't respond." },
        { status: 502 }
      );
    }

    const reply =
      json.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ||
      "Sorry, I couldn't come up with a response. Try rephrasing your question.";

    return NextResponse.json({ reply });
  } catch (err) {
    return NextResponse.json(
      { error: "Couldn't reach the AI assistant: " + err.message },
      { status: 500 }
    );
  }
}
