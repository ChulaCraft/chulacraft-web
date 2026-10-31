import Link from "next/link";

/** What pressing a Register (or sign-in) button agrees to, with each
 *  document one click away. Sits next to every such button on the site. */
export function RegisterConsent({ action = "clicking Register", className }: { action?: string; className?: string }) {
  return (
    <p className={className ? `consent ${className}` : "consent"}>
      By {action}, you agree to our <Link href="/rules">Server rules</Link>, <Link href="/terms">Terms of Service</Link> and <Link href="/privacy">Privacy Policy</Link>.
    </p>
  );
}
