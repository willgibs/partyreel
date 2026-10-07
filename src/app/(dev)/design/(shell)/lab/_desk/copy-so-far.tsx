"use client";

import { useRef, useState } from "react";

import { boardSpec } from "@/app/(dev)/design/sandbox/registry";
import { CopyButton } from "@/components/lab/paste";
import { openCall } from "@/lib/calls/calls";
import { cn } from "@/lib/utils";

import {
  composeSoFar,
  type OpenRound,
  type Transcribed,
} from "./review-message";
import {
  EMPTY_REVIEW,
  markSent,
  type ReviewStore,
  setReviewStore,
  useReviewStore,
} from "./review-store";

/**
 * COPY WHAT YOU HAVE SO FAR (Will, 2026-09-16). One button, on the review
 * step's spine and on the desk, that composes every held answer, verdict and
 * note across every board into the message the Orchestrator transcribes, so a
 * sitting can be pasted in batches at the reviewer's own pace. Copying never
 * clears anything: the same asks pasted again later simply overwrite in the
 * ledger. Emptying the sitting is its own press, `ClearHeld`, below.
 *
 * ★ AND IT OMITS WHAT HAS ALREADY BEEN SENT (the stepped review, 2026-09-16).
 * The store holds the whole sitting for ever, so the second paste of a batched
 * review used to re-send the first. `transcribed` is what the ledger already
 * holds, read on the server from the desk's own rows, and an entry that matches
 * it choice-and-note is dropped; a changed one rides again. The same holds for
 * a note, and nothing rides for a step the board no longer asks (2026-09-17).
 *
 * ★ AND THE LEDGER IS ONLY AS FRESH AS THE BUILD HE IS READING (Will,
 * 2026-09-19: his answers stay in the store after he pastes, and the next paste
 * carries them again until the alias rebuilds). So the paste marks what it took
 * (`markSent`, review-store.ts) and the next one leaves it out: the picks stay
 * on screen, greyed and dated, and only stop travelling. "Copy everything" is
 * the one way back, for the rare paste that went missing between here and the
 * chat window.
 *
 * ★ AND THE CALLS RIDE THE SAME PASTE (calls-desk, 2026-10-07: one message a
 * sitting). An answer at the desk's Calls place joins as one `calls:` line
 * wherever this button stands, on the desk or on a board's spine, read against
 * the calls file this page was built with: an entry the record has retired is
 * not open, so its answer never rides again.
 */

/**
 * A board's open round as the spec declares it today: a step the board
 * withdrew is closed the moment it leaves the spec, whatever the store still
 * holds.
 */
function openRoundOf(board: string): OpenRound | undefined {
  const spec = boardSpec(board);
  return (
    spec && {
      round: spec.round.n,
      asks: spec.asks.map((a) => a.id),
      items: spec.catalog ? spec.candidates.map((c) => c.id) : [],
    }
  );
}

/**
 * WHAT THE SITTING HOLDS, counted the way the Copy buttons count it (the open
 * rounds' entries and the calls the file still asks; a call's answer is an
 * answer, and the program's note is a note). `unsent` is the part no paste has
 * taken and the ledger does not hold: the part a Clear would lose for good.
 */
export type HeldTally = {
  answers: number;
  verdicts: number;
  notes: number;
  unsent: number;
};

type Composed = ReturnType<typeof composeSoFar>;

/** The tally from the two compositions the Copy buttons already make (everything held, and what is not yet sent). */
export function tallyOf(all: Composed, fresh: Composed): HeldTally {
  return {
    answers: all.answers + all.calls,
    verdicts: all.items,
    notes: all.notes,
    unsent: fresh.answers + fresh.calls + fresh.items + fresh.notes,
  };
}

/** The same tally for a caller with no composition of its own (the walk's summary). */
export function tallyHeld(
  store: ReviewStore,
  transcribed?: Transcribed,
  build?: string | null,
): HeldTally {
  return tallyOf(
    composeSoFar(store, openRoundOf, transcribed, build, {
      ignoreSent: true,
      openCall,
    }),
    composeSoFar(store, openRoundOf, transcribed, build, { openCall }),
  );
}

const plural = (n: number, one: string, many = `${one}s`) =>
  `${n} ${n === 1 ? one : many}`;

/** "14 answers, 2 verdicts and 1 note": the kinds that are held, in the Copy label's order. */
function listWords(t: HeldTally): string {
  const parts = [
    t.answers ? plural(t.answers, "answer") : "",
    t.verdicts ? plural(t.verdicts, "verdict") : "",
    t.notes ? plural(t.notes, "note") : "",
  ].filter(Boolean);
  return parts.length < 2
    ? (parts[0] ?? "")
    : `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}

/**
 * THE CLEAR'S QUESTION, SAYING PLAINLY WHAT IT EMPTIES (Will, 2026-10-07): every answer, verdict and note this
 * browser holds, and, in the same breath, how much of it nothing else holds yet. A Clear is the one press that can
 * cost a sitting (review-store.ts: a mark rather than a clear, for that reason), so the loss is the sentence's
 * second half: what no paste has taken would be gone, and what a paste took is only as safe as the paste that
 * reached the chat.
 */
export function clearWords(t: HeldTally): string {
  const total = t.answers + t.verdicts + t.notes;
  const held = listWords(t);
  const fate =
    t.unsent === 0
      ? total === 1
        ? "It is already copied or recorded."
        : "All of it is already copied or recorded."
      : total === 1
        ? "It is not copied yet and would be lost."
        : `${t.unsent === 1 ? "1 of them is" : `${t.unsent} of them are`} not copied yet and would be lost.`;
  return `Clear ${held} held in this browser? ${fate}`;
}

/** A callback ref with a stable identity, so it runs when the element mounts and never again on a re-render. */
const focusOnMount = (el: HTMLElement | null) => el?.focus();

const press =
  "h-7 rounded-[var(--radius-action-sm)] border border-border px-2.5 text-[11px] font-medium transition-transform duration-150 ease-emphasis active:scale-[0.97] motion-reduce:transition-none";

/**
 * A CLEAR ON THE DESK (Will, 2026-10-07: "Copy everything" carried a past batch's answers into his calls paste, since
 * the desk still served a build older than their transcription). One quiet press empties the sitting's held answers,
 * and it asks first, inline and in words: the count it would empty and how much of that nothing else holds. Keep is
 * where the focus lands, so Enter never clears; Escape keeps too. The store goes whole (`EMPTY_REVIEW`: answers,
 * verdicts, notes, the program's note, the calls, and every sent mark), exactly as the walk's end always cleared it,
 * which this now replaces with the same question.
 *
 * Nothing renders when nothing is held, so it appears and goes with the Copy buttons it sits beside. After a
 * transcription the Orchestrator refreshes the desk (the build it serves carries the ledger), so answers the record
 * already holds stop counting on their own; this is for the ones a stale desk still carries.
 */
export function ClearHeld({
  tally,
  label = "Clear",
  onCleared,
  className,
}: {
  tally: HeldTally;
  /** The press's own word: "Clear" on the desk, "Clear this session" at the walk's end. */
  label?: string;
  /** After the store is emptied (the walk goes back to its first step). */
  onCleared?: () => void;
  className?: string;
}) {
  const [asking, setAsking] = useState(false);
  // Focus returns to the press after Keep: it is unmounted while the question stands, so the flag waits for it.
  const returnFocus = useRef(false);
  const total = tally.answers + tally.verdicts + tally.notes;
  // A question left open when the store emptied elsewhere (the desk shows more than one Clear) must not wait to
  // surprise the next answer: adjusting state while rendering, the one place the reset can sit with no effect.
  if (total === 0 && asking) setAsking(false);
  if (total === 0) return null;

  const keep = () => {
    returnFocus.current = true;
    setAsking(false);
  };

  if (!asking) {
    return (
      <button
        type="button"
        ref={(el) => {
          if (el && returnFocus.current) {
            returnFocus.current = false;
            el.focus();
          }
        }}
        onClick={() => setAsking(true)}
        className={cn(
          press,
          "border-dashed text-faint hover:text-foreground",
          className,
        )}
      >
        {label}
      </button>
    );
  }
  return (
    <span
      role="group"
      aria-label="Confirm clearing what this browser holds"
      onKeyDown={(e) => {
        if (e.key === "Escape") keep();
      }}
      className={cn(
        "inline-flex max-w-full flex-wrap items-center gap-1.5 rounded-[var(--radius-action-sm)] border border-border bg-card px-2.5 py-1.5 text-[11px]",
        className,
      )}
    >
      <span
        role="status"
        className={cn(
          "text-muted-foreground",
          tally.unsent > 0 && "text-foreground",
        )}
      >
        {clearWords(tally)}
      </span>
      <button
        type="button"
        ref={focusOnMount}
        onClick={keep}
        className={cn(press, "hover:bg-muted/40")}
      >
        Keep
      </button>
      <button
        type="button"
        onClick={() => {
          setAsking(false);
          setReviewStore(EMPTY_REVIEW);
          onCleared?.();
        }}
        className={cn(
          press,
          "text-muted-foreground hover:border-destructive/50 hover:text-destructive",
        )}
      >
        Clear them
      </button>
    </span>
  );
}

export function CopySoFar({
  transcribed,
  build,
  className,
}: {
  transcribed?: Transcribed;
  /** The commit this page was built from; rides the paste as a `#` line. */
  build?: string | null;
  className?: string;
}) {
  const store = useReviewStore();
  const fresh = composeSoFar(store, openRoundOf, transcribed, build, {
    openCall,
  });
  const all = composeSoFar(store, openRoundOf, transcribed, build, {
    ignoreSent: true,
    openCall,
  });
  // A call's answer is an answer: the label counts it with the boards'.
  const answered = fresh.answers + fresh.calls;
  const held = answered + fresh.items + fresh.notes;
  const everything = all.answers + all.calls + all.items + all.notes;
  if (everything === 0) return null;
  const parts = [
    answered ? `${answered} answer${answered === 1 ? "" : "s"}` : "",
    fresh.items ? `${fresh.items} verdict${fresh.items === 1 ? "" : "s"}` : "",
    fresh.notes ? `${fresh.notes} note${fresh.notes === 1 ? "" : "s"}` : "",
  ].filter(Boolean);
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      {held > 0 && (
        <CopyButton
          text={fresh.message}
          label={`Copy so far (${parts.join(", ")})`}
          done="Copied: paste it in chat"
          onCopy={() => markSent(fresh.included, build)}
          className={cn(
            "text-muted-foreground hover:text-foreground",
            className,
          )}
        />
      )}
      {/* The quiet way back: everything held, sent or not, for the paste that
          never arrived. It marks the lot again, so the next one is clean. */}
      {everything > held && (
        <CopyButton
          text={all.message}
          label={
            held > 0 ? "Copy everything" : `Copy everything (${everything})`
          }
          done="Copied: paste it in chat"
          onCopy={() => markSent(all.included, build)}
          className={cn(
            "border-dashed text-faint hover:text-foreground",
            className,
          )}
        />
      )}
      {/* And the quiet way out: the sitting emptied, after it says what that costs. */}
      <ClearHeld tally={tallyOf(all, fresh)} className={className} />
    </span>
  );
}
