import Link from "next/link";
import { Brand } from "@/components/brand";
import { DiscordIcon } from "@/components/icons";
import { DEV_LOGIN_ENABLED, DEV_USERS } from "@/lib/dev-login";
import { discordCommunityUrl } from "@/lib/site-links";

const LINKS = [
  { label: "Events", href: "/events" },
  { label: "Gallery", href: "/gallery" },
  { label: "Rules", href: "/rules" },
  { label: "About", href: "/about" },
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
];

/** A quiet close: the brand, one row of links and the Discord, then the
 *  small print. The header already carries the full map of the site. */
export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-row">
        <Brand />
        <nav aria-label="Footer">
          <ul className="footer-links">
            {LINKS.map((l) => <li key={l.href}><Link href={l.href}>{l.label}</Link></li>)}
          </ul>
        </nav>
        <a className="footer-discord" href={discordCommunityUrl} target="_blank" rel="noreferrer"><DiscordIcon /> Discord</a>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} ChulaCraft. Java Edition only.</span>
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
