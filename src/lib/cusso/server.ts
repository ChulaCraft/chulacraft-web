import { AuthError } from "@supabase/supabase-js";
import { getChulaSSOAppId, getChulaSSOAppSecret } from "../env";

export type ProfilePayload = {
  /**Student / staff ID number */
  uid:	string,
  /** Chula IT account name (e.g. pkrerk) */
  username:	string,
  /** First name (English) */
  firstname:	string,
  /** Last name (English) */
  lastname:	string,
  /** First name (Thai) */
  firstnameTH:	string,
  /** Last name (Thai) */
  lastnameTH:	string,
  /** University email address */
  email:	string,
  /** LDAP display string (name, faculty, employee no.) */
  gecos:	string,
  /**	"student", "faculty", or both */
  roles:	string[],
  /** Organizational unit / employee number (may be null) */
  ouid:	string,
  /** True if the account has been disabled */
  disable:	boolean,
};

export async function resolveTicket(ticket: string) {
    const headers = new Headers();
    headers.append("DeeAppId", getChulaSSOAppId());
    headers.append("DeeAppSecret", getChulaSSOAppSecret());
    headers.append("DeeTicket", ticket);
    const f = await fetch("https://account.it.chula.ac.th/serviceValidation", { headers });
    if (!f.ok) {
        if (f.status == 401) return { error: new AuthError("ticket resolve failed", 401, "no_authorization") };
        return { error: new AuthError("ticket resolve failed", f.status, "unexpected_failure") };
    }
    let profile: ProfilePayload = await f.json();
    return { profile };
}