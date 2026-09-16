"use client";

import { cn } from "@/lib/utils";

import type { BoardSpec, BoardState, Candidate } from "./board-spec";
import { Compare, type CompareMode } from "./compare";
import { CellLabel } from "./specimen";

/**
 * ANY TWO CARDS, SIDE BY SIDE (the revamp, 2026-09-16).
 *
 * A catalog answers "which of these", and the question under it is always
 * "these two, then". Will asked for the switch to be page-wide so variants can
 * be toggled on previews anywhere on the page (2026-09-16), so A and B are
 * DECLARED CONTROLS set from the catalog's own cards: press A on one card, B on
 * another, and this section is those two. No second selection lives here.
 *
 * ★ `differs` IS STILL REQUIRED, and the default is honest rather than empty:
 * the two candidates' own `one` lines, joined, which is the board's own claim
 * about what separates them. A board with a sharper line passes it.
 *
 * ★ AND A THING AGAINST ITSELF IS NOT A COMPARISON. When A and B name the same
 * card, this renders it ONCE with the line that brings the seam back, rather
 * than drawing two identical halves and letting a reader hunt for a difference
 * that is not there (the palette board's own lesson, round six).
 */
export function CompareTwo({
  spec,
  state,
  render,
  differs,
  mode = "side",
  cols,
  className,
}: {
  spec: BoardSpec;
  state: BoardState;
  /** One candidate, drawn as the comparison shows it. */
  render: (candidate: Candidate, side: "a" | "b") => React.ReactNode;
  /** The one thing that differs; defaults to the two cards' own lines. */
  differs?: string;
  mode?: CompareMode;
  /** The `side` columns as a number, because a breakpoint inside a Stage lies. */
  cols?: 1 | 2;
  className?: string;
}) {
  const pair = comparePair(spec, state);
  if (!pair) return null;
  const { a, b } = pair;

  if (a.id === b.id) {
    return (
      <div className={cn("flex min-w-0 flex-col gap-2", className)}>
        {render(a, "a")}
        <CellLabel>
          A and B are both {a.name}, so both halves would be the same thing.
          Press B on another card in the catalog and the seam comes back.
        </CellLabel>
      </div>
    );
  }

  return (
    <Compare
      className={className}
      mode={mode}
      cols={cols}
      labels={[a.name, b.name]}
      differs={differs ?? defaultDiffers(a, b)}
      a={render(a, "a")}
      b={render(b, "b")}
    />
  );
}

/** The two candidates the declared compare controls are naming, or null. */
export function comparePair(
  spec: BoardSpec,
  state: BoardState,
): { a: Candidate; b: Candidate } | null {
  const compare = spec.catalog?.compare;
  if (!compare) return null;
  const at = (control: string) => {
    const declared = spec.controls?.find((c) => c.id === control);
    const id = state[control] ?? declared?.default;
    return spec.candidates.find((c) => c.id === id);
  };
  const a = at(compare[0]);
  const b = at(compare[1]);
  return a && b ? { a, b } : null;
}

function defaultDiffers(a: Candidate, b: Candidate): string {
  if (!a.one && !b.one) return `${a.name} against ${b.name}.`;
  return `${a.name}: ${a.one ?? "the board's own line is missing."} ${b.name}: ${b.one ?? "the board's own line is missing."}`;
}

/** One real place a candidate is applied: where it lives, and what to read there. */
export type Spot = {
  id: string;
  /** What the place is, in words a stranger knows: "the home page's first screen". */
  name: string;
  /** What to read HERE rather than anywhere else. */
  note?: string;
};

/**
 * THE SAME PLACES, UNDER TWO CANDIDATES (the revamp, 2026-09-16).
 *
 * The catalog shape works when the thing being chosen is a whole object (a
 * palette, a hero). Some explorations choose ONE thing that is then applied in
 * many real places, and the brand voice is the type case: a voice is not a
 * picture, it is seven headers, a guest screen and an email preview. Judging it
 * card by card asks the wrong question; judging one place at a time under two
 * voices asks the right one.
 *
 * So a spot list is the second shape, and it is deliberately the SAME two
 * controls: A and B are still set from the catalog's cards, and every spot is
 * drawn twice under them. `pnpm new-board --spots` scaffolds this.
 */
export function SpotCompare({
  spec,
  state,
  spots,
  render,
  mode = "side",
  cols,
  className,
}: {
  spec: BoardSpec;
  state: BoardState;
  spots: readonly Spot[];
  /** One spot under one candidate: the real component or section, not a picture. */
  render: (
    spot: Spot,
    candidate: Candidate,
    side: "a" | "b",
  ) => React.ReactNode;
  mode?: CompareMode;
  cols?: 1 | 2;
  className?: string;
}) {
  const pair = comparePair(spec, state);
  if (!pair) return null;
  const { a, b } = pair;

  return (
    <div className={cn("flex min-w-0 flex-col gap-8", className)}>
      {spots.map((spot) => (
        <section key={spot.id} className="flex min-w-0 flex-col gap-2">
          <div>
            <h3 className="text-sm font-medium">{spot.name}</h3>
            {spot.note && (
              <p className="mt-0.5 max-w-2xl text-[11px] leading-relaxed text-muted-foreground">
                {spot.note}
              </p>
            )}
          </div>
          {a.id === b.id ? (
            <>
              {render(spot, a, "a")}
              <CellLabel>
                A and B are both {a.name}. Press B on another card in the
                catalog to read this place under two of them.
              </CellLabel>
            </>
          ) : (
            <Compare
              mode={mode}
              cols={cols}
              labels={[a.name, b.name]}
              differs={`${spot.name}, under ${a.name} and under ${b.name}.`}
              a={render(spot, a, "a")}
              b={render(spot, b, "b")}
            />
          )}
        </section>
      ))}
    </div>
  );
}
