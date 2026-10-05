import Link from "next/link";
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
    <main className={`container ${styles.main}`}>
      <nav className={styles.subnav} aria-label="Admin sections">
        <Link href="/admin">Overview</Link>
        <Link href="/admin/players">Players</Link>
        <Link href="/admin/achievements">Achievements</Link>
        <Link href="/admin/announcements">Announcements</Link>
        <Link href="/admin/server">Server</Link>
        <Link href="/admin/restore">Removed accounts</Link>
      </nav>
      {children}
    </main>
  );
}
