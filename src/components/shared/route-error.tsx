"use client";

import { useEffect } from "react";
import Link from "next/link";
import { CircleAlert } from "lucide-react";
import type { CSSProperties } from "react";

import { Button } from "@/components/ui/button";
import { captureError, type SentryArea } from "@/lib/observability/sentry";

type RouteErrorProps = {
  /** The render:* Sentry area for this boundary's route group. */
  area: SentryArea;
  error: Error & { digest?: string };
  reset: () => void;
};

// Shared UI for the route-group error.tsx boundaries. SECURITY: never renders
// error.message (server errors can carry internals); the screen is generic by
// design and the digest is the support correlation handle. Reuses the
// [data-not-found] entrance hook + --nf-i stagger from globals.css (same
// dead-end pattern as NotFoundScreen, which is server-only and owns no
// reporting, so this stays its own component).
export function RouteError({ area, error, reset }: RouteErrorProps) {
  useEffect(() => {
    captureError(area, error, { digest: error.digest });
  }, [area, error]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 sm:py-32">
      <div
        data-not-found
        className="flex w-full max-w-md flex-col items-center gap-5 text-center"
      >
        <div
          style={{ "--nf-i": 0 } as CSSProperties}
          className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground"
        >
          <CircleAlert className="size-6" aria-hidden />
        </div>
        <div
          style={{ "--nf-i": 1 } as CSSProperties}
          className="flex flex-col gap-3"
        >
          {/* The app's `page` step, the same rank a dead link takes inside the
              app (Will's type ruling, 2026-09-17). Every caller is app-side —
              (app), (guest), (auth), admin — and marketing has its own
              boundary, which passes surface="marketing" to NotFoundScreen. */}
          <h1 className="font-heading text-page text-balance">
            Something went wrong
          </h1>
          <p className="text-pretty text-muted-foreground">
            That&apos;s on us, not you. Try again, and if it keeps happening,
            let us know.
          </p>
        </div>
        <div
          style={{ "--nf-i": 2 } as CSSProperties}
          className="flex flex-col gap-3 sm:flex-row"
        >
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
        </div>
        {error.digest && (
          <p
            style={{ "--nf-i": 3 } as CSSProperties}
            className="text-xs text-faint"
          >
            Error code:{" "}
            <span className="rounded bg-muted px-1.5 py-0.5 text-foreground/80 tabular-nums select-all">
              {error.digest}
            </span>
          </p>
        )}
      </div>
    </main>
  );
}
