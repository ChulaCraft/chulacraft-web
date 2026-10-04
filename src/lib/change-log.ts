const PROFILE_FIELDS: Record<string, string> = { first_name: "first name", last_name: "last name", nickname: "nickname", study_level: "study level", faculty: "faculty", major: "major" };

/** Turns one account_change_log row into a short past-tense phrase for admin screens. */
export function describeChange(field: string, oldValue: string | null, newValue: string | null): string {
  switch (field) {
    case "minecraft_username":
      if (!oldValue) return `added ${newValue}`;
      if (!newValue) return `removed ${oldValue}`;
      return `replaced ${oldValue} with ${newValue}`;
    case "is_active":
      return newValue === "true" ? "restored a Minecraft account" : "removed a Minecraft account";
    case "desired_whitelisted":
      return newValue === "true" ? "put an account back on the whitelist" : "removed an account from the whitelist";
    case "role":
      return `changed role to ${newValue}`;
    case "email":
      return newValue ? `verified Chula as ${newValue}` : "reset the Chula link";
    case "guest_verified":
      return newValue === "true" ? "marked as verified (guest)" : "removed guest status";
    case "google":
      return newValue ? `linked personal Google ${newValue}` : "unlinked personal Google";
    default:
      if (field in PROFILE_FIELDS) return `updated ${PROFILE_FIELDS[field]}`;
      return `changed ${field.replaceAll("_", " ")}`;
  }
}
