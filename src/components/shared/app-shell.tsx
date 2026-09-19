import Link from "next/link";

import { Container } from "@/components/shared/container";
import { Logo } from "@/components/shared/logo";
import { cn } from "@/lib/utils";

type AppShellProps = {
  children: React.ReactNode;
  /** Right-aligned header slot (user menu, primary action). */
  headerActions?: React.ReactNode;
};

/**
 * ★ A WIDE PAGE ASKS FOR ITSELF, AND IT ASKS IN CSS.
 *
 * Will's `host=same` (2026-09-19): "The host's album runs to the window's edges
 * and the page lines up the way the guest's does, so a host sees as many
 * photographs at once as a guest." That means the shell's own 1280 cap has to
 * let go on the event page — the LOGO shares the gallery's left line — while
 * every other host page keeps its centred column.
 *
 * The shell is rendered by the `(app)` LAYOUT and the page is its grandchild,
 * so a page cannot hand a prop back up to it. `:has()` is the way the cascade
 * already spells "a page inside me asked for this": the page marks its root
 * `data-app-wide`, and both of the shell's containers drop the cap. No client
 * boundary, no context, no measured layout shift on the way in.
 *
 * It is one declaration per container rather than one on the shell because the
 * cap lives on the containers; the group is on the shell so the HEADER, which
 * is the page's sibling and not its ancestor, can read the same answer.
 */
const WIDE_WHEN_ASKED = "group-has-[[data-app-wide]]/shell:max-w-none";

/** Chrome for the authenticated host app (the `(app)` route group). */
export function AppShell({ children, headerActions }: AppShellProps) {
  return (
    <div className="group/shell flex min-h-full flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <Container
          className={cn(
            "flex h-14 items-center justify-between gap-4",
            WIDE_WHEN_ASKED,
          )}
        >
          <Link href="/dashboard" aria-label="Partyreel dashboard">
            <Logo />
          </Link>
          {headerActions && (
            <div className="flex items-center gap-2">{headerActions}</div>
          )}
        </Container>
      </header>
      <main className="flex-1 py-8">
        <Container className={WIDE_WHEN_ASKED}>{children}</Container>
      </main>
    </div>
  );
}
