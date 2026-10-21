import type { Metadata } from "next";
import Link from "next/link";
import { PixelIcon } from "@/components/icons";
import { SubmitButton } from "@/components/submit-button";
import { SETTING_DEFAULTS } from "@/lib/site-content";
import { createClient } from "@/lib/supabase/server";
import styles from "@/app/admin/admin.module.css";
import { saveSiteSettings } from "./actions";
import { SettingsPreview, type SavedSettings } from "./settings-preview";

export const metadata: Metadata = { title: "Site settings" };

const ERRORS: Record<string, string> = {
  FORBIDDEN: "Only admins can change site settings.",
  INVALID: "Something didn't fit. The Discord link must be a discord.gg or discord.com/invite link, and the server address a host name (with an optional :port).",
  FAILED: "Settings couldn't be saved. Please try again."
};

export default async function AdminSettingsPage({ searchParams }: { searchParams: Promise<{ error?: string; done?: string }> }) {
  const { error: errorCode, done } = await searchParams;
  const supabase = await createClient();
  // Straight from the database, not the cached copy the public pages read.
  const { data, error } = await supabase.rpc("get_site_settings");
  if (error) {
    return <section className={`panel ${styles.errorCard}`} role="alert">
      <h1 className={styles.sectionTitle}><PixelIcon name="warning" size={22} className="tone-danger" />Couldn&apos;t load settings</h1>
      <p className="muted">Nothing was changed. Reload to try again.</p>
    </section>;
  }
  // The form starts with what the site shows now: stored value, else the built-in one.
  const s = { ...SETTING_DEFAULTS, ...Object.fromEntries((data ?? []).map((row) => [row.key, row.value])) };
  const saved: SavedSettings = { ...s, registration_open: s.registration_open !== "false", reports_open: s.reports_open !== "false" };

  return <>
    <div className={styles.titleRow}>
      <h1 className={styles.title}>Site settings</h1>
    </div>

    <div aria-live="polite">
      {errorCode && <div className="alert alert-error" role="alert"><PixelIcon name="warning" /><p className="alert-body">{ERRORS[errorCode] ?? ERRORS.FAILED}</p></div>}
      {done === "saved" && <p className="alert alert-success" role="status"><PixelIcon name="check" />Settings saved. The site shows them within a few seconds.</p>}
    </div>

    <div className={styles.editorGrid}>
    <form id="settings-form" action={saveSiteSettings} className={`panel ${styles.catalogForm}`} aria-labelledby="switches-title">
      <h2 id="switches-title" className={styles.sectionTitle}>Switches</h2>
      <label className={styles.tick}>
        <input type="checkbox" name="registration_open" defaultChecked={saved.registration_open} />
        <span><strong>Registration open</strong><span className="hint">Off: players can&apos;t add or change Minecraft names. Already whitelisted names keep working.</span></span>
      </label>
      <label className={styles.tick}>
        <input type="checkbox" name="reports_open" defaultChecked={saved.reports_open} />
        <span><strong>Player reports open</strong><span className="hint">Off: the Report button is hidden. Reports already sent stay in Moderation.</span></span>
      </label>
      <p className="field-help">For maintenance, pin an announcement of kind Maintenance: it shows under the header on every page.</p>

      <h2 className={styles.sectionTitle}>Homepage</h2>
      <div className="field">
        <label htmlFor="s-kicker">Headline before &ldquo;ChulaCraft&rdquo;</label>
        <input id="s-kicker" className="input" name="home_kicker" defaultValue={saved.home_kicker} maxLength={60} />
      </div>
      <div className="field">
        <label htmlFor="s-intro">Intro</label>
        <textarea id="s-intro" className={styles.textarea} name="home_intro" rows={3} defaultValue={saved.home_intro} maxLength={300} />
      </div>

      <h2 className={styles.sectionTitle}>Links</h2>
      <div className={styles.formRow}>
        <div className="field">
          <label htmlFor="s-address">Server address</label>
          <input id="s-address" className="input mono" name="server_address" defaultValue={saved.server_address} placeholder="play.example.com" maxLength={106} />
        </div>
        <div className="field">
          <label htmlFor="s-discord">Discord invite</label>
          <input id="s-discord" className="input" type="url" name="discord_url" defaultValue={saved.discord_url} />
        </div>
      </div>

      <p className="field-help">Rules, Privacy and Terms are edited under <Link href="/admin/pages">Pages</Link>. Empty a field to go back to the built-in text.</p>
      <div className={styles.formButtons}>
        <SubmitButton className="btn btn-primary">Save settings</SubmitButton>
        <button type="reset" className="btn">Undo changes</button>
      </div>
    </form>
    <div className={styles.previewColumn}>
      <SettingsPreview formId="settings-form" saved={saved} />
    </div>
    </div>
  </>;
}
