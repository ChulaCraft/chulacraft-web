"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Server-side so the header doesn't ship the Supabase browser SDK to every page.
export async function signOut() {
  await (await createClient()).auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
