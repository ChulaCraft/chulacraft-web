"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { dbErrorCode } from "@/lib/db-error";
import { UUID } from "@/lib/registration";
import { createClient } from "@/lib/supabase/server";
import { isTeamKind } from "@/lib/team";
import { BUCKET, uploadPicture } from "@/app/admin/commu/achievements/images";

const BASE = "/admin/commu/team";

/** Back to `page` with the error code or the done message. */
function finish(page: string, error: { message: string } | null, done: string): never {
  revalidatePath(BASE, "layout");
  revalidatePath("/team");
  const join = page.includes("?") ? "&" : "?";
  redirect(`${page}${join}${error ? `error=${dbErrorCode(error) ?? "FAILED"}` : `done=${done}`}`);
}

/** A posted id that isn't a UUID is a malformed form and never reaches the database. */
function postedId(formData: FormData, field: string) {
  const raw = formData.get(field);
  if (raw === null || raw === "") return null;
  const id = String(raw);
  if (!UUID.test(id)) redirect(BASE);
  return id;
}

const fail = (code: string) => ({ message: code });

// ------------------------------------------------------------- generations

export async function saveTeamGeneration(formData: FormData) {
  const id = postedId(formData, "generationId");
  const name = String(formData.get("name") ?? "").trim();
  const page = id ? `${BASE}/${id}` : BASE;
  if (!name || name.length > 40) finish(page, fail("INVALID_GEN"), "saved");
  const supabase = await createClient();
  // The generated type does not mark p_id as nullable; null creates one.
  const { data, error } = await supabase.rpc("admin_save_team_generation", { p_id: id as string, p_name: name });
  finish(!id && data ? `${BASE}/${data}` : page, error, id ? "gen-saved" : "gen-created");
}

export async function moveTeamGeneration(formData: FormData) {
  const id = postedId(formData, "generationId");
  if (!id) redirect(BASE);
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_move_team_generation", { p_id: id, p_up: formData.get("direction") === "up" });
  finish(BASE, error, "moved");
}

export async function deleteTeamGeneration(formData: FormData) {
  const id = postedId(formData, "generationId");
  if (!id) redirect(BASE);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_delete_team_generation", { p_id: id });
  if (!error && data?.length) await supabase.storage.from(BUCKET).remove(data);
  finish(BASE, error, "gen-deleted");
}

// ----------------------------------------------------------------- members

/** Staff paste a player page link (or just the id); the first UUID in it wins. */
function playerIdFrom(value: string) {
  return /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.exec(value)?.[0].toLowerCase() ?? null;
}

export async function saveTeamMember(formData: FormData) {
  const id = postedId(formData, "memberId");
  const from = postedId(formData, "generationId");
  const to = postedId(formData, "toGenerationId") ?? from;
  if (!from || !to) redirect(BASE);
  // Mistakes land back on the open form; success shows the generation it's in now.
  const page = `${BASE}/${from}${id ? `?edit=${id}` : ""}`;
  const kind = String(formData.get("kind") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const playerLink = String(formData.get("player") ?? "").trim();
  const userId = playerIdFrom(playerLink);
  const linkUrl = String(formData.get("link") ?? "").trim();
  if (!name || name.length > 60 || title.length > 60 || bio.length > 300 || !isTeamKind(kind)) finish(page, fail("INVALID"), "saved");
  if (playerLink && !userId) finish(page, fail("BAD_PLAYER"), "saved");
  if (linkUrl && (!/^https:\/\/\S+$/.test(linkUrl) || linkUrl.length > 300)) finish(page, fail("BAD_LINK"), "saved");

  const supabase = await createClient();
  // The photo this row has now comes from the database, never the form: a
  // posted path could name any object in the bucket for the removal below.
  const { data: rows } = id ? await supabase.rpc("list_team") : { data: null };
  const previous = rows?.find((row) => row.id === id)?.image_path ?? null;
  const picture = await uploadPicture(supabase.storage, formData, "photo", "team");
  if (picture.error) finish(page, fail(picture.error), "saved");
  const photo = picture.key ?? (formData.get("removePhoto") === "on" ? null : previous);

  const { error } = await supabase.rpc("admin_save_team_member", {
    // The generated types do not mark the optional arguments as nullable.
    p_id: id as string, p_generation_id: to, p_kind: kind, p_name: name, p_title: title, p_bio: bio,
    p_image_path: photo as string, p_user_id: userId as string, p_link_url: linkUrl
  });
  if (error && picture.key) await supabase.storage.from(BUCKET).remove([picture.key]);
  if (!error && previous && previous !== photo) await supabase.storage.from(BUCKET).remove([previous]);
  if (error) finish(page, error, "saved");
  finish(`${BASE}/${to}`, null, id ? "saved" : "added");
}

export async function moveTeamMember(formData: FormData) {
  const id = postedId(formData, "memberId");
  const generationId = postedId(formData, "generationId");
  if (!id || !generationId) redirect(BASE);
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_move_team_member", { p_id: id, p_up: formData.get("direction") === "up" });
  finish(`${BASE}/${generationId}`, error, "moved");
}

export async function deleteTeamMember(formData: FormData) {
  const id = postedId(formData, "memberId");
  const generationId = postedId(formData, "generationId");
  if (!id || !generationId) redirect(BASE);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_delete_team_member", { p_id: id });
  if (!error && data) await supabase.storage.from(BUCKET).remove([data]);
  finish(`${BASE}/${generationId}`, error, "deleted");
}
