import { AchievementGrid, type AchievementGroup } from "@/components/achievement-grid";
import { CopyButton } from "@/components/copy-button";
import { PixelIcon } from "@/components/icons";
import { getSiteUrl } from "@/lib/env";
import { toStudyLevel } from "@/lib/faculties";
import { requireVerifiedUser } from "@/lib/verified-user";
import Link from "next/link";
import { Fragment } from "react";
import { AboutYouForm } from "../register/details/about-you-form";
import { removeFriend, respondFriendRequest, unblockPlayer } from "./actions";
import { BanCard, type MyBan } from "./ban-card";
import styles from "./dashboard.module.css";
import { ServiceUnavailable } from "./service-unavailable";
import { SubmitButton } from "@/components/submit-button";

type Profile = { first_name: string | null; last_name: string | null; nickname: string | null; study_level: string | null; faculty: string | null; major: string | null };

/** my_social() in supabase/migrations/20261007000001_social.sql builds this
 *  jsonb, so the generated types cannot describe it. Names come from the
 *  Discord identity (fallback 'Player') and never from a profile field. */
type SocialPerson = { user_id: string; display_name: string; avatar_url: string | null; created_at?: string };
type Social = { incoming: SocialPerson[]; outgoing: SocialPerson[]; friends: SocialPerson[]; blocked: SocialPerson[] };

const SOCIAL_ERRORS: Record<string, string> = {
  NOT_FOUND: "That player is no longer available.",
  TOO_MANY_REQUESTS: "You have 50 friend requests waiting for an answer. Answer one first.",
  INVALID_TARGET: "You can't do that to yourself.",
  FAILED: "That didn't save. Please try again in a moment."
};


const SOCIAL_DONE: Record<string, string> = {
  accepted: "Friend added.",
  declined: "Request declined.",
  removed: "Removed.",
  unblocked: "Unblocked."
};

function PersonAvatar({ src, name, size = 40 }: { src: string | null; name: string; size?: number }) {
  return src
    // eslint-disable-next-line @next/next/no-img-element -- Discord CDN avatar; next/image adds nothing at this size
    ? <img className="avatar" src={src} alt="" width={size} height={size} style={{ width: size, height: size }} referrerPolicy="no-referrer" />
    : <span className="avatar" aria-hidden="true" style={{ width: size, height: size }}>{name.charAt(0).toUpperCase()}</span>;
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ error?: string; edit?: string; saved?: string; done?: string; appeal?: string; appealError?: string }> }) {
  const { error: errorCode, edit, saved, done, appeal, appealError } = await searchParams;
  const session = await requireVerifiedUser();
  if (!session) return <ServiceUnavailable />;
  const { supabase, user } = session;

  let profile: Profile | null = null;
  let achievements: AchievementGroup[] = [];
  let social: Social = { incoming: [], outgoing: [], friends: [], blocked: [] };
  let ban: MyBan | null = null;
  let lookupFailed = false;

  try {
    const [profileRow, badges, socialRow, banRow] = await Promise.all([
      supabase.from("profiles").select("first_name, last_name, nickname, study_level, faculty, major").eq("user_id", user.id).maybeSingle(),
      // Published achievements only, and an entry names its event only when
      // that event is published too (20261006000001:438-439).
      supabase.rpc("my_achievements"),
      // Keyed on the JWT, and a bonus: a failure falls back to empty.
      supabase.rpc("my_social"),
      // Also finishes an expired temp ban, which puts the accounts back.
      supabase.rpc("my_ban")
    ]);
    ban = banRow.data as MyBan | null;
    lookupFailed = Boolean(profileRow.error);
    profile = profileRow.data;
    // Badges are a bonus, not the page: a failure here falls back to the
    // empty state rather than blanking the profile.
    achievements = Array.isArray(badges.data) ? badges.data as AchievementGroup[] : [];
    social = (socialRow.data as Social | null) ?? social;
  } catch {
    lookupFailed = true;
  }

  const socialError = SOCIAL_ERRORS[errorCode ?? ""] ?? null;
  const socialDone = done ? SOCIAL_DONE[done] ?? null : null;

  const meta = user.user_metadata;
  const displayName = typeof meta.full_name === "string" ? meta.full_name : typeof meta.user_name === "string" ? meta.user_name : "Discord player";
  const handle = typeof meta.user_name === "string" ? meta.user_name : typeof meta.name === "string" ? meta.name : null;
  const avatar = typeof meta.avatar_url === "string" ? meta.avatar_url : null;
  const editing = edit === "info";
  const infoRows = [
    ["First name", profile?.first_name],
    ["Last name", profile?.last_name],
    ["Nickname", profile?.nickname],
    ["Faculty", profile?.faculty],
    ["Major", profile?.major]
  ] as const;

  // AC 17: the canonical profile URL is the site account's uuid, so it survives
  // a Minecraft rename. Copied absolute, because a clipboard gets pasted into a
  // chat window, not into this site's address bar.
  const profilePath = `/player/${user.id}`;
  const profileUrl = `${getSiteUrl().replace(/\/+$/, "")}${profilePath}`;

  return (
    <>
      <main className={`container ${styles.main}`}>
        <div className="stack gap-10">
          <span className="kicker" aria-hidden="true" />
          <h1 className="page-title">Your profile</h1>
          <p className="lead">Who you are on ChulaCraft. Minecraft accounts, privacy and sign-in live in <Link href="/settings">Settings</Link>.</p>
        </div>

        {ban && <BanCard ban={ban} appealError={appealError} appealSent={appeal === "sent"} />}

        {lookupFailed ? (
          <section className={`panel ${styles.loadError}`} role="alert">
            <h2 className={styles.cardTitle}><PixelIcon name="warning" size={22} className={styles.dangerIcon} />Couldn&apos;t load your profile</h2>
            <p className="muted">Something went wrong while loading your details. Your Minecraft accounts and whitelist aren&apos;t affected.</p>
            <Link href="/dashboard" className="link-button">Try again →</Link>
          </section>
        ) : (
          <div className={styles.layout}>
            <div className={styles.side}>
              <section className={`panel ${styles.profile}`} aria-label="Profile">
                {avatar
                  // eslint-disable-next-line @next/next/no-img-element -- Discord CDN avatar; next/image adds nothing here
                  ? <img className={`pixel-4 ${styles.avatar}`} src={avatar} alt="" width={72} height={72} referrerPolicy="no-referrer" />
                  : <span className={`avatar ${styles.avatar}`} role="img" aria-label="No profile picture">{displayName.charAt(0).toUpperCase()}</span>}
                <div className={styles.profileText}>
                  <p className={styles.displayName}>{displayName}</p>
                  {handle && <p className="muted">@{handle}</p>}
                </div>
                {/* AC 17: view the public page, or copy its address to share. */}
                <div className={styles.profileLinks}>
                  <Link className="link-button" href={profilePath}>View public profile</Link>
                  <CopyButton text={profileUrl} className="btn btn-sm btn-outline" />
                </div>
              </section>

              <section className={`panel ${styles.card}`} aria-labelledby="friends-title">
                <div className={styles.cardHead}>
                  <h2 id="friends-title" className={styles.cardTitle}>Friends</h2>
                  <Link className="link-button" href="/players">Find players</Link>
                </div>
                <div role="status" aria-live="polite">
                  {socialError && <p className={`alert alert-error ${styles.smallAlert}`} role="alert"><PixelIcon name="warning" /><p>{socialError}</p></p>}
                  {socialDone && <p className={`alert alert-success ${styles.smallAlert}`}><PixelIcon name="check" />{socialDone}</p>}
                </div>

                {social.incoming.length === 0 && social.outgoing.length === 0 && social.friends.length === 0 && social.blocked.length === 0
                  ? <p className="muted">No friends yet. <Link href="/players">Find players</Link> to send a request.</p>
                  : (
                    <div className={styles.socialGroups}>
                      {social.incoming.length > 0 && (
                        <div className={styles.socialGroup}>
                          <h3 className={styles.socialTitle}>Requests ({social.incoming.length})</h3>
                          <ul className={styles.socialList}>
                            {social.incoming.map((person) => (
                              <li key={person.user_id} className={styles.socialRow}>
                                <Link href={`/player/${person.user_id}`} className={styles.socialPerson}>
                                  <PersonAvatar src={person.avatar_url} name={person.display_name} />
                                  <span>{person.display_name}</span>
                                </Link>
                                <span className={styles.socialButtons}>
                                  <form action={respondFriendRequest}>
                                    <input type="hidden" name="otherId" value={person.user_id} />
                                    <input type="hidden" name="accept" value="true" />
                                    <SubmitButton className="btn btn-sm btn-primary"><PixelIcon name="check" />Accept</SubmitButton>
                                  </form>
                                  <form action={respondFriendRequest}>
                                    <input type="hidden" name="otherId" value={person.user_id} />
                                    <input type="hidden" name="accept" value="false" />
                                    <SubmitButton className="btn btn-sm">Decline</SubmitButton>
                                  </form>
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {social.outgoing.length > 0 && (
                        <div className={styles.socialGroup}>
                          <h3 className={styles.socialTitle}>Sent ({social.outgoing.length})</h3>
                          <ul className={styles.socialList}>
                            {social.outgoing.map((person) => (
                              <li key={person.user_id} className={styles.socialRow}>
                                <Link href={`/player/${person.user_id}`} className={styles.socialPerson}>
                                  <PersonAvatar src={person.avatar_url} name={person.display_name} />
                                  <span>{person.display_name}</span>
                                </Link>
                                <form action={removeFriend}>
                                  <input type="hidden" name="otherId" value={person.user_id} />
                                  <SubmitButton className="btn btn-sm">Cancel</SubmitButton>
                                </form>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {social.friends.length > 0 && (
                        <div className={styles.socialGroup}>
                          <h3 className={styles.socialTitle}>Friends ({social.friends.length})</h3>
                          <ul className={styles.socialList}>
                            {social.friends.map((person) => (
                              <li key={person.user_id} className={styles.socialRow}>
                                <Link href={`/player/${person.user_id}`} className={styles.socialPerson}>
                                  <PersonAvatar src={person.avatar_url} name={person.display_name} />
                                  <span>{person.display_name}</span>
                                </Link>
                                <form action={removeFriend}>
                                  <input type="hidden" name="otherId" value={person.user_id} />
                                  <SubmitButton className="btn btn-sm">Unfriend</SubmitButton>
                                </form>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {social.blocked.length > 0 && (
                        <div className={styles.socialGroup}>
                          <h3 className={styles.socialTitle}>Blocked ({social.blocked.length})</h3>
                          <ul className={styles.socialList}>
                            {social.blocked.map((person) => (
                              <li key={person.user_id} className={styles.socialRow}>
                                <span className={styles.socialPerson}>
                                  <PersonAvatar src={person.avatar_url} name={person.display_name} />
                                  <span>{person.display_name}</span>
                                </span>
                                <form action={unblockPlayer}>
                                  <input type="hidden" name="otherId" value={person.user_id} />
                                  <SubmitButton className="btn btn-sm">Unblock</SubmitButton>
                                </form>
                              </li>
                            ))}
                          </ul>
                          <p className="hint">A blocked player can&apos;t find you, see your profile or send requests.</p>
                        </div>
                      )}
                    </div>
                  )}
              </section>
            </div>

            <div className={styles.wide}>
              <section className={`panel ${styles.card} ${styles.infoCard}`} aria-labelledby="info-title">
                <div className={styles.cardHead}>
                  <h2 id="info-title" className={styles.cardTitle}>Personal information</h2>
                  {!editing && <Link className="link-button" href="/dashboard?edit=info">Edit</Link>}
                </div>
                <div role="status" aria-live="polite">
                  {saved === "info" && !editing && <p className={`alert alert-success ${styles.smallAlert}`}><PixelIcon name="check" />Saved.</p>}
                </div>
                {editing ? (
                  <AboutYouForm
                    next="/dashboard"
                    submitLabel="Save changes"
                    cancelHref="/dashboard"
                    initial={{ first: profile?.first_name ?? "", last: profile?.last_name ?? "", nick: profile?.nickname ?? "", level: toStudyLevel(profile?.study_level), faculty: profile?.faculty ?? "", major: profile?.major ?? "" }}
                  />
                ) : (
                  <dl className={styles.info}>
                    {infoRows.map(([label, value]) => (
                      <Fragment key={label}>
                        <dt>{label}</dt>
                        <dd data-empty={!value || undefined}>{value || "Not set"}</dd>
                      </Fragment>
                    ))}
                  </dl>
                )}
              </section>

              <section className={`panel ${styles.card}`} aria-labelledby="badges-title">
                <h2 id="badges-title" className={styles.cardTitle}>Achievements</h2>
                <AchievementGrid groups={achievements} />
              </section>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
