import type { Metadata } from "next";
import Link from "next/link";
import { PixelIcon } from "@/components/icons";
import { EventForm } from "../event-form";

export const metadata: Metadata = { title: "New event" };

/** Creating is the edit form with nothing filled in; saveEvent mints the id when
 *  none is posted. */
export default function NewEventPage() {
  return <>
    <Link href="/admin/commu/events" className="back-link"><PixelIcon name="back" />Events</Link>
    <EventForm
      submitLabel="Create event"
      coverUrl={null}
      initial={{ name: "", description: "", startsAt: "", endsAt: "", location: "", category: "", status: "draft" }}
    />
  </>;
}
