import Link from "next/link";
import { AnnouncementBanner } from "@/components/announcement-banner";
import { Brand } from "@/components/brand";
import { DiscordIcon, PixelIcon } from "@/components/icons";
import { discordAvatar, discordName } from "@/lib/chula";
import { isStaff } from "@/lib/staff";
import { discordCommunityUrl } from "@/lib/site-links";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "./sign-out-button";
import { HeaderShell, MainNav, NavLinks, type NavItem } from "./site-nav";

function Avatar({ src, name, size = 36 }: { src: string | null; name: string; size?: number }) {
  return src
    // eslint-disable-next-line @next/next/no-img-element -- tiny Discord CDN avatar; next/image adds nothing here
    ? <img className="avatar" src={src} alt="" width={size} height={size} style={{ width: size, height: size }} referrerPolicy="no-referrer" />
    : <span className="avatar" aria-hidden="true" style={{ width: size, height: size }}>{name.charAt(0).toUpperCase()}</span>;
}

// Rendered once by the root layout; client navigations keep it, so this runs on
// full loads and after sign-out (which revalidates the layout), not per page.
export async function SiteHeader() {
  const supabase = await createClient();
  // list_announcements puts pinned rows first, so the banner is the first row
  // when that row is pinned. It doesn't depend on the user, so it runs
  // alongside the user lookup. Any failure just means no banner.
  const [user, banner] = await Promise.all([
    supabase.auth.getUser().then(({ data }) => data.user, () => null), // Signed-out header is the safe fallback.
    supabase.rpc("list_announcements", { p_limit: 1 }).then(({ data }) => (data?.[0]?.pinned ? data[0] : null), () => null),
  ]);

  let isAdmin = false;
  if (user) {
    try {
      const { data } = await supabase.from("profiles").select("role").eq("user_id", user.id).maybeSingle();
      isAdmin = isStaff(data?.role);
    } catch {
      // The /admin layout re-checks the role, so hiding the link is only cosmetic.
    }
  }

  const meta = user?.user_metadata ?? {};
  const name = discordName(user?.identities) ?? (typeof meta.full_name === "string" ? meta.full_name : typeof meta.user_name === "string" ? meta.user_name : "Player");
  const avatar = discordAvatar(user?.identities);

  // The site's sections, grouped so the bar stays short: what's happening,
  // how to play, who runs it. Players stays signed-in only (D1: search and
  // profiles are hidden rather than linked-and-redirected for a logged-out
  // visitor). Profile and Settings live in the account menu, not here.
  const community = [
    { label: "Events", href: "/events" },
    { label: "News", href: "/announcements" },
    { label: "Gallery", href: "/gallery" },
  ];
  if (user) community.push({ label: "Players", href: "/players" });
  const nav: NavItem[] = [
    { label: "Home", href: "/" },
    { label: "Community", items: community },
    { label: "Play", items: [{ label: "How to join", href: "/#join" }, { label: "Server rules", href: "/rules" }] },
    { label: "About", items: [{ label: "About ChulaCraft", href: "/about" }, { label: "Team", href: "/team" }] },
  ];
  if (isAdmin) nav.push({ label: "Admin", href: "/admin" });

  return <><HeaderShell><div className="container header-inner">
    <Brand />
    <nav className="main-nav" aria-label="Main"><MainNav items={nav} /></nav>
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
            <Link href="/settings"><PixelIcon name="lock" />Settings</Link>
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
      <nav id="mobile-menu" aria-label="Menu">
        {user && <div className="mobile-user"><Avatar src={avatar} name={name} size={40} /><span>{name}</span></div>}
        {user && <NavLinks links={[{ label: "Profile", href: "/dashboard" }, { label: "Settings", href: "/settings" }]} />}
        {/* Phones: the same groups, each under its own heading. */}
        {nav.map((item) => "href" in item
          ? <NavLinks key={item.label} links={[item]} />
          : <div key={item.label} className="mobile-group">
              <p>{item.label}</p>
              <NavLinks links={item.items} />
            </div>)}
        {user
          ? <SignOutButton className="mobile-signout" />
          : <div className="mobile-cta">
              <a className="btn" href={discordCommunityUrl} target="_blank" rel="noreferrer">Join Discord</a>
              <Link className="btn btn-primary" href="/register">Sign in</Link>
            </div>}
      </nav>
    </details>
  </div>
  </HeaderShell>
  {banner && <AnnouncementBanner id={banner.id} title={banner.title} severity={banner.severity} />}
  </>;
}
