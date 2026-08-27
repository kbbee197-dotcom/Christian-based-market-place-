import Stripe from "stripe";
import { NextResponse } from "next/server";
import { supabaseAuthed } from "@/lib/supabaseAuthed";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Checkout processes ONE seller's items at a time, because a Stripe
// Connect destination charge routes money to a single connected account.
// If the buyer's cart has items from more than one seller, this checks
// out the first seller's items; the buyer runs checkout again afterward
// for the rest (the cart page tells them this).
export async function POST(req) {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  }

  const supabase = supabaseAuthed(token);
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  }

  const { data: cartItems, error: cartError } = await supabase
    .from("cart_items")
    .select("id, quantity, product:products(id, title, price_cents, store_id)")
    .eq("user_id", userId);

  if (cartError) {
    return NextResponse.json({ error: cartError.message }, { status: 400 });
  }
  if (!cartItems || cartItems.length === 0) {
    return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
  }

  const firstStoreId = cartItems[0].product.store_id;
  const groupItems = cartItems.filter((item) => item.product.store_id === firstStoreId);

  const { data: store } = await supabase
    .from("sellers_stores")
    .select("id, store_name, stripe_account_id, stripe_onboarded")
    .eq("id", firstStoreId)
    .single();

  if (!store?.stripe_onboarded || !store?.stripe_account_id) {
    return NextResponse.json(
      { error: `${store?.store_name || "This seller"} hasn't connected payouts yet.` },
      { status: 400 }
    );
  }

  const totalCents = groupItems.reduce(
    (sum, item) => sum + item.product.price_cents * item.quantity,
    0
  );

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({ buyer_id: userId, store_id: store.id, total_cents: totalCents, status: "pending" })
    .select()
    .single();

  if (orderError) {
    return NextResponse.json({ error: orderError.message }, { status: 400 });
  }

  await supabase.from("order_items").insert(
    groupItems.map((item) => ({
      order_id: order.id,
      product_id: item.product.id,
      quantity: item.quantity,
      unit_price_cents: item.product.price_cents,
    }))
  );

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: groupItems.map((item) => ({
      quantity: item.quantity,
      price_data: {
        currency: "usd",
        unit_amount: item.product.price_cents,
        product_data: { name: item.product.title },
      },
    })),
    payment_intent_data: {
      transfer_data: { destination: store.stripe_account_id },
    },
    metadata: { order_id: order.id },
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/orders?success=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/cart`,
  });

  return NextResponse.json({ url: session.url });
}
