import type { Metadata } from "next";
import Link from "next/link";
import { PixelIcon } from "@/components/icons";
import { createClient } from "@/lib/supabase/server";
import styles from "@/app/admin/admin.module.css";
import { NewAchievementForm } from "./form";
import { timed } from "@/lib/perf";

export const metadata: Metadata = { title: "New achievement" };

/** Creating is the edit form with nothing filled in; the client form keeps its
 *  errors and typed text on this page (createAchievement). */
export default async function NewAchievementPage() {
  const supabase = await createClient();
  const { data: roles } = await timed("admin_list_discord_roles", supabase.rpc("admin_list_discord_roles"));
  return <>
    <Link href="/admin/commu/achievements" className="back-link"><PixelIcon name="back" />Achievements</Link>
    <h1 className={styles.title}>New achievement</h1>

    <NewAchievementForm roles={roles} />
  </>;
}
