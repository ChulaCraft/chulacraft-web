import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <span>© {new Date().getFullYear()} Chulacraft</span>
      <span className="footer-mark" aria-hidden="true">✦</span>
      <span>Java Edition only</span>
      <span className="footer-mark" aria-hidden="true">✦</span>
      <span><Link href="/privacy">Privacy</Link> · <Link href="/terms">Terms</Link></span>
    </footer>
  );
}
