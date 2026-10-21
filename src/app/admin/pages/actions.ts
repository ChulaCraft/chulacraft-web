"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { dbErrorCode } from "@/lib/db-error";
import { DEFAULT_PAGES, isPageSlug } from "@/lib/site-pages";
import { createClient } from "@/lib/supabase/server";

const normal = (text: string) => text.replace(/\r\n?/g, "\n").trim();

/** Text left equal to the built-in one (or emptied) clears the row, so the page
 *  follows the built-in text again. */
export async function savePage(formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  if (!isPageSlug(slug)) redirect("/admin/pages");
  const body = normal(String(formData.get("body") ?? ""));
  if (body.length > 20000) redirect(`/admin/pages/${slug}?error=TOO_LONG`);
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_save_site_page", { p_slug: slug, p_body: body === normal(DEFAULT_PAGES[slug]) ? "" : body });
  revalidatePath(`/${slug}`);
  redirect(`/admin/pages/${slug}?${error ? `error=${dbErrorCode(error) ?? "FAILED"}` : `done=${body ? "saved" : "reset"}`}`);
}
