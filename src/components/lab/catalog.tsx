"use client";

import { createContext, useContext } from "react";
import { Check } from "lucide-react";

import { withDesignKey } from "@/lib/design-gate/links";
import { cn } from "@/lib/utils";

import { COMPONENTS } from "@/app/(dev)/design/rules/rules";

import {
  type BoardSpec,
  type BoardState,
  type BuilderVerdict,
  type Candidate,
  ITEM_VERDICTS,
} from "./board-spec";
import { BeforeAfter } from "./before-after";
import { ItemVerdictRow } from "./item-verdict";
import { type Ground, GroundBox } from "./stage";
import { useDesignKey } from "./walk";

/**
 * THE CATALOG (the revamp, 2026-09-16): an exploration as a grid of polished
 * ideas, each ruled on where it stands.
 *
 * ★ THE SHAPE IS WILL'S BRIEF, VERBATIM. Tracks "should return design catalogs
 * of ideas to ship in the lab" that he can "kill, refine, or promote the best
 * to the Library", in a "gallery view by default, notes per item"
 * (2026-09-16). The palette board's round six proved the card and this is that
 * card made general: the name, the builder's own call, the one line, the live
 * preview, the facts, the argument folded away, and the reviewer's row.
 *
 * ★ EVERY CONTROL ON A CARD IS A PAGE-WIDE SWITCH, which is the other half of
 * the ruling ("the GUI control should be fixed so that variants can be toggled
 * on different previews anywhere on the page"). Pick sets the board's declared
 * pick control, so every section below the catalog wears the card; A and B set
 * the two compare controls, so any two cards can be put side by side without
 * scrolling back to a dock. The card never holds its own selection: a catalog
 * where a card is a picture and the selection lives somewhere else is two
 * things to keep in your head instead of one.
 *
 * ★ AND A PICK IS CLEARABLE. Pressing the picked card returns the control to
 * its declared default when the control says `clearable` (Will, 2026-09-16: "I
 * can't unpick a selection to return to a non-selected state"), which is the
 * same one toggle rule the verdicts and the asks follow.
 *
 * ★ AND THE SAME GRID IS THE STEP'S TILES (the stepped review, 2026-09-16).
 * When a review walks a catalog, the cards ARE the options, so the step renders
 * the board's own catalog section rather than a second rendering of the same
 * ideas as pills: `CatalogTiles` puts the grid in tiles mode from the step,
 * through a context, so no board's `board.tsx` has to know it is being reviewed.
 * In tiles mode the verdict row is optional feedback rather than the question,
 * so it waits for a hover or a focus.
 *
 * The grid is `.lab-catalog` in design.css, an auto-fill of `--lab-catalog-min`
 * (280px) so the column count follows the room rather than a breakpoint; a
 * board whose cards need more room passes `minWidth`.
 */

/**
 * HOW THE STEP IS SHOWING THE GRID. Null everywhere else, which is the browse
 * mode every board has had: the pick pill, the A and B pills and the verdict
 * row, all of them always there.
 */
export type CatalogTilesMode = {
  /** The card wearing the ring: the option chosen, not merely shown. */
  chosen?: string;
  /** The card currently on the stage below, which a press only SHOWS. */
  shown?: string;
  /** A press on a tile: show it, or (on the shown one) choose it. */
  onPress?: (id: string) => void;
  /** pick-one: the verdict row is optional feedback, so it waits for a hover. */
  quietVerdicts?: boolean;
  /**
   * ONE CARD AT A TIME: the grid draws only this candidate, large, with its
   * before/after, what keeping it lands as and the places it would be used. A
   * keep-any catalog whose cards each need looking AT rather than looking
   * ACROSS asks for this with `walk: "one-at-a-time"` (the stepped review,
   * 2026-09-16), and the step walks card k of N.
   */
  only?: string;
};

const TilesCtx = createContext<CatalogTilesMode | null>(null);

/** Puts every `Catalog` under it in the step's tiles mode. */
export function CatalogTiles({
  value,
  children,
}: {
  value: CatalogTilesMode;
  children: React.ReactNode;
}) {
  return <TilesCtx.Provider value={value}>{children}</TilesCtx.Provider>;
}

const VERDICT_STYLE: Record<BuilderVerdict, string> = {
  // Lifted from the glow boards' own pill (sandbox/glow-lab-shared.tsx), which
  // is where the grammar was worked out: the weight IS the verdict, so it reads
  // at a glance across twelve cards and never costs a hue (bible 1).
  ship: "border-transparent bg-foreground text-background",
  refine: "border-border text-foreground",
  kill: "border-border text-muted-foreground line-through decoration-1",
};

/** The builder's own call on one idea: ship it, refine it, or kill it. */
export function VerdictPill({
  verdict,
  className,
}: {
  verdict: BuilderVerdict;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        VERDICT_STYLE[verdict],
        className,
      )}
    >
      {verdict}
    </span>
  );
}

/** What a card's preview is handed: whether it is the picked one, and the board's state. */
export type CatalogRenderArgs = {
  picked: boolean;
  state: BoardState;
};

const PILL =
  "rounded-md border px-2 py-0.5 text-[11px] font-medium transition-[transform,background-color,color,border-color] duration-150 ease-emphasis active:scale-[0.97] motion-reduce:transition-none";

export function Catalog({
  spec,
  state,
  setState,
  render,
  before,
  usages,
  ground,
  minWidth,
  className,
}: {
  spec: BoardSpec;
  state: BoardState;
  setState: (patch: Record<string, string>) => void;
  /** The live preview for one card. Real components, never a picture of one. */
  render: (candidate: Candidate, args: CatalogRenderArgs) => React.ReactNode;
  /**
   * The SAME specimen without this card's idea, for a card walked one at a
   * time: the step pairs it with `render` in a `BeforeAfter`. A board that
   * cannot draw a meaningful "without" leaves it out and the card shows once.
   */
  before?: (candidate: Candidate, args: CatalogRenderArgs) => React.ReactNode;
  /** Up to two real places this card would land, for the one-at-a-time walk. */
  usages?: (candidate: Candidate, args: CatalogRenderArgs) => React.ReactNode;
  /** Paints the preview on a production ground; leave out to draw your own. */
  ground?: Ground;
  /** The narrowest a card may be before the grid drops a column (default 280). */
  minWidth?: number;
  className?: string;
}) {
  const tiles = useContext(TilesCtx);
  const catalog = spec.catalog;
  if (!catalog) return null;
  const pick = spec.controls?.find((c) => c.id === catalog.control);
  const [a, b] = catalog.compare ?? [];

  const shown = tiles?.only
    ? spec.candidates.filter((c) => c.id === tiles.only)
    : spec.candidates;

  return (
    <div
      data-lab-catalog={spec.id}
      className={cn(tiles?.only ? "min-w-0" : "lab-catalog", className)}
      style={
        minWidth
          ? ({ "--lab-catalog-min": `${minWidth}px` } as React.CSSProperties)
          : undefined
      }
    >
      {shown.map((candidate) => {
        const picked = pick ? state[pick.id] === candidate.id : false;
        const solo = tiles?.only === candidate.id;
        // In tiles mode the RING is the recorded choice and the press is the
        // step's show-then-choose, so the card must not also wear the pick
        // control's highlight: the board state changes on a mere show, and a
        // card that looked chosen because it was merely shown is the whole
        // thing "show versus choose" exists to separate.
        const ringed = tiles ? tiles.chosen === candidate.id : picked;
        return (
          <article
            key={candidate.id}
            {...(tiles?.onPress
              ? {
                  role: "button",
                  tabIndex: 0,
                  "aria-pressed": ringed,
                  onClick: () => tiles.onPress?.(candidate.id),
                  onKeyDown: (e: React.KeyboardEvent) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      tiles.onPress?.(candidate.id);
                    }
                  },
                }
              : {})}
            data-lab-tile={tiles ? "" : undefined}
            data-shown={tiles?.shown === candidate.id ? "true" : undefined}
            // ★ NOT `data-<controlId>`: BoardPage writes that on the board ROOT
            // for every declared control, so a card wearing the same attribute
            // would make any sheet selecting on it hit every card at once.
            data-lab-card={candidate.id}
            data-picked={picked ? "true" : undefined}
            className={cn(
              "flex min-w-0 flex-col gap-3 rounded-xl border p-3 transition-colors duration-150 motion-reduce:transition-none",
              ringed
                ? "border-foreground/40 bg-muted/40"
                : "border-border bg-background",
              tiles?.onPress &&
                "cursor-pointer text-left outline-none focus-visible:border-foreground/40",
              tiles && ringed && "ring-1 ring-foreground/40",
              tiles?.shown === candidate.id && !ringed && "border-foreground/25",
            )}
          >
            <header className="flex min-w-0 items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-sm leading-none font-medium">
                  {candidate.name}
                  {candidate.recommended && (
                    <span
                      className="inline-block size-1.5 shrink-0 rounded-full bg-foreground"
                      title="The board's own pick"
                    />
                  )}
                </p>
                {candidate.one && (
                  <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">
                    {candidate.one}
                  </p>
                )}
              </div>
              {candidate.verdict && <VerdictPill verdict={candidate.verdict} />}
            </header>

            {/* The preview is a SPECIMEN, marked as one: the reading budget
                counts what a reviewer has to read, and this is what he looks
                at. A board that paints its own ground (the palette's scoped
                tokens) leaves `ground` out and still lands inside the marker. */}
            <div data-lab-specimen="" className="min-w-0">
              {solo && before ? (
                // ★ A CARD WALKED ALONE IS JUDGED AS A DIFFERENCE. With the
                // other eleven off the screen there is nothing to compare it
                // to, so the "without" has to be drawn beside it or the
                // reviewer is asked to remember a surface he last saw a step
                // ago (the light board's round-five finding).
                <BeforeAfter
                  before={paint(before(candidate, { picked, state }), ground)}
                  after={paint(render(candidate, { picked, state }), ground)}
                />
              ) : (
                paint(render(candidate, { picked, state }), ground)
              )}
            </div>

            {/* What keeping or picking this card lands as, drawn on the card
                walked alone AND on the picked card of any grid: a pick-one
                gallery is decided by one pick, and "what would winning
                change" is worth reading exactly there (the palette's round
                eight finding, 2026-09-16). */}
            {(solo || picked) && candidate.lands && (
              <p className="text-[11px] leading-snug">
                <span className="text-muted-foreground">Lands as: </span>
                {candidate.lands}
              </p>
            )}

            {solo && usages && (
              <div data-lab-specimen="" className="min-w-0">
                {usages(candidate, { picked, state })}
              </div>
            )}

            {candidate.facts && candidate.facts.length > 0 && (
              <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-[11px]">
                {candidate.facts.map(([label, value]) => (
                  <div key={label} className="contents">
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="text-pretty">{value}</dd>
                  </div>
                ))}
              </dl>
            )}

            {/* The argument is folded: a catalog is read by looking, and a
                paragraph on every card is the paper this exists to end. The
                smoke counts what is NOT folded (lab-smoke.mjs). */}
            {candidate.rationale && (
              <details className="text-[11px] leading-relaxed">
                <summary className="cursor-pointer text-muted-foreground transition-colors duration-150 hover:text-foreground motion-reduce:transition-none">
                  Why it might win
                </summary>
                <p className="mt-1 text-muted-foreground">
                  {candidate.rationale}
                </p>
              </details>
            )}

            {/* The page-wide pills are the BROWSE mode's controls; in a step
                the press on the tile is the pick, and a second row of the same
                gesture is exactly the "every ask printed three times" this
                round is deleting. */}
            {!tiles && (
            <div className="flex flex-wrap items-center gap-1.5">
              {pick && (
                <button
                  type="button"
                  data-dir-press
                  aria-pressed={picked}
                  aria-label={`Pick ${candidate.name} for the whole board`}
                  onClick={() =>
                    setState({
                      [pick.id]:
                        picked && pick.clearable ? pick.default : candidate.id,
                    })
                  }
                  className={cn(
                    PILL,
                    "inline-flex items-center gap-1",
                    picked
                      ? "border-transparent bg-foreground text-background"
                      : "border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  {picked && <Check className="size-3" aria-hidden />}
                  {picked ? "Picked" : "Pick"}
                </button>
              )}
              {a && (
                <SideButton
                  side="A"
                  name={candidate.name}
                  on={state[a] === candidate.id}
                  onPress={() => setState({ [a]: candidate.id })}
                />
              )}
              {b && (
                <SideButton
                  side="B"
                  name={candidate.name}
                  on={state[b] === candidate.id}
                  onPress={() => setState({ [b]: candidate.id })}
                />
              )}
              <LibraryLink id={candidate.library} />
            </div>
            )}

            <div
              // pick-one: a verdict is optional feedback on a card that did not
              // win, so it stays out of the eye until the reader reaches for it.
              className={cn(
                tiles?.quietVerdicts &&
                  "opacity-0 transition-opacity duration-150 group-hover/card:opacity-100 hover:opacity-100 focus-within:opacity-100 motion-reduce:transition-none",
              )}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              role="presentation"
            >
              <ItemVerdictRow
                scope={spec.id}
                round={spec.round.n}
                id={candidate.id}
                name={candidate.name}
                vocabulary={ITEM_VERDICTS}
              />
            </div>
          </article>
        );
      })}
    </div>
  );
}

/** The preview on its production ground, or bare when the board paints its own. */
function paint(node: React.ReactNode, ground?: Ground) {
  if (!ground) return node;
  return (
    <GroundBox
      ground={ground}
      className="overflow-hidden rounded-lg ring-1 ring-foreground/10"
    >
      {node}
    </GroundBox>
  );
}

/** A or B: which half of the compare below this card stands in. */
function SideButton({
  side,
  name,
  on,
  onPress,
}: {
  side: "A" | "B";
  name: string;
  on: boolean;
  onPress: () => void;
}) {
  return (
    <button
      type="button"
      data-dir-press
      aria-pressed={on}
      aria-label={`Put ${name} on side ${side} of the comparison`}
      onClick={onPress}
      className={cn(
        PILL,
        on
          ? "border-foreground/40 bg-card text-foreground"
          : "border-border text-muted-foreground hover:text-foreground",
      )}
    >
      {side}
    </button>
  );
}

/**
 * WHERE A KEPT IDEA WENT. A candidate that has been promoted to the Library
 * carries its entry id, and the card links it: a catalog that never says which
 * of its cards shipped is a museum. The link appears only once the entry really
 * exists in the committed artifact, so a `library` written ahead of the
 * promotion is silent rather than broken.
 */
function LibraryLink({ id }: { id?: string }) {
  // The gate key has to ride every lab link or it lands on the lab's 404.
  const key = useDesignKey();
  if (!id || !COMPONENTS.some((c) => c.id === id)) return null;
  return (
    <a
      href={withDesignKey(`/design/library/${id}`, key ?? null)}
      className="ml-auto text-[11px] text-muted-foreground underline underline-offset-2 transition-colors duration-150 hover:text-foreground motion-reduce:transition-none"
    >
      now in the Library
    </a>
  );
}
