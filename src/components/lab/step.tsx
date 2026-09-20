"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";

import { withDesignKey } from "@/lib/design-gate/links";
import { cn } from "@/lib/utils";

import {
  registerReviewKeys,
  reviewKeysOwned,
} from "@/app/(dev)/design/(shell)/lab/_desk/review-keys";
import { CopySoFar } from "@/app/(dev)/design/(shell)/lab/_desk/copy-so-far";
import type { Transcribed } from "@/app/(dev)/design/(shell)/lab/_desk/review-message";
import {
  setAnswerNote,
  standAnswer,
  toggleAnswer,
  useReviewStore,
} from "@/app/(dev)/design/(shell)/lab/_desk/review-store";
import {
  type AskStep,
  type ItemsStep,
  SESSION_END,
  type SessionOption,
  type OvertakenBadge as OvertakenBadgeData,
  type SessionStep,
  STANDS,
  stepBlocked,
  stepDone,
  stepParam,
  UNCLEAR,
} from "@/app/(dev)/design/(shell)/lab/_desk/session-step";
import { holdId } from "@/app/(dev)/design/(shell)/lab/_desk/step-id";

import type { BoardState, Control } from "./board-spec";
import { ControlKnobs } from "./board-state";
import { CatalogTiles } from "./catalog";
import {
  type LabFit,
  type LabSidebar,
  setLabPref,
  useLabPrefs,
} from "./lab-prefs";
import { useDesignKey } from "./walk";

/**
 * THE STEP (the stepped review, 2026-09-16; the dock, 2026-09-18): one context
 * and its question, the options drawn full size, and the answer in a dock.
 *
 * ★ WILL'S WORDS ARE THE SPEC. "The review process favors you and makes me
 * spend tons of time per track figuring what I'm even being asked"; what he
 * wants instead is "more similar to a multi-step onboarding form where all
 * context is made available for 1+ questions around the same content, then onto
 * the next context". So: one question, its options drawn on the board's own
 * specimen, Back and Next, and nothing else on the page.
 *
 * ★ THE PREVIEW IS THE PAGE AND THE ANSWER IS A DOCK (Will, 2026-09-18). The
 * step before this pinned the evidence above the options in a 40vh window, and
 * he could not see what he was answering: "The top preview UI of our lab is
 * covered by the answer UI, and I cannot scroll it to see the full heights or
 * labels on which height is which. This has been a recurring problem where I
 * have to visit the board to be able to see a full preview, then go back to the
 * question to answer. We should ensure both the question/context/preview UI and
 * response/answer UI work well together." So the page is, top to bottom:
 *  - the HEAD: the question and its context, with "It decides" and "What to
 *    look at" beside them where there is room;
 *  - the STAGE HEAD, sticky: which option is on the stage (its number, its
 *    label, the board's recommendation or your pick, what it means), the knobs,
 *    the scale the stage is drawn at;
 *  - the STAGE: every option mounted ONCE at its true size, never capped and
 *    never pinned, and it takes the pointer, so the wheel scrolls the page;
 *  - the DOCK, sticky at the bottom: the options by number, Pick, the note,
 *    "not clear to me", Back and Next.
 * The answer is always on screen and the preview is never clipped, at every
 * width, which is the one layout the two halves of his note ask for.
 *
 * ★ EVERY OPTION IS MOUNTED ONCE, FLIPPED OR SIDE BY SIDE. Flipped, the options
 * share one place on the stage and one is visible (the rest inert, hidden and
 * paused), so pressing between two is a blink with no reload and no scroll jump:
 * the stage is as tall as its tallest option. Side by side when they all fit at
 * true size (phone-sized previews in a wide column), and `g` swaps the two. A
 * phone always flips.
 *
 * ★ SHOWING IS NOT CHOOSING, AND THAT IS THE WHOLE MECHANISM. A press on an
 * option SHOWS it; a press on the one being shown, or Pick, RECORDS it; a
 * second Pick clears it. Nothing is recorded by looking, which is what makes
 * looking free. The step LANDS showing the answer held, else the board's
 * recommendation, so a reviewer who agrees presses once.
 *
 * ★ A STEP IS STAGED UNTIL ITS QUESTION EXISTS, AND DRAWN IN THE WORLD IT WAITS
 * ON. An ask that declares `after` is skipped by Back, Next and Start the review
 * until its prerequisite is decided (`stepBlocked`, shared with the desk), and
 * every step is drawn wearing the board's decided answers (`wearing`): this
 * sitting's store over the ledger's, so the gap is judged at the pace he picked.
 *
 * ★ AND THE EVIDENCE IS THE BOARD'S OWN. This renders no pictures: the stage
 * calls the board's `evidence(section, state)` in each option's own state. Off
 * a board page (the desk's dry run) there is no evidence function, and the
 * options degrade to what the spec declares in words.
 *
 * ★ AND A QUESTION AN EARLIER RULING REACHED IS BADGED IN PLACE, NEVER REMOVED
 * (Will, 2026-09-19: "In place in the board's walk, badged"). The badge says
 * which ruling reached it, when, in plain words, and carries the lane's one
 * line about whether these options may still beat it. The dock then offers a
 * third dashed answer beside "Not clear to me": "The ruling stands", which is
 * the trash he asked for, drawn as the answer it is. Answering the question as
 * drawn is an OVERRIDE and records the new ruling; nothing is ever recorded by
 * precedent, and nothing is redrawn.
 *
 * Keys: 1..9 shows an option and a second press picks it; x blinks back to the
 * one shown before (A and B); g flips or lays side by side; n goes to the note;
 * ? marks the question unclear; s says the earlier ruling stands; Enter and the
 * arrows step, Enter from the note too; Escape lets the note go. Enter on a
 * focused control belongs to that control: an Enter that pressed a button AND
 * advanced the review answered a question the reader never looked at.
 */

/** The board's own surface, when the step is mounted on one. */
export type StepBoard = {
  /** The board's declared controls, for an ask's config strip. */
  controls?: readonly Control[];
  /**
   * THE BOARD'S OWN DOCK CLUSTER, REACHABLE FROM A STEP (lab-tides,
   * 2026-09-19). A step's dock is the ANSWER's: the options, Pick, the note,
   * Back and Next, and nothing a board could add. That left a board's own
   * tools (a Reload frames, a Replay, an Apply) reachable only by leaving the
   * question and opening the whole board, which is the trip the stepped review
   * exists to end. They ride the stage head instead, beside the scale, where
   * they stay on screen while a tall stage scrolls.
   */
  tools?: React.ReactNode;
  /** The live board state (`useBoardState`), which the stage reads. */
  state: BoardState;
  setState: (patch: Record<string, string>) => void;
  /** One section's evidence, in whatever state it is handed. */
  evidence: (sectionId: string, state: BoardState) => React.ReactNode;
};

/** How the options share the stage. */
type Arrange = "flip" | "side";

/** A phone-sized preview's width, and the gap between two laid side by side. */
const PHONE_W = 375;
const SIDE_GAP = 16;

export function Step({
  boardId,
  steps,
  param,
  board,
  transcribed,
  build,
  onEnd,
  className,
}: {
  /** The board this is mounted on; a step for any other board renders nothing.
   *  Left out on the desk, where every step is walked in place. */
  boardId?: string;
  /** The WHOLE open queue, so "step N of M" counts the review and Next can cross. */
  steps: readonly SessionStep[];
  /** The `session` value the server read, so the first paint is the right step. */
  param: string | null;
  board?: StepBoard;
  /** What the ledger already holds, so "Copy so far" omits it. */
  transcribed?: Transcribed;
  /** The commit this page was built from; rides the paste as a `#` line. */
  build?: string | null;
  /** The desk's summary; without it the last Next links there. */
  onEnd?: () => void;
  className?: string;
}) {
  const store = useReviewStore();
  const router = useRouter();
  const key = useDesignKey();
  // Null until the reader moves: the opening step is the one the URL names, so
  // the first paint is right and no effect has to correct it.
  const [chosen, setChosen] = useState<number | null>(null);
  /** The option on the stage, recorded or not. */
  const [shown, setShown] = useState<string | null>(null);
  /** The option shown before it, which `x` blinks back to. */
  const [previous, setPrevious] = useState<string | null>(null);
  const noteRef = useRef<HTMLInputElement | null>(null);
  /** The stage's flip-or-side switch, which `g` presses. */
  const arrangeRef = useRef<(() => void) | null>(null);
  const landed = useRef<string | null>(null);

  const from = steps.findIndex((s) => stepParam(s) === param);
  const at = chosen ?? from;
  const step = at >= 0 ? steps[at] : undefined;
  // Crossing a board is a navigation, so `chosen` can never leave this board;
  // a step for another board means the URL named one, and that board's own
  // mount renders it.
  const mine = !boardId || step?.board === boardId;

  const held =
    step?.kind === "ask"
      ? store.answers[holdId(step.board, step.round, step.askId)]
      : undefined;
  // ★ AND WHETHER IT HAS ALREADY BEEN PASTED (lab-tides, 2026-09-19). A pasted
  // answer stays held in the browser until the ledger catches up, which on a
  // stale alias is the next day. Saying so where the answer is means he never
  // has to wonder whether an answer he can still see has reached anybody.
  const sent =
    step?.kind === "ask"
      ? store.sent?.[holdId(step.board, step.round, step.askId)]
      : undefined;
  const choice = held?.choice ?? "";
  const unclear = step?.kind === "ask" && choice === UNCLEAR;
  const stood = step?.kind === "ask" && choice === STANDS;
  // ★ "?" IS AN ANSWER, AND IT OWES ITS REASON. The ledger grammar is
  // `<ask>=? "why"`, and `pnpm lab:review` refuses the line without the note:
  // an unclear question that never says what was unclear cannot be rewritten.
  const needsWhy = unclear && !(held?.note ?? "").trim();

  /* ── what Next and Back reach, skipping what is staged ────────────────── */

  const seek = (from: number, dir: 1 | -1): number => {
    let i = from;
    while (i >= 0 && i < steps.length && stepBlocked(steps[i], store) !== null)
      i += dir;
    return i;
  };

  const hop = (i: number): { to: number } | { href: string } | null => {
    if (i < 0) return null;
    if (i >= steps.length)
      return {
        href: withDesignKey(`/design/lab?session=${SESSION_END}`, key ?? null),
      };
    const next = steps[i];
    if (!boardId || next.board === boardId) return { to: i };
    return {
      href: withDesignKey(
        `/design/lab/${next.board}?session=${stepParam(next)}`,
        key ?? null,
      ),
    };
  };

  const goTo = (raw: number) => {
    const i = seek(raw, raw < at ? -1 : 1);
    if (i >= steps.length && onEnd) {
      onEnd();
      return;
    }
    const target = hop(i);
    if (!target) return;
    if ("href" in target) {
      router.push(target.href);
      return;
    }
    setChosen(target.to);
    const url = new URL(window.location.href);
    url.searchParams.set("session", stepParam(steps[target.to]));
    window.history.replaceState(window.history.state, "", url.toString());
  };

  /* ── the world a step is drawn in ─────────────────────────────────────── */

  /**
   * THE BOARD'S DECIDED ANSWERS, AS THE CONTROLS THAT DRAW THEM: the ledger's
   * from an earlier sitting (`ruled`, resolved on the server), then this
   * sitting's from the store, which are newer and win. An exploration's control
   * IS its ask (`defineExploration`), so a ruled answer lands on the control of
   * the same id; an ask in this walk also lends its option's own patch.
   */
  const wearing = (s: AskStep): Record<string, string> => {
    const out: Record<string, string> = { ...s.ruled };
    for (const t of steps) {
      if (t.kind !== "ask" || t.board !== s.board || t.round !== s.round)
        continue;
      if (t.askId === s.askId) continue;
      const value = store.answers[holdId(t.board, t.round, t.askId)]?.choice;
      if (!value || value === UNCLEAR) continue;
      const option = t.options.find((o) => o.id === value);
      Object.assign(out, option?.state, { [t.control ?? t.askId]: value });
    }
    return out;
  };

  /**
   * THE CONTROLS THAT DRAW AN OPTION: the board's decided answers, the ask's
   * own state, then the option's, then the control mirror. With no option it is
   * the state the question is asked in, and the mirrored control goes back to
   * its DECLARED DEFAULT: a cleared answer that left the board wearing the
   * cleared choice would be the un-unpickable pick all over again (Will,
   * 2026-09-16).
   */
  const stateFor = (s: AskStep, option?: SessionOption) => {
    const cleared =
      s.control && !option
        ? board?.controls?.find((c) => c.id === s.control)?.default
        : undefined;
    return {
      ...wearing(s),
      ...s.state,
      ...option?.state,
      ...(s.control && option && option.id !== UNCLEAR
        ? { [s.control]: option.id }
        : {}),
      ...(s.control && cleared ? { [s.control]: cleared } : {}),
    };
  };

  /* ── showing, and choosing ────────────────────────────────────────────── */

  const show = (option: SessionOption) => {
    if (step?.kind !== "ask") return;
    if (shown && shown !== option.id) setPrevious(shown);
    setShown(option.id);
    board?.setState(stateFor(step, option));
  };

  const choose = (id: string) => {
    if (step?.kind !== "ask") return;
    const option = step.options.find((o) => o.id === id);
    const set = toggleAnswer(step.board, step.round, step.askId, id);
    if (set) {
      if (option && drawable(step, option, board) && shown !== id) {
        if (shown) setPrevious(shown);
        setShown(id);
      }
      if (option) board?.setState(stateFor(step, option));
      return;
    }
    // Cleared: the board's control goes back to the state the question was
    // asked in, or the board would keep arguing for an answer nobody holds.
    // The stage keeps showing the option: it is shown now, no longer picked.
    board?.setState(stateFor(step));
  };

  /**
   * A press on an option: show it, or record the one already shown.
   *
   * ★ AN OPTION IN WORDS CHOOSES ON THE FIRST PRESS. Show-then-choose buys a
   * free look at a preview; an option that declares no way to be drawn (a rule,
   * not a look) has nothing to look at, so a first press that did nothing
   * visible would read as a dead button. Off a board page every option is in
   * words, which is what keeps the desk's dry run answerable in one press.
   */
  const press = (option: SessionOption) => {
    if (step?.kind !== "ask") return;
    if (!drawable(step, option, board)) choose(option.id);
    else if (shown === option.id) choose(option.id);
    else show(option);
  };

  const markUnclear = () => {
    choose(UNCLEAR);
    noteRef.current?.focus();
  };

  /**
   * ★ THE RULING STANDS, and that is an ANSWER, not a skip. It goes through the
   * store's own writer so the default note rides with it (the grammar refuses a
   * bare reserved word), and the board is put back into the state the question
   * was asked in, exactly as clearing a pick does: standing by an earlier ruling
   * is not an argument for any option on this stage.
   */
  const markStands = () => {
    if (step?.kind !== "ask") return;
    standAnswer(step.board, step.round, step.askId);
    board?.setState(stateFor(step));
  };

  const writeNote = (note: string) => {
    if (step?.kind !== "ask") return;
    setAnswerNote(step.board, step.round, step.askId, note);
  };

  /* ── landing: the answer held, else the board's recommendation ────────── */

  // Landing happens once per step and reads the render it lands in (the held
  // choice, the board, the decided answers) through a ref: a pick made on this
  // step must not re-land it, and a board handed in anew each render must not
  // either.
  const land = useRef<(s: SessionStep) => void>(() => {});
  useEffect(() => {
    land.current = (s) => {
      setPrevious(null);
      if (s.kind === "ask") {
        const opening = openingFor(s, choice, board);
        setShown(opening?.id ?? null);
        board?.setState(stateFor(s, opening));
      } else {
        setShown(null);
        if (s.state) board?.setState(s.state);
      }
    };
  });

  useEffect(() => {
    if (!step || !mine) return;
    const id = stepParam(step);
    if (landed.current === id) return;
    landed.current = id;
    land.current(step);
    window.scrollTo({ top: 0 });
  }, [step, mine]);

  /* ── the keys ─────────────────────────────────────────────────────────── */

  const onKey = (pressed: string): boolean => {
    if (!step || !mine) return false;
    const n = Number(pressed);
    // A digit on a catalog step does nothing: the verdicts are on the cards,
    // and nine of twelve would be an arbitrary half of a catalog.
    if (step.kind === "ask") {
      if (Number.isInteger(n) && n >= 1 && n <= step.options.length) {
        press(step.options[n - 1]);
        return true;
      }
      const key = pressed.toLowerCase();
      if (key === "x") {
        const back = step.options.find((o) => o.id === previous);
        if (back) show(back);
        return true;
      }
      if (key === "g") {
        arrangeRef.current?.();
        return true;
      }
      if (key === "n") {
        noteRef.current?.focus();
        return true;
      }
      if (pressed === "?") {
        markUnclear();
        return true;
      }
      // Only where there is a ruling to stand by: `s` on an ordinary question
      // would record an answer to something nothing overtook.
      if (key === "s" && step.overtaken) {
        markStands();
        return true;
      }
    }
    if (pressed === "Enter" || pressed === "ArrowRight") {
      if (!needsWhy) goTo(at + 1);
      return true;
    }
    if (pressed === "ArrowLeft") {
      goTo(at - 1);
      return true;
    }
    return false;
  };

  // The handler closes over the step and the store, so a ref carries the
  // current one and both registrations happen exactly once.
  const latest = useRef(onKey);
  useEffect(() => {
    latest.current = onKey;
  });

  useEffect(() => registerReviewKeys((k) => latest.current(k)), []);

  useEffect(() => {
    if (reviewKeysOwned()) return;
    const handler = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const el = event.target as HTMLElement | null;
      const typing =
        el?.tagName === "INPUT" ||
        el?.tagName === "TEXTAREA" ||
        el?.isContentEditable === true;
      if (typing) {
        if (event.key === "Escape") el?.blur();
        // ★ ENTER FROM THE NOTE GOES ON: the note is the last thing a step
        // asks for, and reaching for Next after typing it was a second trip.
        if (event.key === "Enter" && el?.hasAttribute("data-lab-note")) {
          if (latest.current("Enter")) event.preventDefault();
        }
        return;
      }
      if (
        event.key === "Enter" &&
        el?.closest("a,button,summary,[role='button'],[tabindex]")
      )
        return;
      if (latest.current(event.key)) event.preventDefault();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  if (!step || !mine) return null;

  const filled = stepDone(step, store) && !needsWhy;
  // The walk's own numbering: a staged step is not a step the reviewer has.
  const walk = steps.filter((s) => stepBlocked(s, store) === null);
  const n = walk.indexOf(step) + 1;
  // ★ A STEP REACHED BY URL MAY NOT BE IN THE WALK AT ALL (lab-tides,
  // 2026-09-19). Back and Next skip a staged step, but a pasted link, a
  // reload after answering its prerequisite the other way, or the desk's own
  // deep link can land on one. It used to draw itself as "step 8 of 7": a
  // number that is not a position, on a page that is not in the walk. The
  // spine says what it is instead, and the step stays readable, because a
  // reader who followed a link to a question is owed the question.
  const blocked = stepBlocked(step, store);
  // The options the dock carries: the ones drawn on the stage. A catalog's
  // winner is pressed on its cards, and an option in words on its own card.
  const pictured =
    step.kind === "ask" && !step.winner
      ? step.options.filter((o) => drawable(step, o, board))
      : [];

  return (
    <div
      data-review-step
      role="region"
      aria-label={`${step.boardTitle}: the step being reviewed`}
      className={cn("flex min-w-0 flex-col gap-5", className)}
    >
      <Spine
        step={step}
        n={n > 0 ? n : walk.length + 1}
        of={Math.max(walk.length, 1)}
        blocked={blocked}
        transcribed={transcribed}
        build={build}
      />

      <Head step={step} />

      {step.kind === "ask" ? (
        <AskBody
          step={step}
          board={board}
          pictured={pictured}
          choice={choice}
          shown={shown}
          arrangeRef={arrangeRef}
          onPress={press}
          onChoose={choose}
          stateFor={stateFor}
        />
      ) : (
        <ItemsBody step={step} board={board} />
      )}

      <Dock
        step={step}
        pictured={pictured}
        choice={choice}
        shown={shown}
        sent={sent}
        note={held?.note ?? ""}
        unclear={unclear}
        stood={stood}
        needsWhy={needsWhy}
        noteRef={noteRef}
        onPress={press}
        onChoose={choose}
        onNote={writeNote}
        onUnclear={markUnclear}
        onStands={markStands}
        back={seek(at - 1, -1) >= 0 ? () => goTo(at - 1) : undefined}
        next={needsWhy ? undefined : () => goTo(at + 1)}
        filled={filled}
      />
    </div>
  );
}

/** Whether this option can be DRAWN: a state of its own, or the control mirror. */
const drawable = (
  step: AskStep,
  option: SessionOption,
  board?: StepBoard,
): boolean => Boolean(board && step.section && (option.state || step.control));

/**
 * THE OPTION A STEP OPENS ON: the answer held, else the board's recommendation,
 * else the first that can be drawn. "Not clear to me" is not an option to show,
 * and an option in words has nothing to show, so a step of words opens on none.
 */
function openingFor(
  step: AskStep,
  held: string,
  board?: StepBoard,
): SessionOption | undefined {
  const can = (id: string) =>
    step.options.find((o) => o.id === id && drawable(step, o, board));
  return (
    (held && held !== UNCLEAR ? can(held) : undefined) ??
    can(step.recommended) ??
    step.options.find((o) => drawable(step, o, board))
  );
}

const headingFor = (step: ItemsStep) =>
  step.walk === "one-at-a-time"
    ? `The ${step.items.length} in ${step.sectionTitle}, one at a time`
    : `Rule on the ${step.items.length} in ${step.sectionTitle}`;

/* ── the spine ────────────────────────────────────────────────────────────── */

/**
 * WHERE YOU ARE AND THE WAY OUT, in one line: the board, the count, the
 * progress as a hairline, the batch so far, and the whole board one link away.
 * "Open the whole board" drops `?session=`, which is what turns the step back
 * into the board it came from: the argument, the other sections and the meta
 * are all still there for the reviewer who wants them, they are simply not in
 * the way of the question.
 */
function Spine({
  step,
  n,
  of,
  blocked,
  transcribed,
  build,
}: {
  step: SessionStep;
  n: number;
  of: number;
  /** Null when the step is in the walk; otherwise why it is not. */
  blocked?: "staged" | "moot" | null;
  transcribed?: Transcribed;
  build?: string | null;
}) {
  const key = useDesignKey();
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <span className="text-[11px] font-medium">{step.boardTitle}</span>
        {blocked ? (
          <span
            className="text-[11px] text-muted-foreground"
            title={
              blocked === "staged"
                ? "Answer the question it waits on and it joins the walk."
                : "The question it waited on went the other way."
            }
          >
            {blocked === "staged"
              ? "not in the walk yet: it waits on an earlier answer"
              : "not in the walk: moot this round"}
          </span>
        ) : (
          <span className="text-[11px] text-muted-foreground tabular-nums">
            step {n} of {of}
          </span>
        )}
        {/* The build being served, beside the round it is serving. A page
            cannot know a newer build exists, but the reviewer and the
            Orchestrator can compare this one line (Will, 2026-09-17: a batch
            arrived a round behind because nothing on the page said so). */}
        {build && (
          <span
            className="text-[11px] text-faint tabular-nums"
            title="The commit this page was built from. It rides the paste."
          >
            build {build}
          </span>
        )}
        <span className="ml-auto flex flex-wrap items-center gap-2">
          <CopySoFar transcribed={transcribed} build={build} />
          <Link
            href={withDesignKey(step.boardHref, key ?? null)}
            className="text-[11px] text-muted-foreground underline underline-offset-2 transition-colors duration-150 hover:text-foreground motion-reduce:transition-none"
          >
            Open the whole board
          </Link>
        </span>
      </div>
      <span
        aria-hidden
        className="block h-px w-full bg-border"
        role="presentation"
      >
        {/* A step outside the walk has no position in it, so it draws no
            progress rather than a length it did not reach. */}
        <span
          className="block h-px bg-foreground transition-[width] duration-200 ease-out motion-reduce:transition-none"
          style={{
            width: blocked ? 0 : `${Math.round((n / Math.max(of, 1)) * 100)}%`,
          }}
        />
      </span>
    </div>
  );
}

/* ── the head ─────────────────────────────────────────────────────────────── */

/**
 * THE QUESTION AND ITS CONTEXT, with what it decides and where to look beside
 * them where there is room (design.css, `.lab-step-head`), under them where
 * there is not. `look` is the author's own sentence naming what separates the
 * options; it was carried on the step type and once never rendered at all.
 */
function Head({ step }: { step: SessionStep }) {
  const aside = step.kind === "ask" && Boolean(step.lands || step.look);
  return (
    <header className="lab-step-head" data-aside={aside ? "" : undefined}>
      <div className="max-w-3xl min-w-0">
        <h1 className="font-heading text-2xl leading-tight tracking-tight text-balance sm:text-3xl">
          {step.kind === "items" ? headingFor(step) : step.question}
        </h1>
        {step.kind === "ask" && step.overtaken && (
          <OvertakenBadge note={step.overtaken} />
        )}
        {step.kind === "ask" ? (
          step.context && (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {step.context}
            </p>
          )
        ) : (
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {step.walk === "one-at-a-time"
              ? "One card at a time, as it would land. Keep it, refine it, or kill it, with a note where the word is not enough."
              : "Keep, refine or kill each card. A second press on the same word clears it; the note stays."}
          </p>
        )}
      </div>
      {aside && step.kind === "ask" && (
        <div className="flex min-w-0 flex-col gap-2 text-xs leading-relaxed text-muted-foreground">
          {step.lands && (
            <p>
              <span className="text-foreground">It decides: </span>
              {step.lands}
            </p>
          )}
          {step.look && (
            <p>
              <span className="text-foreground">What to look at: </span>
              {step.look}
            </p>
          )}
        </div>
      )}
    </header>
  );
}

/**
 * AN EARLIER RULING REACHED THIS QUESTION (Will, 2026-09-19).
 *
 * ★ PLAIN WORDS WITH THE DATE, NEVER THE CLAUSE. "Ruled since app-shape r1, 19
 * Sep: sharing is a sheet" is readable by someone who has never seen the ledger
 * grammar; `share=room` is not, and the reviewer this is for is the one person
 * who never reads the grammar. Under it, the lane's one line: whether these
 * options may still beat the ruling, or what the ruling already covers.
 *
 * ★ AND THE "AS TODAY" GLOSS, because the words are not ours to fix. An option
 * labelled "the share dialog at 375, as today" was drawn before sharing became
 * a sheet, and a board's spec is never edited by another lane: the badge says
 * so once, where the options are about to be read.
 *
 * A row, not a card: this is context for a question, not a second question. No
 * motion, nothing to press, so reduced motion is honoured by having nothing to
 * honour.
 */
function OvertakenBadge({ note }: { note: OvertakenBadgeData }) {
  return (
    <div
      data-lab-overtaken={note.by}
      data-lab-overtaken-line={note.conceded ? "concedes" : "stands"}
      className="mt-3 border-l-2 border-border pl-3"
    >
      <p className="text-[12px] leading-snug font-medium">{note.badge}</p>
      <p className="mt-0.5 text-[12px] leading-relaxed text-muted-foreground">
        {note.line}
      </p>
      {note.gloss && (
        <p className="mt-0.5 text-[11px] leading-relaxed text-faint">
          {note.gloss}
        </p>
      )}
      <p className="mt-1 text-[11px] leading-relaxed text-faint">
        It is still yours to answer. Answering it records the new ruling; the
        dock&rsquo;s third button says the earlier one stands.
      </p>
    </div>
  );
}

/* ── an ask ───────────────────────────────────────────────────────────────── */

function AskBody({
  step,
  board,
  pictured,
  choice,
  shown,
  arrangeRef,
  onPress,
  onChoose,
  stateFor,
}: {
  step: AskStep;
  board?: StepBoard;
  pictured: readonly SessionOption[];
  choice: string;
  shown: string | null;
  arrangeRef: React.RefObject<(() => void) | null>;
  onPress: (o: SessionOption) => void;
  onChoose: (id: string) => void;
  stateFor: (s: AskStep, o?: SessionOption) => Record<string, string>;
}) {
  if (step.winner && step.catalogSection && board) {
    return (
      <GalleryStep
        step={step}
        board={board}
        choice={choice}
        shown={shown}
        onPress={onPress}
        onChoose={onChoose}
      />
    );
  }

  const section = step.stageSection ?? step.section;
  if (board && section && pictured.length > 0) {
    return (
      <StageViews
        step={step}
        board={board}
        section={section}
        options={pictured}
        choice={choice}
        shown={shown}
        arrangeRef={arrangeRef}
        onPress={onPress}
        stateFor={stateFor}
      />
    );
  }

  // A question whose options cannot be drawn: the evidence as the question is
  // asked, then the options in words, each its own card.
  const strip = board && step.strip && step.strip.length > 0;
  const tools = board?.tools;
  return (
    <>
      {board && section && (
        <div data-lab-specimen="" className="min-w-0">
          {board.evidence(section, { ...board.state, ...stateFor(step) })}
        </div>
      )}
      {(strip || tools) && (
        // No stage head on a words step, so the strip and the board's own
        // tools share a row of their own rather than being unreachable.
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          {strip && <ConfigStrip step={step} board={board} />}
          {tools && (
            <span
              data-lab-board-tools=""
              className="flex flex-wrap items-center gap-1.5"
            >
              {tools}
            </span>
          )}
        </div>
      )}
      <ul className="lab-word-options">
        {step.options.map((option, i) => (
          <li key={option.id} className="min-w-0 list-none">
            <OptionCard
              n={i + 1}
              label={option.label}
              means={option.means}
              recommended={option.id === step.recommended}
              chosen={choice === option.id}
              onPress={() => onPress(option)}
            />
          </li>
        ))}
      </ul>
    </>
  );
}

/**
 * THE STAGE: every drawn option mounted once, flipped or side by side.
 *
 * ★ IT TAKES THE POINTER. The stage it replaces refused it, because a wheel
 * over a pinned iframe scrolled the frame and not the page; nothing is pinned
 * now, so the wheel goes where the reader expects and a preview can be hovered.
 * A link inside a preview does not navigate (a press on the picture of a page
 * is looking, not leaving), and a form inside one does not submit.
 */
function StageViews({
  step,
  board,
  section,
  options,
  choice,
  shown,
  arrangeRef,
  onPress,
  stateFor,
}: {
  step: AskStep;
  board: StepBoard;
  section: string;
  options: readonly SessionOption[];
  choice: string;
  shown: string | null;
  arrangeRef: React.RefObject<(() => void) | null>;
  onPress: (o: SessionOption) => void;
  stateFor: (s: AskStep, o?: SessionOption) => Record<string, string>;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const { fit, sidebar } = useLabPrefs();
  const [room, setRoom] = useState<{ width: number; phone: boolean } | null>(
    null,
  );
  const [arrange, setArrange] = useState<Arrange | null>(null);
  const [scale, setScale] = useState<Scale>({ zoom: 1, wide: false });

  // The column's width, read before paint so the arrangement never flashes.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const sync = () =>
      setRoom({
        width: el.getBoundingClientRect().width,
        phone: window.innerWidth < 640,
      });
    sync();
    window.addEventListener("resize", sync);
    const ro =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(sync);
    ro?.observe(el);
    return () => {
      window.removeEventListener("resize", sync);
      ro?.disconnect();
    };
  }, []);

  // Side by side only when every option fits at its TRUE size: a phone-sized
  // preview (`tile: "phone"`) in a column wide enough for all of them.
  const fits =
    step.tile === "phone" &&
    room !== null &&
    !room.phone &&
    room.width >= options.length * PHONE_W + (options.length - 1) * SIDE_GAP;
  const mode: Arrange = room?.phone
    ? "flip"
    : (arrange ?? (fits ? "side" : "flip"));
  // `g` swaps at any width but a phone's; the button is offered only where
  // side by side draws every option at its true size, or to leave it.
  const canSide = !room?.phone;
  const offerSide = canSide && (fits || mode === "side");

  useEffect(() => {
    arrangeRef.current = canSide
      ? () => setArrange(mode === "side" ? "flip" : "side")
      : null;
    return () => {
      arrangeRef.current = null;
    };
  });

  const live =
    options.find((o) => o.id === shown) ??
    options.find((o) => o.id === choice) ??
    options.find((o) => o.id === step.recommended) ??
    options[0];

  // THE SCALE, READ OFF WHAT IS SHOWN: a zoom-fitted `Stage` reports its zoom,
  // and anything wider than the column is scrolled sideways, which is the
  // other way a preview can stop being 1:1.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const view =
      el.querySelector<HTMLElement>("[data-lab-view][data-shown]") ??
      el.querySelector<HTMLElement>("[data-lab-view]");
    if (!view) return;
    const read = () => {
      let zoom = 1;
      for (const box of view.querySelectorAll<HTMLElement>(
        '[data-stage-fit="zoom"]',
      )) {
        const canvas = box.firstElementChild as HTMLElement | null;
        const z = canvas ? parseFloat(getComputedStyle(canvas).zoom) : NaN;
        if (z > 0 && z < zoom) zoom = z;
      }
      let wide = view.scrollWidth > view.clientWidth + 1;
      for (const box of view.querySelectorAll<HTMLElement>(
        '[data-stage-fit="true"]',
      ))
        if (box.scrollWidth > box.clientWidth + 1) wide = true;
      setScale((s) =>
        s.zoom === zoom && s.wide === wide ? s : { zoom, wide },
      );
    };
    read();
    const ro =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(read);
    ro?.observe(view);
    return () => ro?.disconnect();
  }, [live.id, mode, fit]);

  return (
    <>
      <StageHead
        step={step}
        board={board}
        live={live}
        n={step.options.indexOf(live) + 1}
        picked={choice === live.id}
        mode={mode}
        canSide={offerSide}
        onArrange={() => setArrange(mode === "side" ? "flip" : "side")}
        scale={scale}
        fit={fit}
        sidebar={sidebar}
      />
      <div
        ref={ref}
        data-lab-stage=""
        data-arrange={mode}
        // The stage takes the page's gutter back at 1:1 on a wide page, and a
        // Stage inside it keeps its own box (a bleed inside a bleed).
        data-lab-bleed=""
        className="lab-stage"
        onClickCapture={(event) => {
          if ((event.target as Element).closest?.("a[href]"))
            event.preventDefault();
        }}
        onSubmitCapture={(event) => event.preventDefault()}
      >
        {options.map((option) => {
          const on = option.id === live.id;
          const visible = mode === "side" || on;
          const i = step.options.indexOf(option);
          return (
            <div
              key={option.id}
              data-lab-view=""
              data-option={option.id}
              data-shown={on ? "" : undefined}
              data-paused={visible ? undefined : "true"}
              inert={!visible}
              aria-hidden={visible ? undefined : true}
              className="min-w-0"
            >
              {mode === "side" && (
                <button
                  type="button"
                  data-dir-press
                  data-lab-view-head=""
                  aria-pressed={choice === option.id}
                  onClick={() => onPress(option)}
                  className={cn(
                    "mb-2 flex w-full min-w-0 items-baseline gap-2 rounded-lg border px-2.5 py-1.5 text-left text-[12px] transition-colors duration-150 motion-reduce:transition-none",
                    on
                      ? "border-foreground/40 bg-card"
                      : "border-border hover:bg-muted/40",
                  )}
                >
                  <span className="text-muted-foreground tabular-nums">
                    {choice === option.id ? (
                      <Check className="inline size-3" aria-hidden />
                    ) : (
                      i + 1
                    )}
                  </span>
                  <span className="min-w-0 truncate font-medium">
                    {option.label}
                  </span>
                  {option.id === step.recommended && (
                    <span className="shrink-0 text-[10px] text-muted-foreground">
                      the board says
                    </span>
                  )}
                </button>
              )}
              <div data-lab-specimen="" className="min-w-0">
                {board.evidence(section, {
                  ...board.state,
                  ...stateFor(step, option),
                })}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

/** How the shown option is drawn: its zoom, and whether it runs off the column. */
type Scale = { zoom: number; wide: boolean };

/**
 * THE STAGE HEAD, sticky under the top bar: WHICH option the stage is showing,
 * whether it is the board's recommendation or the reader's pick, what it means,
 * the knobs that drive the stage, and the scale it is drawn at. Before this a
 * stage said nothing about itself and the reader had to remember which tile
 * they had pressed.
 */
function StageHead({
  step,
  board,
  live,
  n,
  picked,
  mode,
  canSide,
  onArrange,
  scale,
  fit,
  sidebar,
}: {
  step: AskStep;
  board: StepBoard;
  live: SessionOption;
  n: number;
  picked: boolean;
  mode: Arrange;
  canSide: boolean;
  onArrange: () => void;
  scale: Scale;
  fit: LabFit;
  sidebar: LabSidebar;
}) {
  const strip = step.strip && step.strip.length > 0;
  const zoomed = scale.zoom < 0.995;
  const small = zoomed || scale.wide;
  return (
    <div data-lab-stage-head="" className="lab-stage-head">
      <div className="min-w-0 flex-1">
        <p className="flex min-w-0 items-baseline gap-2 text-[13px] leading-snug font-medium">
          <span className="text-muted-foreground tabular-nums">{n}</span>
          <span data-lab-stage-label="" className="min-w-0 truncate">
            {live.label}
          </span>
          {live.id === step.recommended && (
            <span className="shrink-0 text-[11px] font-normal text-muted-foreground">
              the board says
            </span>
          )}
          {picked && (
            <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-normal text-foreground">
              <Check className="size-3" aria-hidden />
              your pick
            </span>
          )}
        </p>
        {live.means && (
          <p className="truncate text-[11px] leading-snug text-muted-foreground">
            {live.means}
          </p>
        )}
      </div>
      {strip && <ConfigStrip step={step} board={board} />}
      <span className="flex shrink-0 flex-wrap items-center gap-1.5">
        {/* The board's own cluster, on the one bar that stays on screen while
            the stage scrolls. A board that declares none adds nothing. */}
        {board.tools && (
          <span
            data-lab-board-tools=""
            className="flex flex-wrap items-center gap-1.5"
          >
            {board.tools}
          </span>
        )}
        {canSide && step.options.length > 1 && (
          <button
            type="button"
            data-dir-press
            onClick={onArrange}
            title="Press g to swap"
            className="rounded-md border border-border px-2 py-1 text-[11px] text-muted-foreground transition-colors duration-150 hover:text-foreground motion-reduce:transition-none"
          >
            {mode === "side" ? "One at a time" : "Side by side"}
          </button>
        )}
        <button
          type="button"
          data-dir-press
          data-lab-scale=""
          onClick={() => setLabPref("fit", fit === "true" ? "zoom" : "true")}
          title="The lab draws previews 1:1, or fitted to the column. Press to switch."
          className="rounded-md border border-border px-2 py-1 text-[11px] text-muted-foreground tabular-nums transition-colors duration-150 hover:text-foreground motion-reduce:transition-none"
        >
          {zoomed ? `Fit ${Math.round(scale.zoom * 100)}%` : "1:1"}
          {scale.wide && " · scroll sideways"}
        </button>
        {/* The one thing standing between this preview and 1:1 is sometimes
            the lab's own sidebar: say so, and take it away in one press. */}
        {small && sidebar === "open" && (
          <button
            type="button"
            data-dir-press
            onClick={() => setLabPref("sidebar", "collapsed")}
            className="rounded-md border border-dashed border-border px-2 py-1 text-[11px] text-muted-foreground transition-colors duration-150 hover:text-foreground motion-reduce:transition-none"
          >
            Hide the sidebar for 1:1
          </button>
        )}
      </span>
    </div>
  );
}

/**
 * AN OPTION IN WORDS: the name, the one line, and the ring when it is the
 * answer. The number is the key that picks it. Also the "None of these" exit
 * under a catalog, drawn dashed as the one card that is not a specimen.
 */
function OptionCard({
  n,
  label,
  means,
  recommended,
  chosen,
  onPress,
  dashed,
}: {
  n?: number;
  label: string;
  means?: string;
  recommended?: boolean;
  chosen: boolean;
  onPress: () => void;
  dashed?: boolean;
}) {
  return (
    <button
      type="button"
      data-dir-press
      aria-pressed={chosen}
      onClick={onPress}
      className={cn(
        "flex h-full w-full min-w-0 items-start gap-2 rounded-xl border p-2.5 text-left transition-colors duration-150 outline-none focus-visible:border-foreground/40 motion-reduce:transition-none",
        dashed && "border-dashed",
        chosen
          ? "border-foreground/40 bg-muted/40 ring-1 ring-foreground/40"
          : "border-border hover:bg-muted/40",
      )}
    >
      {n !== undefined && (
        <span
          aria-hidden
          className={cn(
            "mt-px inline-flex size-4.5 shrink-0 items-center justify-center rounded-md border text-[10px] tabular-nums transition-colors duration-150",
            chosen
              ? "border-transparent bg-foreground text-background"
              : "border-border text-muted-foreground",
          )}
        >
          {chosen ? <Check className="size-2.5" /> : n}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block text-[12px] leading-snug font-medium break-words">
          {label}
          {recommended && (
            <span className="ml-1.5 text-[10px] font-normal text-muted-foreground">
              the board says
            </span>
          )}
        </span>
        {means && (
          <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">
            {means}
          </span>
        )}
      </span>
    </button>
  );
}

/**
 * A PICK-ONE CATALOG'S WINNER, asked on the cards themselves.
 *
 * ★ THE CARDS ARE THE OPTIONS, so the step renders the board's own catalog
 * section rather than a second rendering of the same twelve ideas as pills.
 * That is `CatalogTiles`: the grid loses its page-wide pill rows (the press on
 * the card is the pick now) and wears the ring on the card that won.
 *
 * ★ AND THERE ARE THREE EXITS, which is how Will described the hero: choose the
 * winner; mark one or more cards refine with a note (the verdict row, kept as
 * optional feedback); or "None of these", which is the winner ask's own `none`
 * option, so the ledger line is `palette=none "new directions: ..."` and the
 * grammar never learns a fourth word. Choosing it clears the pick control,
 * which is the right preview of none.
 */
function GalleryStep({
  step,
  board,
  choice,
  shown,
  onPress,
  onChoose,
}: {
  step: AskStep;
  board: StepBoard;
  choice: string;
  shown: string | null;
  onPress: (o: SessionOption) => void;
  onChoose: (id: string) => void;
}) {
  const none = step.options.find((o) => o.id === NONE);
  const cards = step.options.filter((o) => o.id !== NONE);
  const grid = step.catalogSection;
  if (!grid) return null;
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <CatalogTiles
        value={{
          chosen: choice,
          shown: shown ?? undefined,
          quietVerdicts: true,
          onPress: (id) => {
            const option = cards.find((o) => o.id === id);
            if (option) onPress(option);
          },
        }}
      >
        <div data-lab-specimen="" className="min-w-0">
          {board.evidence(grid, board.state)}
        </div>
      </CatalogTiles>
      {none && (
        <div className="max-w-md">
          <OptionCard
            label={none.label}
            means={none.means}
            chosen={choice === NONE}
            dashed
            onPress={() => onChoose(NONE)}
          />
          <p className="mt-1.5 text-[10px] leading-relaxed text-muted-foreground">
            Or mark a card refine with a note, and the next round works from it.
          </p>
        </div>
      )}
    </div>
  );
}

/** The cleared option every pick control declares, and the catalog's exit. */
const NONE = "none";

/**
 * A CATALOG WALKED CARD BY CARD. The URL carries the card, not a second step:
 * `?session=<board>.items` stays ONE step and keeps its id, so the desk, the
 * ledger and "Copy so far" see the catalog they always saw and only the reading
 * changed.
 */
function ItemsBody({ step, board }: { step: ItemsStep; board?: StepBoard }) {
  const one = step.walk === "one-at-a-time";
  const [k, setK] = useState(0);
  const card = step.items[Math.min(k, step.items.length - 1)];

  useEffect(() => {
    if (!one || !card) return;
    const url = new URL(window.location.href);
    url.searchParams.set(CARD_PARAM, card.id);
    window.history.replaceState(window.history.state, "", url.toString());
  }, [one, card]);

  if (!board || !step.section) {
    return (
      <p className="max-w-2xl text-sm text-muted-foreground">
        The catalog is on the board itself. Open it from the spine above.
      </p>
    );
  }

  if (!one) {
    return (
      <div data-lab-specimen="" className="min-w-0">
        {board.evidence(step.section, board.state)}
      </div>
    );
  }

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <span className="text-[11px] text-muted-foreground tabular-nums">
          card {Math.min(k, step.items.length - 1) + 1} of {step.items.length}
        </span>
        <span className="ml-auto flex items-center gap-1.5">
          <CardStepButton
            dir="back"
            onGo={k > 0 ? () => setK(k - 1) : undefined}
          />
          <CardStepButton
            dir="next"
            onGo={k < step.items.length - 1 ? () => setK(k + 1) : undefined}
          />
        </span>
      </div>
      <CatalogTiles value={{ only: card?.id }}>
        <div data-lab-specimen="" className="min-w-0">
          {board.evidence(step.section, board.state)}
        </div>
      </CatalogTiles>
    </div>
  );
}

/** The card the one-at-a-time walk is on, so a reload returns to it. */
export const CARD_PARAM = "card";

function CardStepButton({
  dir,
  onGo,
}: {
  dir: "back" | "next";
  onGo?: () => void;
}) {
  return (
    <button
      type="button"
      data-dir-press
      onClick={onGo}
      disabled={!onGo}
      className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground disabled:opacity-40 motion-reduce:transition-none"
    >
      {dir === "back" ? (
        <ArrowLeft className="size-3" aria-hidden />
      ) : (
        <ArrowRight className="size-3" aria-hidden />
      )}
      {dir === "back" ? "Previous card" : "Next card"}
    </button>
  );
}

/* ── the knobs ────────────────────────────────────────────────────────────── */

/**
 * THE CONFIG STRIP: the handful of controls this question needs, beside the
 * stage, rather than the board's whole dock. An ask declares them (`strip`),
 * which is what keeps a step from growing back into the twenty-switch dock
 * the stepped round deleted.
 */
function ConfigStrip({ step, board }: { step: AskStep; board: StepBoard }) {
  const wanted = new Set(step.strip ?? []);
  const controls = (board.controls ?? []).filter((c) => wanted.has(c.id));
  if (controls.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-3">
      <ControlKnobs
        controls={controls}
        state={board.state}
        setState={board.setState}
      />
    </div>
  );
}

/* ── the dock ─────────────────────────────────────────────────────────────── */

/**
 * THE ANSWER, ALWAYS ON SCREEN (the dock round, 2026-09-18): sticky at the foot
 * of the window while the page scrolls, and at rest at the foot of the step when
 * it ends, so a reader can look anywhere on a tall preview and answer without
 * travelling. The options by number (the shown one ringed, the pick ticked),
 * Pick, the note, "not clear to me", Back and Next. At 375 the options scroll
 * sideways on their own row and the rest wraps under them.
 */
function Dock({
  step,
  pictured,
  choice,
  shown,
  sent,
  note,
  unclear,
  stood,
  needsWhy,
  noteRef,
  onPress,
  onChoose,
  onNote,
  onUnclear,
  onStands,
  back,
  next,
  filled,
}: {
  step: SessionStep;
  pictured: readonly SessionOption[];
  choice: string;
  shown: string | null;
  /** When this answer last rode a paste, if it has; it rides again if changed. */
  sent?: { build: string | null; at: string };
  note: string;
  unclear: boolean;
  /** The reviewer said the earlier ruling stands (an overtaken ask only). */
  stood: boolean;
  needsWhy: boolean;
  noteRef: React.RefObject<HTMLInputElement | null>;
  onPress: (o: SessionOption) => void;
  onChoose: (id: string) => void;
  onNote: (v: string) => void;
  onUnclear: () => void;
  onStands: () => void;
  back?: () => void;
  next?: () => void;
  filled: boolean;
}) {
  const live = pictured.find((o) => o.id === shown);
  const picked = live !== undefined && choice === live.id;
  return (
    <div data-lab-dock="" className="lab-dock">
      {step.kind === "ask" && pictured.length > 0 && (
        <div className="lab-dock-options" role="group" aria-label="The options">
          {pictured.map((option) => {
            const i = step.options.indexOf(option);
            const on = shown === option.id;
            const mine = choice === option.id;
            return (
              <button
                key={option.id}
                type="button"
                data-dir-press
                data-lab-option={option.id}
                data-label={option.label}
                data-shown={on ? "" : undefined}
                aria-pressed={mine}
                title={option.means}
                onClick={() => onPress(option)}
                className={cn(
                  "inline-flex max-w-[16rem] min-w-0 shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-left text-[12px] transition-colors duration-150 motion-reduce:transition-none",
                  mine
                    ? "border-transparent bg-foreground text-background"
                    : on
                      ? "border-foreground/40 bg-card ring-1 ring-foreground/30"
                      : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                <span className="tabular-nums">
                  {mine ? <Check className="size-3" aria-hidden /> : i + 1}
                </span>
                <span className="min-w-0 truncate font-medium">
                  {option.label}
                </span>
                {option.id === step.recommended && (
                  <span
                    className={cn(
                      "shrink-0 text-[10px]",
                      mine ? "text-background/70" : "text-muted-foreground",
                    )}
                  >
                    the board says
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {step.kind === "ask" && (
        /* ★ THE NOTE ROW WRAPS (the overtaken lane, 2026-09-19). At 1280 and up
           the dock is one row and the note's column falls to its 14rem floor
           whenever the options row is long; two dashed answers and a field
           cannot share 224 px, and measured on the first-event board the field
           came out at 26 px. Wrapping is the fix this lane owns: the field
           keeps a usable minimum and the answers drop to a line of their own
           where there is no room, and snap back to one row the moment there is
           (collapsing the lab's sidebar is enough). The one-row grid itself is
           `design.css`, which is not this lane's; the Handoff carries the
           column patch that would make the wrap rare. */
        <div className="lab-dock-note flex-wrap">
          <input
            ref={noteRef}
            type="text"
            data-lab-note=""
            value={note}
            onChange={(e) => onNote(e.target.value)}
            aria-label={`Your note on: ${step.question}`}
            aria-required={needsWhy}
            placeholder={
              unclear
                ? "Say what was unclear. It rides the answer into the ledger."
                : "A note on this one (optional)"
            }
            className={cn(
              "h-9 min-w-[9rem] flex-1 rounded-lg border bg-card px-3 text-[12px] transition-colors duration-150 outline-none placeholder:text-faint focus:border-foreground/40 motion-reduce:transition-none",
              needsWhy ? "border-foreground/40" : "border-border",
            )}
          />
          {/* "?" is recorded, not skipped: the ledger then says which question
              failed and why, and the board owes a clearer one. */}
          <button
            type="button"
            data-dir-press
            aria-pressed={unclear}
            onClick={onUnclear}
            className={cn(
              "shrink-0 rounded-lg border border-dashed px-3 py-2 text-[11px] font-medium transition-colors duration-150 motion-reduce:transition-none",
              unclear
                ? "border-foreground/40 bg-card text-foreground"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {unclear ? "Marked: not clear to me" : "Not clear to me"}
          </button>
          {/* ★ THE THIRD ANSWER, AND ONLY WHERE THERE IS A RULING TO STAND BY
              (Will, 2026-09-19). He asked for "an optional trash button to kill
              the question in the board if no answer"; a trash beside three
              options would read as killing the OPTIONS, and `kill` is already
              the catalog's verdict word. What he is actually doing is agreeing
              with the earlier ruling, so it is drawn as the answer it is and
              recorded as one: `<ask>=stands`, counted everywhere the desk
              counts. Primed when the lane conceded, so agreeing costs one press
              and nothing is recorded by looking. */}
          {step.kind === "ask" && step.overtaken && (
            <button
              type="button"
              data-dir-press
              data-lab-stands=""
              aria-pressed={stood}
              onClick={onStands}
              title="Press s. Recorded as an answer: the wiring follows the earlier ruling."
              className={cn(
                "shrink-0 rounded-lg border border-dashed px-3 py-2 text-[11px] font-medium transition-colors duration-150 motion-reduce:transition-none",
                stood
                  ? "border-foreground/40 bg-card text-foreground"
                  : step.overtaken.conceded
                    ? "border-foreground/30 text-foreground hover:bg-muted/40"
                    : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {stood ? "Marked: the ruling stands" : "The ruling stands"}
              {!stood && step.overtaken.conceded && (
                <span className="ml-1.5 font-normal text-muted-foreground">
                  the lane concedes
                </span>
              )}
            </button>
          )}
          {/* The transcriber learns `stands` at this round's merge; until then
              a paste carrying one is refused by name, which is the honest
              failure and is said here rather than discovered in chat. */}
          {stood && (
            <span className="shrink-0 text-[11px] text-faint">
              Recorded as an answer.
            </span>
          )}
          {needsWhy && (
            <span className="shrink-0 text-[11px] text-muted-foreground">
              Say what was unclear, then go on.
            </span>
          )}
          {sent && !needsWhy && (
            <span
              className="shrink-0 text-[11px] text-faint"
              title="It rode a paste. Change it and it goes again as a replacement."
            >
              {sent.build ? `sent on ${sent.build}` : "sent"}
            </span>
          )}
        </div>
      )}

      {/* Back, Pick, Next: agreeing with what is on the stage and moving on
          are one gesture apart. Pick sits outside the options' own row, which
          scrolls, so a long row can never push it off the dock. */}
      <div className="lab-dock-way">
        <Way dir="back" onGo={back} />
        {live && (
          <button
            type="button"
            data-dir-press
            data-lab-pick=""
            aria-pressed={picked}
            onClick={() => onChoose(live.id)}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors duration-150 motion-reduce:transition-none",
              picked
                ? "border border-border text-muted-foreground hover:text-foreground"
                : "border border-transparent bg-foreground text-background hover:opacity-90",
            )}
          >
            {picked ? (
              <>
                <Check className="size-3" aria-hidden />
                Picked
              </>
            ) : (
              `Pick ${step.kind === "ask" ? step.options.indexOf(live) + 1 : 1}`
            )}
          </button>
        )}
        <Way dir="next" onGo={next} filled={filled} />
      </div>
    </div>
  );
}

function Way({
  dir,
  onGo,
  filled,
}: {
  dir: "back" | "next";
  onGo?: () => void;
  filled?: boolean;
}) {
  const label = dir === "back" ? "Back" : "Next";
  const shape = cn(
    "inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-medium transition-colors duration-150 motion-reduce:transition-none",
    filled
      ? "border border-transparent bg-foreground text-background hover:opacity-90"
      : "border border-border text-muted-foreground hover:text-foreground",
  );
  return (
    <button
      type="button"
      data-dir-press
      onClick={onGo}
      disabled={!onGo}
      className={cn(shape, "disabled:opacity-40")}
    >
      {dir === "back" && <ArrowLeft className="size-3.5" aria-hidden />}
      {label}
      {dir === "next" && <ArrowRight className="size-3.5" aria-hidden />}
    </button>
  );
}
