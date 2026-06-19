import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * Lazy admin client — server-side only.
 * Created on first call so missing env vars don't crash at module load.
 */
let _admin: ReturnType<typeof createClient<Database>> | null = null;

export function getSupabaseAdmin() {
  if (_admin) return _admin;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }
  _admin = createClient<Database>(url, key, { auth: { persistSession: false } });
  return _admin;
}
