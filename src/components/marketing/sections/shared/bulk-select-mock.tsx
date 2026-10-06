import { Check, Download, EyeOff, Heart, X } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";

import { marketingImage } from "@/lib/constants/marketing-media";
import { cn } from "@/lib/utils";

/**
 * THE SELECT-MODE MOCK, shared (2026-09-01). The app's bulk-select state,
 * quoted for marketing: a photo tile carrying the selection scrim + corner
 * check (selectable-media-grid.tsx) and the album header's row the selection
 * takes over (feed-section-header.tsx's bulk slot holding gallery-actions.tsx's
 * GalleryBulkBar, `event-feed/bulk-bar.tsx`). Two consumers: /features/curation's bulk-tools section (a
 * 4x2 sweep) and the home's curation section (a compact 2x2 beside the host's
 * three controls). Extracted rather than duplicated so the two can never
 * drift, and so a change in the app's bar has one place to be mirrored.
 * Static on purpose: resting shapes, never controls.
 *
 * The bar shows the three actions the copy names (like, hide, download) in the
 * app's own state hues (gallery-actions.tsx's GalleryBulkBar: `like`,
 * `warning`, `save`); the destructive Delete is left out rather than restated
 * in marketing, and nothing here invents a label. The reel action left the
 * host's bar with the stored reel, so it left this mock too.
 */

/** One icon action inside the mock bar (a resting shape, never a control). */
function BarAction({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <span
      title={label}
      className="flex size-7 items-center justify-center rounded-md"
    >
      {children}
    </span>
  );
}

/**
 * THE ALBUM HEADER IN SELECT MODE, quoted: `FeedSectionHeader`'s row, its label
 * and count at the left, and `BulkBar` in the action slot at the right (All/Clear,
 * the live count, the actions, Cancel), above the tiles it acts on. ★ IN THE
 * ROW, NEVER FLOATING: the app's floating action pill retired with
 * EventFeedActionBar, and the bar has lived in the header's slot since, so a mock
 * that floated it over the album's edge pictured a bar the app no longer draws.
 * `total` is the album's count in the label's pill (the header's own shape).
 */
export function BulkBarMock({
  count,
  total,
}: {
  count: number;
  total?: number;
}) {
  return (
    <span className="flex min-h-7 items-center justify-between gap-3">
      <span className="flex items-center gap-1.5">
        <span className="text-label font-semibold text-muted-foreground uppercase">
          Album
        </span>
        {total ? (
          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-muted px-1 text-[10px] font-semibold text-muted-foreground tabular-nums">
            {total}
          </span>
        ) : null}
      </span>
      <span className="flex items-center gap-0.5 sm:gap-1">
        <span className="px-2 text-xs font-medium">All</span>
        <span className="px-0.5 text-xs text-muted-foreground tabular-nums">
          {count}
        </span>
        <BarAction label="Like">
          <Heart className="size-4 text-like" />
        </BarAction>
        <BarAction label="Hide">
          <EyeOff className="size-4 text-warning" />
        </BarAction>
        <BarAction label="Download">
          <Download className="size-4 text-save" />
        </BarAction>
        <BarAction label="Cancel selection">
          <X className="size-4" />
        </BarAction>
      </span>
    </span>
  );
}

/**
 * A photo tile in select mode: the scrim darkens the chosen ones and the
 * corner check fills in the app's approve green. `sizes` is the caller's,
 * because the two consumers render very different tile widths.
 */
export function SelectTile({
  id,
  selected,
  sizes,
}: {
  id: string;
  selected: boolean;
  sizes: string;
}) {
  return (
    <div className="relative aspect-square overflow-hidden rounded-lg">
      <Image
        src={marketingImage(id).src}
        alt=""
        fill
        sizes={sizes}
        className="object-cover"
      />
      <span
        className={cn(
          "absolute inset-0",
          selected ? "bg-black/40" : "bg-black/0",
        )}
      />
      <span
        className="absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-full border-2"
        style={
          selected
            ? { borderColor: "#fff", background: "var(--success)" }
            : {
                borderColor: "rgba(255,255,255,0.85)",
                background: "rgba(0,0,0,0.35)",
              }
        }
      >
        {selected && <Check className="size-3.5 text-white" />}
      </span>
    </div>
  );
}
