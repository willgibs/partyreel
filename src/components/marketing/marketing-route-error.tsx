"use client";

import Link from "next/link";
import { useEffect } from "react";

import { MissingFrameStrip } from "@/components/marketing/marketing-not-found";
import { Logo } from "@/components/shared/logo";
import { HelpLine, NotFoundScreen } from "@/components/shared/not-found-screen";
import { Button } from "@/components/ui/button";
import { captureError } from "@/lib/observability/sentry";

/**
 * THE BRANDED MARKETING ERROR SCREEN (R5): mounted by (marketing)/error.tsx
 * ONLY (the MarketingNotFound precedent; app areas keep the shared
 * RouteError). The boundary replaces the whole group subtree INCLUDING the
 * chrome and the skin wrappers, so this screen is self-sufficient: it forces
 * the paper skin (the root-404 ruling: marketing surfaces are authored, never
 * session-themed), brings a logo-only top row instead of the full header
 * (re-rendering real chrome inside a crash boundary risks re-crashing it;
 * global-error backstops), and reuses the 404's screen + tilted-strip
 * vocabulary with a "500" frame so the two dead ends read as siblings.
 * No error details are leaked; captureError mirrors RouteError's contract.
 *
 * ★ THE STRIP IS THE ICON NOW (Will, `picture=today` with his note,
 * 2026-09-19: "it does look weird beneath the content. It may look better as a
 * replacement for the icon above"). The RefreshCcw circle is gone and the 500
 * strip stands in its place, which keeps this screen and the group 404s reading
 * as one pair: on both, the photographs with one frame missing ARE the picture.
 *
 * ★ AND THE DIGEST PRINTS (Will, `code=always`). It never did on this screen:
 * the marketing crash was the one boundary that received a digest from Next and
 * showed nothing, so a reporter who followed "Tell us what happened" arrived
 * with no code at all. It is the same ErrorDigest the app boundaries draw.
 */
export function MarketingRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    captureError("render:marketing", error, { digest: error.digest });
  }, [error]);

  return (
    <div className="surface-paper flex min-h-dvh flex-col bg-background text-foreground">
      <div className="flex h-16 items-center px-6">
        <Link href="/" aria-label="Partyreel home">
          <Logo />
        </Link>
      </div>
      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <NotFoundScreen
          // Marketing's half of the dead-end ladder: the `prose` step.
          surface="marketing"
          visual={<MissingFrameStrip label="500" />}
          eyebrow="Error"
          title="That one didn't develop."
          description="Something went wrong loading this page, and it's on us, not you. Try again; if it keeps happening, we want to know."
          actions={
            <>
              <Button size="cta" onClick={reset}>
                Try again
              </Button>
              <Button asChild size="cta" variant="outline">
                <Link href="/">Back home</Link>
              </Button>
            </>
          }
          // The line this screen already carried, moved into the slot every
          // failure page now shares (Will, `ways-out=guided`): same words, same
          // destination, one rank quieter than the actions and one above the
          // code, so the four surfaces stack their ways out in the same order.
          help={<HelpLine href="/contact">Tell us what happened</HelpLine>}
          digest={error.digest}
        />
      </main>
    </div>
  );
}
