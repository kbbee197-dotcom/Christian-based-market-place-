import { createClient } from "@supabase/supabase-js";

// This client is intentionally framework-agnostic: importing only from
// @supabase/supabase-js means this exact file (or a near-copy) can be reused
// inside the future React Native / Expo app without changes.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
