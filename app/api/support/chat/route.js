import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAuthed } from "@/lib/supabaseAuthed";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SYSTEM_PROMPT_BASE = `You are a friendly, concise support assistant for a Christian-based marketplace app. Shoppers browse a TikTok-style video feed, follow creators, and buy handmade goods from vendors. Vendors apply to sell, get admin-approved, and manage their own store, products, and videos.

Keep answers short (2-4 sentences unless more detail is truly needed), warm, and practical. If you don't know something specific to this person's account, say so plainly rather than guessing, and suggest they check the relevant screen or contact the seller/admin. Never make up order details, prices, or policies you weren't given.`;

const FAQ_CONTEXT = `Known platform facts:
- Becoming a vendor: apply from Settings > "Apply to sell." An admin reviews the application before approval.
- Messaging sellers: there's no direct messaging yet — buyers can comment on a seller's post or follow them.
- Payouts: vendors connect a Stripe account from their dashboard; buyer payments route directly to that account once connected.
- Managing videos: vendors delete or change visibility (Public/Followers/Private) from "Your videos" in the dashboard.
- Order problems: buyers view orders from the Orders link in the feed header; for issues, they should contact the seller via a comment on the seller's post.
- Product variants: vendors can add options like size or color when editing a saved product.
- Bulk product import: vendors can upload a CSV (Shopify export or a generic template) from Dashboard > Import.`;

export async function POST(req) {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "");
  let userId = null;

  if (token) {
    const { data } = await supabaseAuthed(token).auth.getUser();
    userId = data?.user?.id || null;
  }

  let userContext = "This person is not logged in.";

  if (userId) {
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("account_type, username, display_name")
      .eq("id", userId)
      .single();

    const contextParts = [
      `Logged in as ${profile?.display_name || profile?.username || "a user"}.`,
      `Account type: ${profile?.account_type || "shopper"}.`,
    ];

    const { data: orders } = await supabaseAdmin
      .from("orders")
      .select("id, status, total_cents, created_at")
      .eq("buyer_id", userId)
      .order("created_at", { ascending: false })
      .limit(5);

    if (orders?.length) {
      const lines = orders.map(
        (o) =>
          `Order ${o.id.slice(0, 8)}: status "${o.status}", $${(o.total_cents / 100).toFixed(2)}, placed ${new Date(o.created_at).toLocaleDateString()}`
      );
      contextParts.push("Their recent orders:\n" + lines.join("\n"));
    } else {
      contextParts.push("They have no orders yet.");
    }

    if (profile?.account_type === "vendor") {
      const { data: store } = await supabaseAdmin
        .from("sellers_stores")
        .select("store_name, approved, stripe_onboarded")
        .eq("owner_id", userId)
        .maybeSingle();
      if (store) {
        contextParts.push(
          `Their store "${store.store_name}" is ${store.approved ? "approved and live" : "pending admin approval"}. Stripe payouts are ${store.stripe_onboarded ? "connected" : "not yet connected"}.`
        );
      }
    }

    userContext = contextParts.join("\n");
  }

  const { messages } = await req.json();
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "No message provided." }, { status: 400 });
  }

  const systemInstruction = `${SYSTEM_PROMPT_BASE}\n\n${FAQ_CONTEXT}\n\nContext about the person you're talking to:\n${userContext}`;

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
          generationConfig: { maxOutputTokens: 500 },
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
