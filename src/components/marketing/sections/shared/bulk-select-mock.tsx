import { Check, Clapperboard, Download, EyeOff, X } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";

import { marketingImage } from "@/lib/constants/marketing-media";
import { cn } from "@/lib/utils";

/**
 * THE SELECT-MODE MOCK, shared (2026-09-01). The app's bulk-select state,
 * quoted for marketing: a photo tile carrying the selection scrim + corner
 * check (selectable-media-grid.tsx) and the floating action pill the
 * selection summons (event-feed-action-bar.tsx wrapping gallery-actions.tsx's
 * GalleryBulkBar). Two consumers: /features/curation's bulk-tools section (a
 * 4x2 sweep) and the home's curation section (a compact 2x2 beside the host's
 * three controls). Extracted rather than duplicated so the two can never
 * drift, and so a change in the app's bar has one place to be mirrored.
 * Static on purpose: resting shapes, never controls.
 *
 * The bar shows the three actions the copy names (add to reel, hide,
 * download) in the app's own state hues; Like and the destructive Delete are
 * left out rather than restated in marketing, and nothing here invents a label.
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
      className="flex size-8 items-center justify-center rounded-md"
    >
      {children}
    </span>
  );
}

/**
 * The floating select-mode bar, quoted: the app's rounded-full pill over the
 * album, carrying All/Clear, the live count, the actions, and Cancel.
 */
export function BulkBarMock({ count }: { count: number }) {
  return (
    <span className="flex items-center gap-0.5 rounded-full border border-border bg-background/95 px-2 py-1.5 shadow-[0_6px_18px_rgba(0,0,0,0.18)] backdrop-blur sm:gap-1">
      <span className="px-2 text-xs font-medium">All</span>
      <span className="px-0.5 text-xs text-muted-foreground tabular-nums">
        {count}
      </span>
      <BarAction label="Add to reel">
        <Clapperboard className="size-4 text-reel" />
      </BarAction>
      <BarAction label="Hide">
        <EyeOff className="size-4 text-warning" />
      </BarAction>
      <BarAction label="Download">
        <Download className="size-4 text-muted-foreground" />
      </BarAction>
      <BarAction label="Cancel selection">
        <X className="size-4" />
      </BarAction>
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
