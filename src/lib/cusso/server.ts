import { getChulaSSOAppId, getChulaSSOAppSecret } from "../env";

export type ProfilePayload = {
  /** Student / staff ID number */
  uid: string;
  /** Chula IT account name (e.g. pkrerk) */
  username: string;
  /** First name (English) */
  firstname: string;
  /** Last name (English) */
  lastname: string;
  /** First name (Thai) */
  firstnameTH: string;
  /** Last name (Thai) */
  lastnameTH: string;
  /** University email address */
  email: string;
  /** LDAP display string (name, faculty, employee no.) */
  gecos: string;
  /** "student", "faculty", or both */
  roles: string[];
  /** Organizational unit / employee number (may be null) */
  ouid: string;
  /** True if the account has been disabled */
  disable: boolean;
};

export async function resolveTicket(ticket: string) {
  const response = await fetch("https://account.it.chula.ac.th/serviceValidation", {
    headers: { DeeAppId: getChulaSSOAppId(), DeeAppSecret: getChulaSSOAppSecret(), DeeTicket: ticket }
  });
  if (!response.ok) return { error: { status: response.status } };
  const profile: ProfilePayload = await response.json();
  return { profile };
}
