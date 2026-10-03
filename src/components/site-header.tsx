import Link from "next/link";
import { Brand } from "@/components/brand";
import { DiscordIcon, PixelIcon } from "@/components/icons";
import { discordCommunityUrl } from "@/lib/site-links";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "./sign-out-button";

export type NavId = "home" | "about" | "dashboard" | "admin";

function Avatar({ src, name, size = 36 }: { src: string | null; name: string; size?: number }) {
  return src
    // eslint-disable-next-line @next/next/no-img-element -- tiny Discord CDN avatar; next/image adds nothing here
    ? <img className="avatar" src={src} alt="" width={size} height={size} style={{ width: size, height: size }} referrerPolicy="no-referrer" />
    : <span className="avatar" aria-hidden="true" style={{ width: size, height: size }}>{name.charAt(0).toUpperCase()}</span>;
}

export async function SiteHeader({ user, active, overlay }: { user?: User | null; active?: NavId; overlay?: boolean }) {
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

  const links: { id: NavId; label: string; href: string }[] = [
    { id: "home", label: "Home", href: "/" },
    { id: "about", label: "About", href: "/about" },
  ];
  if (user) links.push({ id: "dashboard", label: "Profile", href: "/dashboard" });
  if (isAdmin) links.push({ id: "admin", label: "Admin", href: "/admin" });
  const navLinks = links.map((l) => <Link key={l.id} href={l.href} aria-current={l.id === active ? "page" : undefined}>{l.label}</Link>);

  // On the landing page the header floats over the hero and drops in on scroll.
  return <header className={`site-header${overlay ? " site-header-overlay" : ""}`}><div className="container header-inner">
    <Brand />
    <nav className="main-nav" aria-label="Main">{navLinks}</nav>
    <div className="header-actions">
      {user ? (
        <details className="menu">
          <summary aria-label={`Account menu for ${name}`}>
            <Avatar src={avatar} name={name} />
            <span>{name}</span>
            <PixelIcon name="chevron" size={14} />
          </summary>
          <div className="menu-panel">
            <p>Signed in as <strong>{name}</strong></p>
            <Link href="/dashboard"><PixelIcon name="user" />Profile</Link>
            {isAdmin && <Link href="/admin"><PixelIcon name="shield" />Admin</Link>}
            <SignOutButton />
          </div>
        </details>
      ) : <>
        <a className="btn btn-sm" href={discordCommunityUrl} target="_blank" rel="noreferrer"><DiscordIcon /> Join Discord</a>
        <Link className="btn btn-sm btn-primary" href="/register">Sign in</Link>
      </>}
    </div>
    <details className="mobile-menu">
      <summary aria-controls="mobile-menu">
        <PixelIcon name="menu" className="menu-label-closed" />
        <PixelIcon name="close" className="menu-label-open" />
        <span className="menu-label-closed">Menu</span>
        <span className="menu-label-open">Close</span>
      </summary>
      <nav id="mobile-menu" aria-label="Main">
        {user && <div className="mobile-user"><Avatar src={avatar} name={name} size={40} /><span>{name}</span></div>}
        {navLinks}
        {user
          ? <SignOutButton className="mobile-signout" />
          : <div className="mobile-cta">
              <a className="btn" href={discordCommunityUrl} target="_blank" rel="noreferrer">Join Discord</a>
              <Link className="btn btn-primary" href="/register">Sign in</Link>
            </div>}
      </nav>
    </details>
  </div></header>;
}
