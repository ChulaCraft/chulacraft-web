import Link from "next/link";
import { DEV_LOGIN_ENABLED, DEV_USERS } from "@/lib/dev-login";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <span>© {new Date().getFullYear()} ChulaCraft</span>
        <span aria-hidden="true">✦</span>
        <span>Java Edition only</span>
        <span aria-hidden="true">✦</span>
        <Link href="/privacy">Privacy</Link>
        <span aria-hidden="true">✦</span>
        <Link href="/terms">Terms</Link>
        {DEV_LOGIN_ENABLED && (
          <span>
            Dev sign in as:{" "}
            {Object.keys(DEV_USERS).map((as) => (
              <a key={as} href={`/api/dev-login?as=${as}`} className="dev-link">{as}</a>
            ))}
          </span>
        )}
      </div>
    </footer>
  );
}
