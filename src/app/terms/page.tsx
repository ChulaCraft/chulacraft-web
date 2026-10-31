import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { sitePage } from "@/lib/site-content";
import { PAGES } from "@/lib/site-pages";

export const metadata: Metadata = { ...PAGES.terms, alternates: { canonical: "/terms" } };

/** Text edited at /admin/pages; the built-in text until then. */
export default async function Page() {
  const { source, effective } = await sitePage("terms");
  return <LegalPage title={PAGES.terms.title} source={source} effective={effective} />;
}
