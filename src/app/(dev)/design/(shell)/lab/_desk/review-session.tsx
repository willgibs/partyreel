"use client";

import { useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";

import { useAdoptTypedValue } from "@/lib/adopt-typed-value";
import { CALLS, openCall } from "@/lib/calls/calls";
import { cn } from "@/lib/utils";

import { Step } from "@/components/lab/step";

import { CopyButton } from "@/app/(dev)/design/(shell)/_shell/copy";
import { LabLink } from "@/app/(dev)/design/(shell)/_shell/shell-context";
import { answerWords } from "../calls/answer-words";
import {
  alreadySent,
  composeMessage,
  heldCallAnswers,
  type SessionAnswer,
  type SessionItem,
  type SessionNote,
  type Transcribed,
} from "./review-message";
import {
  EMPTY_REVIEW,
  type ReviewStore,
  setProgramNote,
  setReviewStore,
  useReviewStore,
} from "./review-store";
import {
  type AskStep,
  SESSION_END,
  type SessionOption,
  type SessionStep,
  stepDone,
  stepHeld,
  stepParam,
  UNCLEAR,
} from "./session-step";
import { holdId, itemHoldId } from "./step-id";

/**
 * THE REVIEW SESSION (the Library x Lab round, 2026-09-15). Will's desk asks
 * one thing at a time: every open ask across every standing board, in board
 * order, with the case for the recommendation beside it and the evidence one
 * click away. At the end it composes ONE message in the ledger grammar for him
 * to paste into chat. The UI never writes the repo directly:
 * `pnpm lab:review` is the only thing that touches docs/reviews/.
 *
 * The position lives in the URL as `?session=<board>.<ask>` (`end` is the
 * summary), written with history.replaceState rather than a router push, so a
 * step change costs no server round trip and a reload still resumes where the
 * reader stopped. The answers live in localStorage, per viewer, so closing the
 * tab mid-review loses nothing either. No board is called `end`, and none will
 * be: a board's id is its folder's descriptive name.
 *
 * Keys: 1..9 picks an option, Enter goes on, the arrows step; Escape lets a
 * note field go so the digits work again.
 * The handler is registered with review-keys.ts so the shell can own the
 * keyboard later without this file changing.
 *
 * A STEP IS AN ASK OR A CATALOG (the revamp, 2026-09-16). A board that
 * declares its candidates ARE a catalog contributes ONE step carrying every
 * card, each given `keep | refine | kill` on a row of its own; away from the board
 * the rows are all there is to show, so the step lists them, and on the board
 * the same rows are under the cards themselves.
 *
 * A STEP CARRIES THE ASK'S OWN CONTEXT (the clarity round, 2026-09-15). Will's
 * first session stopped at "The aurora's placement: no | seam | both | room":
 * a label and four tokens, with the board's argument for its own pick under
 * them and the evidence a tab away. So a step now shows the question in plain
 * words, what the thing is, where to look, and each option's label with what
 * choosing it means; and "Not clear to me" is an answer of its own (`?`), so
 * a question that still fails is recorded as failing rather than skipped.
 */

/* The step's shape, its `?` answer and the queue's derivation live in
   session-step.ts: the board's review card renders the same step, and two
   copies would drift the day an ask grew a field. Re-exported so the desk's
   own importers keep one import. */
export { UNCLEAR };
export type { SessionOption, SessionStep };

/** An ASK's held key. A catalog's cards hold one key each (`itemHoldId`). */
const askKey = (s: AskStep) => holdId(s.board, s.round, s.askId);
/**
 * The summary's own URL value. The dry run namespaces it, so finishing a dry
 * run and reloading returns to the dry run rather than to the real queue's
 * summary (they share one param).
 */
const endValue = (sample: boolean) =>
  sample ? `sample.${SESSION_END}` : SESSION_END;

/**
 * Where a session opens: the step the URL names, else the first ask with no
 * answer held. Derived during render rather than settled in an effect, so the
 * step resolves the moment the store hydrates (react-hooks/set-state-in-effect
 * is what makes an effect the wrong tool here).
 */
function startAt(
  steps: SessionStep[],
  param: string | null,
  store: ReviewStore,
  end: string,
) {
  if (param === end) return steps.length;
  const at = steps.findIndex((s) => stepParam(s) === param);
  if (at >= 0) return at;
  const first = steps.findIndex((s) => !stepDone(s, store));
  return first < 0 ? steps.length : first;
}

export function ReviewSession({
  steps,
  param,
  title,
  blurb,
  build,
  transcribed,
  sample = false,
}: {
  steps: SessionStep[];
  /** The `session` value the server read, so the first paint is the right step. */
  param: string | null;
  title: string;
  blurb: string;
  /** The commit this page was built from; rides the paste as a `#` line. */
  build?: string | null;
  /** What the ledger already holds, so neither message sends it again. */
  transcribed?: Transcribed;
  /** A dry run: the message it composes is refused by lab-review, by design. */
  sample?: boolean;
}) {
  const END = endValue(sample);
  const store = useReviewStore();
  // Null until the reader moves: the opening step is derived, so it follows
  // the store from its empty server snapshot to the answers held here.
  const [chosen, setChosen] = useState<number | null>(null);
  const at = chosen ?? startAt(steps, param, store, END);

  const atEnd = at >= steps.length;

  // No useCallback anywhere below: the React compiler memoises these, and a
  // hand-written dependency list here disagreed with the one it infers, which
  // makes it skip the whole component (react-hooks/incompatible-library).
  const update = setReviewStore;

  const syncUrl = (value: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set("session", value);
    // ★ NULL, NEVER `window.history.state` (crumbs-16; `board-state.tsx` has the measurements): the
    // entry's own state carries Next's `__NA`, which makes Next apply no URL, so the shell's
    // `useSearchParams` (`CopyLink`, the sticky links) kept the step the reader left.
    window.history.replaceState(null, "", url.toString());
  };

  const goTo = (next: number) => {
    const clamped = Math.max(0, Math.min(steps.length, next));
    setChosen(clamped);
    syncUrl(clamped >= steps.length ? END : stepParam(steps[clamped]));
    window.scrollTo({ top: 0 });
  };

  const { answers, items, notes } = useMemo(() => {
    const answers: SessionAnswer[] = [];
    const items: SessionItem[] = [];
    for (const s of steps) {
      if (s.kind === "items") {
        for (const item of s.items) {
          const held = store.items[itemHoldId(s.board, s.round, item.id)];
          if (!held?.verdict) continue;
          items.push({
            board: s.board,
            round: s.round,
            item: item.id,
            verdict: held.verdict,
            note: held.note || undefined,
          });
        }
        continue;
      }
      const held = store.answers[askKey(s)];
      if (!held?.choice) continue;
      if (alreadySent(transcribed?.answers[askKey(s)], held)) continue;
      answers.push({
        board: s.board,
        round: s.round,
        ask: s.askId,
        choice: held.choice,
        note: held.note || undefined,
      });
    }
    const notes: SessionNote[] = [];
    for (const s of steps) {
      if (notes.some((n) => n.board === s.board)) continue;
      const text = store.notes[s.board];
      if (text?.trim()) notes.push({ board: s.board, round: s.round, text });
    }
    return { answers, items, notes };
  }, [steps, store, transcribed]);

  const program = store.program ?? "";
  // ★ The note on the whole program is drawn at the end of the walk from the
  // server's first paint, so a word typed before the page hydrated is kept
  // (`adopt-typed-value.ts`).
  const adoptProgram = useAdoptTypedValue<HTMLTextAreaElement>(program);
  // ★ AND THE CALLS RIDE THIS MESSAGE TOO (calls-desk: one message a sitting),
  // by the rule "Copy so far" sends them by, a paste's mark included, since
  // the calls have no ledger for this page to compare against. Never in a dry
  // run, whose message is a sample board's alone.
  const calls = useMemo(
    () =>
      sample
        ? []
        : heldCallAnswers(store.calls, openCall, (key) =>
            Boolean(store.sent?.[key]),
          ).calls,
    [sample, store],
  );
  const message = useMemo(
    () => composeMessage(answers, notes, items, [], build, program, calls),
    [answers, notes, items, build, program, calls],
  );
  const answered = answers.length + items.length + calls.length;
  // A note on the whole program is a message on its own.
  const said = answered > 0 || program.trim() !== "";

  if (steps.length === 0) return null;

  return (
    <div className="pb-8">
      <div className="flex flex-wrap items-center justify-between gap-2 pt-6">
        <LabLink
          href="/design/lab"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          The desk
        </LabLink>
        {atEnd && (
          <p className="text-xs text-muted-foreground tabular-nums">
            {answered} answered
            {sample && <span className="ml-2">· dry run</span>}
          </p>
        )}
      </div>

      {sample && (
        <p className="mt-4 rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
          A dry run on a sample board, so the session can be walked before the
          standing boards carry their specs. The message it composes is real
          grammar on an unreal board, so{" "}
          <code className="font-sans">lab:review</code> refuses it: that is the
          refusal path, shown rather than described.
        </p>
      )}

      {/* ★ ONE STEP SURFACE, TWO PLACES IT IS MOUNTED (the stepped review,
          2026-09-16). The dry run and a board's own page walk the SAME `Step`:
          away from a board there is no `evidence` function, so its tiles are
          the options in words and its stage is nothing, which is exactly the
          graceful degradation a fixture board needs. The desk keeps what only
          it can own: the summary, and the message. */}
      {!atEnd && (
        <div className="mt-8">
          <Step
            steps={steps}
            param={param}
            transcribed={transcribed}
            build={build}
            onEnd={() => goTo(steps.length)}
          />
        </div>
      )}

      {atEnd && (
        <section data-dir-enter className="mt-8">
          <h2 className="font-heading text-2xl tracking-tight">{title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {blurb}
          </p>

          {!said ? (
            <p className="mt-6 rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
              Nothing answered yet. Walk back through the steps and pick a word
              on the ones you have a view on; skipping is a fine answer too.
            </p>
          ) : (
            <>
              <div className="mt-6 overflow-hidden rounded-xl border border-border bg-card">
                <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2">
                  <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                    Paste this into chat
                  </p>
                  <CopyButton
                    text={message}
                    label="Copy the message"
                    copied="Copied"
                  />
                </div>
                <p className="px-4 py-3 text-sm leading-relaxed break-words whitespace-pre-wrap">
                  {message}
                </p>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                The Orchestrator runs it through{" "}
                <code className="font-sans">pnpm lab:review</code>, which checks
                every question, option and catalog item against the
                board&rsquo;s own spec and appends to docs/reviews. Nothing in
                this page writes the repo.
              </p>

              <ul className="mt-6 space-y-3">
                {[
                  ...new Set([
                    ...answers.map((a) => a.board),
                    ...items.map((i) => i.board),
                  ]),
                ].map((board) => {
                  const mine = steps.filter((s) => s.board === board);
                  return (
                    <li
                      key={board}
                      className="rounded-xl border border-border bg-card px-4 py-3"
                    >
                      <p className="text-sm font-medium">
                        {mine[0]?.boardTitle ?? board}
                      </p>
                      <ul className="mt-1.5 space-y-1">
                        {mine.map((s) => {
                          const i = steps.indexOf(s);
                          // A catalog is one line here, not twelve: the
                          // summary is a check that nothing was missed, and
                          // twelve rows per board would bury the boards.
                          if (s.kind === "items") {
                            const { held, of } = stepHeld(s, store);
                            return (
                              <li key={stepParam(s)} className="text-xs">
                                <button
                                  type="button"
                                  onClick={() => goTo(i)}
                                  className="text-left hover:underline"
                                >
                                  <span className="text-muted-foreground">
                                    {`The ${of} in ${s.sectionTitle}`}
                                  </span>{" "}
                                  <span
                                    className={cn(
                                      "font-medium",
                                      held < of && "text-muted-foreground/70",
                                    )}
                                  >
                                    {`${held} of ${of} answered`}
                                  </span>
                                </button>
                              </li>
                            );
                          }
                          const held = store.answers[askKey(s)];
                          return (
                            <li key={s.askId} className="text-xs">
                              <button
                                type="button"
                                onClick={() => goTo(i)}
                                className="text-left hover:underline"
                              >
                                <span className="text-muted-foreground">
                                  {s.question}
                                </span>{" "}
                                <span
                                  className={cn(
                                    "font-medium",
                                    !held?.choice && "text-muted-foreground/70",
                                  )}
                                >
                                  {held?.choice === UNCLEAR
                                    ? "not clear to me"
                                    : (s.options.find(
                                        (o) => o.id === held?.choice,
                                      )?.label ??
                                      held?.choice ??
                                      "not answered")}
                                </span>
                              </button>
                              {held?.note && (
                                <span className="text-muted-foreground">
                                  {" "}
                                  &ldquo;{held.note}&rdquo;
                                </span>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                      <label className="mt-2.5 block">
                        <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                          A note on the whole board
                        </span>
                        <textarea
                          rows={2}
                          value={store.notes[board] ?? ""}
                          onChange={(e) =>
                            update({
                              ...store,
                              notes: {
                                ...store.notes,
                                [board]: e.target.value,
                              },
                            })
                          }
                          placeholder="Optional. Anything that is about the board rather than one question."
                          className="mt-1 w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm transition-colors duration-150 outline-none placeholder:text-muted-foreground/70 focus:border-foreground/40"
                        />
                      </label>
                    </li>
                  );
                })}
                {/* The calls answered at the desk's Calls place, read back
                    the way the place says them: a check that the paste holds
                    what he meant, changed where he answered them. */}
                {calls.length > 0 && (
                  <li className="rounded-xl border border-border bg-card px-4 py-3">
                    <p className="flex flex-wrap items-baseline justify-between gap-2 text-sm font-medium">
                      Calls
                      <LabLink
                        href="/design/lab#calls"
                        className="text-[11px] font-normal text-muted-foreground hover:text-foreground"
                      >
                        Change them on the desk
                      </LabLink>
                    </p>
                    <ul className="mt-1.5 space-y-1">
                      {calls.map((c) => {
                        const entry = CALLS.entries.find((e) => e.id === c.id);
                        return (
                          <li key={c.id} className="text-xs">
                            <span className="text-muted-foreground">
                              {c.id} {entry?.title}
                            </span>{" "}
                            <span className="font-medium">
                              {entry ? answerWords(entry, c.answer) : c.answer}
                            </span>
                            {c.note && (
                              <span className="text-muted-foreground">
                                {" "}
                                &ldquo;{c.note}&rdquo;
                              </span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                )}
              </ul>
            </>
          )}

          {/* ★ A NOTE FOR THE WHOLE PROGRAM (lab-sitting, 2026-10-01): what
              he says about no one board had only the chat beside the paste to
              go to. It rides the message as its own bare line, which the
              transcript reads, records nowhere and says where it goes. */}
          <label className="mt-6 block">
            <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
              For the whole program
            </span>
            <textarea
              ref={adoptProgram}
              rows={2}
              value={program}
              onChange={(e) => setProgramNote(e.target.value)}
              placeholder="Optional. Anything about the lab, the rounds or every board, rather than one."
              className="mt-1 w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm transition-colors duration-150 outline-none placeholder:text-muted-foreground/70 focus:border-foreground/40"
            />
            <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
              It rides the message as its own line, recorded on no board: the
              Orchestrator folds it into the doc it refines.
            </span>
          </label>

          <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-border pt-4">
            <button
              type="button"
              data-dir-press
              onClick={() => goTo(steps.length - 1)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-colors duration-150 hover:bg-muted/40"
            >
              <ArrowLeft className="size-3.5" />
              The last step
            </button>
            <LabLink
              href="/design/lab"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-colors duration-150 hover:bg-muted/40"
            >
              Back to the desk
            </LabLink>
            {said && (
              <button
                type="button"
                onClick={() => {
                  update(EMPTY_REVIEW);
                  goTo(0);
                }}
                className="ml-auto text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                Clear this session
              </button>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
