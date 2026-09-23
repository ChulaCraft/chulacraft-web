import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { createClient } from "@/lib/supabase/server";
import styles from "./admin.module.css";

// Real gate: every admin RPC re-checks the caller's role in the database.
// This layout only keeps non-admins from seeing the admin screens at all.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");
  const { data: role } = await supabase.rpc("current_app_role");
  if (role !== "owner" && role !== "admin") notFound();

  return (
    <main className={`${styles.page} auth-scene`}>
      <div className={`${styles.backdrop} auth-scene-backdrop`} />
      <SiteHeader user={user} />
      <div className={styles.shell}>
        <nav className={styles.adminNav} aria-label="Admin">
          <Link href="/admin">Players</Link>
          <Link href="/admin/restore">Restore accounts</Link>
        </nav>
        {children}
      </div>
    </main>
  );
}
