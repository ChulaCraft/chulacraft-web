"use client";

import { HomeHero } from "@/app/home-hero";
import { PreviewFrame, checked, text, useFormValues } from "@/components/form-preview";

export type SavedSettings = { home_kicker: string; home_intro: string; server_address: string; discord_url: string; registration_open: boolean; reports_open: boolean };

/** What the homepage and the switches look like with the form as it is now. */
export function SettingsPreview({ formId, saved }: { formId: string; saved: SavedSettings }) {
  const values = useFormValues(formId);
  const address = text(values, "server_address", saved.server_address).trim();
  const discord = text(values, "discord_url", saved.discord_url).trim();
  const registration = checked(values, "registration_open", saved.registration_open);
  const reports = checked(values, "reports_open", saved.reports_open);

  return (
    <PreviewFrame label="Preview — homepage">
      <div className="stack gap-10">
        <HomeHero preview kicker={text(values, "home_kicker", saved.home_kicker)} intro={text(values, "home_intro", saved.home_intro)} />
        <div className="address-row">
          <div>
            <span className="mono address-row-value">{address || "Address coming soon"}</span>
            <span className="address-row-note">Join Discord → {discord || "(built-in invite)"}</span>
          </div>
        </div>
        <p className="hint">
          Registration: <strong>{registration ? "open" : "closed"}</strong> · Player reports: <strong>{reports ? "open" : "closed"}</strong>
        </p>
      </div>
    </PreviewFrame>
  );
}
