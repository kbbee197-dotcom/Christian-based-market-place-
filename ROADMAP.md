# Build roadmap

**Phase 1 — Database & auth — DONE**
**Phase 2 — Web front end & vertical feed — DONE**
**Phase 3 — Vendor dashboard, checkout, admin — DONE**
- Store setup + Stripe Connect (`/dashboard/store`)
- Product add/edit/delete (`/dashboard/products`)
- Video upload + tagging (`/dashboard/upload`)
- Cart + checkout that pays the seller directly (`/cart`, `/api/checkout`)
- Stripe webhook confirming payment (`/api/stripe/webhook`)
- Order history (`/orders`)
- Comment drawer — read and write (in the feed)
- Admin moderation: approve stores, flag/remove products and posts (`/admin`)

**Still open:**
- Multi-seller checkout in a single pass (currently one seller per
  checkout — clearly explained to the buyer on the cart page).
- Email receipts / notifications.
- Search or category browsing beyond the main feed.

**Phase 4 — React Native / Expo apps**
- Reuse `lib/supabaseClient.js` and all business logic as-is.
- Swap Tailwind + framer-motion for NativeWind + Reanimated — the data
  layer and API routes don't change.
- Submit to the App Store and Google Play.
