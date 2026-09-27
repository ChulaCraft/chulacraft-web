"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CUIcon, GoogleIcon } from "@/components/icons";

// No `hd` hint: chula.ac.th and student.chula.ac.th may be separate Google
// tenants, and hd would hide one of them. The callback enforces the domain.
function useGoogle(mode: "sign-in" | "link") {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function start() {
    setLoading(true);
    try {
      const supabase = createClient();
      const options = { redirectTo: `${window.location.origin}/auth/callback`, queryParams: { prompt: "select_account" } };
      const { error } = mode === "link"
        ? await supabase.auth.linkIdentity({ provider: "google", options })
        : await supabase.auth.signInWithOAuth({ provider: "google", options });
      if (error) router.push("/auth/error?reason=start_failed");
    } catch {
      router.push("/auth/error?reason=start_failed");
    } finally {
      setLoading(false);
    }
  }
  return { loading, start };
}

export function GoogleSignInButton() {
  const { loading, start } = useGoogle("sign-in");
  return <button type="button" className="button button-discord" onClick={start} disabled={loading} aria-busy={loading}>
    <GoogleIcon /> {loading ? "Opening Google…" : "Sign In with Google"}
  </button>;
}

/** Links a Google account to the signed-in user: the Chula account on /verify, a personal one later. */
export function LinkGoogleButton({ chula = false, className = "button button-discord" }: { chula?: boolean; className?: string }) {
  const { loading, start } = useGoogle("link");
  return <button type="button" className={className} onClick={start} disabled={loading} aria-busy={loading}>
    {chula ? <CUIcon /> : <GoogleIcon />} {loading ? "Opening Google…" : chula ? "Verify with Chula Google" : "Link Google"}
  </button>;
}
