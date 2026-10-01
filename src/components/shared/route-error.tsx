"use client";

import { useEffect, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { CircleAlert } from "lucide-react";

import { HelpLine, NotFoundScreen } from "@/components/shared/not-found-screen";
import { Button } from "@/components/ui/button";
import { captureError, type SentryArea } from "@/lib/observability/sentry";

/** The boundaries this component draws: every `render:*` area there is. */
type RouteErrorArea = Extract<SentryArea, `render:${string}`>;

/**
 * What Next hands every `error.js` that a screen reads: the crash, and `unstable_retry` (16.2), the router's refresh
 * with the reset. The bare `reset` it also hands is never read (`TryAgain` says why).
 */
export type CrashBoundaryProps = {
  error: Error & { digest?: string };
  unstable_retry: () => void;
};

type RouteErrorProps = {
  /** The render:* Sentry area for this boundary's route group. */
  area: RouteErrorArea;
  error: Error & { digest?: string };
  /** The boundary's `unstable_retry` (`TryAgain` says why it is never the bare `reset`). */
  retry: () => void;
};

/**
 * ★ TRY AGAIN ASKS FOR THE PAGE AGAIN (crumbs-30, from crumbs-28). It called the boundary's `reset`, which re-renders
 * what the router already holds without asking the server, so a crash a Server Component threw came straight back
 * and the button looked dead. `retry` is the `unstable_retry` Next 16.2 hands every `error.js` (the router's refresh
 * and the reset in one transition, the docs' own choice over `reset`), so the page is drawn again from what the server
 * answers now. And while it is asked for, the button says so and waits, the album card's words and behaviour
 * (`album-boundary.tsx`): a retry that crashes again is seen to have been tried. Every crash screen's one button: the
 * five groups' and the root's through `RouteError`, the marketing site's through its own screen; `global-error`,
 * which may import nothing of the kit, draws the same two words itself.
 */
export function TryAgain({ retry }: { retry: () => void }) {
  const [retrying, startRetry] = useTransition();
  return (
    <Button size="cta" disabled={retrying} onClick={() => startRetry(retry)}>
      {retrying ? "Trying again…" : "Try again"}
    </Button>
  );
}

/**
 * THE QUIET LINE, worded for the surface that crashed (Will, `ways-out=guided`,
 * 2026-09-19). Module-local on purpose: the five `error.tsx` files stay one line
 * each, which is what keeps five boundaries from drifting into five screens
 * again, and a new surface adds a row here rather than a paragraph of JSX.
 *
 * The portal's line carries no href: no runbook page exists to point at, and his
 * `ways-out` overrule named the operator as the one reader who may not want a
 * pointer at all. An unlinked line also beats a link that 404s, which /help
 * would do on a host that serves nothing but the portal.
 */
const HELP_BY_AREA: Record<RouteErrorArea, ReactNode> = {
  "render:app": <HelpLine href="/help">Visit the help center</HelpLine>,
  "render:guest": <HelpLine href="/help">Visit the help center</HelpLine>,
  "render:auth": <HelpLine href="/contact">Tell us what happened</HelpLine>,
  "render:admin": <HelpLine>Check the runbook</HelpLine>,
  // MarketingRouteError draws the marketing crash; this row exists so the map
  // is total and a mistaken `area` still renders a sentence rather than nothing.
  "render:marketing": (
    <HelpLine href="/contact">Tell us what happened</HelpLine>
  ),
  // The root boundary (src/app/error.tsx): a crash inside a group's OWN layout,
  // which skipped every branded boundary below it. Something structural failed,
  // so the line that matters is the one that reaches a person.
  "render:global": <HelpLine href="/contact">Tell us what happened</HelpLine>,
};

// THE CRASH WRAPPER for the route-group error.tsx boundaries, and the only
// place in the failure family that reports (Will, `grammar=shared`,
// 2026-09-19). The screen itself is NotFoundScreen now, so a dead end and a
// crash are one grammar; what stays here is the reporting effect, the digest
// and the per-surface words around it.
//
// ★ captureError STAYS HERE AND NEVER MOVES DOWN. NotFoundScreen draws six 404s
// as well as these five crashes; a capture inside the primitive would file a
// Sentry issue for every real not-found in the product.
//
// SECURITY: never renders error.message (server errors can carry internals);
// the screen is generic by design and the digest is the support correlation
// handle, which ErrorDigest now makes copyable rather than retypable.
export function RouteError({ area, error, retry }: RouteErrorProps) {
  useEffect(() => {
    captureError(area, error, { digest: error.digest });
  }, [area, error]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 sm:py-32">
      <NotFoundScreen
        icon={CircleAlert}
        // The app's `page` step, the same rank a dead link takes inside the app
        // (Will's type ruling, 2026-09-17): every caller here is app-side, and
        // marketing has its own boundary, which passes surface="marketing".
        title="Something went wrong"
        description="That's on us, not you. Try again, and if it keeps happening, let us know."
        actions={
          <>
            <TryAgain retry={retry} />
            <Button asChild size="cta" variant="outline">
              <Link href="/">Back home</Link>
            </Button>
          </>
        }
        help={HELP_BY_AREA[area]}
        digest={error.digest}
      />
    </main>
  );
}
