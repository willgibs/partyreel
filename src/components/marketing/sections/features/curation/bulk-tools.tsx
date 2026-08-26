import { Check, Clapperboard, Download, EyeOff, X } from "lucide-react";
import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";

import { MonoCaption } from "@/components/marketing/system/mono-caption";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { marketingImage } from "@/lib/constants/marketing-media";
import { cn } from "@/lib/utils";

/**
 * Curation page section 5: the bulk sweep (copy absorbed from FEATURE_GROUPS
 * hosts "Approve in bulk"). The visual quotes the gallery selection state
 * (selectable-media-grid.tsx's scrim + corner check) AND the bar it summons
 * (event-feed-action-bar.tsx's floating pill wrapping gallery-actions.tsx's
 * GalleryBulkBar). Static on purpose: the interactive triage lives in the
 * signature demo above; this one shows that selection scales to a batch, and
 * ends where the app ends it, on the actions.
 *
 * The bar shows the three actions this section's copy names (add to reel, hide,
 * download) in the app's own state hues; Like and the destructive Delete are
 * left out rather than restated in marketing, and nothing here invents a label.
 */

const GRID: { id: string; selected: boolean }[] = [
  { id: "wedding-golden", selected: true },
  { id: "reception-table", selected: false },
  { id: "festival-crowd", selected: true },
  { id: "wedding-toast", selected: true },
  { id: "party-dj", selected: false },
  { id: "concert-confetti", selected: true },
  { id: "reception-hall", selected: true },
  { id: "festival-lights", selected: false },
];

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
function BulkBarMock({ count }: { count: number }) {
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

export function BulkTools() {
  const selectedCount = GRID.filter((t) => t.selected).length;
  return (
    <SectionShell
      eyebrow="Bulk tools"
      heading="Sweep dozens in one pass."
      subhead="Big events fill fast, so the tools scale with them. Long-press any photo to start a selection, then feature, hide, or download the whole batch together. Curation takes minutes, not the morning after."
    >
      <Reveal className="mx-auto mt-10 max-w-2xl">
        <div
          aria-hidden
          data-mkt-reveal
          className="relative rounded-2xl border bg-card p-4 ring-1 ring-foreground/5 sm:p-5"
          style={{ "--i": 3 } as CSSProperties}
        >
          <div className="grid grid-cols-4 gap-1.5">
            {GRID.map((tile) => (
              <div
                key={tile.id}
                className="relative aspect-square overflow-hidden rounded-lg"
              >
                <Image
                  src={marketingImage(tile.id).src}
                  alt=""
                  fill
                  sizes="(min-width: 640px) 160px, 25vw"
                  className="object-cover"
                />
                <span
                  className={cn(
                    "absolute inset-0",
                    tile.selected ? "bg-black/40" : "bg-black/0",
                  )}
                />
                <span
                  className="absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-full border-2"
                  style={
                    tile.selected
                      ? { borderColor: "#fff", background: "var(--success)" }
                      : {
                          borderColor: "rgba(255,255,255,0.85)",
                          background: "rgba(0,0,0,0.35)",
                        }
                  }
                >
                  {tile.selected && <Check className="size-3.5 text-white" />}
                </span>
              </div>
            ))}
          </div>
          {/* The bar the selection summons, straddling the album's edge the
              way the app's floating bar rides the bottom of the screen. */}
          <span className="absolute inset-x-0 -bottom-5 flex justify-center">
            <BulkBarMock count={selectedCount} />
          </span>
        </div>
        <MonoCaption
          data-mkt-reveal
          className="mt-9 text-center"
          style={{ "--i": 3 } as CSSProperties}
        >
          {selectedCount} selected · long-press to start, tap to add more
        </MonoCaption>
      </Reveal>
    </SectionShell>
  );
}
