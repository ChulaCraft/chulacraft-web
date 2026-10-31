import type { Metadata } from "next";
import Link from "next/link";
import { PixelIcon } from "@/components/icons";
import { createClient } from "@/lib/supabase/server";
import { EventForm } from "../event-form";
import { timed } from "@/lib/perf";

export const metadata: Metadata = { title: "New event" };

/** Creating is the edit form with nothing filled in; saveEvent mints the id when
 *  none is posted. */
export default async function NewEventPage() {
  const supabase = await createClient();
  const { data } = await timed("admin_list_banners", supabase.rpc("admin_list_banners"));
  return <>
    <Link href="/admin/commu/events" className="back-link"><PixelIcon name="back" />Events</Link>
    <EventForm
      submitLabel="Create event"
      coverUrl={null}
      banners={(data ?? []).filter((b) => b.kind === "unlock")}
      initial={{ name: "", description: "", startsAt: "", endsAt: "", location: "", category: "", banner: "", reminders: [], status: "draft" }}
    />
  </>;
}
