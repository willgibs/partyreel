import { requireNamedProfile } from "@/app/(app)/name-gate";

// THE NAME GATE for /me, as for /account and /dashboard: a nameless account reaches /welcome, the one page that can
// name it, before any page of the app (`name-gate.test.ts` holds every (app) route but /welcome to this layout).
export default async function MeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireNamedProfile();
  return children;
}
