import Link from "next/link";

import { Logo } from "@/components/shared/logo";

/**
 * THE GUEST SURFACE'S FAILURE BAR: every failure screen renders inside its real
 * surface's shell, and the guest surface is no exception.
 *
 * ★ SESSION-LESS, AND THAT IS THE WHOLE POINT. `GuestHeader` is the real guest
 * chrome, but it is a client island that resolves a Supabase session on mount
 * and fetches `/api/me/menu`, and it needs a `qrToken` and an `eventId` to do
 * it. A bad-link 404 has neither, and a crash boundary must not go asking the
 * network for anything: the render that just failed is exactly the render whose
 * data may be what failed. So the two failure surfaces (the bad-token 404 and
 * the guest crash) wear this row instead: the wordmark, linking home, and
 * nothing else.
 *
 * Even on a failure screen, a guest surface belongs to the host's event, so this
 * stays the quietest possible Partyreel mark. When there is no event left to
 * return to, the wordmark is the only way out the screen can honestly offer.
 */
export function GuestBar() {
  return (
    <header className="flex items-center border-b border-border/60 px-5 py-3">
      <Link href="/" aria-label="Partyreel home">
        <Logo />
      </Link>
    </header>
  );
}
