const AUTH_FAILURE_REASONS = [
  "cancelled",
  "provider_error",
  "callback_missing_code",
  "session_exchange_failed",
  "start_failed",
  "cu_ticket_invalid",
  "cu_disabled",
  "cu_not_linked",
  "cu_no_email",
  "cu_already_linked",
  "other"
] as const;

export type AuthFailureReason = (typeof AUTH_FAILURE_REASONS)[number];

export function classifyOAuthCallbackFailure(
  error: string | null,
  errorCode: string | null
): AuthFailureReason {
  if (error === "access_denied" || errorCode === "access_denied") return "cancelled";
  if (error || errorCode) return "provider_error";
  return "callback_missing_code";
}

export function safeAuthFailureReason(value: string | undefined): AuthFailureReason {
  return AUTH_FAILURE_REASONS.find((reason) => reason === value) ?? "provider_error";
}

export function authFailureMessage(reason: AuthFailureReason) {
  switch (reason) {
    case "cancelled":
      return "Discord authorization was cancelled. No account was connected.";
    case "provider_error":
      return "Discord could not complete authorization. The site owner should check the Discord provider credentials in Supabase.";
    case "callback_missing_code":
      return "The sign-in response was incomplete. Start again from this browser and finish within a few minutes.";
    case "session_exchange_failed":
      return "Discord authorized the account, but the secure session could not be created. Please start again in the same browser.";
    case "start_failed":
      return "The Discord sign-in request could not be started. Please refresh the page and try again.";
    case "cu_ticket_invalid":
      return "Chula SSO could not confirm your sign-in. Please start again from this site.";
    case "cu_disabled":
      return "This Chula account is disabled, so it can't be used to sign in.";
    case "cu_not_linked":
      return "No ChulaCraft account uses this Chula SSO yet. Sign in with Discord, then press Link Chula SSO on your dashboard.";
    case "cu_no_email":
      return "Your account has no email address, so Chula SSO sign-in isn't available. Please sign in with Discord.";
    case "cu_already_linked":
      return "This Chula account is already linked to another ChulaCraft account, or yours already has a different Chula account linked.";
    case "other":
      return "An error occurred.";
  }
}
