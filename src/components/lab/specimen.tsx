import { cn } from "@/lib/utils";

/**
 * THE JUDGED THING AND THE LINE THAT NAMES IT (lifted from the light board,
 * whose two rules decide everything here and are general, not about light):
 *
 * 1. A LABEL IS NEVER INSIDE THE JUDGED AREA. A caption box drawn around a
 *    specimen is one more edge, one more surface, one more corner, which on any
 *    board judging edges, surfaces or corners is a competing cue. Captions sit
 *    UNDER the specimen, on the bare ground, in the ground's own muted ink.
 * 2. A SPECIMEN SITS ON THE GROUND, NOT IN A FRAME, for the same reason. The
 *    glow-doctrine board proved it the other way round: un-applying its lit
 *    surface to re-judge its beams would have changed what they were.
 */

/** The per-cell label: one step under the lab's caption atom, in the body face
 *  with tabular figures (there is no mono face in the product, bible 7). */
export function CellLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "mt-2 text-[11px] leading-snug text-muted-foreground tabular-nums",
        className,
      )}
    >
      {children}
    </p>
  );
}

/**
 * A named specimen: the thing, then its label. `note` is the one line saying
 * what this cell is evidence FOR; `proposed` marks the cell the board lands on.
 *
 * ★ THE MARK IS IN THE LABEL, NEVER AROUND THE SPECIMEN. A dashed outline at an
 * offset is the obvious way to say "this one", and on any board about edges it
 * is a fifth cue: the eye reads the outlined card as the one with the extra
 * edge. Tried it, removed it.
 */
export function Cell({
  name,
  note,
  proposed,
  className,
  children,
}: {
  name: string;
  note?: string;
  /** One line: why this is the one. Draws the dot. */
  proposed?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col", className)}>
      <div className="flex min-h-0 flex-1 items-center justify-center">
        {children}
      </div>
      <CellLabel>
        <span
          className={cn(
            "font-medium",
            proposed ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {name}
        </span>
        {proposed ? (
          <span className="block text-foreground">
            <span className="mr-1.5 inline-block size-1.5 translate-y-[-1px] rounded-full bg-foreground align-middle" />
            {proposed}
          </span>
        ) : null}
        {note ? <span className="block">{note}</span> : null}
      </CellLabel>
    </div>
  );
}

/**
 * A labelled FULL-WIDTH block: a stage, a frame, a compare, and the line that
 * says what it is.
 *
 * ★ NOT `Cell`. Cell centres its child in a flex row, and a Stage measures the
 * box it is handed to decide its zoom, so a Stage inside a flex row shrinks to
 * its content width, measures about 100px and renders a 1440 canvas at seven
 * percent. It looks like a thumbnail and nothing about it says it is wrong.
 * Stages and frames go here; specimens go in Cell.
 */
export function Labeled({
  name,
  note,
  children,
  className,
}: {
  name: string;
  note?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex w-full flex-col", className)}>
      {children}
      <CellLabel>
        <span className="font-medium text-foreground">{name}</span>
        {note ? <span className="block">{note}</span> : null}
      </CellLabel>
    </div>
  );
}

/**
 * A ROW OR GRID OF CELLS, so a board stops hand-rolling a grid template per
 * block. `cols` is a NUMBER a board computes from its canvas rather than a
 * responsive class, because a breakpoint prefix inside a stage reads the real
 * browser viewport and not the canvas (stage.tsx's landmine), so `sm:` fires
 * inside a 375 stage on a desktop and the grid silently lies.
 */
export function Specimen({
  cols,
  gap = 4,
  className,
  children,
}: {
  /**
   * A number for equal cells; `"auto"` for a row of specimens at different
   * TRUE widths (a 560 beside two 437s inside a 1440 stage), where equal
   * columns could only fit the wide one by shrinking or scaling it, which the
   * 1:1 law forbids for a thing whose size is being judged (the river-visual
   * migration, 2026-09-15): each column is its content's width, centred.
   */
  cols: number | "auto";
  /** Tailwind's gap scale step; 4 is the board default. */
  gap?: 2 | 3 | 4 | 6 | 8;
  className?: string;
  children: React.ReactNode;
}) {
  const GAP = { 2: "gap-2", 3: "gap-3", 4: "gap-4", 6: "gap-6", 8: "gap-8" };
  return (
    <div
      className={cn(
        "grid min-w-0",
        cols === "auto" && "justify-center",
        GAP[gap],
        className,
      )}
      style={
        cols === "auto"
          ? { gridAutoFlow: "column", gridAutoColumns: "max-content" }
          : { gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }
      }
    >
      {children}
    </div>
  );
}
