"use client";

import { RefreshCcw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

import { MissingFrameStrip } from "@/components/marketing/marketing-not-found";
import { Logo } from "@/components/shared/logo";
import { NotFoundScreen } from "@/components/shared/not-found-screen";
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
          icon={RefreshCcw}
          eyebrow="Error"
          title="That one didn't develop."
          description="Something went wrong loading this page, and it's on us, not you. Try again; if it keeps happening, we want to know."
          actions={
            <>
              <Button size="lg" className="h-11 px-6 text-base" onClick={reset}>
                Try again
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-11 px-6 text-base"
              >
                <Link href="/">Back home</Link>
              </Button>
            </>
          }
          footnote={
            <div className="flex flex-col items-center gap-5">
              <p className="text-muted-foreground">
                Still stuck?{" "}
                <Link
                  href="/contact"
                  className="font-medium text-foreground underline-offset-2 hover:underline"
                >
                  Tell us what happened
                </Link>
                .
              </p>
              <MissingFrameStrip label="500" />
            </div>
          }
        />
      </main>
    </div>
  );
}
