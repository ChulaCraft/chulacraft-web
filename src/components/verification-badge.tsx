import { PixelIcon } from "@/components/icons";

export type VerificationKind = "verified" | "guest" | "unverified";

export function VerificationBadge({ kind }: { kind: VerificationKind }) {
  if (kind === "verified") return <span className="badge badge-green"><PixelIcon name="check" />Verified</span>;
  if (kind === "guest") return <span className="badge badge-lavender"><PixelIcon name="shield" />Guest</span>;
  return <span className="badge badge-muted"><PixelIcon name="info" />Unverified</span>;
}
