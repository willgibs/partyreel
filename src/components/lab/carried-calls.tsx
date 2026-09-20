import { cn } from "@/lib/utils";

import type { CarriedCall } from "./board-spec";

/**
 * THE CALLS THE LANE CARRIED, ABOVE THE BOARD'S SECTIONS (lab-tides,
 * 2026-09-19).
 *
 * ★ THE FINDING. Every lane carries the calls its goal left open on its own
 * recommendation, because stopping to ask would stop the lane; today those
 * calls reach Will only through the round's CHANGELOG entry, a page away from
 * the board he is answering. Four lanes in the last sitting carried three to
 * six each. A decision taken for him that he never reads is not a decision he
 * made, so the board he IS reading says what was taken in his name.
 *
 * ★ A ROW, NEVER A CARD, and that is the whole of the design. A card says "here
 * is a thing to consider"; these are things already built, and the reader's job
 * is to skim them and stop at the one that is wrong. So: one heading, one line
 * each about the question, the call, and what changes if he says otherwise,
 * hairline-separated, no border box, no pill, nothing to press. They sit under
 * the Answer and above the sections because that is the last quiet moment
 * before the evidence begins.
 *
 * ★ AND THEY COUNT AGAINST THE READING BUDGET, on purpose. `lab:smoke` weighs
 * what a reviewer MEETS, and nothing here is folded: a lane that carried
 * fifteen calls has written a paper, and the budget is the one thing that says
 * so. `LIMITS.carried*` caps each string for the same reason.
 *
 * No motion: there is nothing to reveal and nothing to press, so reduced motion
 * is honoured by having nothing to honour.
 */
export function CarriedCalls({
  calls,
  className,
}: {
  calls?: readonly CarriedCall[];
  className?: string;
}) {
  if (!calls || calls.length === 0) return null;
  return (
    <section
      data-lab-carried=""
      aria-label="Calls the lane carried"
      className={cn("flex max-w-3xl flex-col gap-3", className)}
    >
      <div>
        <h2 className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
          Calls the lane carried, yours to overrule
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {calls.length === 1 ? "One question" : `${calls.length} questions`}{" "}
          this round left open. The lane took its own recommendation and built
          on it rather than stopping. To take one back, name it in a note on any
          step of this board.
        </p>
      </div>
      <ul className="flex flex-col">
        {calls.map((call) => (
          <li
            key={call.id}
            data-lab-call={call.id}
            className="border-t border-border py-2.5 first:border-t-0 first:pt-0"
          >
            <p className="text-[13px] leading-snug font-medium text-balance">
              {call.question}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              <span className="text-foreground">Taken: </span>
              {call.taken}
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              <span className="text-foreground">If not: </span>
              {call.overrule}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
