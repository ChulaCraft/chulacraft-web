import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import sharp from "sharp";

/** Shared pieces of the Open Graph images (app/opengraph-image.tsx,
 *  events/[id]/ and player/[id]/). ImageResponse (Satori) reads PNG but not the
 *  site's WebP, so pictures go through sharp first.
 *
 *  Fonts (public/fonts): Minecraftia first, so Latin text is pixel type, and
 *  Trirong Regular (the site's body face, OFL, Trirong-OFL.txt) second, which
 *  Satori falls back to per glyph for Thai. Bundled rather than left to
 *  ImageResponse's runtime Google Fonts fetch, which fails offline or when
 *  blocked and then draws boxes (og-image.test.ts). */
export const OG_SIZE = { width: 1200, height: 630 };
export const OG_TYPE = "image/png";

const NIGHT = "#110c1b";
const MOON = "#f2ecf7";
const TEXT_2 = "#bdb4c6";
const SAKURA = "#ff6aa2";

// Read once per server process: neither depends on the request. Literal paths
// so the build traces just these two files, not the whole project.
const logo = readFile(join(process.cwd(), "public/images/chulacraft-logo.webp"))
  .then((buffer) => sharp(buffer).resize(220, 220).png().toBuffer())
  .then((png) => `data:image/png;base64,${png.toString("base64")}`);
const pixelFont = readFile(join(process.cwd(), "public/fonts/Minecraftia-Regular.ttf"));
const thaiFont = readFile(join(process.cwd(), "public/fonts/Trirong-Regular.ttf"));

/** A remote picture (poster, avatar, badge) as a PNG data URI, or null when it
 *  is missing, slow (3 s) or not an image: the card then goes without it. */
export async function pictureData(url: string | null | undefined, width: number, height: number): Promise<string | null> {
  if (!url) return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return null;
    const png = await sharp(Buffer.from(await res.arrayBuffer())).resize(width, height, { fit: "cover" }).png().toBuffer();
    return `data:image/png;base64,${png.toString("base64")}`;
  } catch {
    return null;
  }
}

async function render(body: React.ReactElement) {
  return new ImageResponse(body, {
    ...OG_SIZE,
    fonts: [
      { name: "Minecraftia", data: await pixelFont, weight: 400, style: "normal" },
      { name: "Trirong", data: await thaiFont, weight: 400, style: "normal" },
    ],
  });
}

const frame = { width: "100%", height: "100%", display: "flex", background: NIGHT, color: MOON, padding: 64, fontSize: 32 } as const;

/** The site card: every page that has no image of its own. */
export async function siteImage() {
  return render(
    <div style={{ ...frame, flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 28 }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- Satori markup, not a page */}
      <img src={await logo} width={220} height={220} alt="" />
      <div style={{ fontSize: 72 }}>ChulaCraft</div>
      <div style={{ color: TEXT_2, fontSize: 34 }}>The Minecraft Java server for the Chula community</div>
    </div>
  );
}

type Card = {
  kicker: string;
  title: string;
  lines: string[];
  /** Data URI from pictureData(); a square avatar or a 4:5 poster. */
  picture?: { src: string; width: number; height: number } | null;
  badges?: string[];
};

/** A page's own card: text on the left, its picture on the right. */
export async function cardImage({ kicker, title, lines, picture, badges = [] }: Card) {
  return render(
    <div style={{ ...frame, alignItems: "center", gap: 56 }}>
      <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, color: SAKURA, fontSize: 30 }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- Satori markup, not a page */}
          <img src={await logo} width={56} height={56} alt="" />
          <span>{kicker}</span>
        </div>
        <div style={{ fontSize: title.length > 40 ? 56 : 72, lineHeight: 1.1 }}>{title}</div>
        {lines.map((line) => <div key={line} style={{ color: TEXT_2 }}>{line}</div>)}
        {badges.length > 0 && (
          <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- Satori markup, not a page */}
            {badges.map((src) => <img key={src.slice(-32)} src={src} width={88} height={88} alt="" />)}
          </div>
        )}
      </div>
      {picture && (
        // eslint-disable-next-line @next/next/no-img-element -- Satori markup, not a page
        <img src={picture.src} width={picture.width} height={picture.height} alt="" style={{ borderRadius: 8 }} />
      )}
    </div>
  );
}
