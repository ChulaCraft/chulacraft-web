"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { dbErrorCode } from "@/lib/db-error";
import { UUID } from "@/lib/registration";
import { UPCOMING_EVENTS_TAG } from "@/components/event-card";
import { createClient } from "@/lib/supabase/server";

/** D7: marking interest needs an account. /auth/callback refuses caller-chosen
 *  destinations on purpose, so sign-in lands on its usual page, not back here. */
function signInPath() {
  return "/register";
}

function eventId(formData: FormData) {
  const value = String(formData.get("eventId") ?? "");
  return UUID.test(value) ? value : null;
}

/** Toggle, not two buttons: one form that passes the state it wants, so the
 *  server decides what happens and the page stays a single code path. */
export async function toggleInterest(formData: FormData) {
  const id = eventId(formData);
  // A malformed id never reaches the database, and never lands on a page that
  // would then not find the event either.
  if (!id) redirect("/");
  const back = `/events/${id}`;

  const supabase = await createClient();
  let user: { id: string } | null = null;
  try {
    ({ data: { user } } = await supabase.auth.getUser());
  } catch {
    // Supabase is unreachable: treat it as signed out rather than pretending
    // the toggle worked.
    redirect(`${back}?error=FAILED`);
  }
  if (!user) redirect(signInPath());

  const { error } = await supabase.rpc("set_event_interest", {
    p_event_id: id,
    p_interested: formData.get("interested") === "true"
  });

  // The homepage list is cached (src/app/page.tsx) and this page reads fresh;
  // expiring the tag keeps the count from lagging behind the click.
  revalidatePath(back);
  updateTag(UPCOMING_EVENTS_TAG);

  if (error) redirect(`${back}?error=${dbErrorCode(error) ?? "FAILED"}`);
  redirect(`${back}?done=${formData.get("interested") === "true" ? "interested" : "cleared"}`);
}