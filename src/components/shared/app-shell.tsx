import Link from "next/link";

import { Container } from "@/components/shared/container";
import { Logo } from "@/components/shared/logo";

type AppShellProps = {
  children: React.ReactNode;
  /** Right-aligned header slot (user menu, primary action). */
  headerActions?: React.ReactNode;
};

/** Chrome for the authenticated host app (the `(app)` route group). */
export function AppShell({ children, headerActions }: AppShellProps) {
  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <Container className="flex h-14 items-center justify-between gap-4">
          <Link href="/dashboard" aria-label="Partyreel dashboard">
            <Logo />
          </Link>
          {headerActions && (
            <div className="flex items-center gap-2">{headerActions}</div>
          )}
        </Container>
      </header>
      <main className="flex-1 py-8">
        <Container>{children}</Container>
      </main>
    </div>
  );
}
