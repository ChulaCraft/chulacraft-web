import Link from "next/link";
import { Brand } from "@/components/brand";
import { DiscordIcon } from "@/components/icons";
import { DEV_LOGIN_ENABLED, DEV_USERS } from "@/lib/dev-login";
import { discordCommunityUrl } from "@/lib/site-links";

const COLUMNS = [
  {
    title: "Community",
    links: [
      { label: "Events", href: "/events" },
      { label: "Announcements", href: "/announcements" },
      { label: "Gallery", href: "/gallery" },
      { label: "Players", href: "/players" },
    ],
  },
  {
    title: "Server",
    links: [
      { label: "How to join", href: "/#join" },
      { label: "Register", href: "/register" },
      { label: "Rules", href: "/rules" },
    ],
  },
  {
    title: "About",
    links: [
      { label: "About us", href: "/about" },
      { label: "Team", href: "/team" },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
];

/** The close: the brand with a line on what this is and the Discord, then
 *  the site in three short columns, then the small print. */
export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-main">
        <div className="footer-about">
          <Brand />
          <p>A Minecraft Java Edition server for the Chulalongkorn University community.</p>
          <a className="footer-discord" href={discordCommunityUrl} target="_blank" rel="noreferrer"><DiscordIcon /> Join our Discord</a>
        </div>
        <nav className="footer-nav" aria-label="Footer">
          {COLUMNS.map((col) => (
            <div key={col.title} className="footer-col">
              <h2>{col.title}</h2>
              <ul>
                {col.links.map((l) => <li key={l.href}><Link href={l.href}>{l.label}</Link></li>)}
              </ul>
            </div>
          ))}
        </nav>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} ChulaCraft. All rights reserved.</span>
        <span>Not an official Minecraft product. Not approved by or associated with Mojang or Microsoft.</span>
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
