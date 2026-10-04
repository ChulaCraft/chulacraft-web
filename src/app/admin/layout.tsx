import { notFound } from "next/navigation";
import { requireVerifiedUser } from "@/lib/verified-user";
import styles from "./admin.module.css";

// Real gate: every admin RPC re-checks the caller's role in the database.
// This layout only keeps non-admins from seeing the admin screens at all.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireVerifiedUser();
  if (!session) throw new Error("Could not load admin.");
  const { supabase } = session;
  const { data: role } = await supabase.rpc("current_app_role");
  if (role !== "owner" && role !== "admin") notFound();

  return (
    <main className={`container ${styles.main}`}>{children}</main>
  );
}
