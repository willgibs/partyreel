import { requireNamedProfile } from "@/app/(app)/name-gate";

// THE NAME GATE for /account (name-gate, 2026-09-22). Until this gate, a
// nameless profile rendered /account normally — the one gap in Will's ruling
// (rulings.md "the morning after the identity round"): "an account without a
// name wasn't moving around the app as a normal user." /account can no longer
// set the name itself either now that a nameless visit never reaches it;
// /welcome (this redirects to) is the one write path (auth-accounts.md).
export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireNamedProfile();
  return children;
}
