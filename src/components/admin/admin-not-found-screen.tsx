import Link from "next/link";
import { FileQuestion } from "lucide-react";

import { Container } from "@/components/shared/container";
import { Logo } from "@/components/shared/logo";
import { NotFoundScreen } from "@/components/shared/not-found-screen";
import { Button } from "@/components/ui/button";

/**
 * THE ADMIN HOST'S REFUSED PATH (Will, `admin-404=portal`, 2026-09-19).
 *
 * The admin surface allow-lists its own paths and the proxy REWRITES everything
 * else to a sentinel no route serves, so the root not-found renders under a real
 * 404. Until now that meant the marketing 404, whose three footnote links
 * (features, pricing, contact) all 404 AGAIN on this host, because none of those
 * routes exist here: "a 404 that offers three more dead ends is worse than no
 * 404 at all". This is the screen that answers the surface the proxy actually
 * rewrote to, and every way out of it stays on this host.
 *
 * ★ SESSION-LESS, AND THAT IS A SECURITY PROPERTY, NOT A CONVENIENCE. The real
 * AdminShell takes the operator's email and the four alert counts, which means
 * requireAdmin() and four privileged queries: a refused path is reached by
 * ANYONE who types a URL at admin.partyreel.com, signed out included, so this
 * screen asks the database nothing and renders no session state. It also mounts
 * no sign-out form, because there may be no session to sign out of. What is
 * left is the shape AdminShell's header keeps: the wordmark, the Ops badge, one
 * Container, minus the nav and the operator's row.
 *
 * ★ NOT admin/not-found.tsx. That one is a missing RECORD inside the portal,
 * already past requireAdmin() and MFA, and it renders inside the real shell.
 * This one is a path the host does not serve at all.
 */
export function AdminNotFoundScreen() {
  return (
    // `flex-1` rather than a viewport height: this renders as the direct child
    // of app/layout.tsx's `flex min-h-full flex-col` body, which already fills
    // the screen, and a second 100vh here would make the column taller than the
    // window whenever the browser chrome moves.
    <div className="flex min-h-0 flex-1 flex-col bg-background text-foreground">
      <header className="border-b">
        <Container className="flex h-14 items-center">
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
        </Container>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
        <NotFoundScreen
          icon={FileQuestion}
          title="This page isn't part of the operations portal"
          description="This host only serves the operations portal. If you followed a link here, it was meant for the marketing site or the app instead."
          actions={
            <Button asChild size="cta">
              <Link href="/admin">Back to overview</Link>
            </Button>
          }
        />
      </main>
    </div>
  );
}
