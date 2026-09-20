import { MediaTile } from "@/components/app/media-grid";
import type { PulseTile } from "@/lib/db/queries/pulse";
import { cn } from "@/lib/utils";

/**
 * THE PULSE'S SECOND BAND: the photographs of the last hour.
 *
 * The window widens until the strip is full and the caption says which one it
 * settled on (`lib/dashboard/arrivals.ts`) — "12 in the last hour" or, when
 * nothing is fresh, "Newest, 3 days ago". A strip that silently showed
 * three-day-old photographs under a heading promising the last hour is the
 * kind of small lie a host catches immediately and never fully trusts again.
 *
 * ★ THESE TILES KEEP THE ARRIVAL FADE, AND THEY ARE THE ONE PLACE IN THE HOST
 * APP THAT SHOULD. Every other host surface sets `data-static` to opt OUT of
 * the [data-media-tile] fade, because entrance theatre on a management tool is
 * noise (emil). Here the animation is not theatre: these photographs LITERALLY
 * just arrived, so the fade is the one thing on the page telling the truth
 * about what changed since the host last looked. `data-static` is deliberately
 * absent — do not add it back to match the cards.
 */
export function JustArrived({
  tiles,
  caption,
}: {
  tiles: PulseTile[];
  caption: string;
}) {
  if (tiles.length === 0) return null;

  return (
    <section aria-label="Just arrived" className="space-y-2.5">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <h2 className="font-heading text-subsection">Just arrived</h2>
        <span className="text-xs text-muted-foreground">{caption}</span>
      </div>
      <ul
        className={cn(
          "grid gap-[var(--gap-gallery)]",
          // Eight in a hand, twelve at a desk: the strip is one glance wide at
          // either size rather than a grid that reflows into three rows.
          "grid-cols-4 sm:grid-cols-8 xl:grid-cols-12",
        )}
      >
        {tiles.map((tile, i) => (
          <li
            key={tile.id}
            data-media-tile
            data-lit=""
            // ★ `--tile-i`, NOT `--arrive-i`. The [data-media-tile] fade reads
            // --tile-i (45ms steps, capped at 540ms); --arrive-i is the
            // separate [data-arrive] section beat next door in globals.css.
            // Setting the wrong one is silent: every tile simply lands at once.
            style={{ "--tile-i": i } as React.CSSProperties}
            className="relative aspect-square overflow-hidden rounded-[var(--radius-tile)]"
          >
            <MediaTile
              item={{ type: tile.type, url: tile.url, previewUrl: null }}
              playBadge="none"
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
