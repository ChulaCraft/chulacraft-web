import Link from "next/link";
import { Brand } from "@/components/brand";
import { AuthButton } from "@/components/auth-button";
import { DiscordIcon } from "@/components/icons";
import { discordCommunityUrl } from "@/lib/site-links";

export function SiteHeader({ authenticated = false }: { authenticated?: boolean }) {
  return <header className="site-header"><div className="header-inner">
    <Brand showTagline={false} />
    <nav className="desktop-navigation" aria-label="Main navigation"><Link href="/">Home</Link><Link href="/about">About</Link></nav>
    <div className="header-actions">
      <a className="button button-outline header-community" href={discordCommunityUrl} target="_blank" rel="noreferrer"><DiscordIcon /> Community</a>
      {authenticated ? <Link className="button button-header-signup" href="/register">Register</Link> : <AuthButton compact />}
    </div>
    <details className="mobile-navigation">
      <summary aria-label="Open navigation"><span aria-hidden="true" /></summary>
      <nav aria-label="Mobile navigation">
        <Link href="/">Home</Link>
        <Link href="/about">About</Link>
        <a href={discordCommunityUrl} target="_blank" rel="noreferrer"><DiscordIcon /> Community</a>
        {authenticated ? <Link href="/register">Register</Link> : <AuthButton compact />}
      </nav>
    </details>
  </div></header>;
}
