// Server-only: holds the secret key. Never import from client code.
import { createClient } from "@supabase/supabase-js";
import { getSecretSupabaseEnvironment } from "@/lib/env";
import { createBoundedFetch } from "@/lib/bounded-fetch";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

/** Service-role client with no cookies or session. */
export function serviceClient(): SupabaseClient<Database> {
  const { url, key } = getSecretSupabaseEnvironment();
  return createClient<Database>(url, key, {
    global: { fetch: createBoundedFetch() },
    auth: { persistSession: false, autoRefreshToken: false }
  });
}
