"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import sharp from "sharp";
import { BUCKET, MAX_IMAGE_BYTES, imageKey } from "@/app/admin/commu/achievements/images";
import { dbErrorCode } from "@/lib/db-error";
import { createClient } from "@/lib/supabase/server";
import { BANNER_STYLES, bannerFileError, toBannerStyle, type BannerStyle } from "./size";

const BASE = "/admin/commu/banners";
const BANNER_ID = /^[a-z0-9-]{2,32}$/;
const HEX = /^#[0-9a-f]{6}$/i;

type Checked = { buffer: Buffer; colors: string[] } | { error: string };

/** Format, size and frame count are read from the bytes, not trusted from the
 *  browser. The four colours are the average of each quarter of the first
 *  frame, so swatches and the loading fallback match the picture. */
async function checkFile(style: BannerStyle, file: File): Promise<Checked> {
  if (!(BANNER_STYLES.find((s) => s.value === style)!.types as readonly string[]).includes(file.type)) return { error: style === "animated" ? "NOT_GIF" : "BAD_IMAGE_TYPE" };
  if (file.size > MAX_IMAGE_BYTES) return { error: "IMAGE_TOO_LARGE" };
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const invalid = bannerFileError(style, await sharp(buffer).metadata());
    if (invalid) return { error: invalid };
    const px = await sharp(buffer, { pages: 1 }).resize(4, 1, { fit: "fill" }).removeAlpha().raw().toBuffer();
    const colors = [0, 1, 2, 3].map((i) => `#${[...px.subarray(i * 3, i * 3 + 3)].map((v) => v.toString(16).padStart(2, "0")).join("")}`);
    return { buffer, colors };
  } catch {
    return { error: "BAD_IMAGE_TYPE" };
  }
}

// The RPCs re-check everything (role, name, colours, style/file pairing,
// defaults); these only keep a malformed form from reaching the database.
export async function saveBanner(formData: FormData) {
  const rawId = String(formData.get("bannerId") ?? "");
  const id = rawId === "" ? null : BANNER_ID.test(rawId) ? rawId : redirect(BASE);
  const back = (code: string): never => redirect(`${BASE}?${id ? `edit=${id}&` : ""}error=${code}`);
  const name = String(formData.get("name") ?? "").trim();
  const style = toBannerStyle(formData.get("style"));
  if (!name || name.length > 40 || !style) back("INVALID");

  const supabase = await createClient();
  // What the banner has now comes from the database, never the form: a posted
  // path could name any object in the bucket for the removal below.
  const { data: rows } = id ? await supabase.rpc("admin_list_banners") : { data: null };
  const previous = (Array.isArray(rows) ? rows : []).find((b) => b.id === id) ?? null;

  let colors: string[];
  let image: string | null = null;
  let still: string | null = null;
  const uploaded: string[] = [];
  const file = formData.get("picture");
  // An untouched file input still posts an empty File.
  const upload = style !== "color" && file instanceof File && file.size > 0 ? file : null;

  if (style === "color") {
    colors = ["c1", "c2", "c3", "c4"].map((key) => String(formData.get(key) ?? ""));
    if (!colors.every((c) => HEX.test(c))) back("INVALID");
  } else if (upload) {
    const checked = await checkFile(style!, upload);
    if ("error" in checked) back(checked.error);
    const ok = checked as Exclude<Checked, { error: string }>;
    colors = ok.colors;
    image = imageKey("banners", upload.type);
    const { error } = await supabase.storage.from(BUCKET).upload(image, upload, { contentType: upload.type });
    if (error) back("UPLOAD_FAILED");
    uploaded.push(image);
    if (style === "animated") {
      still = imageKey("banners", "image/png");
      const frame = await sharp(ok.buffer, { pages: 1 }).png().toBuffer();
      const { error: stillError } = await supabase.storage.from(BUCKET).upload(still, frame, { contentType: "image/png" });
      if (stillError) {
        await supabase.storage.from(BUCKET).remove(uploaded);
        back("UPLOAD_FAILED");
      }
      uploaded.push(still);
    }
  } else if (previous?.style === style && previous.image_path) {
    // Same file style, no new file: keep what is there.
    ({ colors, image_path: image, still_path: still } = previous);
  } else {
    back("NEED_FILE");
  }

  const { error } = await supabase.rpc("admin_save_banner", { p_id: id!, p_name: name, p_colors: colors!, p_style: style!, p_image_path: image!, p_still_path: still! });
  if (error) {
    if (uploaded.length) await supabase.storage.from(BUCKET).remove(uploaded);
    back(dbErrorCode(error) ?? "FAILED");
  }
  const stale = [previous?.image_path, previous?.still_path].filter((p): p is string => Boolean(p) && p !== image && p !== still);
  if (stale.length) await supabase.storage.from(BUCKET).remove(stale);
  revalidatePath(BASE);
  redirect(`${BASE}?done=${id ? "saved" : "created"}`);
}

export async function deleteBanner(formData: FormData) {
  const id = String(formData.get("bannerId") ?? "");
  if (!BANNER_ID.test(id)) redirect(BASE);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_delete_banner", { p_id: id }).maybeSingle();
  if (error) redirect(`${BASE}?error=${dbErrorCode(error) ?? "FAILED"}`);
  const files = [data?.image_path, data?.still_path].filter((p): p is string => Boolean(p));
  if (files.length) await supabase.storage.from(BUCKET).remove(files);
  revalidatePath(BASE);
  redirect(`${BASE}?done=deleted`);
}
