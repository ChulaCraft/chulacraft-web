"use client";

import { useState } from "react";
import { ConfirmAction } from "@/components/confirm-action";
import { setRole } from "./actions";
import styles from "../../admin.module.css";

const BODY: Record<string, (name: string) => string> = {
  admin: () => "Admins can search players, reset Chula links, and restore accounts.",
  user: (name) => `${name} loses admin tools and goes back to a regular player account.`,
  owner: () => "Owners can change every player's role, including other owners and you. Only promote someone you'd trust to run the server.",
};

export function RoleControl({ userId, role, name, handle }: { userId: string; role: string; name: string; handle: string }) {
  const [draft, setDraft] = useState(role);
  const unchanged = draft === role;
  return (
    <div className="field">
      <label htmlFor="role" className="label">Role</label>
      <div className={styles.roleField}>
        <select id="role" className={`input ${styles.roleSelect}`} value={draft} onChange={(e) => setDraft(e.target.value)}>
          <option value="user">User</option>
          <option value="admin">Admin</option>
          <option value="owner">Owner</option>
        </select>
        {unchanged
          ? <button type="button" className="btn btn-sm" disabled>Change role</button>
          : <ConfirmAction
              action={setRole}
              fields={{ userId, role: draft }}
              trigger="Change role"
              triggerClassName="btn btn-sm btn-primary"
              title={draft === "owner" ? `Make ${handle} an owner?` : `Change ${name}'s role to ${draft}?`}
              body={BODY[draft](name)}
              confirmLabel={draft === "owner" ? "Make owner" : "Change role"}
              confirmClassName={draft === "owner" ? "btn btn-danger" : "btn btn-primary"}
              requireText={draft === "owner" ? handle : undefined}
              danger={draft === "owner"}
            />}
      </div>
    </div>
  );
}
