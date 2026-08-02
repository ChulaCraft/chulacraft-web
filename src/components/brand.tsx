import Link from "next/link";
import Image from "next/image";

export function Brand({ showTagline = true }: { showTagline?: boolean }) {
  return (
    <Link href="/" className="brand" aria-label="Chulacraft home">
      <Image
        className="brand-lockup"
        src="/images/chulacraft-logo-lockup.png"
        alt="Chulacraft"
        width={1399}
        height={412}
        priority
      />
      {showTagline && <span className="brand-tagline">Build <i /> Explore <i /> Connect</span>}
    </Link>
  );
}
