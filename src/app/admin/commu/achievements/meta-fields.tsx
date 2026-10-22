import { TIER_LABELS, TIERS, toTier } from "@/components/achievement-grid";

type Role = { role_id: string; label: string };

/** Tier and Discord role, shared by the New and edit forms. Roles come only
 *  from the admin-curated list on /admin/settings (20261026000001), so this
 *  is a select, never free text. `roles` is null when the list didn't load:
 *  the current mapping is then posted back unchanged instead of cleared. */
export function MetaFields({ idPrefix, roles, tier, roleId }: { idPrefix: string; roles: Role[] | null; tier: string; roleId: string | null }) {
  return <>
    <div className="field">
      <label htmlFor={`${idPrefix}-tier`}>Tier</label>
      <select id={`${idPrefix}-tier`} className="input" name="tier" defaultValue={toTier(tier)} aria-describedby={`${idPrefix}-tier-help`}>
        {TIERS.map((value) => <option key={value} value={value}>{TIER_LABELS[value]}</option>)}
      </select>
      <p id={`${idPrefix}-tier-help`} className="field-help">Sets the badge&apos;s frame colour. The tier is also written on the badge.</p>
    </div>
    {roles === null ? (
      <input type="hidden" name="discordRoleId" value={roleId ?? ""} />
    ) : roles.length === 0 ? (
      <div className="field">
        <p className="field-help">Discord roles: none to pick yet. An owner or admin adds the roles badges may give in Site settings.</p>
      </div>
    ) : (
      <div className="field">
        <label htmlFor={`${idPrefix}-role`}>Discord role <span className="optional">(optional)</span></label>
        <select id={`${idPrefix}-role`} className="input" name="discordRoleId" defaultValue={roleId ?? ""} aria-describedby={`${idPrefix}-role-help`}>
          <option value="">None</option>
          {roles.map((role) => <option key={role.role_id} value={role.role_id}>{role.label}</option>)}
        </select>
        <p id={`${idPrefix}-role-help`} className="field-help">Players holding this badge get the role on Discord.</p>
      </div>
    )}
  </>;
}
