# Christian Marketplace — starter project

A TikTok-style video feed with shoppable product tags, a vendor dashboard,
real checkout, and admin moderation — built for a faith-focused
multi-vendor marketplace. This is a **real Next.js app**, not a flat
static site — the GitHub → Vercel workflow you already know still works,
no computer needed.

## What's built
- **Feed** (`/feed`) — live posts from Supabase: like, follow, comment,
  and add-to-cart, all real.
- **Login / signup** (`/login`, `/signup`).
- **Cart** (`/cart`) and **checkout** — pays the seller directly via
  Stripe Connect.
- **Order history** (`/orders`) for buyers.
- **Vendor dashboard** (`/dashboard`) —
  - `/dashboard/store` — create your store, connect Stripe payouts
  - `/dashboard/products` — add, edit, and remove products
  - `/dashboard/upload` — upload a video, tag a product, publish to the feed
- **Admin** (`/admin`, admin accounts only) — approve stores, flag or
  remove products and posts.
- Full database schema with security rules (`supabase/schema.sql`).

## What's NOT built yet
- Push notifications, email receipts.
- Multi-seller checkout in one pass (right now, a cart with items from two
  different sellers checks out one seller at a time — the cart page
  explains this to the buyer).
- Search/discovery beyond the main feed.

Tell me which of these to build next, if any.

## Setup steps (from your phone, no computer needed)

**1. Upload this to GitHub**
Upload this whole folder into your repo, overwriting anything with the
same name.

**2. Create a free Supabase project** (supabase.com)
- New project → wait for it to finish.
- SQL Editor → New query → paste in everything from `supabase/schema.sql` → Run.
  - *Already ran schema.sql before on this project?* Instead, just run
    `supabase/migration_002_admin_policies.sql` — it only adds the new
    admin permissions.
- Settings → API → copy the "Project URL" and "anon public" **and**
  "service_role" keys.
- Settings → Authentication → Email sign-in is on by default, nothing to change.

**3. Create a free Cloudinary account** (cloudinary.com)
- Copy your **Cloud Name**.
- Settings → Upload → Upload presets → Add upload preset → Signing Mode:
  **Unsigned** → name it (e.g. `marketplace_videos`).

**4. Create a Stripe account** (stripe.com)
- Settings → Connect → get started.
- Copy your API keys from Developers → API keys.
- **New this round:** Developers → Webhooks → Add endpoint →
  `https://YOUR-VERCEL-URL.vercel.app/api/stripe/webhook` → select event
  `checkout.session.completed` → copy the **Signing secret** (starts with
  `whsec_`). You'll only be able to do this after your first Vercel
  deploy, once you know your live URL — that's fine, come back to it.
- Read `docs/STRIPE_CONNECT.md` for how sellers get paid.

**5. Deploy on Vercel**
- vercel.com → New Project → import the GitHub repo.
- Add Environment Variables using `.env.example` as the checklist:
  - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
  - `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`
  - `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
  - `NEXT_PUBLIC_SITE_URL` — set this to your real Vercel URL, e.g.
    `https://your-project.vercel.app`
- Deploy. After it's live, go back to step 4 and add the webhook using
  your real URL, then add `STRIPE_WEBHOOK_SECRET` to Vercel and redeploy
  (Vercel → Deployments → ... → Redeploy).

**6. Make your account an admin**
In Supabase SQL Editor, run (with your own username):
```sql
update profiles set role = 'admin' where username = 'your_username';
```
Then visit `/admin` while logged in.

**7. Test the whole flow**
- Sign up → Dashboard → Store tab → create a store → Connect Stripe
  (use Stripe's test mode while you're testing).
- Products tab → add a product.
- Upload tab → upload a short video, tag the product, publish.
- Visit `/feed` → like, comment, add the product to cart.
- `/cart` → Checkout → complete Stripe's test payment.
- `/orders` → the order should show as "paid."
- `/admin` → approve the store, and try flagging a product or post.

## Updating this project later
Same as always: upload the new files into the same GitHub repo,
overwriting anything with a matching name. Vercel redeploys automatically.
If a change touches the database (a new migration file appears in
`supabase/`), you'll need to run that one file in the Supabase SQL Editor
too — I'll always tell you when that's the case.

## Coming back to this project
Tell me "continue the marketplace build" and what's next, and I'll pick up
from there. See `docs/ROADMAP.md` for the full phase plan.
