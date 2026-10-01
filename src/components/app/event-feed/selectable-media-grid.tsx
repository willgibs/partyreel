"use client";

import {
  type CSSProperties,
  type FocusEvent,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Check, CircleX, Play, X } from "lucide-react";
import { FocusScope } from "radix-ui/internal";

import { MediaTile, type GridMedia } from "@/components/app/media-grid";
import { Kbd } from "@/components/shared/kbd";
import { FaceCredit } from "@/components/shared/media-lightbox-parts/credit";
import {
  CornerPlayBadge,
  GALLERY_COLUMNS,
  GALLERY_UNIFORM_COLUMNS,
} from "@/components/shared/masonry";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { GLASS, GLASS_BEHIND, GLASS_MARK, GLASS_MARK_LIT } from "@/lib/glass";
import { tileAspect, UNIFORM_TILE_ASPECT } from "@/lib/media/tile-aspect";
import { cn } from "@/lib/utils";

// The shared selectable grid: the Review room's queue (uniform, with the peek). Media-forward,
// matching the album look. Reuses the shared CSS hooks: [data-review-tile] (the tile's entrance and
// its [data-exiting] fade+scale removal, globals.css) + [data-check-pop] (the checkmark micro-pop).
// Plain MediaTile <img>/<video> poster — never next/image (its optimizer 400s on presigned R2 URLs).
//
// Two configurations:
//   • enablePreview (Review) → a tap in BROWSE mode peeks the media full-bleed (you can't judge a video
//     from a poster); a tap in SELECT mode toggles; the video ▶ always peeks.
//   • no preview → there is no browse mode (the grid only mounts while selecting), so every tap
//     toggles; videos wear the static corner play badge, no peek graph pulled onto the surface.
//
// ★ THE DOM IS THE KEYBOARD'S CONTRACT (`review-keys.ts`): each tile carries `data-tile-id` and its
// one focusable `data-tile-button`, the grid `data-review-grid` (the keys read its columns off the
// computed grid), and the peek `data-review-peek`. A tile's focus draws on the tile, outside it, so
// the keyboard's cursor reads over any photograph.
export type SelectableMediaGridProps = {
  items: GridMedia[];
  selectMode: boolean;
  selected: Set<string>;
  exiting: Set<string>;
  onToggle: (id: string) => void;
  /** Review = true (browse peek + preview modal). False: a tap always toggles. */
  enablePreview?: boolean;
  /** Must MATCH the surface's normal grid so toggling select never reflows tile heights — the
   *  gallery clamps extreme ratios (MasonryColumns clampAspect), the review queue does not. */
  clampAspect?: boolean;
  /** "masonry" (natural shapes) vs "uniform" (Review — a fixed-aspect grid for standardized
   *  selection hit-targets). Mirrors MasonryColumns. */
  layout?: "masonry" | "uniform";
  /**
   * The peek, CONTROLLED (the Review room: the keys, the grid and the verdict move one cursor).
   * Omit `onPeekChange` and the grid keeps its own.
   */
  peekId?: string | null;
  onPeekChange?: (id: string | null) => void;
  /**
   * THE VERDICT ON THE PEEK (host-curation `peek=verdict`, Will: "I like handling the yes/no review
   * before any additional handling is available"): Reject and Approve under the photograph, where
   * it is big enough to judge. Without it the peek is a look with one close button.
   */
  verdict?: {
    onApprove: (id: string) => void;
    onReject: (id: string) => void;
  };
  /** A screen reader's line for what a tile's keys do (the room's; no hint row is ever drawn). */
  keyHint?: string;
};

export function SelectableMediaGrid({
  items,
  selectMode,
  selected,
  exiting,
  onToggle,
  enablePreview = false,
  clampAspect = false,
  layout = "masonry",
  peekId,
  onPeekChange,
  verdict,
  keyHint,
}: SelectableMediaGridProps) {
  const uniform = layout === "uniform";
  const hintId = useId();
  // A lightweight peek overlay: inspect a photo/video before judging it, without pulling the full
  // gallery lightbox graph onto this surface. Held by the caller when it passes `onPeekChange`.
  const [ownPeek, setOwnPeek] = useState<string | null>(null);
  const controlled = onPeekChange !== undefined;
  const shownId = controlled ? (peekId ?? null) : ownPeek;
  const preview = shownId
    ? (items.find((i) => i.id === shownId) ?? null)
    : null;
  const setPeek = (id: string | null) =>
    controlled ? onPeekChange(id) : setOwnPeek(id);

  const gridRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  // The latest of each, for the open/close effect below, which runs only on the open edge.
  const setPeekRef = useRef(setPeek);
  const lastShown = useRef<string | null>(null);
  const withVerdict = useRef(!!verdict);
  useLayoutEffect(() => {
    setPeekRef.current = setPeek;
    withVerdict.current = !!verdict;
    if (preview) lastShown.current = preview.id;
  });

  // ★ THE PEEK IS A MODAL, SO IT BEHAVES AS ONE: Escape closes it, focus moves inside it when it
  // opens (onto the look itself where it carries the verdict, so Enter and Backspace are the
  // verdict's; onto its close button where it is only a look: `focusOnOpen`, the trap's own mount
  // below), and when it closes, focus lands on the tile of the photograph it showed last (the keys
  // may have walked it on), or the tile that opened it, or the queue's first tile, so the next key
  // press starts where the host was.
  const open = preview !== null;
  useEffect(() => {
    if (!open) return;
    // Read before the trap moves anything: this commit's effects run before the trap has its
    // container, so focus is still on whatever opened the peek.
    const opener =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPeekRef.current(null);
    };
    window.addEventListener("keydown", onKey);
    const grid = gridRef.current;
    return () => {
      window.removeEventListener("keydown", onKey);
      if (!grid?.isConnected) return;
      const staying = [
        ...grid.querySelectorAll<HTMLElement>(
          "[data-tile-id]:not([data-exiting])",
        ),
      ];
      const buttonOf = (tile: HTMLElement | undefined) =>
        tile?.querySelector<HTMLElement>("[data-tile-button]") ?? null;
      const back =
        buttonOf(staying.find((t) => t.dataset.tileId === lastShown.current)) ??
        (opener?.isConnected && grid.contains(opener) ? opener : null) ??
        buttonOf(staying[0]);
      back?.focus();
    };
  }, [open]);

  /**
   * ★ THE TRAP TAKES THE OPENING FOCUS ITSELF (build 33's red-team). The effect above used to focus the look,
   * and it runs a commit before the trap has its container, so the trap never saw that focus arrive and had
   * nothing to hand focus back to: Shift+Tab as the first key walked out onto the tile behind the look, the
   * peek still up. Moved here, into the trap's own mount (its listeners are up by then), the focus is the
   * one the trap returns to whenever anything sends focus out behind it.
   */
  const focusOnOpen = (e: Event) => {
    e.preventDefault();
    (withVerdict.current ? dialogRef.current : closeRef.current)?.focus();
  };

  return (
    <>
      {keyHint && (
        <p id={hintId} className="sr-only">
          {keyHint}
        </p>
      )}
      <div
        ref={gridRef}
        data-review-grid
        className={uniform ? GALLERY_UNIFORM_COLUMNS : GALLERY_COLUMNS}
        onFocus={markKeyboardTile}
        onBlur={unmarkKeyboardTile}
      >
        {items.map((it) => {
          const isSelected = selected.has(it.id);
          return (
            <div
              key={it.id}
              data-tile-id={it.id}
              data-review-tile={enablePreview ? "" : undefined}
              data-exiting={exiting.has(it.id) ? "" : undefined}
              style={
                {
                  aspectRatio: uniform
                    ? UNIFORM_TILE_ASPECT
                    : tileAspect(it, clampAspect),
                  borderRadius: "var(--radius-tile)",
                } as CSSProperties
              }
              className={cn(
                "relative w-full overflow-hidden bg-black/10 transition-[opacity,transform] duration-150 ease-emphasis",
                !uniform && "mb-[var(--gap-gallery)] break-inside-avoid",
                // The keyboard's cursor: a ring OUTSIDE the tile in the focus colour, clear of the
                // photograph by a hair of the page and lifted over its neighbours' edges, so it
                // reads over a dark photograph and a bright one alike (`markKeyboardTile`).
                "outline-offset-2 data-[kbd-focus]:z-10 data-[kbd-focus]:outline-2 data-[kbd-focus]:outline-ring",
              )}
            >
              <MediaTile item={it} playBadge="none" />

              {/* The full-tile tap target: toggles selection in select mode, peeks in browse mode
                  (peek only exists when previews are enabled). */}
              <button
                type="button"
                data-tile-button
                onClick={() =>
                  selectMode
                    ? onToggle(it.id)
                    : enablePreview
                      ? setPeek(it.id)
                      : undefined
                }
                aria-pressed={selectMode ? isSelected : undefined}
                aria-label={
                  selectMode ? (isSelected ? "Deselect" : "Select") : "Preview"
                }
                aria-describedby={keyHint && !selectMode ? hintId : undefined}
                className="absolute inset-0 outline-none"
              />

              {/* Video marker. With previews on, the ▶ sits above the select layer so a tap peeks the
                  video instead of selecting (judge, then select). Without previews, it's the shared
                  static corner badge — non-interactive, the whole tile just toggles. ★ Out of the tab
                  order: the tile's own button is the one stop per upload (Space peeks it), so a
                  keyboard walking a queue of videos never lands twice on each. */}
              {it.type === "video" &&
                (enablePreview ? (
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setPeek(it.id)}
                    aria-label="Preview video"
                    className={cn(
                      "absolute top-1/2 left-1/2 flex size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-white outline-none",
                      "transition-transform duration-150 ease-emphasis focus-visible:ring-2 focus-visible:ring-white active:scale-90 motion-reduce:active:scale-100",
                      GLASS_MARK,
                    )}
                  >
                    <Play className="size-4 translate-x-px fill-current" />
                  </button>
                ) : (
                  <CornerPlayBadge />
                ))}

              {/* Selection overlay + checkmark (select mode only; visual, never blocks clicks). */}
              {selectMode && (
                <>
                  <span
                    className={`pointer-events-none absolute inset-0 transition-colors ${isSelected ? "bg-black/40" : "bg-black/0"}`}
                  />
                  {/* ★ THE CHECK IS A MARK, IN THE ONE MATERIAL, and its SELECTED
                      state keeps its colour: state feedback is always coloured
                      (--success), which is the rule glass does not get to soften.
                      Unselected it is the material with the material's own hairline,
                      so an empty check no longer needs a hand-typed ring. */}
                  <span
                    className={cn(
                      "pointer-events-none absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-full",
                      isSelected
                        ? "bg-success text-success-foreground ring-2 ring-white"
                        : GLASS_MARK,
                    )}
                  >
                    {isSelected && (
                      <Check data-check-pop className="size-3.5" />
                    )}
                  </span>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Peek overlay: a fixed full-bleed view of the tapped media; backdrop / ✕ / Escape closes.
          Rendered at the feed root (fixed), so it sits above whatever sticks to the page.
          ★ AND IT HOLDS FOCUS WHILE IT IS UP (crumbs-28): it says `aria-modal`, so Tab must never walk
          out behind it onto the tiles it covers. Radix's FocusScope, the trap every Dialog here wears:
          trapped and looping, from its last control round to its first. Its own mount focus is ours
          (`focusOnOpen`: the look or its close button), its unmount focus is turned down (the effect
          above puts focus back on the tile); and a layer opened over it (the credit's look) pauses it,
          as one Radix layer pauses another. */}
      {enablePreview && preview && (
        <FocusScope.Root
          asChild
          trapped
          loop
          onMountAutoFocus={focusOnOpen}
          onUnmountAutoFocus={(e) => e.preventDefault()}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={
              preview.type === "video" ? "Video preview" : "Photo preview"
            }
            data-review-peek
            tabIndex={-1}
            className={cn(
              "fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 p-4 outline-none",
              // The peek stands on the same ground the lightbox does (`behind=album`):
              // the queue behind it, blurred at half brightness. Its children paint
              // above the filter, so the media it exists to show is never in it.
              GLASS_BEHIND,
            )}
            onClick={() => setPeek(null)}
            // ★ SHIFT+TAB FROM THE LOOK ITSELF COMES ROUND TO ITS LAST CONTROL (build 33's red-team). The
            // trap's loop only turns at its first and last controls, and the look is neither, so from it
            // Shift+Tab would bounce back onto the look and seem to do nothing; it goes the loop's own
            // way instead, as Tab from the look already reaches its first. (This runs before the trap's
            // own keys, which then see focus on the close button and leave it there.)
            onKeyDown={(e) => {
              if (
                e.key === "Tab" &&
                e.shiftKey &&
                !e.altKey &&
                !e.ctrlKey &&
                !e.metaKey &&
                e.target === e.currentTarget
              ) {
                e.preventDefault();
                closeRef.current?.focus();
              }
            }}
          >
            {preview.type === "video" ? (
              <video
                key={preview.id}
                src={preview.url}
                controls
                autoPlay
                playsInline
                onClick={(e) => e.stopPropagation()}
                className={cn(
                  "min-h-0 max-w-[94vw] rounded-md",
                  // Under the verdict the media keeps clear of it: the pill never covers the
                  // photograph it is judging, nor a video's own controls.
                  verdict ? "max-h-[calc(100svh-7.5rem)]" : "max-h-[88vh]",
                )}
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element -- presigned R2 URL; next/image 400s on it
              <img
                key={preview.id}
                src={preview.url}
                alt=""
                onClick={(e) => e.stopPropagation()}
                className={cn(
                  "min-h-0 max-w-[94vw] rounded-md object-contain",
                  verdict ? "max-h-[calc(100svh-7.5rem)]" : "max-h-[88vh]",
                )}
              />
            )}
            {verdict && (
              <PeekVerdict
                onReject={() => verdict.onReject(preview.id)}
                onApprove={() => verdict.onApprove(preview.id)}
              />
            )}
            {/* ★ WHO SENT IT, AS THE VIEWER SAYS IT (event-safety `entry=all`: "every road opens the
              person's look", the uploader in Review among them): the viewer's own face-led credit,
              top left, whose name opens the person's look with its quiet Block. This peek is the
              Review room's alone, so its credit is the host's. A press inside it (or inside the look
              it opens, whose clicks bubble here through React) never reaches the backdrop's close. */}
            <div
              className="absolute top-4 left-4 flex max-w-[calc(100%-5rem)]"
              onClick={(e) => e.stopPropagation()}
            >
              <FaceCredit
                key={preview.id}
                item={preview}
                viewerIsHost
                isOwn={false}
              />
            </div>
            <button
              ref={closeRef}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setPeek(null);
              }}
              aria-label="Close preview"
              className={cn(
                "absolute top-4 right-4 flex size-9 items-center justify-center rounded-full text-white outline-none",
                "transition-transform duration-150 ease-emphasis focus-visible:ring-2 focus-visible:ring-white/70 active:scale-90 motion-reduce:active:scale-100",
                GLASS,
              )}
            >
              <X className="size-5" />
            </button>
          </div>
        </FocusScope.Root>
      )}
    </>
  );
}

/** A verdict on the peek: its glyph in its state colour, its word in white, the key in its tooltip. */
const VERDICT_BUTTON = cn(
  // A thumb's full target on a phone (44px), a pointer's 40 at a desk.
  "flex h-11 items-center gap-1.5 rounded-full px-4 text-sm font-medium text-white/85 outline-none sm:h-10",
  "transition-[color,background-color,transform] duration-150 ease-emphasis hover:bg-white/10 hover:text-white",
  "focus-visible:text-white focus-visible:ring-2 focus-visible:ring-white/70 active:scale-95 motion-reduce:active:scale-100",
  GLASS_MARK_LIT,
);

/**
 * THE YES/NO, ON THE LOOK (host-curation `peek=verdict`). One pill in the one material under the
 * photograph, Reject then Approve, the order the bar keeps. The keys sit in each button's tooltip
 * and nowhere else (`keys=arrows`: "no hints row ... maybe it can be nested somewhere subtly like
 * a tooltip"). The peek mounts only on a tap, after hydration, so a radix Tooltip is safe here.
 */
function PeekVerdict({
  onReject,
  onApprove,
}: {
  onReject: () => void;
  onApprove: () => void;
}) {
  return (
    <div
      data-review-verdict
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "flex shrink-0 items-center gap-0.5 rounded-full p-1",
        GLASS,
      )}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button" onClick={onReject} className={VERDICT_BUTTON}>
            <CircleX className="size-4 text-warning" aria-hidden />
            Reject
          </button>
        </TooltipTrigger>
        <TooltipContent>
          Reject <Kbd>Backspace</Kbd>
        </TooltipContent>
      </Tooltip>
      <span aria-hidden className="h-5 w-px bg-white/20" />
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button" onClick={onApprove} className={VERDICT_BUTTON}>
            <Check className="size-4 text-success" aria-hidden />
            Approve
          </button>
        </TooltipTrigger>
        <TooltipContent>
          Approve <Kbd>Enter</Kbd>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

/**
 * THE KEYBOARD'S CURSOR, AS AN ATTRIBUTE (`data-kbd-focus`, the album's own pattern in
 * `masonry.tsx`): `:has(:focus-visible)` matches but does not reliably repaint in Chromium, so a
 * ring drawn by it can linger on the tile the keys just left. Keyboard focus only, so a click never
 * rings a tile; React never manages the attribute, so a re-render never clears it.
 */
function markKeyboardTile(e: FocusEvent<HTMLDivElement>) {
  const target = e.target as Element;
  const tile = target.closest?.("[data-tile-id]");
  if (!tile) return;
  let keyboard = false;
  try {
    keyboard = target.matches(":focus-visible");
  } catch {
    // An engine without the selector (jsdom) draws no cursor.
  }
  if (keyboard) tile.setAttribute("data-kbd-focus", "");
}

function unmarkKeyboardTile(e: FocusEvent<HTMLDivElement>) {
  const tile = (e.target as Element).closest?.("[data-tile-id]");
  const next = e.relatedTarget as Node | null;
  if (tile && !(next && tile.contains(next))) {
    tile.removeAttribute("data-kbd-focus");
  }
}
