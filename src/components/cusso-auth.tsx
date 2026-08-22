"use client";

import { CUIcon } from "@/components/icons";
import { getChulaLoginURL } from "@/lib/cusso/client";

export function CussoAuthButton({ compact = false }: { compact?: boolean }) {
  const login_url = getChulaLoginURL(`https://${window.location.host}/auth/cucallback`);

  return <a href={login_url}><button type="button" className={compact ? "button button-header-signup" : "button button-discord"}>
    {!compact && <CUIcon />} {compact ? "Sign Up Now!" : "Sign Up with CU SSO"}
  </button></a>;
}
