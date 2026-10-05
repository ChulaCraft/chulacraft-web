import type { UserIdentity } from "@supabase/supabase-js";

// Mirrors public.is_chula_email in SQL.
export function isChulaEmail(email: unknown): email is string {
  return typeof email === "string" && /^[^@\s]+@(student\.)?chula\.ac\.th$/i.test(email);
}

export function identityEmail(identity: UserIdentity): string | null {
  const email = identity.identity_data?.email;
  return typeof email === "string" ? email : null;
}

const byAge = (a: UserIdentity, b: UserIdentity) => (a.created_at ?? "").localeCompare(b.created_at ?? "");

/**
 * Sorts a user's identities into the roles the app cares about, oldest first.
 * A Google identity counts as Chula only with a Chula domain AND a verified
 * email; a Chula-domain identity without verification is `invalid`.
 *
 * `claimedGoogleSub` is chula_claims.google_sub for the user. That identity is
 * always the Chula account, even if its email has since left the domain, so it
 * must never be offered as a personal account the user can unlink.
 */
export function classifyIdentities(identities: UserIdentity[], claimedGoogleSub?: string | null) {
  const google = identities.filter((i) => i.provider === "google").sort(byAge);
  const chulaDomain = google.filter((i) => isChulaEmail(identityEmail(i)));
  const verified = (i: UserIdentity) => i.identity_data?.email_verified === true || i.identity_data?.email_verified === "true";
  // google_sub is stored from identity.id (see reconcile-identities.ts).
  const claimed = (i: UserIdentity) => Boolean(claimedGoogleSub) && i.id === claimedGoogleSub;
  return {
    discord: identities.find((i) => i.provider === "discord") ?? null,
    cu: chulaDomain.filter(verified),
    invalid: chulaDomain.filter((i) => !verified(i)),
    personal: google.filter((i) => !isChulaEmail(identityEmail(i)) && !claimed(i)),
  };
}

// Error codes the callback and dashboard pass to /verify and /settings.
export const LINK_ERRORS = {
  cu_wrong_domain: "Use your @chula.ac.th or @student.chula.ac.th Google account to verify.",
  cu_already_linked: "This Chula account is already linked to another ChulaCraft account.",
  cu_swap: "Your account already has a Chula account. Ask an admin to reset it if you need to change it.",
  personal_limit: "You can link only one personal Google account. The extra one was removed.",
  unlink_failed: "The account could not be unlinked. Please try again.",
  other: "Something went wrong while linking. Please try again.",
} as const;

export type LinkError = keyof typeof LINK_ERRORS;

export function linkErrorMessage(value: string | undefined) {
  return value && Object.hasOwn(LINK_ERRORS, value) ? LINK_ERRORS[value as LinkError] : null;
}
