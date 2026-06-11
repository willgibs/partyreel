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
          <h1 className="font-heading text-3xl text-balance sm:text-4xl">
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
            className="text-xs text-muted-foreground/70"
          >
            Error code: <span className="font-mono">{error.digest}</span>
          </p>
        )}
      </div>
    </main>
  );
}
