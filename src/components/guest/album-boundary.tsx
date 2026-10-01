"use client";

import { Component, useEffect, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ImageOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { captureError } from "@/lib/observability/sentry";
import { cn } from "@/lib/utils";

/**
 * THE ALBUM'S OWN BOUNDARY (crumbs-28, from `owner-album`): a crash where the album renders is the album's failure,
 * never the page's.
 *
 * With nothing nearer, a throw there reached the guest route's `error.tsx`: the whole page went to "Something went
 * wrong", the header, the door and the upload with it, for an album the guest had not even looked at yet. Wrapped
 * around the album and nothing else, this keeps the header, the door and Add photos standing, while the album alone
 * says it could not load, with a way back. It was built for a seed whose read failed, which threw where the live
 * source `use()`d it; since crumbs-30 that seed is read and never thrown (`gallery-live.tsx`: the source stands, so her
 * uploads list stays, and its own first sync heals the album with no refresh, the view drawing this boundary's card,
 * `AlbumFailedCard`, while it cannot), so what reaches here is a crash while drawing the album itself.
 *
 * ★ "TRY AGAIN" RE-FETCHES, IT DOES NOT MERELY RE-RENDER: the router's refresh and the boundary's reset ride ONE
 * transition, so React commits them together and the album renders with the FRESH seed the page's render hands it; a
 * bare reset would `use()` the same rejected promise and fail again. Next's own navigation throws (a `notFound()`, a
 * redirect) are never caught here: they pass through to their boundaries.
 *
 * ★ A BOUNDARY OF ITS OWN, NOT NEXT 16.2's `unstable_catchError`, WHICH DOES THE SAME (its `unstable_retry` is this
 * transition). Measured on `next build`, that API brought its class, the bot test and the navigation-failure handling
 * into the guest album's own chunk: 2.1 KB gzipped on every album load, the product's most-loaded page on a phone at a
 * venue, where this boundary costs 0.5 KB.
 *
 * ★ IT REPORTS, AS THE ROUTE'S OWN BOUNDARY DOES (`route-error.tsx`): zero silent failures. The message is never drawn
 * (a server error can carry internals).
 */
export function AlbumBoundary({
  className,
  children,
}: {
  /** The box the failure stands in: the page's words column. */
  className?: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const [retrying, startRetry] = useTransition();
  return (
    <Catch
      className={className}
      retrying={retrying}
      retry={(reset) =>
        startRetry(() => {
          router.refresh();
          reset();
        })
      }
    >
      {children}
    </Catch>
  );
}

/** Whether a throw is Next's own navigation (a `notFound()`, a redirect), which some other boundary answers. */
function isNavigationThrow(error: unknown): boolean {
  const digest = (error as { digest?: unknown } | null)?.digest;
  return (
    typeof digest === "string" &&
    (digest.startsWith("NEXT_REDIRECT") ||
      digest.startsWith("NEXT_HTTP_ERROR_FALLBACK"))
  );
}

type CatchProps = {
  className?: string;
  retrying: boolean;
  retry: (reset: () => void) => void;
  children: ReactNode;
};

class Catch extends Component<CatchProps, { error: Error | null }> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    // Handed on, as Next's own boundaries hand them on: never the album's failure to draw.
    if (isNavigationThrow(error)) throw error;
    return { error };
  }

  private reset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <AlbumFailed
        error={error}
        className={this.props.className}
        retrying={this.props.retrying}
        onRetry={() => this.props.retry(this.reset)}
      />
    );
  }
}

function AlbumFailed({
  error,
  ...card
}: {
  error: Error & { digest?: string };
  className?: string;
  retrying: boolean;
  onRetry: () => void;
}) {
  useEffect(() => {
    captureError("render:guest", error, {
      digest: error.digest,
      seam: "album",
    });
  }, [error]);

  return <AlbumFailedCard {...card} />;
}

/**
 * THE ALBUM THAT COULD NOT LOAD, SAID ONE WAY WHEREVER IT IS SAID: this boundary's card for a crash, and the album
 * view's for an album its live source could not read (`live-gallery.tsx`, crumbs-30). The card only draws: whoever
 * mounts it has reported what failed (here, the effect above; there, the source, once per failed seed).
 */
export function AlbumFailedCard({
  className,
  retrying,
  onRetry,
}: {
  className?: string;
  retrying: boolean;
  onRetry: () => void;
}) {
  return (
    // The caller's box (the page's words column: its measure and its gutter), and the card inside it.
    <div className={cn("mt-7", className)}>
      <div
        role="alert"
        data-album-failed=""
        className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-border p-5"
      >
        <ImageOff className="size-5 text-muted-foreground" aria-hidden />
        <div className="space-y-1">
          {/* An album-level state's title, the empty album's own step (`subsection`), a step under the
              page's h1. */}
          <p className="font-heading text-subsection text-balance">
            The album didn&rsquo;t load
          </p>
          <p className="text-reading text-pretty text-muted-foreground">
            That&rsquo;s on us, not you. Try again in a moment.
          </p>
        </div>
        <Button
          size="lg"
          variant="outline"
          disabled={retrying}
          onClick={onRetry}
        >
          {retrying ? "Trying again…" : "Try again"}
        </Button>
      </div>
    </div>
  );
}
