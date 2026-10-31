import { requireArea } from "@/app/admin/staff-gate";
import { timed } from "@/lib/perf";

export default async function Layout({ children }: { children: React.ReactNode }) {
  await timed("requireArea", requireArea("admin"));
  return children;
}
