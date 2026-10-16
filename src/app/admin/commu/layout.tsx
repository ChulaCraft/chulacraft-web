import { requireArea } from "@/app/admin/staff-gate";

export default async function Layout({ children }: { children: React.ReactNode }) {
  await requireArea("community");
  return children;
}
