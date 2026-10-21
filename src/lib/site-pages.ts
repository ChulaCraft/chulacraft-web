// The text /rules, /privacy and /terms show until an admin edits them at
// /admin/pages (public.site_pages, 20261025000001). Markdown: see src/lib/markdown.tsx.
// Each "## " line starts a numbered section with its own link in the side menu.

export type PageSlug = "rules" | "privacy" | "terms";

export const PAGES: Record<PageSlug, { title: string; description: string }> = {
  rules: { title: "Server rules", description: "The rules for playing on the ChulaCraft Minecraft server." },
  privacy: { title: "Privacy Policy", description: "What Chulacraft collects, why, and your choices." },
  terms: { title: "Terms of Service", description: "The rules for using the Chulacraft website and Minecraft server." },
};

export const PAGE_SLUGS = Object.keys(PAGES) as PageSlug[];

export const isPageSlug = (value: string): value is PageSlug => Object.hasOwn(PAGES, value);

/** Shown as "Effective …" until the page is edited; then the edit date. */
export const LEGAL_EFFECTIVE_DATE = "27 September 2026";

export const DEFAULT_PAGES: Record<PageSlug, string> = {
  rules: `Breaking these can get your Minecraft accounts removed from the whitelist. They are part of our [Terms of Service](/terms).

## Be kind
- No harassment, hate speech or bullying, in game or on Discord.
- Don't impersonate other players or staff.

## Play fair
- No hacked clients, x-ray, duping or exploits.
- Found a bug? Tell an admin instead of using it.

## Respect builds
- No griefing, stealing or building on someone else's land without asking.
- Clean up temporary builds and floating trees.

## Keep it legal
Follow Thai law, university regulations and the [Minecraft End User License Agreement](https://www.minecraft.net/eula).

## Questions
Ask the admins on our [Discord server](/discord).`,

  privacy: `Chulacraft is a community Minecraft Java Edition server for Chulalongkorn University students and staff. This policy explains what we collect through this website, why, and your choices. We follow Thailand's Personal Data Protection Act B.E. 2562 (PDPA).

## What we collect
| Data | Source | Why |
|---|---|---|
| Discord user ID and username | Discord sign-in | Your login and identifying you in the community |
| Chula Google email and Google account ID | "Verify with Chula Google" | Confirming you are a Chula member, and making sure one Chula account verifies only one player |
| Personal Google email and account ID (optional) | "Add personal Google" | Letting you sign in with that account |
| Minecraft UUID and username | You enter it; we confirm it with Mojang's public API | Adding you to the server whitelist |
| Account change history (what changed, when, by you or an admin) | This website | Security, abuse prevention and resolving disputes |
| Registration attempt counts | This website | Rate limiting |
| Anonymous page-view statistics | Vercel Analytics (no cookies, no cross-site tracking) | Understanding how the site is used |

From Google and Discord we receive only your basic profile and email address. We never read your Google Drive, Gmail, contacts or Discord messages, and we never see your passwords.

## How we use it
Only to run Chulacraft: signing you in, verifying Chula membership, managing the whitelist, moderating the server and keeping the service secure. We do not sell or rent your data or use it for advertising.

## Google user data
Chulacraft's use of information received from Google APIs adheres to the [Google API Services User Data Policy](https://developers.google.com/terms/api-services-user-data-policy), including the Limited Use requirements. Google data is used only for sign-in and Chula verification and is shared with no one except the service providers listed below.

## Who can see it
- **Server admins** see your Discord username, Chula email, linked Google email, Minecraft accounts and change history, to moderate the server.
- **Other players** see your Minecraft username in game, as on any Minecraft server.
- **Service providers** that run the service for us: Supabase (database and login), Vercel (hosting and analytics), Discord and Google (sign-in), and Mojang/Microsoft (username lookup).
- We disclose data when the law requires it.

## How long we keep it
While your account exists. Your Chula verification record stays even if you unlink that Google account, so one Chula account cannot verify several players; an admin can reset it on request. After your account is deleted, change history is kept for up to 12 months for security, then deleted.

## Your rights
Under the PDPA you can ask to access, correct, export or delete your data, or withdraw your consent. You can unlink your personal Google account from Settings at any time. For anything else, contact an admin (see below). Deleting your account also removes you from the whitelist.

## Security
Your data is stored in Supabase with row-level security: players can read only their own records, and every change goes through checked server functions. No system is perfectly secure; if a breach affects you, we will tell you as the PDPA requires.

## Minors
If you are under 20, you confirm that a parent or guardian agrees to your use of Chulacraft.

## Changes
We will post changes on this page and update the effective date. Significant changes are announced on our Discord.

## Contact
Message the Chulacraft admins on our [Discord server](/discord). See also the [Terms of Service](/terms).

*Chulacraft is a student community project, not an official service of Chulalongkorn University, Mojang, Microsoft, Discord or Google.*`,

  terms: `By signing in to Chulacraft you agree to these terms and our [Privacy Policy](/privacy).

## Eligibility
You must be a current Chulalongkorn University student or staff member with a valid @chula.ac.th or @student.chula.ac.th Google account, own a legitimate Minecraft Java Edition account, and follow the Discord and Google terms of service.

## Your account
- One person, one Chulacraft account. It is built on one Discord account and verified by one Chula Google account.
- A Chula account can verify only one Chulacraft account, and you cannot swap it yourself; ask an admin.
- You may register up to 5 Minecraft accounts that you own or are allowed to use. You are responsible for everything done with them on the server.
- Keep your sign-in accounts secure, and tell an admin if you think your account was misused.

## Rules
You must not:
- Impersonate anyone, or verify for or with someone else's Chula account.
- Cheat, use hacked clients or exploits, grief, or harass other players.
- Attack, overload, scrape or try to bypass the security of the website or server.
- Break Thai law, university regulations, or the [Minecraft End User License Agreement](https://www.minecraft.net/eula).

The [server rules](/rules) are part of these terms.

## Moderation
Admins may remove any Minecraft account from the whitelist and suspend or delete accounts that break these terms. A player cannot re-add an account an admin removed. Appeals go to the admins on Discord.

## The service
Chulacraft is a free, volunteer-run community project provided "as is". We may change, pause or shut down the website or server, or reset worlds, at any time. To the extent the law allows, we are not liable for lost progress, items or downtime.

## Not official
Chulacraft is not affiliated with or endorsed by Chulalongkorn University, Mojang Studios, Microsoft, Discord or Google. Minecraft is a trademark of Mojang Synergies AB.

## Ending
You may stop using Chulacraft and ask for your account to be deleted at any time. These terms end when your account is deleted, except sections 5 and 6.

## Changes
We may update these terms. The effective date above will change, and significant changes are announced on Discord. Using the service after a change means you accept it.

## Governing law
These terms are governed by the laws of Thailand.

## Contact
Message the Chulacraft admins on our [Discord server](/discord).`,
};
