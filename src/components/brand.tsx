import Link from "next/link";
import Image from "next/image";

export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="ChulaCraft home">
      <Image src="/images/chulacraft-logo.webp" alt="" width={72} height={72} preload />
      <span>ChulaCraft</span>
    </Link>
  );
}
