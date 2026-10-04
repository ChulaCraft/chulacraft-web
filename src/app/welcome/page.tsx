import Link from "next/link";
import { redirect } from "next/navigation";
import { LinkGoogleButton } from "@/components/google-auth";
import { PixelIcon } from "@/components/icons";
import { ServerAddressRow } from "@/components/server-address-card";
import { classifyIdentities, identityEmail } from "@/lib/chula";
import { createAdminClient } from "@/lib/supabase/server";
import { requireVerifiedUser } from "@/lib/verified-user";
import { ServiceUnavailable } from "../dashboard/service-unavailable";
import styles from "./welcome.module.css";

type StepKind = "done" | "current" | "waiting" | "upcoming";
type Step = { title: string; kind: StepKind; label: string; optional?: boolean; action?: React.ReactNode; address?: boolean };

/** Landing page after sign-in: shows what's left to do, the profile page does the editing. */
export default async function WelcomePage() {
  const session = await requireVerifiedUser();
  if (!session) return <ServiceUnavailable />;
  const { supabase, user } = session;

  let accounts: { minecraft_username: string; sync_status: string }[] = [];
  let chulaEmail: string | null = null;
  let chulaGoogleSub: string | null = null;
  let hasProfile = false;
  let lookupFailed = false;
  try {
    const [mc, claim, profile] = await Promise.all([
      supabase.from("minecraft_registrations").select("minecraft_username, sync_status").eq("user_id", user.id).eq("is_active", true).order("created_at"),
      // google_sub is not readable by the authenticated role, so the claim is
      // looked up with the admin client; the user id comes from the session.
      createAdminClient().from("chula_claims").select("email, google_sub").eq("user_id", user.id).maybeSingle(),
      supabase.from("profiles").select("major").eq("user_id", user.id).maybeSingle(),
    ]);
    lookupFailed = Boolean(mc.error || claim.error || profile.error);
    hasProfile = Boolean(profile.data?.major);
    accounts = mc.data ?? [];
    chulaEmail = claim.data?.email ?? null;
    chulaGoogleSub = claim.data?.google_sub ?? null;
  } catch {
    lookupFailed = true;
  }
  if (lookupFailed) return <ServiceUnavailable />;
  if (!hasProfile) redirect("/register/details");

  const personal = classifyIdentities(user.identities ?? [], chulaGoogleSub).personal.filter((i) => identityEmail(i) !== chulaEmail);
  const personalEmail = personal[0] ? identityEmail(personal[0]) : null;
  const meta = user.user_metadata;
  const name = typeof meta.full_name === "string" ? meta.full_name : typeof meta.user_name === "string" ? meta.user_name : "player";
  const synced = accounts.find((a) => a.sync_status === "synced");
  const first = synced ?? accounts[0];
  const state = synced ? "allset" : accounts.length ? "almost" : "progress";
  const shortName = name.split(" ")[0];

  const steps: Step[] = [
    { title: "Sign in with Discord", kind: "done", label: "Done" },
    // Past requireVerifiedUser with no claim means an admin let them in as a guest.
    { title: "Verify Chula account", kind: "done", label: chulaEmail ?? "Verified (guest)" },
    personalEmail
      ? { title: "Add personal Google", optional: true, kind: "done", label: `Linked · ${personalEmail}` }
      : { title: "Add personal Google", optional: true, kind: "upcoming", label: "Not linked. Lets you sign in with Google too.", action: <LinkGoogleButton className="link-button" /> },
    first
      ? { title: "Add Minecraft account", kind: "done", label: `${first.minecraft_username}${synced ? " · Synced" : " added · Pending"}${accounts.length > 1 ? ` (+${accounts.length - 1} more)` : ""}` }
      : { title: "Add Minecraft account", kind: "current", label: "Current step", action: <Link className="link-button" href="/dashboard#add-account">Add your Java username →</Link> },
    state === "allset"
      ? { title: "Join the server", kind: "current", label: "Ready. Open Minecraft Java and connect.", address: true }
      : state === "almost"
        ? { title: "Join the server", kind: "waiting", label: "Waiting for the whitelist. You can join once it says Synced.", address: true }
        : { title: "Join the server", kind: "upcoming", label: "Upcoming", address: true },
  ];

  return (
    <>
      <main className="narrow">
        <div>
          <div className="stack gap-10">
            <span className="kicker" aria-hidden="true" />
            <h1 className="page-title">{state === "allset" ? `You're all set, ${shortName}` : state === "almost" ? `Almost there, ${shortName}` : `Welcome to ChulaCraft, ${shortName}`}</h1>
            <p className="lead">{state === "allset" ? "Everything is ready. Here is how to connect." : state === "almost" ? "Your account is in. The server just needs a moment to add you." : "A few steps and you can start playing."}</p>
          </div>

          {state === "almost" && first && (
            <div className="alert" role="status">
              <PixelIcon name="clock" />
              <div className="stack gap-4">
                <p className="alert-title">Almost there: {first.minecraft_username} is pending</p>
                <p className="alert-body">Waiting for the server to add it to the whitelist. This usually takes a few minutes, so check back later.</p>
              </div>
            </div>
          )}
          {state === "allset" && synced && (
            <div className="alert alert-success" role="status">
              <PixelIcon name="check" />
              <div className="stack gap-4">
                <p className="alert-title">All set: {synced.minecraft_username} is on the whitelist</p>
                <p className="alert-body">You can join now. See you in the world.</p>
              </div>
            </div>
          )}

          <ol className={styles.steps} aria-label="Getting started checklist">
            {steps.map((s, i) => (
              <li key={s.title} data-kind={s.kind} aria-current={s.kind === "current" ? "step" : undefined}>
                <span className={styles.marker} aria-hidden="true">
                  {s.kind === "done" ? <PixelIcon name="check" /> : s.kind === "waiting" ? <PixelIcon name="clock" /> : i + 1}
                </span>
                <div className={styles.body}>
                  <div>
                    <p className={styles.title}>{s.title}{s.optional && <span className="optional"> (optional)</span>}</p>
                    <p className={styles.label}>{s.label}</p>
                  </div>
                  {s.action}
                  {s.address && <ServerAddressRow />}
                </div>
              </li>
            ))}
          </ol>

          <Link className={`btn ${styles.selfStart}`} href="/dashboard">Go to your profile <span aria-hidden="true">→</span></Link>
        </div>
      </main>
    </>
  );
}
