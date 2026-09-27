import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal-page";
import { MAX_MINECRAFT_ACCOUNTS } from "@/lib/registration";
import { discordCommunityUrl } from "@/lib/site-links";

export const metadata: Metadata = {
  title: "Terms of Service | Chulacraft",
  description: "The rules for using the Chulacraft website and Minecraft server.",
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service">
      <p>
        By signing in to Chulacraft you agree to these terms and our <Link href="/privacy">Privacy Policy</Link>.
      </p>

      <h2>1. Eligibility</h2>
      <p>
        You must be a current Chulalongkorn University student or staff member with a valid @chula.ac.th or
        @student.chula.ac.th Google account, own a legitimate Minecraft Java Edition account, and follow the
        Discord and Google terms of service.
      </p>

      <h2>2. Your account</h2>
      <ul>
        <li>One person, one Chulacraft account. It is built on one Discord account and verified by one Chula Google account.</li>
        <li>A Chula account can verify only one Chulacraft account, and you cannot swap it yourself; ask an admin.</li>
        <li>You may register up to {MAX_MINECRAFT_ACCOUNTS} Minecraft accounts that you own or are allowed to use. You are responsible for everything done with them on the server.</li>
        <li>Keep your sign-in accounts secure, and tell an admin if you think your account was misused.</li>
      </ul>

      <h2>3. Rules</h2>
      <p>You must not:</p>
      <ul>
        <li>Impersonate anyone, or verify for or with someone else’s Chula account.</li>
        <li>Cheat, use hacked clients or exploits, grief, or harass other players.</li>
        <li>Attack, overload, scrape or try to bypass the security of the website or server.</li>
        <li>
          Break Thai law, university regulations, or the{" "}
          <a href="https://www.minecraft.net/eula">Minecraft End User License Agreement</a>.
        </li>
      </ul>
      <p>In-game rules posted on our Discord are part of these terms.</p>

      <h2>4. Moderation</h2>
      <p>
        Admins may remove any Minecraft account from the whitelist and suspend or delete accounts that break these
        terms. A player cannot re-add an account an admin removed. Appeals go to the admins on Discord.
      </p>

      <h2>5. The service</h2>
      <p>
        Chulacraft is a free, volunteer-run community project provided “as is”. We may change, pause or shut down the
        website or server, or reset worlds, at any time. To the extent the law allows, we are not liable for lost
        progress, items or downtime.
      </p>

      <h2>6. Not official</h2>
      <p>
        Chulacraft is not affiliated with or endorsed by Chulalongkorn University, Mojang Studios, Microsoft, Discord
        or Google. Minecraft is a trademark of Mojang Synergies AB.
      </p>

      <h2>7. Ending</h2>
      <p>
        You may stop using Chulacraft and ask for your account to be deleted at any time. These terms end when your
        account is deleted, except sections 5 and 6.
      </p>

      <h2>8. Changes</h2>
      <p>
        We may update these terms. The effective date above will change, and significant changes are announced on
        Discord. Using the service after a change means you accept it.
      </p>

      <h2>9. Governing law</h2>
      <p>These terms are governed by the laws of Thailand.</p>

      <h2>10. Contact</h2>
      <p>Message the Chulacraft admins on our <a href={discordCommunityUrl}>Discord server</a>.</p>
    </LegalPage>
  );
}
