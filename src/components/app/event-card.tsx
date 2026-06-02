import Link from "next/link";
import { Image as ImageIcon, Lock } from "lucide-react";

/**
 * Shared dashboard event card with cover art, used by BOTH tabs ("Your events"
 * and "Saved"). Presentational + server-renderable. The cover is a presigned R2
 * URL (or a placeholder); raw keys never reach here.
 *
 * `href: null` renders a DISABLED card (a saved event the host has since made
 * private) — non-clickable, muted, lock glyph. `action` (e.g. an unsave button)
 * is rendered OUTSIDE the link so tapping it never navigates.
 */
export function EventCard({
  href,
  name,
  dateLabel,
  coverUrl,
  badges,
  byline,
  action,
}: {
  href: string | null;
  name: string;
  dateLabel: string;
  coverUrl: string | null;
  badges?: React.ReactNode;
  byline?: string | null;
  action?: React.ReactNode;
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
          className="block h-full overflow-hidden rounded-xl border border-border bg-card transition-colors hover:bg-muted/40 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          {body}
        </Link>
      ) : (
        <div className="block h-full cursor-default overflow-hidden rounded-xl border border-dashed border-border bg-muted/20 opacity-75">
          {body}
        </div>
      )}
      {action && <div className="absolute top-2 right-2 z-10">{action}</div>}
    </div>
  );
}
