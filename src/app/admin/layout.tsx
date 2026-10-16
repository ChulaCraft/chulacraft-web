import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireVerifiedUser } from "@/lib/verified-user";
import { isStaff } from "@/lib/staff";
import { AdminNav } from "./admin-nav";
import { myRole } from "./staff-gate";
import styles from "./admin.module.css";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin | ChulaCraft" } };

// Real gate: every admin RPC re-checks the caller's role in the database.
// This layout only keeps non-admins from seeing the admin screens at all.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireVerifiedUser();
  if (!session) throw new Error("Could not load admin.");
  const role = await myRole();
  if (!isStaff(role)) notFound();

  return (
    <main className={`container ${styles.main}`}>
      <AdminNav role={role} />
      {children}
    </main>
  );
}
