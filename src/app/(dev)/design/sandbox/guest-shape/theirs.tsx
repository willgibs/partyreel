"use client";

import { GuestMasonry } from "@/components/guest/guest-masonry";
import { MediaTile } from "@/components/app/media-grid";
import { MasonryColumns } from "@/components/shared/masonry";
import { GLASS_MARK, GLASS_MARK_LIT } from "@/lib/glass";
import { cn } from "@/lib/utils";

import { ALBUM_BIG, MINE_IDS } from "./fixtures";
import {
  ControlsRow,
  EventBlock,
  GUTTER,
  READABLE,
  ReportFoot,
  type ScreenId,
} from "./page-parts";

/**
 * THEIRS, ROUND TWO: WHERE A GUEST FINDS THEIR OWN PHOTOGRAPHS ONCE THE ALBUM
 * IS BIG.
 *
 * A guest's own photograph is already removable for ever, on both identities,
 * final for the host too (`yours`, ruled and wired: `canDelete`/`ownIds` in
 * `live-gallery.tsx`, a server read never a client claim). That answers what a
 * guest can DO about their own photograph. It says nothing about FINDING it
 * again once the album is 68 photographs deep rather than round one's small
 * wedding — this board's own fixture, `ALBUM_BIG`, with ten of them this
 * guest's own, spread from near the top to well past the fold. Every option
 * is that album with one thing changed; `none` is the shipped page today.
 *
 * ★ `mark` USES THE REAL GRID, NOT A HAND-ROLLED ONE. `GuestMasonry` (the
 * guest's own thin wrapper) does not expose a per-tile overlay hook, but the
 * ONE grid underneath it (`shared/masonry.tsx`, `glass-wiring`) does:
 * `renderOverlay`. So `mark` renders `MasonryColumns` directly — the exact
 * component every album grid now is — with a small badge on the ten tiles
 * that are this guest's own, in the ONE material the tile's other marks
 * already wear (`GLASS_MARK`, `lib/glass.ts`), never an invented fourth
 * treatment.
 *
 * ★ `show` IS THE FILTER ITSELF. `chip` and `mark` both narrow the grid to
 * this guest's own ten when it reads `mine`; the board's own dock is the tap,
 * exactly as every other decision on this board answers "what does the tap
 * do" with a knob rather than wired local state.
 */

export type TheirsShape = "none" | "chip" | "strip" | "mark";

export const theirsOf = (v: string | undefined): TheirsShape =>
  v === "chip" ? "chip" : v === "strip" ? "strip" : v === "mark" ? "mark" : "none";

export type ShowId = "all" | "mine";
export const showOf = (v: string | undefined): ShowId =>
  v === "mine" ? "mine" : "all";

/** The ten that are this guest's own, in album order. */
const MINE_ITEMS = ALBUM_BIG.filter((item) => MINE_IDS.has(item.id));

/** Where each of the ten falls in the UNFILTERED album's DOM order (source
 *  order, which every masonry grid preserves under its column-major flow).
 *  The board's own measurement reads these positions to say how many of
 *  yours are on screen without scrolling, on the option that adds nothing. */
export const MINE_INDEX: readonly number[] = ALBUM_BIG.reduce<number[]>(
  (acc, item, i) => (MINE_IDS.has(item.id) ? [...acc, i] : acc),
  [],
);

/* ── the two new pieces ──────────────────────────────────────────────────── */

/** `chip`'s own control, in the gallery's row beside Sort and Filter. */
function YoursChip({ active }: { active: boolean }) {
  return (
    <button
      type="button"
      tabIndex={-1}
      data-gs-yours-chip
      aria-pressed={active}
      className={cn(
        "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors active:scale-[0.97]",
        active
          ? "border-foreground/30 bg-foreground text-background"
          : "border-border text-muted-foreground",
      )}
    >
      Yours
      <span className={cn("tabular-nums", active ? "text-background/70" : "text-faint")}>
        {MINE_ITEMS.length}
      </span>
    </button>
  );
}

/** `mark`'s own badge, on the ten tiles that are this guest's own. The other
 *  two permitted marks (play, like) both sit on the tile's BOTTOM corners
 *  (`masonry.tsx`), so this one takes a top corner rather than a fourth mark
 *  stacking onto a pair already there. */
function MineMark() {
  return (
    <button
      type="button"
      tabIndex={-1}
      aria-label="Yours. Tap to show only your photographs."
      className={cn(
        "absolute top-1.5 right-1.5 flex size-5 items-center justify-center rounded-full transition-transform active:scale-90",
        GLASS_MARK,
      )}
    >
      <span className={cn("size-1.5 rounded-full bg-white", GLASS_MARK_LIT)} />
    </button>
  );
}

/** `strip`'s own section: everything this guest added, above the full album
 *  rather than replacing any of it, each tile the real `MediaTile`. */
function MineStrip() {
  return (
    <section
      data-gs-mine-strip
      className="mb-6 rounded-lg bg-card p-4 ring-1 ring-foreground/10"
    >
      <p className="text-sm font-medium">Yours, {MINE_ITEMS.length} photos</p>
      <div className="mt-3 flex gap-[var(--gap-gallery)] overflow-x-auto pb-1">
        {MINE_ITEMS.map((item) => (
          <div
            key={item.id}
            data-media-tile
            className="relative aspect-square w-20 shrink-0 overflow-hidden bg-black/10"
            style={{ borderRadius: "var(--radius-tile)" }}
          >
            <MediaTile item={item} playBadge="none" />
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── the whole page ──────────────────────────────────────────────────────── */

export function TheirsPage({
  shape,
  screen,
  show,
}: {
  shape: TheirsShape;
  screen: ScreenId;
  show: ShowId;
}) {
  const wide = screen === "1440";
  const filters = shape === "chip" || shape === "mark";
  const items = filters && show === "mine" ? MINE_ITEMS : ALBUM_BIG;

  return (
    <div className="relative flex min-h-screen flex-col bg-background text-foreground">
      <div className={cn("py-8", wide ? "px-5" : GUTTER)}>
        <div className={wide ? READABLE : undefined}>
          <EventBlock count={ALBUM_BIG.length} />
        </div>
        <div className="mt-7">
          <ControlsRow
            albumKey="lab"
            after={filters ? <YoursChip active={show === "mine"} /> : undefined}
          />
          {shape === "strip" && <MineStrip />}
          {shape === "mark" ? (
            <MasonryColumns
              items={items}
              renderOverlay={(item) =>
                MINE_IDS.has(item.id) ? <MineMark /> : null
              }
            />
          ) : (
            <GuestMasonry items={items} />
          )}
        </div>
        <ReportFoot />
      </div>
    </div>
  );
}
