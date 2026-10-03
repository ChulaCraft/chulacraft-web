import { ErrorScreen } from "@/components/error-screen";

export default function NotFoundPage() {
  return <ErrorScreen
    code="404"
    title="This chunk never loaded"
    body="We couldn't find that page. It may have moved, or the link has a typo."
    primary={{ label: "Back to home", href: "/" }}
    secondary={{ label: "Go to your profile", href: "/dashboard" }}
    help="Still lost? Ask on Discord and someone will point the way."
  />;
}
