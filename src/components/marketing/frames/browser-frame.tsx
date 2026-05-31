import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

// Shared browser-card chrome for the media frames (album / gallery / reel). One card
// look (rounded card + hairline ring) and an optional window bar (3 dots + a small
// label) so every frame reads as one family. Decorative; the caller's frame sets
// `aria-hidden`. The media-frame library's base — see frames/index.ts.
export function BrowserFrame({
  label,
  className,
  children,
}: {
  /** Optional window-bar content (e.g. an icon + a URL). Omit for a bare card. */
  label?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border bg-card p-3 ring-1 ring-foreground/5",
        className,
      )}
    >
      {label != null && (
        <div className="mb-3 flex items-center gap-1.5 px-1">
          <span className="size-2 rounded-full bg-muted-foreground/30" />
          <span className="size-2 rounded-full bg-muted-foreground/30" />
          <span className="size-2 rounded-full bg-muted-foreground/30" />
          <span className="ml-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
            {label}
          </span>
        </div>
      )}
      {children}
    </div>
  );
}
