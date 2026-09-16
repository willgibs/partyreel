"use client";

import { cn } from "@/lib/utils";

import {
  setAnswerNote,
  setBoardNote,
  toggleAnswer,
  useReviewStore,
} from "@/app/(dev)/design/(shell)/lab/_desk/review-store";
import { holdId } from "@/app/(dev)/design/(shell)/lab/_desk/step-id";

import {
  type BoardSpec,
  optionId,
  optionLabel,
  optionMeans,
} from "./board-spec";
import { CopyButton } from "./paste";

/**
 * THE REVIEW PANEL: COPY AS MESSAGE, AND NOTHING ELSE.
 *
 * ★ THE LAB NEVER WRITES THE REPO (Will's decision, 2026-09-15). A panel that
 * appended to `docs/reviews/` would need a write route on a dev surface, and a
 * ruling would land in git with nobody in the loop. So this composes one LINE
 * and Will pastes it into chat; the Orchestrator runs `pnpm lab:review "<line>"`,
 * which validates every ask and option against this board's spec before it
 * appends. The validation is on the way IN, where a typo is still cheap.
 *
 * The grammar is `docs/reviews/README.md`, and this is the only thing in the
 * product that writes it:
 *
 *   review <board> r<n>: <ask>=<option> "an optional note"; <ask>=<option>;
 *   note: "a board-wide note"
 *
 * ★ IT EMITS ASK IDS AND OPTION TOKENS, NEVER THE QUESTION TEXT. A ledger that
 * stored the question would go stale the moment the board reworded it, and the
 * answers would stop matching the asks they answered. The id is the join.
 *
 * ★ AND AN UNANSWERED ASK IS OMITTED, NOT DEFAULTED. "Answer only the ones you
 * want to differ on" is the whole point of a recommendation; writing the
 * recommended option for every untouched ask would record agreement nobody gave.
 *
 * "?" IS AN ANSWER: "this question is not clear to me". It rides into the
 * line as `ask=? "why"` and lands in the ledger as a null choice, so the desk
 * keeps the ask open and the board owes a clearer question (the clarity
 * round, 2026-09-15). The buttons show each option's LABEL; the line carries
 * its id.
 */
export function composeReviewMessage(
  spec: BoardSpec,
  answers: Record<string, string>,
  notes: Record<string, string>,
  boardNote: string,
): string {
  const clauses = spec.asks
    .filter((a) => answers[a.id])
    .map((a) => {
      const note = notes[a.id]?.trim();
      return `${a.id}=${answers[a.id]}${note ? ` "${note.replace(/"/g, "'")}"` : ""}`;
    });
  const tail = boardNote.trim()
    ? `note: "${boardNote.trim().replace(/"/g, "'")}"`
    : "";
  const body = [...clauses, tail].filter(Boolean).join("; ");
  return `review ${spec.id} r${spec.round.n}: ${body}`;
}

export function ReviewQuestions({
  spec,
  className,
}: {
  spec: BoardSpec;
  className?: string;
}) {
  // One store for the panel, the review card and the desk's session, so a
  // pick made on any of them shows on all of them and clears the same way.
  const store = useReviewStore();
  const round = spec.round.n;
  const answers: Record<string, string> = {};
  const notes: Record<string, string> = {};
  for (const ask of spec.asks) {
    const held = store.answers[holdId(spec.id, round, ask.id)];
    if (held?.choice) answers[ask.id] = held.choice;
    if (held?.note) notes[ask.id] = held.note;
  }
  const boardNote = store.notes[spec.id] ?? "";
  const answered = spec.asks.filter((a) => answers[a.id]).length;
  const message = composeReviewMessage(spec, answers, notes, boardNote);

  return (
    <section
      className={cn(
        "flex max-w-2xl flex-col gap-3 rounded-xl border border-foreground/25 bg-card px-4 py-4",
        className,
      )}
    >
      <div>
        <h2 className="text-sm font-semibold tracking-tight">Rule on it</h2>
        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
          One word an ask, a note where the word is not enough. Answer only what
          you want to differ on; leaving an ask blank leaves it out of the
          message. Nothing here is written to the repo: Copy hands you one line
          to paste into chat.
        </p>
      </div>

      <ul className="flex flex-col gap-3">
        {spec.asks.map((ask) => (
          <li key={ask.id} className="flex flex-col gap-1.5">
            <span className="text-[12px] font-medium">{ask.question}</span>
            <div className="flex flex-wrap gap-1.5">
              {[...ask.options, "?" as const].map((o) => {
                const id = o === "?" ? "?" : optionId(o);
                const on = answers[ask.id] === id;
                return (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={on}
                    title={o === "?" ? undefined : optionMeans(o)}
                    onClick={() => toggleAnswer(spec.id, round, ask.id, id)}
                    className={cn(
                      "rounded-md px-2.5 py-1 text-[11px] font-medium transition-[transform,background-color,color] duration-150 ease-emphasis active:scale-[0.97] motion-reduce:transition-none",
                      on
                        ? "bg-foreground text-background"
                        : "border border-border text-muted-foreground hover:text-foreground",
                      !on &&
                        id === ask.recommended &&
                        "border-foreground/40 text-foreground",
                      o === "?" && !on && "border-dashed",
                    )}
                  >
                    {o === "?" ? "Not clear to me" : optionLabel(o)}
                    {id === ask.recommended ? (
                      <span className="ml-1 opacity-60">proposed</span>
                    ) : null}
                  </button>
                );
              })}
            </div>
            <input
              type="text"
              value={notes[ask.id] ?? ""}
              onChange={(e) =>
                setAnswerNote(spec.id, round, ask.id, e.target.value)
              }
              placeholder="A note on this one (optional)"
              aria-label={`A note on ${ask.question}`}
              className="h-8 w-full rounded-[var(--radius-action-sm)] border border-border bg-background px-2.5 text-[12px] outline-none focus-visible:border-foreground/40"
            />
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={`${spec.id}-board-note`}
          className="text-[12px] font-medium"
        >
          A note on the whole board
        </label>
        <textarea
          id={`${spec.id}-board-note`}
          rows={2}
          value={boardNote}
          onChange={(e) => setBoardNote(spec.id, e.target.value)}
          placeholder="Anything that is not an answer to one ask"
          className="w-full resize-y rounded-[var(--radius-action-sm)] border border-border bg-background px-2.5 py-1.5 text-[12px] outline-none focus-visible:border-foreground/40"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <CopyButton
          text={() => message}
          label="Copy as message"
          done="Copied, paste it into chat"
          className="border-foreground/40"
        />
        <span className="text-[11px] text-muted-foreground tabular-nums">
          {answered} of {spec.asks.length} answered
        </span>
      </div>
      <p className="overflow-x-auto rounded-lg border border-border bg-muted/40 px-3 py-2 font-sans text-[11px] leading-relaxed whitespace-pre-wrap">
        {message}
      </p>
    </section>
  );
}
