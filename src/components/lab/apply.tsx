"use client";

import {
  clearCandidate,
  setCandidateCss,
  useTunerCandidate,
} from "@/components/dev/candidate-style";
import { cn } from "@/lib/utils";

/**
 * "APPLY TO THE SITE" (lifted from the light board, round two of the review
 * wave, 2026-09-14).
 *
 * A board proposes CSS; this hands that exact CSS to every page with a tuner
 * island, so a candidate is judged on the real dashboard and the real pricing
 * page rather than only on a stage. It is the shortest path from a board to the
 * product, and the reason a board's paste and what the site is wearing can never
 * disagree: they are one string.
 *
 * ★ IT IS A RADIO ACROSS THE BOARD, NOT A CHECKBOX ON EACH CANDIDATE. One block
 * stands at a time (the store's newest replaces the last), so four independent
 * "Applied" states while only one is live would be a lie. The button reads the
 * STORE rather than local state, which is what makes that true: clearing from
 * the tuner panel, or applying another board's block in a second tab, is
 * reflected here on the next render.
 *
 * ★ AND A STANDING TUNER KNOB BEATS IT. The tuner writes INLINE on <html> and an
 * inline declaration beats the `:root` block a candidate renders, so a board
 * whose candidate moves a token the tuner also owns must move the knobs with it
 * (`sync`), or the site silently keeps wearing the knob. The rounding board
 * learned this the expensive way.
 */
export type ApplyBlock = {
  /** What the badge in the dock says; prefix it with the board ("Light: ..."). */
  label: string;
  /** The paste, verbatim. Real selectors; it wins on source order, not weight. */
  css: string;
  /** One line: what this block changes, shown while it is not applied. */
  what?: string;
  /** Where to walk with it on: "/pricing, the dashboard". */
  pages?: string;
};

export function ApplyToSite({
  block,
  onApply,
  className,
}: {
  block: ApplyBlock;
  /** Move any tuner knob this block also owns; see the second landmine. */
  onApply?: (applied: boolean) => void;
  className?: string;
}) {
  const applied = useTunerCandidate();
  const on = applied?.label === block.label;
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <button
        type="button"
        onClick={() => {
          if (on) clearCandidate();
          else setCandidateCss(block.label, block.css);
          onApply?.(!on);
        }}
        aria-pressed={on}
        className={cn(
          "h-8 rounded-[var(--radius-action-sm)] px-3 text-[12px] font-medium transition-[transform,background-color,color] duration-150 ease-emphasis active:scale-[0.97] motion-reduce:transition-none",
          on
            ? "bg-foreground text-background"
            : "border border-border bg-card text-foreground hover:border-foreground/30",
        )}
      >
        {on ? "Applied to the site" : "Apply to the site"}
      </button>
      <span className="text-[11px] text-muted-foreground">
        {on
          ? `Walk: ${block.pages ?? "any page with a tuner island"}. It persists until you clear it.`
          : (block.what ?? "Hands the site this exact block.")}
      </span>
    </div>
  );
}
