# How payments work on this platform

This uses **Stripe Standard Connected Accounts** — the free model for
platforms like this one.

**What happens when a seller signs up:**
1. They tap "Set up store" in the vendor dashboard.
2. They're sent to Stripe to either link an existing Stripe account or open
   a free one.
3. Stripe collects everything itself: ID verification, bank details, tax
   info (1099s at year end), and fraud checks.

**What this means for you as the platform owner:**
- You pay **$0/month** to Stripe for this — no per-seller fee, no payout fee.
- Stripe — not you — carries the fraud and chargeback liability on these
  charges.
- Stripe pays sellers directly to their own bank account. Money for a sale
  never has to pass through an account you control.
- Stripe's own processing fee (roughly 2.9% + $0.30 per transaction, current
  rates always confirmed at stripe.com/pricing) comes out of each sale
  automatically.

**What you still need to do:**
- Apply for a Stripe account for the platform itself, and turn on Connect
  in the Stripe dashboard (Settings → Connect).
- Stripe may ask you, as the platform, for business verification too —
  budget a few days for that before launch.
- Decide if/when you want to add a platform fee (Stripe calls this an
  "application fee") on top of each sale. That's a small code change in
  the `/api/stripe/connect` route, not a Stripe setting — ask me when
  you're ready and I'll wire it in.
