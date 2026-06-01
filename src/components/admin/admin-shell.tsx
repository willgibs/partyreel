import Link from "next/link";
import {
  Flag,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  ShieldCheck,
  Users,
} from "lucide-react";

import { signOutAction } from "@/app/(auth)/actions";
import { Container } from "@/components/shared/container";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";

// Chrome for the operations portal — deliberately distinct from the host AppShell
// (an "Ops" mark + the operator nav) so it's obvious you're in the internal tool.
// Links use the canonical /admin/* paths so they resolve on both the subdomain and
// localhost (dev). Each new operational surface adds one NAV entry.
const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/support", label: "Support", icon: LifeBuoy },
  { href: "/admin/applicants", label: "Applicants", icon: Users },
  { href: "/admin/reports", label: "Reports", icon: Flag },
  { href: "/admin/security", label: "Security", icon: ShieldCheck },
];

export function AdminShell({
  email,
  children,
}: {
  email: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <Container className="flex h-14 items-center justify-between gap-4">
          <div className="flex items-center gap-6">
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
            <nav className="flex items-center gap-1">
              {NAV.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <Icon className="size-4" />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
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
