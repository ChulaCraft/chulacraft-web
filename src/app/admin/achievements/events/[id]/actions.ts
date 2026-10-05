"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { instant } from "@/lib/bangkok-time";
import { dbErrorCode } from "@/lib/db-error";
import { UUID } from "@/lib/registration";
import { UPCOMING_EVENTS_TAG } from "@/components/event-card";
import { createClient } from "@/lib/supabase/server";
import { BUCKET, imageError, imageKey, toStatus } from "../../images";

/** null means the New page is creating one; a posted value that is not a UUID
 *  is a malformed form and never reaches the database. */
function postedId(formData: FormData, field: string) {
  const raw = formData.get(field);
  if (raw === null) return null;
  const value = String(raw);
  if (!UUID.test(value)) redirect("/admin/achievements");
  return value;
}

/** `never` so TypeScript knows the guards below are unreachable after it. */
function finish(eventId: string | null, error: { message: string } | null, done: string): never {
  if (!eventId) redirect("/admin/achievements");
  const code = dbErrorCode(error) ?? (error ? "FAILED" : null);
  revalidatePath("/admin/achievements");
  revalidatePath(`/admin/achievements/events/${eventId}`);
  updateTag(UPCOMING_EVENTS_TAG);
  redirect(`/admin/achievements/events/${eventId}${code ? `?error=${code}` : `?done=${done}`}`);
}

export async function saveEvent(formData: FormData) {
  const eventId = postedId(formData, "eventId");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const status = toStatus(String(formData.get("status") ?? "draft"));
  const startsAt = instant(formData, "startsAt");
  const endsAt = instant(formData, "endsAt");
  const file = formData.get("cover");
  // An untouched file input still posts an empty File; that means "keep the current image".
  const upload = file instanceof File && file.size > 0 ? file : null;

  const invalid = imageError(upload);
  if (invalid) finish(eventId, { message: invalid }, "saved");
  if (!name || name.length > 80 || description.length > 500 || location.length > 120) finish(eventId, { message: "FAILED" }, "saved");
  // The column is not null and ends_at must not precede it (20261006000001:72-74).
  if (!startsAt || (endsAt && endsAt < startsAt)) finish(eventId, { message: "BAD_DATE" }, "saved");

  const supabase = await createClient();
  // The image this row has now comes from the database, never the form: a
  // posted path could name any object in the bucket for the removal below.
  const { data: rows } = eventId ? await supabase.rpc("admin_list_events") : { data: null };
  const previousImage = rows?.find((row) => row.id === eventId)?.image_path ?? "";
  let key = previousImage;
  if (upload) {
    key = imageKey("events", upload.type);
    const { error } = await supabase.storage.from(BUCKET).upload(key, upload, { contentType: upload.type });
    if (error) finish(eventId, { message: "UPLOAD_FAILED" }, "saved");
  }

  // The id this save asks for, which is the one admin_upsert_event echoes back;
  // comparing against it is what tells a failed save from a new row.
  const requestedId = eventId ?? crypto.randomUUID();
  const { data, error } = await supabase.rpc("admin_upsert_event", {
    p_id: requestedId,
    p_name: name,
    p_description: description,
    p_starts_at: startsAt,
    // The generated type does not mark the optional ends_at as nullable.
    p_ends_at: endsAt!,
    p_location: location,
    p_image_path: key,
    p_status: status
  });

  // D5, same as achievements: the database cannot touch Storage.
  if (upload && (error || data !== requestedId)) await supabase.storage.from(BUCKET).remove([key]);
  if (!error && previousImage && previousImage !== key) await supabase.storage.from(BUCKET).remove([previousImage]);
  if (error) finish(eventId, error, "saved");

  if (!eventId && data) {
    revalidatePath("/admin/achievements");
    updateTag(UPCOMING_EVENTS_TAG);
    redirect(`/admin/achievements/events/${data}?done=created`);
  }
  finish(eventId, null, "saved");
}

export async function deleteEvent(formData: FormData) {
  const eventId = postedId(formData, "eventId");
  if (!eventId) redirect("/admin/achievements");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_delete_event", { p_id: eventId });
  const code = dbErrorCode(error) ?? (error ? "FAILED" : null);
  if (!error) {
    const path = data?.[0]?.image_path;
    if (path) await supabase.storage.from(BUCKET).remove([path]);
  }
  revalidatePath("/admin/achievements");
  updateTag(UPCOMING_EVENTS_TAG);
  redirect(`/admin/achievements${code ? `?error=${code}` : "?done=event-deleted"}`);
}