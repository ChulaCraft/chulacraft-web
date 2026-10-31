"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { dbErrorCode } from "@/lib/db-error";
import { UUID } from "@/lib/registration";
import { createClient } from "@/lib/supabase/server";
import { BUCKET, uploadPicture } from "@/app/admin/commu/achievements/images";

const BASE = "/admin/commu/gallery";

/** Back to `page` with the error code or the done message. */
function finish(page: string, error: { message: string } | null, done: string): never {
  revalidatePath(BASE, "layout");
  redirect(`${page}?${error ? `error=${dbErrorCode(error) ?? "FAILED"}` : `done=${done}`}`);
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

// ------------------------------------------------------------------ groups

export async function saveGalleryGroup(formData: FormData) {
  const id = postedId(formData, "groupId");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const page = id ? `${BASE}/${id}` : BASE;
  if (!name || name.length > 60 || description.length > 300) finish(page, fail("INVALID"), "saved");
  const supabase = await createClient();
  // The generated type does not mark p_id as nullable; null creates a group.
  const { data, error } = await supabase.rpc("admin_save_gallery_group", { p_id: id as string, p_name: name, p_description: description });
  // A new group opens straight away, ready for its first pictures.
  finish(!id && data ? `${BASE}/${data}` : page, error, id ? "group-saved" : "group-created");
}

export async function moveGalleryGroup(formData: FormData) {
  const id = postedId(formData, "groupId");
  if (!id) redirect(BASE);
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_move_gallery_group", { p_id: id, p_up: formData.get("direction") === "up" });
  finish(BASE, error, "moved");
}

export async function deleteGalleryGroup(formData: FormData) {
  const id = postedId(formData, "groupId");
  if (!id) redirect(BASE);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_delete_gallery_group", { p_id: id });
  if (!error && data?.length) await supabase.storage.from(BUCKET).remove(data);
  finish(BASE, error, "group-deleted");
}

// ---------------------------------------------------------------- pictures

const alt = (formData: FormData) => String(formData.get("alt") ?? "").trim();

export async function addGalleryImage(formData: FormData) {
  const groupId = postedId(formData, "groupId");
  if (!groupId) redirect(BASE);
  const page = `${BASE}/${groupId}`;
  const text = alt(formData);
  if (!text || text.length > 200) finish(page, fail("NO_ALT"), "added");
  const supabase = await createClient();
  const picture = await uploadPicture(supabase.storage, formData, "image", "gallery");
  if (picture.error) finish(page, fail(picture.error), "added");
  if (!picture.key) finish(page, fail("NO_FILE"), "added");
  const { error } = await supabase.rpc("admin_save_gallery_image", {
    // The generated type does not mark p_id as nullable; null adds a picture.
    p_id: null as unknown as string, p_group_id: groupId, p_path: picture.key!, p_alt: text, p_wide: formData.get("wide") === "on"
  });
  if (error) await supabase.storage.from(BUCKET).remove([picture.key!]);
  finish(page, error, "added");
}

/** Edits the description and size, and can move the picture to another group. */
export async function updateGalleryImage(formData: FormData) {
  const id = postedId(formData, "imageId");
  const from = postedId(formData, "groupId");
  const to = postedId(formData, "toGroupId") ?? from;
  if (!id || !from || !to) redirect(BASE);
  const page = `${BASE}/${from}`;
  const text = alt(formData);
  if (!text || text.length > 200) finish(page, fail("NO_ALT"), "saved");
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_save_gallery_image", {
    p_id: id, p_group_id: to, p_path: null as unknown as string, p_alt: text, p_wide: formData.get("wide") === "on"
  });
  finish(page, error, to === from ? "saved" : "moved-group");
}

export async function moveGalleryImage(formData: FormData) {
  const id = postedId(formData, "imageId");
  const groupId = postedId(formData, "groupId");
  if (!id || !groupId) redirect(BASE);
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_move_gallery_image", { p_id: id, p_up: formData.get("direction") === "up" });
  finish(`${BASE}/${groupId}`, error, "moved");
}

export async function deleteGalleryImage(formData: FormData) {
  const id = postedId(formData, "imageId");
  const groupId = postedId(formData, "groupId");
  if (!id || !groupId) redirect(BASE);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_delete_gallery_image", { p_id: id });
  if (!error && data) await supabase.storage.from(BUCKET).remove([data]);
  finish(`${BASE}/${groupId}`, error, "deleted");
}
