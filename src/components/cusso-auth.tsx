import { CUIcon } from "@/components/icons";

// Chula SSO signs in only accounts that already linked it (new accounts start with Discord).
export function CussoAuthButton({ compact = false }: { compact?: boolean }) {
  return <a href="/auth/cusso/start" className={compact ? "button button-header-signup" : "button button-discord"}>
    {!compact && <CUIcon />} {compact ? "Sign In" : "Sign In with CU SSO"}
  </a>;
}
