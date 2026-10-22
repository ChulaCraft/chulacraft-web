import { getSiteUrl } from "@/lib/env";
import { eventIcs, icsFilename, type IcsEvent } from "@/lib/ics";
import { UUID } from "@/lib/registration";
import { createClient } from "@/lib/supabase/server";

/** get_event returns published events only, so a draft is a 404 here too. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) return new Response("Not found", { status: 404 });
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_event", { p_id: id });
  if (error || !data) return new Response("Not found", { status: 404 });
  const event = data as IcsEvent;
  return new Response(eventIcs(event, getSiteUrl()), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${icsFilename(event)}"`
    }
  });
}
