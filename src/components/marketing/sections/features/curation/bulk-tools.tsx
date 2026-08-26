import { Check } from "lucide-react";
import Image from "next/image";
import type { CSSProperties } from "react";

import { MonoCaption } from "@/components/marketing/system/mono-caption";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { marketingImage } from "@/lib/constants/marketing-media";
import { cn } from "@/lib/utils";

/**
 * Curation page section 5: the bulk sweep (copy absorbed from FEATURE_GROUPS
 * hosts "Approve in bulk"). The visual quotes the gallery selection state
 * (selectable-media-grid.tsx's scrim + corner check), static on purpose: the
 * interactive triage lives in the signature demo above; this one just shows
 * that selection scales to a whole batch.
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
          className="rounded-2xl border bg-card p-4 ring-1 ring-foreground/5 sm:p-5"
          style={{ "--i": 0 } as CSSProperties}
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
        </div>
        <MonoCaption
          data-mkt-reveal
          className="mt-4 text-center"
          style={{ "--i": 1 } as CSSProperties}
        >
          {selectedCount} selected · long-press to start, tap to add more
        </MonoCaption>
      </Reveal>
    </SectionShell>
  );
}
