import Stripe from "stripe";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// This runs with no logged-in user, so it uses the service role key
// (full access, bypasses RLS) — the only place in this project that
// should. Never expose SUPABASE_SERVICE_ROLE_KEY to the browser.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature");

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return NextResponse.json({ error: `Webhook signature error: ${err.message}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const orderId = session.metadata?.order_id;

    if (orderId) {
      const { data: order } = await supabaseAdmin
        .from("orders")
        .update({ status: "paid", stripe_payment_intent_id: session.payment_intent })
        .eq("id", orderId)
        .select()
        .single();

      if (order) {
        const { data: items } = await supabaseAdmin
          .from("order_items")
          .select("product_id")
          .eq("order_id", orderId);

        const productIds = (items || []).map((i) => i.product_id);
        if (productIds.length > 0) {
          await supabaseAdmin
            .from("cart_items")
            .delete()
            .eq("user_id", order.buyer_id)
            .in("product_id", productIds);
        }

        const { data: store } = await supabaseAdmin
          .from("sellers_stores")
          .select("owner_id")
          .eq("id", order.store_id)
          .single();

        if (store?.owner_id) {
          const { data: ownerProfile } = await supabaseAdmin
            .from("profiles")
            .select("notify_orders")
            .eq("id", store.owner_id)
            .single();

          if (!ownerProfile || ownerProfile.notify_orders !== false) {
            await supabaseAdmin.from("notifications").insert({
              recipient_id: store.owner_id,
              actor_id: order.buyer_id,
              type: "order",
              order_id: order.id,
            });
          }
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
