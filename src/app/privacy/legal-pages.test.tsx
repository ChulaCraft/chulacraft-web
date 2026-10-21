import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LegalPage, splitSections } from "@/components/legal-page";
import { DEFAULT_PAGES } from "@/lib/site-pages";

const render = (source: string) => renderToStaticMarkup(<LegalPage title="T" source={source} effective="1 January 2026" />);

describe("legal pages", () => {
  it("built-in privacy policy keeps the Google Limited Use statement, the data table and contact", () => {
    const markup = render(DEFAULT_PAGES.privacy);
    expect(markup).toContain("Limited Use");
    expect(markup).toContain("<th>Data</th>");
    expect(markup).toContain(`href="/discord"`);
  });

  it("built-in terms link back to the privacy policy", () => {
    const markup = render(DEFAULT_PAGES.terms);
    expect(markup).toContain('href="/privacy"');
    expect(markup).toContain("up to 5 Minecraft accounts");
  });

  it("numbers each ## section and links it from the side menu", () => {
    const markup = render("Intro\n\n## One\nA\n\n## Two\nB");
    expect(markup).toContain('<a href="#s2"><span>2</span>Two</a>');
    expect(markup).toContain('<h2 id="s1"><span>1</span> One</h2>');
    expect(splitSections("Intro\n## One\nA").sections).toEqual([{ title: "One", body: "A" }]);
  });
});
