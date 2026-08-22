import { getChulaSSOAppId } from "../env";

export function getChulaLoginURL(callback_url: string) {
  return `https://account.it.chula.ac.th/login?service=${encodeURIComponent(callback_url)}&app_id=${getChulaSSOAppId()}`;
}
