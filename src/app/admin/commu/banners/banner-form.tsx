"use client";

import Link from "next/link";
import { useState } from "react";
import { PixelIcon } from "@/components/icons";
import { BannerStrip } from "@/components/profile-banner";
import { SubmitButton } from "@/components/submit-button";
import styles from "@/app/admin/admin.module.css";
import { saveBanner } from "./actions";
import { BANNER_HEIGHT, BANNER_STYLES, BANNER_WIDTH, bannerFileError, type BannerStyle } from "./size";

const BLOCKS = ["Left", "Second", "Third", "Right"];
const FORMATS: Record<string, string> = { "image/png": "png", "image/jpeg": "jpeg", "image/webp": "webp", "image/gif": "gif" };
const PROBLEMS: Record<string, string> = {
  BAD_IMAGE_TYPE: "That isn't a PNG, JPEG or WebP picture.",
  NOT_GIF: "Animated banners must be a GIF.",
};

type Initial = { id: string | null; name: string; colors: string[]; style: BannerStyle; image: string | null; still: string | null };

/** One style per banner: colours, a still picture or an animated GIF, with the
 *  strip previewed as it will look. The checks here save a round trip; the
 *  server action reads the file's bytes again. */
export function BannerForm({ initial }: { initial: Initial }) {
  const [style, setStyle] = useState<BannerStyle>(initial.style);
  const [colors, setColors] = useState(initial.colors);
  const [preview, setPreview] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const editing = initial.id !== null;
  const types = BANNER_STYLES.find((s) => s.value === style)!.types;
  // The stored file only counts while the style is the one it was saved as.
  const keeps = style !== "color" && style === initial.style && initial.image !== null;

  function clearFile() {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setNote(null);
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    clearFile();
    const file = e.target.files?.[0];
    if (!file) return;
    const bitmap = await createImageBitmap(file).catch(() => null);
    const code = bitmap ? bannerFileError(style, { format: FORMATS[file.type], width: bitmap.width, height: bitmap.height }) : "BAD_IMAGE_TYPE";
    const size = bitmap ? `${bitmap.width} × ${bitmap.height}` : "";
    bitmap?.close();
    if (code) {
      setNote(code === "BAD_SIZE" ? `That file is ${size}. It must be exactly ${BANNER_WIDTH} × ${BANNER_HEIGHT}.` : PROBLEMS[code] ?? "That file can't be used.");
      e.target.value = "";
      return;
    }
    setPreview(URL.createObjectURL(file));
  }

  return (
    <section className="panel" aria-labelledby="banner-form-title">
      <form action={saveBanner} className="stack gap-16">
        <h2 id="banner-form-title" className={styles.sectionTitle}>{editing ? `Edit ${initial.name}` : "New banner"}</h2>
        <input type="hidden" name="bannerId" value={initial.id ?? ""} />
        <BannerStrip
          colors={colors}
          image={keeps ? initial.image : null}
          still={keeps ? initial.still : null}
          imageSrc={style === "color" ? null : preview}
          animate
          className={styles.bannerPreview}
        />
        <div className="field">
          <label htmlFor="banner-name">Name</label>
          <input id="banner-name" className="input" name="name" defaultValue={initial.name} maxLength={40} required placeholder="Halloween 2026" />
        </div>

        <fieldset className={styles.styleRow}>
          <legend className="label">Style</legend>
          {BANNER_STYLES.map((s) => (
            <label key={s.value} className={styles.styleOption}>
              <input type="radio" name="style" value={s.value} checked={style === s.value} onChange={() => { clearFile(); setStyle(s.value); }} />
              {s.label}
            </label>
          ))}
        </fieldset>

        {style === "color" ? (
          <fieldset className={styles.colorRow}>
            <legend className="label">Colours, left to right</legend>
            {colors.map((color, i) => (
              <label key={i} className={styles.colorField}>
                <input type="color" name={`c${i + 1}`} value={color} onChange={(e) => setColors((c) => c.map((v, j) => (j === i ? e.target.value : v)))} />
                <span>{BLOCKS[i]} <span className="mono">{color}</span></span>
              </label>
            ))}
          </fieldset>
        ) : (
          <div className="field">
            <label htmlFor="banner-file">{style === "animated" ? "GIF" : "Picture"}{keeps && <span className="optional"> (leave empty to keep the current one)</span>}</label>
            <input key={style} id="banner-file" className="input" type="file" name="picture" accept={types.join(",")} required={!keeps} onChange={onFile} aria-describedby="banner-file-help banner-file-note" />
            <p id="banner-file-help" className="field-help">
              Exactly {BANNER_WIDTH} × {BANNER_HEIGHT} px, {style === "animated" ? "GIF" : "PNG, JPEG or WebP, not animated"}, up to 2 MB.
              Keep text away from the bottom-left: the player&apos;s avatar sits there.
              {style === "animated" && " Players who turn on reduced motion see the first frame."}
            </p>
            <div id="banner-file-note" aria-live="polite">
              {note && <p className="alert alert-error" role="alert"><PixelIcon name="warning" />{note}</p>}
            </div>
          </div>
        )}

        <p className="field-help">New banners are unlockable: pick one as an event&apos;s reward banner, or give it from a player&apos;s page.</p>
        <div className={styles.titleRow}>
          <SubmitButton className="btn btn-primary">{editing ? "Save banner" : "Create banner"}</SubmitButton>
          {editing && <Link href="/admin/commu/banners" className="link-button">Cancel</Link>}
        </div>
      </form>
    </section>
  );
}
