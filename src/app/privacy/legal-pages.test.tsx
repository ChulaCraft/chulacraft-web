import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";


import PrivacyPage from "./page";
import TermsPage from "../terms/page";

describe("legal pages", () => {
  it("renders the privacy policy with the Google Limited Use statement and contact", () => {
    const markup = renderToStaticMarkup(<PrivacyPage />);
    expect(markup).toContain("Privacy Policy");
    expect(markup).toContain("Limited Use");
    expect(markup).toContain("https://discord.gg/");
  });

  it("renders the terms and links back to the privacy policy", () => {
    const markup = renderToStaticMarkup(<TermsPage />);
    expect(markup).toContain("Terms of Service");
    expect(markup).toContain('href="/privacy"');
    expect(markup).toContain("up to 5 Minecraft accounts");
  });
});
