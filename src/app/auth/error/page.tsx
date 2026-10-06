import type { Metadata } from "next";
import { ErrorScreen } from "@/components/error-screen";
import { authFailureMessage, safeAuthFailureReason } from "@/lib/auth-error";

export const metadata: Metadata = { title: "Sign-in problem" };

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const reason = safeAuthFailureReason((await searchParams).reason);

  return <ErrorScreen
    code="✦"
    title="Sign-in didn't finish"
    body={authFailureMessage(reason)}
    primary={{ label: "Try signing in again", href: "/register" }}
    secondary={{ label: "Back to home", href: "/" }}
    help="If this keeps happening, let an admin know on Discord."
  />;
}
