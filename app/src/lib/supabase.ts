import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * One client for the whole app. Returns null when the two env vars are not
 * set, so the UI can show setup instructions instead of a blank page.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!url || !anonKey) return null;
  if (!client) client = createClient(url, anonKey);
  return client;
}
