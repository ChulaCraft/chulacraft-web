"use server";

import { redirect } from "next/navigation";
import { validateProfile, type ProfileDetails, type ProfileErrors } from "@/lib/faculties";
import { createAdminClient } from "@/lib/supabase/server";
import { requireVerifiedUser } from "@/lib/verified-user";

export type SaveProfileState = { errors?: ProfileErrors; failed?: boolean };

// The user id comes from the session; the form only supplies the profile fields.
export async function saveProfile(_prev: SaveProfileState, formData: FormData): Promise<SaveProfileState> {
  const session = await requireVerifiedUser();
  if (!session) return { failed: true };

  const v = {
    first: String(formData.get("first") ?? "").trim(),
    last: String(formData.get("last") ?? "").trim(),
    nick: String(formData.get("nick") ?? "").trim(),
    level: String(formData.get("level") ?? "") as ProfileDetails["level"],
    faculty: String(formData.get("faculty") ?? ""),
    major: String(formData.get("major") ?? "")
  };
  const errors = validateProfile(v);
  if (Object.keys(errors).length) return { errors };

  const { error } = await createAdminClient().rpc("update_profile_details", {
    p_user_id: session.user.id, p_first_name: v.first, p_last_name: v.last, p_nickname: v.nick, p_faculty: v.faculty, p_major: v.major,
    p_study_level: v.level
  });
  if (error) return { failed: true };
  redirect(formData.get("next") === "/dashboard" ? "/dashboard?saved=info" : "/welcome");
}
