import Link from "next/link";
import { Brand } from "@/components/brand";
import { DiscordIcon } from "@/components/icons";
import { discordCommunityUrl } from "@/lib/site-links";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "./sign-out-button";

export async function SiteHeader({ user = undefined }: { user?: User | null }) {
  if (user === undefined) {
    const supabase = await createClient();
    try {
      ({ data: { user } } = await supabase.auth.getUser());
    } catch {
      user = null;
    }
  }
  return <header className="site-header"><div className="header-inner">
    <Brand showTagline={false} />
    <nav className="desktop-navigation" aria-label="Main navigation"><Link href="/">Home</Link><Link href="/about">About</Link></nav>
    <div className="header-actions">
      <a className="button button-outline header-community" href={discordCommunityUrl} target="_blank" rel="noreferrer"><DiscordIcon /> Community</a>
      {user ? <SignOutButton /> : <Link className="button button-header-signup" href="/register">Register</Link>}
    </div>
    <details className="mobile-navigation">
      <summary aria-label="Open navigation"><span aria-hidden="true" /></summary>
      <nav aria-label="Mobile navigation">
        <Link href="/">Home</Link>
        <Link href="/about">About</Link>
        <a href={discordCommunityUrl} target="_blank" rel="noreferrer"><DiscordIcon /> Community</a>
        {user ? <SignOutButton /> : <Link href="/register">Register</Link>}
      </nav>
    </details>
  </div></header>;
}
