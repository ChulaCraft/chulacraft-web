import { requireArea } from "@/app/admin/staff-gate";
import { timed } from "@/lib/perf";

// The console's WebSocket origin is in the CSP connect-src for every page
// (src/proxy.ts, managerSocketOrigin), so this layout only gates the section.
export default async function Layout({ children }: { children: React.ReactNode }) {
  await timed("requireArea", requireArea("admin"));
  return children;
}
