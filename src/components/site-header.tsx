import Link from "next/link";
import { Brand } from "@/components/brand";
import { DiscordIcon } from "@/components/icons";
import { discordCommunityUrl } from "@/lib/site-links";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "./sign-out-button";

export async function SiteHeader({ user }: { user?: User | null }) {
  const supabase = await createClient();
  if (user === undefined) {
    try {
      ({ data: { user } } = await supabase.auth.getUser());
    } catch {
      user = null;
    }
  }

  let isAdmin = false;
  if (user) {
    try {
      const { data } = await supabase.from("profiles").select("role").eq("user_id", user.id).maybeSingle();
      isAdmin = data?.role === "owner" || data?.role === "admin";
    } catch {
      // The /admin layout re-checks the role, so hiding the link is only cosmetic.
    }
  }

  const meta = user?.user_metadata ?? {};
  const name = typeof meta.full_name === "string" ? meta.full_name : typeof meta.user_name === "string" ? meta.user_name : "Player";
  const avatar = typeof meta.avatar_url === "string" ? meta.avatar_url : null;
  const accountLinks = <>
    <Link href="/dashboard">Profile</Link>
    {isAdmin && <Link href="/admin">Admin Dashboard</Link>}
    <SignOutButton />
  </>;

  return <header className="site-header"><div className="header-inner">
    <Brand showTagline={false} />
    <nav className="desktop-navigation" aria-label="Main navigation"><Link href="/">Home</Link><Link href="/about">About</Link></nav>
    <div className="header-actions">
      <a className="button button-outline header-community" href={discordCommunityUrl} target="_blank" rel="noreferrer"><DiscordIcon /> Community</a>
      {user ? (
        <details className="profile-menu">
          <summary aria-label={`Account menu for ${name}`}>
            {avatar
              // eslint-disable-next-line @next/next/no-img-element -- tiny Discord CDN avatar; next/image adds nothing here
              ? <img src={avatar} alt="" width={40} height={40} referrerPolicy="no-referrer" />
              : <span aria-hidden="true">{name.charAt(0).toUpperCase()}</span>}
          </summary>
          <nav aria-label="Account">{accountLinks}</nav>
        </details>
      ) : <Link className="button button-header-signup" href="/register">Register</Link>}
    </div>
    <details className="mobile-navigation">
      <summary aria-label="Open navigation"><span aria-hidden="true" /></summary>
      <nav aria-label="Mobile navigation">
        <Link href="/">Home</Link>
        <Link href="/about">About</Link>
        <a href={discordCommunityUrl} target="_blank" rel="noreferrer"><DiscordIcon /> Community</a>
        {user ? accountLinks : <Link href="/register">Register</Link>}
      </nav>
    </details>
  </div></header>;
}
