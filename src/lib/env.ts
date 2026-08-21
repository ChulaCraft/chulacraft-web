export function getPublicSupabaseEnvironment() {
  // NEXT_PUBLIC variables must use explicit property access so Next.js can
  // inline them into the browser bundle at build time.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const missing: string[] = [];
  if (!url) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!key) missing.push("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");

  if (missing.length) {
    throw new Error(`Missing required configuration: ${missing.join(", ")}. Add it to web/.env.local.`);
  }

  return { url: url!, key: key! };
}

export function getSiteUrl() {
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configuredSiteUrl) return configuredSiteUrl;

  const vercelProductionUrl =
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercelProductionUrl) return `https://${vercelProductionUrl}`;

  const vercelDeploymentUrl = process.env.VERCEL_URL?.trim();
  if (vercelDeploymentUrl) return `https://${vercelDeploymentUrl}`;

  return "http://localhost:3000";
}

export function getChulaSSOAppId() {
  if (!process.env.NEXT_PUBLIC_CHULA_SSO_APP_ID) throw new Error("Chula SSO is not currently supported");
  return process.env.NEXT_PUBLIC_CHULA_SSO_APP_ID;
}

export function getChulaSSOAppSecret() {
  if (!process.env.CHULA_SSO_APP_SECRET) throw new Error("Chula SSO is not currently supported");
  return process.env.CHULA_SSO_APP_SECRET;
}

export function getChulaLoginURL(callback_url: string) {
  return `https://account.it.chula.ac.th/login?service=${encodeURIComponent(callback_url)}&app_id=${getChulaSSOAppId()}`;
}