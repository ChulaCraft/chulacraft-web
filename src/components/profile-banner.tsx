import { achievementImage } from "./achievement-grid";
import styles from "./profile-banner.module.css";

type Props = {
  name: string;
  avatarUrl: string | null;
  /** Four hex colours from the banners table (20261021000001); null → Dusk, the first default. */
  colors?: string[] | null;
  /** Optional staff-uploaded picture or GIF (banners/ in the achievements bucket), drawn over the colours. */
  image?: string | null;
  /** First frame of an animated banner: shown instead under prefers-reduced-motion. */
  still?: string | null;
  /** Rendered as the page's h1 on /player/[id]; a plain paragraph where the page has its own h1. */
  heading?: boolean;
  stats?: { label: string; value: number }[];
  /** Under the name: handle, Minecraft heads. */
  children?: React.ReactNode;
  actions?: React.ReactNode;
};

/** Banner header shared by /dashboard and /player/[id]: avatar over a banner
 *  strip, name, a stat row, and the page's buttons. */
export function ProfileBanner({ name, avatarUrl, colors, image, still, heading = false, stats = [], children, actions }: Props) {
  const Name = heading ? "h1" : "p";
  return (
    <section className={`panel ${styles.banner}`} aria-label="Profile">
      <BannerStrip colors={colors} image={image} still={still} animate />
      <div className={styles.body}>
        {avatarUrl
          // eslint-disable-next-line @next/next/no-img-element -- Discord CDN avatar; next/image adds nothing here
          ? <img className={`avatar ${styles.avatar}`} src={avatarUrl} alt="" width={104} height={104} referrerPolicy="no-referrer" />
          : <span className={`avatar ${styles.avatar}`} role="img" aria-label="No profile picture">{name.charAt(0).toUpperCase()}</span>}
        <div className={styles.text}>
          <Name className={styles.name}>{name}</Name>
          {children}
        </div>
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
      {stats.length > 0 && (
        <dl className={styles.stats}>
          {stats.map((stat) => (
            <div key={stat.label}>
              <dt>{stat.label}</dt>
              <dd>{stat.value.toLocaleString("en-GB")}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}

/** The strip alone: the banner header uses it, and so do the swatches.
 *  Swatches (animate off) show an animated banner's still frame: a row of
 *  moving thumbnails is noise, not information. */
export function BannerStrip({ colors, image, still, imageSrc, animate = false, className }: {
  colors?: string[] | null;
  image?: string | null;
  still?: string | null;
  /** A ready URL instead of a bucket path: the admin form's local preview. */
  imageSrc?: string | null;
  animate?: boolean;
  className?: string;
}) {
  const vars: Record<string, string> = {};
  if (colors?.length === 4) colors.forEach((c, i) => { vars[`--b${i + 1}`] = c; });
  // Paths are checked against banners/<uuid>.<ext> by the database, so they are safe inside url().
  const url = (path: string) => `url("${achievementImage(path)}")`;
  const main = imageSrc ? `url("${imageSrc}")` : animate ? (image ? url(image) : null) : (still ?? image) ? url((still ?? image)!) : null;
  if (main) vars["--banner-image"] = main;
  if (animate && still) vars["--banner-still"] = url(still);
  return <div className={`${styles.strip} ${className ?? ""}`} data-image={main ? "" : undefined} style={vars as React.CSSProperties} aria-hidden="true" />;
}
