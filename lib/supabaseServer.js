import { createClient } from "@supabase/supabase-js";

// Used inside server components (like app/feed/page.js) to fetch
// publicly-readable data at request time. Read-only feed data is covered
// by the "Public ... viewable" policies in supabase/schema.sql, so the
// anon key is safe to use here — no service role key needed for this.
export function supabaseServer() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
