import Link from "next/link";
import { LogOut } from "lucide-react";

import { signOutAction } from "@/app/(auth)/actions";
import { AdminNav } from "@/components/admin/admin-nav";
import {
  OperatorAlerts,
  type OperatorAlertCounts,
} from "@/components/admin/operator-alerts";
import { Container } from "@/components/shared/container";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";

// Chrome for the operations portal — deliberately distinct from the host AppShell (an "Ops" mark +
// the operator nav) so it's obvious you're in the internal tool. The nav is a single dropdown
// ([admin-nav.tsx]); the alerts bell surfaces pending work portal-wide ([operator-alerts.tsx]).
export function AdminShell({
  email,
  alerts,
  children,
}: {
  email: string | null;
  alerts: OperatorAlertCounts;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <Container className="flex h-14 items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              aria-label="Partyreel operations"
              className="flex items-center gap-2"
            >
              <Logo />
              <span className="rounded-md bg-foreground px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-background uppercase">
                Ops
              </span>
            </Link>
            <AdminNav />
          </div>
          <div className="flex items-center gap-2">
            <OperatorAlerts {...alerts} />
            {email && (
              <span className="hidden text-xs text-muted-foreground md:inline">
                {email}
              </span>
            )}
            {/* Sign-out is the shared server action; on the subdomain it clears the
                host-isolated admin cookies and redirects to /login. */}
            <form action={signOutAction}>
              <Button type="submit" variant="ghost" size="sm">
                <LogOut className="size-4" />
                Sign out
              </Button>
            </form>
          </div>
        </Container>
      </header>
      <main className="flex-1 py-8">
        <Container>{children}</Container>
      </main>
    </div>
  );
}
