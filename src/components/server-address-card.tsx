import { PixelIcon } from "@/components/icons";
import { CopyButton } from "@/components/copy-button";

export const serverAddress = process.env.NEXT_PUBLIC_MINECRAFT_SERVER_ADDRESS;

/** Compact address row used inside cards (Welcome, Dashboard). */
export function ServerAddressRow() {
  return (
    <div className="address-row">
      <div>
        <span className="mono address-row-value">{serverAddress ?? "Address coming soon"}</span>
        <span className="address-row-note"><PixelIcon name="info" size={14} className="tone-amber" />Java Edition only</span>
      </div>
      {serverAddress && <CopyButton text={serverAddress} className="btn btn-sm btn-outline" />}
    </div>
  );
}
