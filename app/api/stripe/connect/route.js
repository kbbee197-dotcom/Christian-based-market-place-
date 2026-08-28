import Stripe from "stripe";
import { NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Called when a seller clicks "Set up store" / "Connect payouts."
// Uses Standard Connected Accounts: Stripe owns KYC, tax forms (1099s),
// fraud/dispute liability, and payouts directly to the seller.
// The platform (you) pays no per-user or payout fees to Stripe for this.
export async function POST(req) {
  const { sellerId, email, returnUrl, refreshUrl } = await req.json();

  const account = await stripe.accounts.create({
    type: "standard",
    email,
  });

  const accountLink = await stripe.accountLinks.create({
    account: account.id,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: "account_onboarding",
  });

  // TODO: save account.id to sellers_stores.stripe_account_id for this sellerId
  // (use the Supabase service-role client here, not the anon client).

  return NextResponse.json({ url: accountLink.url, accountId: account.id });
}
