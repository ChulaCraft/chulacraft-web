"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PixelIcon } from "@/components/icons";

export function SignOutButton({ className }: { className?: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  async function signOut() {
    setLoading(true);
    await createClient().auth.signOut();
    router.replace("/");
    router.refresh();
  }
  return <button type="button" className={className} onClick={signOut} disabled={loading} aria-busy={loading}><PixelIcon name="signout" />{loading ? "Signing out…" : "Sign out"}</button>;
}
