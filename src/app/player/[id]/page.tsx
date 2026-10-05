import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AchievementGrid, type AchievementGroup } from "@/components/achievement-grid";
import { PixelIcon } from "@/components/icons";
import { UUID } from "@/lib/registration";
import { createClient } from "@/lib/supabase/server";
import { blockPlayer, removeFriend, reportPlayer, respondFriendRequest, sendFriendRequest } from "./actions";
import styles from "./player.module.css";
import { SubmitButton } from "@/components/submit-button";

/** player_card() in supabase/migrations/20261007000001_social.sql builds this
 *  jsonb, so the generated types cannot describe it. Every section is optional:
 *  a hidden profile carries only the five keys AC 20 allows, and a field the
 *  viewer may not see is absent rather than null. */
type PlayerCard = {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  hidden: boolean;
  relationship: "self" | "friend" | "incoming" | "outgoing" | "none" | "blocked_by_me" | "blocked_me";
  minecraft_names?: string[];
  achievements?: AchievementGroup[];
  friends?: { user_id: string; display_name: string; avatar_url: string | null }[];
  friend_count?: number;
};

/** mc-heads.net renders the skin head; a plain <img> because next/image would
 *  need a remote pattern for a 32px avatar and no gain. */
function mcHead(name: string, size: number) {
  const url = `https://mc-heads.net/avatar/${encodeURIComponent(name)}/64`;
  // eslint-disable-next-line @next/next/no-img-element -- third-party avatar service; next/image adds nothing at this size
  return <img src={url} alt={`${name}'s Minecraft head`} width={size} height={size} className={styles.mcHead} referrerPolicy="no-referrer" />;
}

function Avatar({ src, name, size = 72 }: { src: string | null; name: string; size?: number }) {
  return src
    // eslint-disable-next-line @next/next/no-img-element -- Discord CDN avatar; next/image adds nothing here
    ? <img className={`avatar pixel-4 ${styles.avatar}`} src={src} alt="" width={size} height={size} referrerPolicy="no-referrer" />
    : <span className={`avatar ${styles.avatar}`} aria-label="No profile picture">{name.charAt(0).toUpperCase()}</span>;
}

/** Read through the session's own client: get_player_profile is granted to
 *  authenticated only (D1), and the card has to reflect whoever is asking. */
async function loadCard(id: string): Promise<PlayerCard | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_player_profile", { p_user_id: id });
    // A read failure looks like a missing profile: there is nothing to show
    // either way, and both end at the 404.
    if (error || !data) return null;
    return data as PlayerCard;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const card = UUID.test(id) ? await loadCard(id) : null;
  if (!card) return { title: "Player not found" };
  return { title: card.display_name };
}

const ERRORS: Record<string, string> = {
  NOT_FOUND: "That player is no longer available.",
  ALREADY_FRIENDS: "You are already friends with this player.",
  TOO_MANY_REQUESTS: "You have 50 friend requests waiting for an answer. Answer one first.",
  INVALID_TARGET: "You can't do that to yourself.",
  INVALID: "Pick what happened and describe it in at least 10 characters. Links must start with https://.",
  ALREADY_REPORTED: "You already reported this player. An admin will look at it.",
  RATE_LIMITED: "You've sent 5 reports today. Try again tomorrow, or message an admin on Discord.",
  FAILED: "That didn't save. Please try again in a moment."
};

export default async function PlayerPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; done?: string }>;
}) {
  const { id } = await params;
  const { error: errorCode, done } = await searchParams;
  if (!UUID.test(id)) notFound();

  // D1: signed-in only. Logged out → /register, before any read happens.
  const supabase = await createClient();
  let signedIn = true;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    signedIn = Boolean(user);
  } catch {
    signedIn = false;
  }
  if (!signedIn) redirect("/register");

  const card = await loadCard(id);
  // A blocked profile and an unknown one are both NOT_FOUND (AC 18).
  if (!card) notFound();

  const relationship = card.relationship;
  const isSelf = relationship === "self";
  const blocked = relationship === "blocked_by_me" || relationship === "blocked_me";
  const names = card.minecraft_names ?? [];
  const friends = card.friends ?? [];
  const badges = card.achievements ?? [];

  return (
    <>
      <main className="narrow">
        <div className={styles.main}>
          <Link href="/players" className="back-link"><PixelIcon name="back" />Players</Link>

          <div aria-live="polite">
            {errorCode && (
              <div className="alert alert-error" role="alert">
                <PixelIcon name="warning" />
                <p className="alert-body">{ERRORS[errorCode] ?? ERRORS.FAILED}</p>
              </div>
            )}
            {done === "requested" && <p className="alert alert-success" role="status"><PixelIcon name="check" />Friend request sent.</p>}
            {done === "accepted" && <p className="alert alert-success" role="status"><PixelIcon name="check" />You are now friends.</p>}
            {done === "declined" && <p className="alert alert-success" role="status"><PixelIcon name="check" />Request declined.</p>}
            {done === "removed" && <p className="alert alert-success" role="status"><PixelIcon name="check" />Removed.</p>}
            {done === "reported" && <p className="alert alert-success" role="status"><PixelIcon name="check" />Report sent. Thanks, an admin will look at it.</p>}
          </div>

          <header className={styles.header}>
            <Avatar src={card.avatar_url} name={card.display_name} />
            <div className={styles.headerText}>
              <h1 className={styles.name}>{card.display_name}</h1>
              {names.length > 0 && (
                <ul className={styles.heads} aria-label="Minecraft accounts">
                  {names.map((name) => (
                    <li key={name}>{mcHead(name, 40)}<span className="mono">{name}</span></li>
                  ))}
                </ul>
              )}
            </div>
          </header>

          {/* AC 20: a viewer who may not see the profile still gets the name, the
              avatar, an explanation and the two actions that always work. */}
          {card.hidden ? (
            <section className={`panel ${styles.hidden}`}>
              <h2 className={styles.cardTitle}>This user hides their profile</h2>
              <p className="muted">You can still send them a friend request. Accepting it unlocks whatever they choose to share.</p>
              <div className={styles.actions}>
                {!isSelf && relationship !== "outgoing" && (
                  <form action={sendFriendRequest}>
                    <input type="hidden" name="playerId" value={id} />
                    <SubmitButton className="btn btn-primary"><PixelIcon name="plus" />Add friend</SubmitButton>
                  </form>
                )}
                {relationship === "outgoing" && (
                  <form action={removeFriend}>
                    <input type="hidden" name="playerId" value={id} />
                    <SubmitButton className="btn">Cancel request</SubmitButton>
                  </form>
                )}
                {relationship !== "blocked_by_me" && (
                  <form action={blockPlayer}>
                    <input type="hidden" name="playerId" value={id} />
                    <SubmitButton className="btn btn-danger-outline">Block</SubmitButton>
                  </form>
                )}
              </div>
            </section>
          ) : (
            <div className={styles.sections}>
              <section className={`panel ${styles.card}`} aria-labelledby="badges-title">
                <h2 id="badges-title" className={styles.cardTitle}>Achievements</h2>
                <AchievementGrid groups={badges} />
              </section>

              <section className={`panel ${styles.card}`} aria-labelledby="friends-title">
                <div className={styles.cardHead}>
                  <h2 id="friends-title" className={styles.cardTitle}>Friends</h2>
                  <span className="badge badge-muted pixel-4">{card.friend_count ?? 0}</span>
                </div>
                {friends.length === 0 ? (
                  <p className="muted">No friends to show.</p>
                ) : (
                  <ul className={styles.friendList}>
                    {friends.map((friend) => (
                      <li key={friend.user_id}>
                        <Link href={`/player/${friend.user_id}`} className={styles.friend}>
                          <Avatar src={friend.avatar_url} name={friend.display_name} size={40} />
                          <span>{friend.display_name}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* The one row of buttons, decided by the relationship the card
                  reports. A blocked pair sees only Unblock. */}
              {!isSelf && !blocked && (
                <section className={`panel ${styles.card}`} aria-labelledby="actions-title">
                  <h2 id="actions-title" className={styles.cardTitle}>Friendship</h2>
                  <div className={styles.actions}>
                    {relationship === "none" && (
                      <form action={sendFriendRequest}>
                        <input type="hidden" name="playerId" value={id} />
                        <SubmitButton className="btn btn-primary"><PixelIcon name="plus" />Add friend</SubmitButton>
                      </form>
                    )}
                    {relationship === "outgoing" && (
                      <form action={removeFriend}>
                        <input type="hidden" name="playerId" value={id} />
                        <SubmitButton className="btn">Cancel request</SubmitButton>
                      </form>
                    )}
                    {relationship === "incoming" && (
                      <>
                        <form action={respondFriendRequest}>
                          <input type="hidden" name="requesterId" value={id} />
                          <input type="hidden" name="accept" value="true" />
                          <SubmitButton className="btn btn-primary"><PixelIcon name="check" />Accept</SubmitButton>
                        </form>
                        <form action={respondFriendRequest}>
                          <input type="hidden" name="requesterId" value={id} />
                          <input type="hidden" name="accept" value="false" />
                          <SubmitButton className="btn">Decline</SubmitButton>
                        </form>
                      </>
                    )}
                    {relationship === "friend" && (
                      <form action={removeFriend}>
                        <input type="hidden" name="playerId" value={id} />
                        <SubmitButton className="btn">Unfriend</SubmitButton>
                      </form>
                    )}
                    <form action={blockPlayer}>
                      <input type="hidden" name="playerId" value={id} />
                      <SubmitButton className="btn btn-danger-outline">Block</SubmitButton>
                    </form>
                  </div>
                  <p className="hint">Blocking removes any friendship and hides this profile from them, both ways.</p>
                </section>
              )}

              {relationship === "blocked_by_me" && (
                <section className={`panel ${styles.card}`} aria-labelledby="blocked-title">
                  <h2 id="blocked-title" className={styles.cardTitle}>You blocked this player</h2>
                  <p className="muted">They can&apos;t find you and can&apos;t see this profile. Unblocking restores both.</p>
                  <form action={removeFriend} className={styles.actions}>
                    <input type="hidden" name="playerId" value={id} />
                    <SubmitButton className="btn">Unfriend</SubmitButton>
                  </form>
                </section>
              )}
            </div>
          )}

          {blocked && (
            <section className={`panel ${styles.card}`} role="status">
              <h2 className={styles.cardTitle}>You can&apos;t see this profile</h2>
              <p className="muted">
                {relationship === "blocked_me"
                  ? "This player blocked you, so their profile is not available."
                  : "You blocked this player, so their profile is not available to you."}
              </p>
            </section>
          )}

          {/* Reporting stays available when blocked: harassment is often why. */}
          {!isSelf && (
            <details className={`panel ${styles.card}`}>
              <summary className="link-button">Report this player</summary>
              <form action={reportPlayer} className="stack gap-10" style={{ marginTop: 12 }}>
                <input type="hidden" name="playerId" value={id} />
                <label className="stack gap-6">
                  <span className="label">What happened?</span>
                  <select className="input" name="category" defaultValue="grief">
                    <option value="grief">Griefing</option>
                    <option value="cheat">Cheating or hacked client</option>
                    <option value="harassment">Harassment</option>
                    <option value="other">Something else</option>
                  </select>
                </label>
                <label className="stack gap-6">
                  <span className="label">Details</span>
                  <textarea className="input" name="details" rows={3} minLength={10} maxLength={2000} required placeholder="Where, when, and what they did" />
                </label>
                <label className="stack gap-6">
                  <span className="label">Screenshot or video link <span className="optional">optional</span></span>
                  <input className="input" type="url" name="evidenceUrl" pattern="https://.*" maxLength={500} placeholder="https://" />
                </label>
                <p className="hint">Only admins see reports. The player isn&apos;t told who reported them.</p>
                <SubmitButton className="btn btn-sm btn-danger-outline">Send report</SubmitButton>
              </form>
            </details>
          )}
        </div>
      </main>
    </>
  );
}