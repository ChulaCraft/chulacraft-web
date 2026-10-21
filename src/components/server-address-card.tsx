import { Suspense } from "react";
import { unstable_cache } from "next/cache";
import { PixelIcon } from "@/components/icons";
import { CopyButton } from "@/components/copy-button";
import { pingServer } from "@/lib/server-status";
import { siteSettings } from "@/lib/site-content";

/** 30 s is short enough to feel live and keeps pings to ~2/min whatever the traffic.
 *  Same unstable_cache reasoning as upcomingEvents in src/app/page.tsx. */
const serverStatus = unstable_cache((address: string) => pingServer(address), ["server-status"], { revalidate: 30 });

async function StatusBadge({ address }: { address: string }) {
  const status = await serverStatus(address);
  if (!status.online) return <span className="badge badge-muted pixel-4">Offline</span>;
  const { online, max, names } = status.players;
  return (
    <span className="badge badge-green pixel-4" title={names.length ? names.join(", ") : undefined}>
      <span aria-hidden="true">●</span>Online · {online}/{max} playing
    </span>
  );
}

/** Live online/player count. Streams in so a slow or down server never delays the page. */
export function ServerStatus({ address }: { address: string | null }) {
  if (!address) return null;
  return <Suspense fallback={null}><StatusBadge address={address} /></Suspense>;
}

/** Compact address row used inside cards (Welcome, Dashboard). */
export async function ServerAddressRow() {
  const { serverAddress } = await siteSettings();
  return (
    <div className="address-row">
      <div>
        <span className="mono address-row-value">{serverAddress ?? "Address coming soon"}</span>
        <span className="address-row-note"><PixelIcon name="info" size={14} className="tone-amber" />Java Edition only</span>
        <ServerStatus address={serverAddress} />
      </div>
      {serverAddress && <CopyButton text={serverAddress} className="btn btn-sm btn-outline" />}
    </div>
  );
}
