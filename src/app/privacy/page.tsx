import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal-page";
import styles from "@/components/legal-page.module.css";
import { discordCommunityUrl } from "@/lib/site-links";

export const metadata: Metadata = {
  title: "Privacy Policy | ChulaCraft",
  description: "What Chulacraft collects, why, and your choices.",
};

const collected = [
  ["Discord user ID and username", "Discord sign-in", "Your login and identifying you in the community"],
  ["Chula Google email and Google account ID", "“Verify with Chula Google”", "Confirming you are a Chula member, and making sure one Chula account verifies only one player"],
  ["Personal Google email and account ID (optional)", "“Add personal Google”", "Letting you sign in with that account"],
  ["Minecraft UUID and username", "You enter it; we confirm it with Mojang’s public API", "Adding you to the server whitelist"],
  ["Account change history (what changed, when, by you or an admin)", "This website", "Security, abuse prevention and resolving disputes"],
  ["Registration attempt counts", "This website", "Rate limiting"],
  ["Anonymous page-view statistics", "Vercel Analytics (no cookies, no cross-site tracking)", "Understanding how the site is used"],
] as const;

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" sections={["What we collect", "How we use it", "Google user data", "Who can see it", "How long we keep it", "Your rights", "Security", "Minors", "Changes", "Contact"]}>
      <p>
        Chulacraft is a community Minecraft Java Edition server for Chulalongkorn University students and staff.
        This policy explains what we collect through this website, why, and your choices. We follow Thailand’s
        Personal Data Protection Act B.E. 2562 (PDPA).
      </p>

      <h2 id="s1"><span>1</span> What we collect</h2>
      <div className={styles.tableWrap}>
        <table>
          <thead><tr><th>Data</th><th>Source</th><th>Why</th></tr></thead>
          <tbody>
            {collected.map(([data, source, why]) => <tr key={data}><td>{data}</td><td>{source}</td><td>{why}</td></tr>)}
          </tbody>
        </table>
      </div>
      <p>
        From Google and Discord we receive only your basic profile and email address. We never read your Google
        Drive, Gmail, contacts or Discord messages, and we never see your passwords.
      </p>

      <h2 id="s2"><span>2</span> How we use it</h2>
      <p>
        Only to run Chulacraft: signing you in, verifying Chula membership, managing the whitelist, moderating the
        server and keeping the service secure. We do not sell or rent your data or use it for advertising.
      </p>

      <h2 id="s3"><span>3</span> Google user data</h2>
      <p>
        Chulacraft’s use of information received from Google APIs adheres to the{" "}
        <a href="https://developers.google.com/terms/api-services-user-data-policy">Google API Services User Data Policy</a>,
        including the Limited Use requirements. Google data is used only for sign-in and Chula verification and is
        shared with no one except the service providers listed below.
      </p>

      <h2 id="s4"><span>4</span> Who can see it</h2>
      <ul>
        <li><strong>Server admins</strong> see your Discord username, Chula email, linked Google email, Minecraft accounts and change history, to moderate the server.</li>
        <li><strong>Other players</strong> see your Minecraft username in game, as on any Minecraft server.</li>
        <li><strong>Service providers</strong> that run the service for us: Supabase (database and login), Vercel (hosting and analytics), Discord and Google (sign-in), and Mojang/Microsoft (username lookup).</li>
        <li>We disclose data when the law requires it.</li>
      </ul>

      <h2 id="s5"><span>5</span> How long we keep it</h2>
      <p>
        While your account exists. Your Chula verification record stays even if you unlink that Google account, so one
        Chula account cannot verify several players; an admin can reset it on request. After your account is deleted,
        change history is kept for up to 12 months for security, then deleted.
      </p>

      <h2 id="s6"><span>6</span> Your rights</h2>
      <p>
        Under the PDPA you can ask to access, correct, export or delete your data, or withdraw your consent. You can
        unlink your personal Google account from the dashboard at any time. For anything else, contact an admin (see
        below). Deleting your account also removes you from the whitelist.
      </p>

      <h2 id="s7"><span>7</span> Security</h2>
      <p>
        Your data is stored in Supabase with row-level security: players can read only their own records, and every
        change goes through checked server functions. No system is perfectly secure; if a breach affects you, we
        will tell you as the PDPA requires.
      </p>

      <h2 id="s8"><span>8</span> Minors</h2>
      <p>If you are under 20, you confirm that a parent or guardian agrees to your use of Chulacraft.</p>

      <h2 id="s9"><span>9</span> Changes</h2>
      <p>We will post changes on this page and update the effective date. Significant changes are announced on our Discord.</p>

      <h2 id="s10"><span>10</span> Contact</h2>
      <p>
        Message the Chulacraft admins on our <a href={discordCommunityUrl}>Discord server</a>. See also the{" "}
        <Link href="/terms">Terms of Service</Link>.
      </p>
      <p>
        <small>
          Chulacraft is a student community project, not an official service of Chulalongkorn University, Mojang,
          Microsoft, Discord or Google.
        </small>
      </p>
    </LegalPage>
  );
}
