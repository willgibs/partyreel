import type { CSSProperties } from "react";

import {
  BulkBarMock,
  SelectTile,
} from "@/components/marketing/sections/shared/bulk-select-mock";
import { Caption } from "@/components/marketing/system/caption";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";

/**
 * Curation page section 5: the bulk sweep (copy absorbed from FEATURE_GROUPS
 * hosts "Approve in bulk"). The visual quotes the gallery selection state
 * (selectable-media-grid.tsx's scrim + corner check) AND the bar it summons,
 * in the album header's row above the tiles (its bulk slot holding
 * gallery-actions.tsx's GalleryBulkBar). Static on purpose: the interactive triage lives in the
 * signature demo above; this one shows that selection scales to a batch, and
 * ends where the app ends it, on the actions.
 *
 * The bar shows the three actions this section's copy names (like, hide,
 * download) in the app's own state hues; the destructive Delete is left out
 * rather than restated in marketing, and nothing here invents a label.
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

// BarAction, BulkBarMock and the select tile live in sections/shared/
// bulk-select-mock.tsx since 2026-09-01: the home's curation section quotes
// the same select mode, and one copy cannot drift from the other.
export function BulkTools() {
  const selectedCount = GRID.filter((t) => t.selected).length;
  return (
    <SectionShell
      eyebrow="Bulk tools"
      heading="Sweep dozens in one pass."
      subhead="Big events fill fast, so the tools scale with them. Long-press any photo to start a selection, then like, hide, or download the whole batch together. Curation takes minutes, not the morning after."
    >
      <Reveal className="mx-auto mt-10 max-w-2xl">
        <div
          aria-hidden
          data-mkt-reveal
          className="relative rounded-2xl border bg-card p-4 ring-1 ring-foreground/5 sm:p-5"
          style={{ "--i": 3 } as CSSProperties}
        >
          <BulkBarMock count={selectedCount} total={GRID.length} />
          <div className="mt-2.5 grid grid-cols-4 gap-1.5">
            {GRID.map((tile) => (
              <SelectTile
                key={tile.id}
                id={tile.id}
                selected={tile.selected}
                sizes="(min-width: 640px) 160px, 25vw"
              />
            ))}
          </div>
        </div>
        <Caption
          data-mkt-reveal
          className="mt-5 text-center tabular-nums"
          style={{ "--i": 3 } as CSSProperties}
        >
          {selectedCount} selected · long-press to start, tap to add more
        </Caption>
      </Reveal>
    </SectionShell>
  );
}
