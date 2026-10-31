import type { Metadata } from "next";
import Link from "next/link";
import { ConfirmAction } from "@/components/confirm-action";
import { PixelIcon } from "@/components/icons";
import { BannerStrip } from "@/components/profile-banner";
import { createClient } from "@/lib/supabase/server";
import styles from "@/app/admin/admin.module.css";
import { deleteBanner } from "./actions";
import { BannerForm } from "./banner-form";
import { BANNER_STYLES, toBannerStyle } from "./size";
import { timed } from "@/lib/perf";

export const metadata: Metadata = { title: "Banners" };

const ERRORS: Record<string, string> = {
  FORBIDDEN: "You don't have permission to do that.",
  NOT_FOUND: "That banner no longer exists.",
  DEFAULT_LOCKED: "The four free banners can't be changed or deleted.",
  INVALID: "Give the banner a name (up to 40 characters) and four colours.",
  BAD_SIZE: "Pictures and GIFs must be exactly 1500 × 300 pixels.",
  ANIMATED: "That picture is animated. Choose the Animated GIF style, or upload a still image.",
  NOT_GIF: "Animated banners must be a GIF.",
  NEED_FILE: "Picture and Animated GIF banners need a file. Upload one, or choose Colours.",
  BAD_IMAGE_TYPE: "That file isn't a PNG, JPEG or WebP picture.",
  IMAGE_TOO_LARGE: "That picture is bigger than 2 MB. Please upload a smaller one.",
  UPLOAD_FAILED: "The picture couldn't be uploaded. Nothing was changed.",
  FAILED: "The change couldn't be saved. Please try again."
};

const DONE: Record<string, string> = {
  created: "Banner created. Set it as an event's reward or give it to a player.",
  saved: "Banner saved. Everyone using it sees the new colours.",
  deleted: "Banner deleted. Anyone using it is back on the default."
};

const BLANK = ["#3a3050", "#55406e", "#7a4f8a", "#a0609a"];

export default async function AdminBannersPage({ searchParams }: { searchParams: Promise<{ error?: string; done?: string; edit?: string }> }) {
  const { error: errorCode, done, edit } = await searchParams;
  const supabase = await createClient();
  const { data, error } = await timed("admin_list_banners", supabase.rpc("admin_list_banners"));
  const rows = data ?? [];
  const editing = rows.find((b) => b.id === edit && b.kind === "unlock");

  return <>
    <div className={styles.titleRow}>
      <h1 className={styles.title}>Banners</h1>
    </div>

    <div aria-live="polite">
      {errorCode && <div className="alert alert-error" role="alert"><PixelIcon name="warning" /><p className="alert-body">{ERRORS[errorCode] ?? ERRORS.FAILED}</p></div>}
      {done && DONE[done] && <p className="alert alert-success" role="status"><PixelIcon name="check" />{DONE[done]}</p>}
    </div>

    <BannerForm
      key={editing?.id ?? "new"}
      initial={editing ? { id: editing.id, name: editing.name, colors: editing.colors, style: toBannerStyle(editing.style) ?? "color", image: editing.image_path, still: editing.still_path } : { id: null, name: "", colors: BLANK, style: "color", image: null, still: null }}
    />

    {error ? (
      <div className="alert alert-error" role="alert"><PixelIcon name="warning" /><p className="alert-body">Couldn&apos;t load banners. Please reload.</p></div>
    ) : (
      <ul className={styles.bannerList} aria-label="Banners">
        {rows.map((banner) => (
          <li key={banner.id}>
            <BannerStrip colors={banner.colors} image={banner.image_path} still={banner.still_path} className={styles.bannerSwatch} />
            <span className={styles.bannerText}>
              <strong>{banner.name}</strong>
              <span className="hint">
                {BANNER_STYLES.find((st) => st.value === banner.style)?.label} · {banner.kind === "default" ? "Free for everyone" : banner.event_ids.length > 0 ? `Reward for ${banner.event_ids.length} ${banner.event_ids.length === 1 ? "event" : "events"}` : "Unlock only by staff"}
              </span>
            </span>
            {banner.kind === "unlock" && <>
              <Link href={`/admin/commu/banners?edit=${banner.id}`} className="btn btn-sm">Edit</Link>
              <ConfirmAction
                action={deleteBanner}
                fields={{ bannerId: banner.id }}
                trigger="Delete"
                triggerClassName="btn btn-sm btn-danger-outline"
                title={`Delete ${banner.name}?`}
                body="Everyone who has it loses it, anyone using it goes back to the default, and events stop rewarding it. This can't be undone."
                confirmLabel="Delete banner"
                confirmClassName="btn btn-danger"
              />
            </>}
          </li>
        ))}
      </ul>
    )}
  </>;
}
