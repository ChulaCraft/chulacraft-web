"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CUIcon } from "@/components/icons";
import { getChulaLoginURL } from "@/lib/env";

export function CussoAuthButton({ compact = false }: { compact?: boolean }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function signIn() {
    setLoading(true);
    try {
      router.replace(getChulaLoginURL(`https://${window.location.host}/auth/cucallback`));
    } finally {
      setLoading(false);
    }
  }

  return <button type="button" className={compact ? "button button-header-signup" : "button button-discord"} onClick={signIn} disabled={loading} aria-busy={loading}>
    {!compact && <CUIcon />} {loading ? "Loading…" : compact ? "Sign Up Now!" : "Sign Up with CU SSO"}
  </button>;
}
