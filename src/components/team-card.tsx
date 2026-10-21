import Image from "next/image";
import Link from "next/link";
import type { TeamMember } from "@/lib/site-content";
import { publicImageUrl } from "@/app/admin/commu/achievements/images";
import styles from "@/app/team/team.module.css";

export type TeamCardData = { name: string; title: string; bio: string; photo: string | null; userId: string | null; linkUrl: string | null };

export const toCard = (m: TeamMember): TeamCardData => ({
  name: m.name, title: m.title, bio: m.bio, photo: m.image_path ? publicImageUrl(m.image_path) : null, userId: m.user_id, linkUrl: m.link_url,
});

/** One person (or sponsor) on /team, and the admin's preview of them. A player
 *  link wins over an outside link. */
export function TeamCard({ member, preview = false }: { member: TeamCardData; preview?: boolean }) {
  const body = <>
    <div className={`pixel-4 ${styles.photo}`}>
      {member.photo
        ? <Image src={member.photo} alt="" fill sizes="96px" unoptimized={member.photo.startsWith("blob:")} />
        : <span aria-hidden="true">{member.name.slice(0, 1).toUpperCase() || "?"}</span>}
    </div>
    <h3 className={styles.name}>{member.name || "Name"}</h3>
    {member.title && <p className={styles.role}>{member.title}</p>}
    {member.bio && <p className={styles.bio}>{member.bio}</p>}
  </>;
  const Item = preview ? "div" : "li";
  return <Item className={`panel ${styles.card}`}>
    {member.userId ? <Link href={`/player/${member.userId}`} className={styles.link}>{body}</Link>
      : member.linkUrl ? <a href={member.linkUrl} className={styles.link} target="_blank" rel="noreferrer">{body}</a>
      : body}
  </Item>;
}
