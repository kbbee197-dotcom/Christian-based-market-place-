import Stripe from "stripe";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAuthed } from "@/lib/supabaseAuthed";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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
    .select("id, stripe_account_id, stripe_onboarded")
    .eq("owner_id", userId)
    .maybeSingle();

  if (!store?.stripe_account_id) {
    return NextResponse.json({ onboarded: false });
  }
  if (store.stripe_onboarded) {
    return NextResponse.json({ onboarded: true });
  }

  const account = await stripe.accounts.retrieve(store.stripe_account_id);
  const onboarded = !!(account.details_submitted && account.charges_enabled);

  if (onboarded) {
    await supabaseAdmin
      .from("sellers_stores")
      .update({ stripe_onboarded: true })
      .eq("id", store.id);
  }

  return NextResponse.json({ onboarded });
}
