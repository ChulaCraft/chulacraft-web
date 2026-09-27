const AUTH_FAILURE_REASONS = [
  "cancelled",
  "provider_error",
  "callback_missing_code",
  "session_exchange_failed",
  "start_failed",
  "register_discord_first",
  "already_linked",
  "discord_required",
  "other"
] as const;

export type AuthFailureReason = (typeof AUTH_FAILURE_REASONS)[number];

export function classifyOAuthCallbackFailure(
  error: string | null,
  errorCode: string | null,
  errorDescription: string | null = null
): AuthFailureReason {
  if (error === "access_denied" || errorCode === "access_denied") return "cancelled";
  // Message set by public.hook_only_discord_signups.
  if (errorDescription?.includes("REGISTER_DISCORD_FIRST")) return "register_discord_first";
  if (errorCode === "identity_already_exists") return "already_linked";
  if (error || errorCode) return "provider_error";
  return "callback_missing_code";
}

export function safeAuthFailureReason(value: string | undefined): AuthFailureReason {
  return AUTH_FAILURE_REASONS.find((reason) => reason === value) ?? "provider_error";
}

export function authFailureMessage(reason: AuthFailureReason) {
  switch (reason) {
    case "cancelled":
      return "Authorization was cancelled. No account was connected.";
    case "provider_error":
      return "The sign-in provider could not complete authorization. The site owner should check the provider settings in Supabase.";
    case "callback_missing_code":
      return "The sign-in response was incomplete. Start again from this browser and finish within a few minutes.";
    case "session_exchange_failed":
      return "The account was authorized, but the secure session could not be created. Please start again in the same browser.";
    case "start_failed":
      return "The sign-in request could not be started. Please refresh the page and try again.";
    case "register_discord_first":
      return "No ChulaCraft account uses this Google account. New players sign up with Discord first, then verify with their Chula Google account.";
    case "already_linked":
      return "This Google account is already linked to another ChulaCraft account.";
    case "discord_required":
      return "A ChulaCraft account needs exactly one linked Discord account, and this one has none or several. Please contact an admin to fix it.";
    case "other":
      return "An error occurred.";
  }
}
