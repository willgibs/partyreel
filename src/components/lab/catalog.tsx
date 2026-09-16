"use client";

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
 * The grid is `.lab-catalog` in design.css, an auto-fill of `--lab-catalog-min`
 * (280px) so the column count follows the room rather than a breakpoint; a
 * board whose cards need more room passes `minWidth`.
 */

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
  ground,
  minWidth,
  className,
}: {
  spec: BoardSpec;
  state: BoardState;
  setState: (patch: Record<string, string>) => void;
  /** The live preview for one card. Real components, never a picture of one. */
  render: (candidate: Candidate, args: CatalogRenderArgs) => React.ReactNode;
  /** Paints the preview on a production ground; leave out to draw your own. */
  ground?: Ground;
  /** The narrowest a card may be before the grid drops a column (default 280). */
  minWidth?: number;
  className?: string;
}) {
  const catalog = spec.catalog;
  if (!catalog) return null;
  const pick = spec.controls?.find((c) => c.id === catalog.control);
  const [a, b] = catalog.compare ?? [];

  return (
    <div
      data-lab-catalog={spec.id}
      className={cn("lab-catalog", className)}
      style={
        minWidth
          ? ({ "--lab-catalog-min": `${minWidth}px` } as React.CSSProperties)
          : undefined
      }
    >
      {spec.candidates.map((candidate) => {
        const picked = pick ? state[pick.id] === candidate.id : false;
        return (
          <article
            key={candidate.id}
            // ★ NOT `data-<controlId>`: BoardPage writes that on the board ROOT
            // for every declared control, so a card wearing the same attribute
            // would make any sheet selecting on it hit every card at once.
            data-lab-card={candidate.id}
            data-picked={picked ? "true" : undefined}
            className={cn(
              "flex min-w-0 flex-col gap-3 rounded-xl border p-3 transition-colors duration-150 motion-reduce:transition-none",
              picked
                ? "border-foreground/40 bg-muted/40"
                : "border-border bg-background",
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
              {ground ? (
                <GroundBox
                  ground={ground}
                  className="overflow-hidden rounded-lg ring-1 ring-foreground/10"
                >
                  {render(candidate, { picked, state })}
                </GroundBox>
              ) : (
                render(candidate, { picked, state })
              )}
            </div>

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

            <ItemVerdictRow
              scope={spec.id}
              round={spec.round.n}
              id={candidate.id}
              name={candidate.name}
              vocabulary={ITEM_VERDICTS}
            />
          </article>
        );
      })}
    </div>
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
