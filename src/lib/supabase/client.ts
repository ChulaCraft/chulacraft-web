"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getPublicSupabaseEnvironment } from "@/lib/env";
import type { Database } from "@/lib/supabase/database.types";

export function createClient() {
  const { url, key } = getPublicSupabaseEnvironment();
  return createBrowserClient<Database>(url, key);
}
