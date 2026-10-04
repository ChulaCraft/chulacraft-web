"use client";

import { useFormStatus } from "react-dom";
import { signOut } from "@/app/auth/actions";
import { PixelIcon } from "@/components/icons";

function SubmitButton({ className }: { className?: string }) {
  const { pending } = useFormStatus();
  return <button type="submit" className={className} disabled={pending} aria-busy={pending}><PixelIcon name="signout" />{pending ? "Signing out…" : "Sign out"}</button>;
}

export function SignOutButton({ className }: { className?: string }) {
  return <form action={signOut} className="contents"><SubmitButton className={className} /></form>;
}
