import type { Metadata } from "next";
import Link from "next/link";
import { PixelIcon } from "@/components/icons";
import { EventForm } from "../event-form";

export const metadata: Metadata = { title: "New event" };

/** Creating is the edit form with nothing filled in; saveEvent mints the id when
 *  none is posted. */
export default function NewEventPage() {
  return <>
    <Link href="/admin/achievements" className="back-link"><PixelIcon name="back" />Achievements</Link>
    <EventForm
      submitLabel="Create event"
      coverUrl={null}
      initial={{ name: "", description: "", startsAt: "", endsAt: "", location: "", status: "draft" }}
    />
  </>;
}
