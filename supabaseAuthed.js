import { createClient } from "@supabase/supabase-js";

// Used inside API routes: takes the buyer's own access token (sent from the
// browser) so RLS applies as that user, instead of using the powerful
// service-role key for actions a regular user should be doing themselves.
export function supabaseAuthed(accessToken) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
  );
}
