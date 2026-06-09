import Link from "next/link";
import { Bookmark, CalendarCheck, Image as ImageIcon, Lock } from "lucide-react";

/**
 * Shared dashboard event card with cover art, used in the merged "Events" tab (hosted
 * + saved, Phase 4) and the "Trash" tab. Presentational + server-renderable. The cover
 * is a presigned R2 URL (or a placeholder); raw keys never reach here.
 *
 * `href: null` renders a DISABLED card (a saved event the host has since made
 * private) — non-clickable, muted, lock glyph. `action` (e.g. an unsave button)
 * is rendered OUTSIDE the link so tapping it never navigates. `kind` adds a subtle
 * top-left provenance glyph (hosted vs saved) for the interleaved Events tab.
 */
export function EventCard({
  href,
  name,
  dateLabel,
  coverUrl,
  badges,
  byline,
  action,
  kind,
}: {
  href: string | null;
  name: string;
  dateLabel: string;
  coverUrl: string | null;
  badges?: React.ReactNode;
  byline?: string | null;
  action?: React.ReactNode;
  /** Provenance marker for the merged Events tab: a top-left glyph (hosted vs saved). */
  kind?: "hosted" | "saved";
}) {
  const locked = href === null;

  const body = (
    <>
      <div className="aspect-video w-full overflow-hidden bg-muted">
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- presigned R2 URL, not optimizable
          <img
            src={coverUrl}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted/30 text-muted-foreground/40">
            {locked ? (
              <Lock className="size-7" />
            ) : (
              <ImageIcon className="size-7" />
            )}
          </div>
        )}
      </div>
      <div className="space-y-1 p-4">
        <h3 className="truncate font-medium">{name}</h3>
        <p className="truncate text-sm text-muted-foreground">{dateLabel}</p>
        {byline && (
          <p className="truncate text-xs text-muted-foreground">{byline}</p>
        )}
        {badges && <div className="flex flex-wrap gap-1.5 pt-1">{badges}</div>}
      </div>
    </>
  );

  return (
    <div data-media-tile className="group relative h-full">
      {href ? (
        <Link
          href={href}
          className="block h-full overflow-hidden rounded-xl border border-border bg-card transition-[transform,background-color] duration-150 ease-emphasis hover:bg-muted/40 active:scale-[0.99] motion-reduce:active:scale-100 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          {body}
        </Link>
      ) : (
        <div className="block h-full cursor-default overflow-hidden rounded-xl border border-dashed border-border bg-muted/20 opacity-75">
          {body}
        </div>
      )}
      {/* Provenance glyph (top-LEFT; the action slot owns top-right). Static, subtle. */}
      {kind && (
        <div
          className="pointer-events-none absolute top-2 left-2 z-10 flex items-center justify-center rounded-md bg-background/80 p-1 text-muted-foreground shadow-sm ring-1 ring-border/60 backdrop-blur-sm"
          title={kind === "hosted" ? "You're hosting this event" : "A saved event"}
        >
          {kind === "hosted" ? (
            <CalendarCheck className="size-3.5" aria-hidden />
          ) : (
            <Bookmark className="size-3.5" aria-hidden />
          )}
          <span className="sr-only">{kind === "hosted" ? "Hosting" : "Saved"}</span>
        </div>
      )}
      {action && <div className="absolute top-2 right-2 z-10">{action}</div>}
    </div>
  );
}
