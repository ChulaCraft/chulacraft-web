"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { DiscordIcon } from "@/components/icons";

export function DiscordAuthButton({ className = "btn btn-primary btn-lg", children }: { className?: string; children?: React.ReactNode }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function signIn() {
    setLoading(true);
    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/callback`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "discord",
        options: { redirectTo }
      });
      if (error) router.push("/auth/error?reason=start_failed");
    } catch {
      router.push("/auth/error?reason=start_failed");
    } finally {
      setLoading(false);
    }
  }

  return <button type="button" className={className} onClick={signIn} disabled={loading} aria-busy={loading}>
    {children ?? <><DiscordIcon /> {loading ? "Opening Discord…" : "Continue with Discord"}</>}
  </button>;
}
