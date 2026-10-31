import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Markdown, plainText } from "./markdown";

const html = (src: string) => renderToStaticMarkup(<Markdown source={src} />);

describe("Markdown", () => {
  it("renders headings, paragraphs and line breaks", () => {
    expect(html("## Rules\nBe kind\nno griefing\n\nHave fun")).toBe("<h3>Rules</h3><p>Be kind<br/>no griefing</p><p>Have fun</p>");
  });

  it("renders bold, italic, code and safe links", () => {
    expect(html("**Win** a *prize* with `/spawn` at [Discord](https://discord.gg/x)"))
      .toBe('<p><strong>Win</strong> a <em>prize</em> with <code>/spawn</code> at <a href="https://discord.gg/x" target="_blank" rel="noreferrer">Discord</a></p>');
  });

  it("renders bullet and numbered lists", () => {
    expect(html("- one\n- two\n\n1. first\n2. second")).toBe("<ul><li>one</li><li>two</li></ul><ol><li>first</li><li>second</li></ol>");
  });

  it("renders a list right under a heading", () => {
    expect(html("## Prizes\n- badge\n- title")).toBe("<h3>Prizes</h3><ul><li>badge</li><li>title</li></ul>");
  });

  it("renders site links in the same tab, and never protocol-relative ones", () => {
    expect(html("[Terms](/terms) [x](//evil.example)")).toBe('<p><a href="/terms">Terms</a> [x](//evil.example)</p>');
  });

  it("renders tables, with or without the dashes row", () => {
    const table = '<div class="md-table"><table><thead><tr><th>Data</th><th>Why</th></tr></thead><tbody><tr><td><strong>ID</strong></td><td>Login</td></tr></tbody></table></div>';
    expect(html("| Data | Why |\n|---|---|\n| **ID** | Login |")).toBe(table);
    expect(html("| Data | Why |\n| **ID** | Login |")).toBe(table);
  });

  it("never renders raw HTML or script links", () => {
    expect(html('<img src=x onerror=alert(1)> [x](javascript:alert(1))')).toBe("<p>&lt;img src=x onerror=alert(1)&gt; [x](javascript:alert(1))</p>");
  });
});

describe("plainText", () => {
  it("strips markdown for card excerpts", () => {
    expect(plainText("## Rules\n**Win** a [prize](https://x.y)\n- one")).toBe("Rules Win a prize one");
  });
});
