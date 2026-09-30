"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { ArrowLeft, ArrowRight, Check, Info } from "lucide-react";

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
  toggleAnswer,
  useReviewStore,
} from "@/app/(dev)/design/(shell)/lab/_desk/review-store";
import {
  type AskStep,
  type ItemsStep,
  SESSION_END,
  type SessionOption,
  type SessionStep,
  stepBlocked,
  stepDone,
  stepParam,
  UNCLEAR,
} from "@/app/(dev)/design/(shell)/lab/_desk/session-step";
import { holdId } from "@/app/(dev)/design/(shell)/lab/_desk/step-id";

import { AboutPanel, hasAbout, panelTerms } from "./about";
import type { BoardState, Control, Term } from "./board-spec";
import { ControlKnobs } from "./board-state";
import { CatalogTiles } from "./catalog";
import { Glossed } from "./gloss";
import {
  FitPin,
  type LabSidebar,
  type LabStage,
  setLabPref,
  useLabPrefs,
} from "./lab-prefs";
import { Crumbs } from "./opening";
import { useDesignKey } from "./walk";
import { type Fitted, fitStage, unfitStage } from "./whole";

/**
 * THE STEP (the stepped review, 2026-09-16; the dock, 2026-09-18; pictures
 * first, lab-focus, 2026-09-29): one question, its options drawn whole on the
 * first screen, and the answer in a dock.
 *
 * ★ WILL'S WORDS ARE THE SPEC. "The review process favors you and makes me
 * spend tons of time per track figuring what I'm even being asked"; what he
 * wants instead is "more similar to a multi-step onboarding form where all
 * context is made available for 1+ questions around the same content, then onto
 * the next context". So: one question, its options drawn on the board's own
 * specimen, Back and Next, and nothing else on the page.
 *
 * ★ THE PICTURES ARE WHAT HE SEES (lab-focus, 2026-09-29). Opening a question
 * he is excited to see the drawn options, and he met "an absolutely
 * overwhelming smorgasbord of UI" first: the board's opening, a breadcrumb, a
 * context sentence, the question and its description, the words here twice, a
 * column of what it decides, the knobs, the option's trade, and per frame a
 * title and a measured line, with the frames below the fold and the dock
 * cutting them. So the first screen, at a desk and at a phone, is:
 *  - the SPINE: the board, the count, the way out;
 *  - WHERE IT HAPPENS, in one line: the breadcrumb and the state that brings
 *    someone there, with About at its end;
 *  - the QUESTION, sized to read, not to shout;
 *  - the OPTIONS as the tabs he picks between;
 *  - the shown option's SENTENCE, gain and cost in a line, over its picture;
 *  - the KNOBS as one quiet row on the stage;
 *  - the STAGE WHOLE: every frame of the shown option, scaled to fit the room
 *    left above the dock (`whole.ts`), with 1:1 one press away (`f`);
 *  - the DOCK: the note, "not clear to me", Back, Pick and Next.
 * Everything else a board knows (its opening, its words, what the question
 * decides and why, the board's reason) is one press on About (`i`), in one
 * place (`about.tsx`), and stays open for him once he opens it. What a lane
 * measures to prove a frame stays in the page for the lanes and `lab:demo`
 * and out of his view (design.css hides a frame's caption on a stage).
 *
 * ★ THE PREVIEW IS NEVER COVERED AND THE ANSWER IS ALWAYS ON SCREEN (the dock
 * round, 2026-09-18: "The top preview UI of our lab is covered by the answer
 * UI, and I cannot scroll it to see the full heights or labels on which height
 * is which"). Whole, the stage ends where the dock begins; 1:1, the page
 * scrolls under a sticky stage head and the dock sticks to the window's foot.
 *
 * ★ EVERY OPTION IS MOUNTED ONCE, FLIPPED OR SIDE BY SIDE. Flipped, the options
 * share one place on the stage and one is visible (the rest inert, hidden and
 * paused), so pressing between two is a blink with no reload and no scroll jump,
 * and whole, every option is drawn at one scale. Side by side when they are
 * phone columns and there is room (`g` swaps the two). A phone always flips.
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
 * ★ A QUESTION A LATER BOARD REACHED IS RESHAPED ON ITS BOARD, NEVER BADGED
 * HERE (an earlier pick that closed the road to a better
 * answer is adapted to the current context, and a question already solved at
 * its best is removed). So the step draws every question the same way, and
 * the ground a later board moved lives in the question's own context.
 *
 * Keys: 1..9 shows an option and a second press picks it; x blinks back to the
 * one shown before (A and B); g flips or lays side by side; f swaps whole and
 * 1:1; i opens or closes About; n goes to the note; ? marks the question
 * unclear; Enter and the arrows step, Enter from the note too; Escape lets the
 * note go. Enter on a focused control belongs to that control: an Enter that
 * pressed a button AND advanced the review answered a question the reader
 * never looked at.
 */

/** The board's own surface, when the step is mounted on one. */
export type StepBoard = {
  /** The board's declared controls, for an ask's config strip. */
  controls?: readonly Control[];
  /**
   * THE BOARD'S OWN DOCK CLUSTER, REACHABLE FROM A STEP (lab-tides,
   * 2026-09-19). A step's dock is the ANSWER's: Pick, the note, Back and
   * Next, and nothing a board could add. That left a board's own tools (a
   * Reload frames, a Replay, an Apply) reachable only by leaving the question
   * and opening the whole board, which is the trip the stepped review exists
   * to end. They ride the stage's knob row instead, beside the scale.
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
  page = false,
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
  /**
   * THE STEP IS THE PAGE: it fills the window under the top bar, so a whole
   * stage takes exactly the room between the question and the dock. A board's
   * review mounts it so; the desk's dry run and the kit's demo sit in a page
   * of their own and leave it off.
   */
  page?: boolean;
  className?: string;
}) {
  const store = useReviewStore();
  const router = useRouter();
  const key = useDesignKey();
  const prefs = useLabPrefs();
  const aboutId = useId();
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
  // ★ "?" IS AN ANSWER, AND IT OWES ITS REASON. The ledger grammar is
  // `<ask>=? "why"`, and `pnpm lab:review` refuses the line without the note:
  // an unclear question that never says what was unclear cannot be rewritten.
  const needsWhy = unclear && !(held?.note ?? "").trim();
  const aboutOpen = prefs.about === "open";

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
    // ★ NULL, NEVER `window.history.state` (crumbs-16; `board-state.tsx` has the measurements): the
    // entry's own state carries Next's `__NA`, which makes Next apply no URL, so `CopyLink` (Next's
    // `useSearchParams`) named the step the reader left and a refresh put it back on the bar.
    window.history.replaceState(null, "", url.toString());
  };

  /* ── the world a step is drawn in ─────────────────────────────────────── */

  /**
   * THE BOARD'S DECIDED ANSWERS, AS THE CONTROLS THAT DRAW THEM: the ledger's
   * from an earlier sitting (`answered`, resolved on the server), then this
   * sitting's from the store, which are newer and win. An exploration's control
   * IS its ask (`defineExploration`), so an answer on record lands on the control of
   * the same id; an ask in this walk also lends its option's own patch.
   */
  const wearing = (s: AskStep): Record<string, string> => {
    const out: Record<string, string> = { ...s.answered };
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

  const writeNote = (note: string) => {
    if (step?.kind !== "ask") return;
    setAnswerNote(step.board, step.round, step.askId, note);
  };

  const toggleAbout = () =>
    setLabPref("about", prefs.about === "open" ? "closed" : "open");
  const toggleStage = () =>
    setLabPref("stage", prefs.stage === "whole" ? "true" : "whole");

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
    const key = pressed.toLowerCase();
    // A digit on a catalog step does nothing: the verdicts are on the cards,
    // and nine of twelve would be an arbitrary half of a catalog.
    if (step.kind === "ask") {
      if (Number.isInteger(n) && n >= 1 && n <= step.options.length) {
        press(step.options[n - 1]);
        return true;
      }
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
    }
    if (key === "i" && hasAbout(step)) {
      toggleAbout();
      return true;
    }
    if (key === "f") {
      toggleStage();
      return true;
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
  // The options the tabs carry: the ones drawn on the stage. A catalog's
  // winner is pressed on its cards, and an option in words on its own card.
  const pictured =
    step.kind === "ask" && !step.winner
      ? step.options.filter((o) => drawable(step, o, board))
      : [];
  // ★ WHERE HIS SITTING ENTERS THE BOARD (the context layer, 2026-09-29): the
  // first of the board's steps the walk reaches is where the board's opening
  // is new to him, so its About says so with a mark until he opens it; every
  // later step keeps the same panel one press away.
  const enters =
    step.kind === "ask" &&
    step.opening !== undefined &&
    walk.find((s) => s.board === step.board) === step;
  const about = hasAbout(step);
  // Every coined word the view says is marked where it appears, with its
  // meaning a hover away, and listed in About.
  const terms = panelTerms(step);

  return (
    <div
      data-review-step
      role="region"
      aria-label={`${step.boardTitle}: the step being reviewed`}
      data-stage={prefs.stage}
      data-page={page ? "" : undefined}
      className={cn("lab-step", className)}
    >
      <Spine
        step={step}
        n={n > 0 ? n : walk.length + 1}
        of={Math.max(walk.length, 1)}
        blocked={blocked}
        transcribed={transcribed}
        build={build}
      />

      <div
        className="lab-step-body"
        data-about={about && aboutOpen ? "open" : undefined}
      >
        <Head
          step={step}
          terms={terms}
          lines={prefs.lines}
          about={
            about
              ? {
                  id: aboutId,
                  open: aboutOpen,
                  fresh: enters && !aboutOpen,
                  onToggle: toggleAbout,
                }
              : undefined
          }
        />

        {about && aboutOpen && (
          <AboutPanel step={step} id={aboutId} onClose={toggleAbout} />
        )}

        <div className="lab-step-main">
          {step.kind === "ask" ? (
            <AskBody
              step={step}
              board={board}
              pictured={pictured}
              choice={choice}
              shown={shown}
              terms={terms}
              lines={prefs.lines}
              stage={prefs.stage}
              arrangeRef={arrangeRef}
              onPress={press}
              onChoose={choose}
              stateFor={stateFor}
            />
          ) : (
            <ItemsBody step={step} board={board} stage={prefs.stage} />
          )}
        </div>
      </div>

      <Dock
        step={step}
        pictured={pictured}
        choice={choice}
        shown={shown}
        sent={sent}
        note={held?.note ?? ""}
        unclear={unclear}
        needsWhy={needsWhy}
        noteRef={noteRef}
        onChoose={choose}
        onNote={writeNote}
        onUnclear={markUnclear}
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
    <div className="lab-spine flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
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
 * WHERE IT HAPPENS, IN ONE LINE, AND THE QUESTION (lab-focus, 2026-09-29).
 *
 * ★ HE CAN ALWAYS PLACE A QUESTION (the context layer, 2026-09-29: "for some
 * questions I'm just getting dropped off in the middle of nowhere"), and the
 * one line is how: the breadcrumb (the surface, then the screen and the
 * moment) and the state that brings someone there, together, cut to one line
 * with the rest a press on "more" away. About sits at its end, marked where
 * the board is new to this sitting.
 *
 * ★ THE QUESTION IS SIZED TO READ, NOT TO SHOUT: the reading face at a
 * reading size, since the pictures under it are what he came for.
 */
function Head({
  step,
  terms,
  lines,
  about,
}: {
  step: SessionStep;
  terms: readonly Term[];
  lines: "one" | "full";
  about?: {
    id: string;
    open: boolean;
    /** The board is new to this sitting and its About not yet opened. */
    fresh: boolean;
    onToggle: () => void;
  };
}) {
  const ask = step.kind === "ask" ? step : null;
  const where = ask?.where?.length ? ask.where : undefined;
  const placed = Boolean(where || ask?.when);
  return (
    <header className="lab-step-head">
      {(placed || about) && (
        <div className="flex min-w-0 items-start gap-3">
          {placed ? (
            <OneLine
              data="where"
              lines={lines}
              className="text-xs leading-5 text-muted-foreground"
              whole={[...(where ?? []), ask?.when].filter(Boolean).join(" · ")}
            >
              <Crumbs where={where} />
              {ask?.when && (
                <>
                  {where && (
                    <span aria-hidden className="px-1.5 text-faint">
                      ·
                    </span>
                  )}
                  <span data-lab-when="" className="text-foreground/85">
                    <Glossed text={ask.when} terms={terms} />
                  </span>
                </>
              )}
            </OneLine>
          ) : (
            <span className="flex-1" />
          )}
          {about && (
            <button
              type="button"
              data-dir-press
              data-lab-about-toggle=""
              data-fresh={about.fresh ? "" : undefined}
              aria-expanded={about.open}
              aria-controls={about.open ? about.id : undefined}
              onClick={about.onToggle}
              title={
                about.fresh
                  ? "What this board is about, what is settled and what you said before (i)"
                  : "What it decides, why it matters, the board's words (i)"
              }
              className={cn(
                "relative inline-flex h-5 shrink-0 items-center gap-1 rounded-md px-1.5 text-[11px] font-medium transition-colors duration-150 motion-reduce:transition-none",
                about.open
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Info className="size-3.5" aria-hidden />
              About
              {about.fresh && (
                <span
                  aria-hidden
                  className="absolute -top-0.5 -right-0.5 size-1.5 rounded-full bg-foreground"
                />
              )}
            </button>
          )}
        </div>
      )}
      <h1 className="lab-question">
        {step.kind === "items" ? (
          headingFor(step)
        ) : (
          <Glossed text={step.question} terms={terms} />
        )}
      </h1>
      {step.kind === "items" && (
        <p className="text-xs leading-relaxed text-muted-foreground">
          {step.walk === "one-at-a-time"
            ? "One card at a time, as it would land. Keep it, refine it, or kill it, with a note where the word is not enough."
            : "Keep, refine or kill each card. A second press on the same word clears it; the note stays."}
        </p>
      )}
    </header>
  );
}

/**
 * A LINE CUT TO ONE LINE, with "more" where it is cut (lab-focus). The where
 * line and the shown option's line are read in one line each so the stage
 * keeps its room; a press on "more" reads both whole, and that choice holds
 * for the reader (`lines`, a per-viewer convenience). The whole text rides
 * the line's title for a hover.
 */
function OneLine({
  data,
  lines,
  whole,
  className,
  children,
}: {
  /** `data-lab-<data>` on the line, the hook a test or a tool reads it by. */
  data: "where" | "trade";
  lines: "one" | "full";
  /** The line's words, for its title. */
  whole: string;
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLParagraphElement | null>(null);
  const [cut, setCut] = useState(false);
  const full = lines === "full";

  // Whether the line is cut, read off its own box, so "more" is offered only
  // where there is more.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || full) return;
    const read = () => setCut(el.scrollWidth > el.clientWidth + 1);
    read();
    const ro =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(read);
    ro?.observe(el);
    return () => ro?.disconnect();
  }, [full, whole]);

  return (
    <div className="flex min-w-0 flex-1 items-baseline gap-1.5">
      <p
        ref={ref}
        {...{ [`data-lab-${data}`]: "" }}
        title={full ? undefined : whole}
        className={cn("min-w-0 flex-1", !full && "truncate", className)}
      >
        {children}
      </p>
      {(full || cut) && (
        <button
          type="button"
          data-dir-press
          onClick={() => setLabPref("lines", full ? "one" : "full")}
          className="shrink-0 text-[11px] text-muted-foreground underline decoration-dotted underline-offset-2 transition-colors duration-150 hover:text-foreground motion-reduce:transition-none"
        >
          {full ? "less" : "more"}
        </button>
      )}
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
  terms,
  lines,
  stage,
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
  terms: readonly Term[];
  lines: "one" | "full";
  stage: LabStage;
  arrangeRef: RefObject<(() => void) | null>;
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
        stage={stage}
        onPress={onPress}
        onChoose={onChoose}
      />
    );
  }

  const section = step.stageSection ?? step.section;
  if (board && section && pictured.length > 0) {
    return (
      <>
        <OptionTabs
          step={step}
          options={pictured}
          choice={choice}
          shown={shown}
          onPress={onPress}
        />
        <StageViews
          step={step}
          board={board}
          section={section}
          options={pictured}
          choice={choice}
          shown={shown}
          terms={terms}
          lines={lines}
          stage={stage}
          arrangeRef={arrangeRef}
          onPress={onPress}
          stateFor={stateFor}
        />
      </>
    );
  }

  // A question whose options cannot be drawn: the evidence as the question is
  // asked, then the options in words, each its own card.
  const strip = board && step.strip && step.strip.length > 0;
  const tools = board?.tools;
  return (
    <>
      {(strip || tools) && (
        // No tabs on a words step, so the strip and the board's own tools
        // share a row of their own rather than being unreachable.
        <div className="lab-knobs">
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
      {board && section && (
        <FitStage stage={stage} deps={[board.state, section]}>
          <div data-lab-specimen="" className="min-w-0">
            {board.evidence(section, { ...board.state, ...stateFor(step) })}
          </div>
        </FitStage>
      )}
      {/* With nothing drawn to look at, the author's line saying what to
          look at is the view's own (it is in About too): it was once the
          only instruction such a step had, and it shipped dropped. */}
      {step.look && (
        <p className="text-xs leading-relaxed text-muted-foreground">
          <span className="text-foreground">What to look at: </span>
          {step.look}
        </p>
      )}
      <ul className="lab-word-options">
        {step.options.map((option, i) => (
          <li key={option.id} className="min-w-0 list-none">
            <OptionCard
              n={i + 1}
              label={option.label}
              means={option.means}
              gains={option.gains}
              costs={option.costs}
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
 * THE OPTIONS, AS THE TABS HE PICKS BETWEEN (lab-focus, 2026-09-29). They sat
 * in the dock under the picture; now they head the stage they drive, each
 * with its number (the key that shows it), its name, the board's mark on the
 * one it recommends (its reason on a hover, and in About) and a tick on his
 * pick. A press shows; a press on the one shown picks.
 */
function OptionTabs({
  step,
  options,
  choice,
  shown,
  onPress,
}: {
  step: AskStep;
  options: readonly SessionOption[];
  choice: string;
  shown: string | null;
  onPress: (o: SessionOption) => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  useScrollEdges(ref);
  // A tab shown by a key on a phone may be off the row's edge: bring it in.
  // ★ THE ROW, NEVER THE PAGE: `scrollIntoView` scrolls every ancestor that
  // can, and with About open above the tabs at a phone it carried the page
  // down past the question on landing. So the row's own scroll is moved.
  useEffect(() => {
    const row = ref.current;
    const tab = row?.querySelector<HTMLElement>("[data-shown]");
    if (!row || !tab) return;
    const at = row.getBoundingClientRect();
    const box = tab.getBoundingClientRect();
    const start = box.left - at.left + row.scrollLeft;
    const end = start + box.width;
    if (start < row.scrollLeft) row.scrollLeft = start;
    else if (end > row.scrollLeft + row.clientWidth)
      row.scrollLeft = end - row.clientWidth;
  }, [shown]);
  return (
    <div
      ref={ref}
      data-lab-tabs=""
      className="lab-tabs"
      role="group"
      aria-label="The options"
    >
      {options.map((option) => {
        const i = step.options.indexOf(option);
        const on = shown === option.id;
        const mine = choice === option.id;
        const recommended = option.id === step.recommended;
        return (
          <button
            key={option.id}
            type="button"
            data-dir-press
            data-lab-option={option.id}
            data-label={option.label}
            data-shown={on ? "" : undefined}
            aria-pressed={mine}
            aria-current={on ? "true" : undefined}
            // The recommendation's reason rides its tab, so the one place
            // the stage says "the board says" also says why.
            title={
              recommended && step.because
                ? [option.means, `The board says: ${step.because}`]
                    .filter(Boolean)
                    .join(" ")
                : option.means
            }
            onClick={() => onPress(option)}
            className={cn(
              "lab-tab group/tab",
              on
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "inline-flex size-4.5 shrink-0 items-center justify-center rounded-md border text-[10px] tabular-nums transition-colors duration-150 motion-reduce:transition-none",
                mine
                  ? "border-transparent bg-foreground text-background"
                  : on
                    ? "border-foreground/40"
                    : "border-border",
              )}
            >
              {mine ? <Check className="size-2.5" /> : i + 1}
            </span>
            <span className="min-w-0 truncate font-medium">{option.label}</span>
            {recommended && (
              <span className="shrink-0 text-[10px] font-normal text-muted-foreground">
                the board says
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/**
 * ★ AN OPTION'S TRADE, IN A LINE, OVER ITS PICTURE (the context layer,
 * 2026-09-29; a line, lab-focus). Its name, what it is, what picking it gains
 * and what it costs, so the difference between two tiles is read rather than
 * spotted: "click through the options to see what's changing" was the trip
 * this ends. Outside the view on purpose: `lab:demo` compares the views'
 * pictures, and words that change with every press would hide a stage that
 * does not. `narrow` is the stacked form a side-by-side column wears.
 */
function OptionTrade({
  option,
  terms,
  lines = "one",
  withMeans = true,
  narrow = false,
  n,
  className,
}: {
  option: SessionOption;
  terms?: readonly Term[];
  lines?: "one" | "full";
  withMeans?: boolean;
  narrow?: boolean;
  /** The option's number, when the line names it. */
  n?: number;
  className?: string;
}) {
  const means = withMeans ? option.means : undefined;
  if (narrow) {
    if (!means && !option.gains && !option.costs) return null;
    return (
      <div
        data-lab-trade={option.id}
        className={cn("flex flex-col gap-1 text-xs leading-relaxed", className)}
      >
        {means && <p className="text-muted-foreground">{means}</p>}
        {option.gains && (
          <p>
            <span className="font-medium text-foreground">Gains: </span>
            <span className="text-muted-foreground">{option.gains}</span>
          </p>
        )}
        {option.costs && (
          <p>
            <span className="font-medium text-foreground">Costs: </span>
            <span className="text-muted-foreground">{option.costs}</span>
          </p>
        )}
      </div>
    );
  }
  return (
    <TradeLine
      option={option}
      means={means}
      terms={terms}
      lines={lines}
      n={n}
      className={className}
    />
  );
}

/**
 * THE SHOWN OPTION'S LINE: its number and name with what it is, what it
 * gains, what it costs, sharing one line (two parts to the sentence, one each
 * to the trade) so every part shows however long the others run, each cut
 * where it runs out and whole on a hover. Below a tablet's width the line is
 * the sentence alone. "more" reads all of it, stacked (`lines`).
 */
function TradeLine({
  option,
  means,
  terms,
  lines,
  n,
  className,
}: {
  option: SessionOption;
  means?: string;
  terms?: readonly Term[];
  lines: "one" | "full";
  n?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [cut, setCut] = useState(false);
  const full = lines === "full";
  const what = [option.label, means].filter(Boolean).join(": ");

  // Whether any part is cut (or hidden below a tablet's width), read off the
  // parts' own boxes, so "more" is offered only where there is more.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || full) return;
    const read = () =>
      setCut(
        [...el.querySelectorAll<HTMLElement>("[data-part]")].some(
          (p) => p.offsetParent === null || p.scrollWidth > p.clientWidth + 1,
        ),
      );
    read();
    const ro =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(read);
    ro?.observe(el);
    return () => ro?.disconnect();
  }, [full, option.id]);

  return (
    <div
      ref={ref}
      data-lab-trade={option.id}
      data-full={full ? "" : undefined}
      className={cn(
        "lab-trade text-xs leading-5 text-muted-foreground",
        className,
      )}
    >
      <p data-part="" title={full ? undefined : what}>
        {n !== undefined && <span className="mr-1.5 tabular-nums">{n}</span>}
        <span data-lab-stage-label="" className="font-medium text-foreground">
          <Glossed text={option.label} terms={terms} />
        </span>
        {means && (
          <>
            <Dot />
            <Glossed text={means} terms={terms} />
          </>
        )}
      </p>
      {option.gains && (
        <p
          data-part=""
          data-trade="gains"
          title={full ? undefined : option.gains}
        >
          <span className="font-medium text-foreground">Gains </span>
          <Glossed text={option.gains} terms={terms} />
        </p>
      )}
      {option.costs && (
        <p
          data-part=""
          data-trade="costs"
          title={full ? undefined : option.costs}
        >
          <span className="font-medium text-foreground">Costs </span>
          <Glossed text={option.costs} terms={terms} />
        </p>
      )}
      {(full || cut) && (
        <button
          type="button"
          data-dir-press
          onClick={() => setLabPref("lines", full ? "one" : "full")}
          className="shrink-0 self-baseline text-[11px] text-muted-foreground underline decoration-dotted underline-offset-2 transition-colors duration-150 hover:text-foreground motion-reduce:transition-none"
        >
          {full ? "less" : "more"}
        </button>
      )}
    </div>
  );
}

const Dot = () => (
  <span aria-hidden className="px-1.5 text-faint">
    ·
  </span>
);

/**
 * THE STAGE: every drawn option mounted once, flipped or side by side, whole
 * on the first screen or 1:1.
 *
 * ★ IT TAKES THE POINTER. A stage that refused it once made the wheel scroll a
 * pinned iframe and not the page; nothing is pinned now, so the wheel goes
 * where the reader expects and a preview can be hovered. A link inside a
 * preview does not navigate (a press on the picture of a page is looking, not
 * leaving), and a form inside one does not submit.
 */
function StageViews({
  step,
  board,
  section,
  options,
  choice,
  shown,
  terms,
  lines,
  stage,
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
  terms: readonly Term[];
  lines: "one" | "full";
  stage: LabStage;
  arrangeRef: RefObject<(() => void) | null>;
  onPress: (o: SessionOption) => void;
  stateFor: (s: AskStep, o?: SessionOption) => Record<string, string>;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const { sidebar } = useLabPrefs();
  const [room, setRoom] = useState<{ width: number; phone: boolean } | null>(
    null,
  );
  const [arrange, setArrange] = useState<Arrange | null>(null);
  const [wide, setWide] = useState(false);
  const whole = stage === "whole";

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

  // Side by side only when every option is a phone column (`tile: "phone"`)
  // in a column wide enough for all of them at their true size.
  const fits =
    step.tile === "phone" &&
    room !== null &&
    !room.phone &&
    room.width >= options.length * PHONE_W + (options.length - 1) * SIDE_GAP;
  const mode: Arrange = room?.phone
    ? "flip"
    : (arrange ?? (fits ? "side" : "flip"));
  // `g` swaps at any width but a phone's; the button is offered only where
  // side by side draws every option as its column, or to leave it.
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

  const k = useWholeFit(ref, whole, mode === "side", [
    live.id,
    board.state,
    options.length,
  ]);

  // 1:1, anything wider than the column is scrolled sideways: say so on the
  // scale, and offer the sidebar's room where it is the difference.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || whole) return;
    const view =
      el.querySelector<HTMLElement>("[data-lab-view][data-shown]") ??
      el.querySelector<HTMLElement>("[data-lab-view]");
    if (!view) return;
    const read = () => {
      let w = view.scrollWidth > view.clientWidth + 1;
      for (const box of view.querySelectorAll<HTMLElement>(
        '[data-stage-fit="true"]',
      ))
        if (box.scrollWidth > box.clientWidth + 1) w = true;
      setWide(w);
    };
    read();
    const ro =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(read);
    ro?.observe(view);
    return () => ro?.disconnect();
  }, [live.id, mode, whole]);

  return (
    <>
      <StageHead
        step={step}
        board={board}
        live={live}
        n={step.options.indexOf(live) + 1}
        picked={choice === live.id}
        terms={terms}
        lines={lines}
        mode={mode}
        canSide={offerSide}
        onArrange={() => setArrange(mode === "side" ? "flip" : "side")}
        stage={stage}
        k={k}
        wide={wide}
        sidebar={sidebar}
      />
      <div
        ref={ref}
        data-lab-stage=""
        data-arrange={mode}
        data-fit={whole ? "whole" : "true"}
        // 1:1, the stage takes the page's gutter back on a wide page, and a
        // Stage inside it keeps its own box (a bleed inside a bleed).
        data-lab-bleed={whole ? undefined : ""}
        className="lab-stage"
        onClickCapture={(event) => {
          if ((event.target as Element).closest?.("a[href]"))
            event.preventDefault();
        }}
        onSubmitCapture={(event) => event.preventDefault()}
      >
        {/* Every piece inside draws 1:1: whole, the stage scales the option
            at once (and a Fit's canvas takes its width); 1:1 is 1:1. */}
        <FitPin.Provider value={whole ? "whole" : "true"}>
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
                {mode === "side" && (
                  <OptionTrade
                    option={option}
                    withMeans={false}
                    narrow
                    className="mb-2 px-0.5"
                  />
                )}
                <div data-lab-fit="">
                  <div data-lab-specimen="" className="min-w-0">
                    {board.evidence(section, {
                      ...board.state,
                      ...stateFor(step, option),
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </FitPin.Provider>
      </div>
    </>
  );
}

/**
 * FITS A STAGE WHOLE, and keeps it fitted as the room or the drawing changes
 * (`whole.ts` does the measuring). Returns the scale worn, for the scale's
 * label, or null at 1:1 and before the first fit.
 *
 * ★ A RESIZE OBSERVER ON THE BOX AND ON EACH DRAWING: the box moves when the
 * window does or About opens beside it, and a drawing moves when a knob swaps
 * its frames or a webfont lands. A re-fit that finds the same answer writes
 * nothing (`last`), so the observer's own echo ends there.
 */
function useWholeFit(
  ref: RefObject<HTMLDivElement | null>,
  whole: boolean,
  side: boolean,
  deps: readonly unknown[],
): number | null {
  const [k, setK] = useState<number | null>(null);
  const last = useRef<Fitted | null>(null);

  useLayoutEffect(() => {
    const box = ref.current;
    if (!box) return;
    if (!whole) {
      unfitStage(box);
      last.current = null;
      box.removeAttribute("data-fitted");
      return;
    }
    let raf = 0;
    const run = () => {
      raf = 0;
      const fitted = fitStage(box, { side, last: last.current });
      if (!fitted) return;
      last.current = fitted;
      box.setAttribute("data-fitted", "");
      setK((was) =>
        was !== null && Math.abs(was - fitted.k) < 0.002 ? was : fitted.k,
      );
    };
    run();
    const again = () => {
      if (!raf) raf = requestAnimationFrame(run);
    };
    const ro =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(again);
    ro?.observe(box);
    for (const wrap of box.querySelectorAll<HTMLElement>("[data-lab-fit]"))
      ro?.observe(wrap);
    window.addEventListener("resize", again);
    document.fonts?.ready.then(again).catch(() => {});
    return () => {
      cancelAnimationFrame(raf);
      ro?.disconnect();
      window.removeEventListener("resize", again);
    };
    // The deps are the caller's: what it draws, and in what state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, whole, side, ...deps]);

  // 1:1 has no scale to say; the last whole one waits for the next fit.
  return whole ? k : null;
}

/**
 * A ROW THAT SCROLLS SIDEWAYS SAYS SO AT ITS EDGES (the tabs, the knobs): it
 * marks the side that has more (`data-edge-start`, `data-edge-end`) and
 * design.css fades that edge, so a tab cut at a phone's edge reads as more to
 * come rather than as a broken label.
 */
function useScrollEdges(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const read = () => {
      const more = el.scrollWidth - el.clientWidth;
      el.toggleAttribute("data-edge-start", more > 1 && el.scrollLeft > 1);
      el.toggleAttribute("data-edge-end", more > 1 && el.scrollLeft < more - 1);
    };
    read();
    el.addEventListener("scroll", read, { passive: true });
    const ro =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(read);
    ro?.observe(el);
    for (const kid of el.children) ro?.observe(kid);
    return () => {
      el.removeEventListener("scroll", read);
      ro?.disconnect();
    };
  }, [ref]);
}

/**
 * ONE DRAWING, WHOLE OR 1:1, where a step has one thing to show rather than an
 * option per view: a words step's evidence, a catalog's cards. The same fit
 * as the stage's, over a single view.
 */
function FitStage({
  stage,
  deps,
  children,
}: {
  stage: LabStage;
  deps: readonly unknown[];
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const whole = stage === "whole";
  useWholeFit(ref, whole, false, deps);
  return (
    <div
      ref={ref}
      data-lab-whole=""
      data-fit={whole ? "whole" : "true"}
      className="lab-stage"
    >
      <FitPin.Provider value={whole ? "whole" : "true"}>
        <div data-lab-view="" data-shown="" className="min-w-0">
          <div data-lab-fit="">{children}</div>
        </div>
      </FitPin.Provider>
    </div>
  );
}

/**
 * THE STAGE HEAD: which option the stage is showing, in its line (its number,
 * its name, what it is, what it gains and costs), and under it the one quiet
 * row the stage is driven from: the ask's knobs, the board's own tools, the
 * arrangement and the scale. 1:1, it sticks under the top bar while a tall
 * stage scrolls, so the line saying which option is on it never leaves.
 */
function StageHead({
  step,
  board,
  live,
  n,
  picked,
  terms,
  lines,
  mode,
  canSide,
  onArrange,
  stage,
  k,
  wide,
  sidebar,
}: {
  step: AskStep;
  board: StepBoard;
  live: SessionOption;
  n: number;
  picked: boolean;
  terms: readonly Term[];
  lines: "one" | "full";
  mode: Arrange;
  canSide: boolean;
  onArrange: () => void;
  stage: LabStage;
  /** The whole stage's scale, once fitted. */
  k: number | null;
  /** 1:1, whether the shown option runs off the column. */
  wide: boolean;
  sidebar: LabSidebar;
}) {
  const strip = step.strip && step.strip.length > 0;
  const row = useRef<HTMLDivElement | null>(null);
  const knobs = useRef<HTMLDivElement | null>(null);
  useScrollEdges(row);
  useScrollEdges(knobs);
  return (
    <div data-lab-stage-head="" className="lab-stage-head">
      <div className="flex min-w-0 items-baseline gap-2">
        <OptionTrade
          option={live}
          terms={terms}
          lines={lines}
          n={n}
          className="min-w-0 flex-1"
        />
        {picked && (
          <span className="inline-flex shrink-0 items-center gap-1 text-[11px] text-foreground">
            <Check className="size-3" aria-hidden />
            your pick
          </span>
        )}
      </div>
      <div ref={row} className="lab-knobs">
        {/* The knobs scroll sideways where they run out of room; the cluster
            that sets the stage (the board's tools, the arrangement, the
            scale) never scrolls away at a desk, and leads the row at a
            phone (design.css). */}
        <div ref={knobs} className="lab-knobs-scroll">
          {strip && <ConfigStrip step={step} board={board} />}
        </div>
        <span className="lab-knobs-set">
          {/* The board's own cluster, on the row that stays with the stage.
              A board that declares none adds nothing. */}
          {board.tools && (
            <span data-lab-board-tools="" className="flex items-center gap-1.5">
              {board.tools}
            </span>
          )}
          {canSide && step.options.length > 1 && (
            <button
              type="button"
              data-dir-press
              onClick={onArrange}
              title="Press g to swap"
              className="h-6 rounded-md border border-border px-2 text-[11px] text-muted-foreground transition-colors duration-150 hover:text-foreground motion-reduce:transition-none"
            >
              {mode === "side" ? "One at a time" : "Side by side"}
            </button>
          )}
          {/* The one thing standing between a 1:1 preview and its room is
              sometimes the lab's own sidebar: say so, and take it away in one
              press. */}
          {stage === "true" && wide && sidebar === "open" && (
            <button
              type="button"
              data-dir-press
              onClick={() => setLabPref("sidebar", "collapsed")}
              className="h-6 rounded-md border border-dashed border-border px-2 text-[11px] text-muted-foreground transition-colors duration-150 hover:text-foreground motion-reduce:transition-none"
            >
              Hide the sidebar
            </button>
          )}
          <ScaleSwitch stage={stage} k={k} wide={wide} />
        </span>
      </div>
    </div>
  );
}

/**
 * WHOLE OR 1:1, AND THE SCALE THE STAGE IS DRAWN AT (lab-focus). Whole draws
 * every frame of the shown option in the room above the dock and says the
 * scale it took; 1:1 draws them at their true pixels and lets the page
 * scroll, which is a detail's press away. `f` swaps them.
 */
function ScaleSwitch({
  stage,
  k,
  wide,
}: {
  stage: LabStage;
  k: number | null;
  wide: boolean;
}) {
  const scaled = stage === "whole" && k !== null && k < 0.995;
  return (
    <span
      role="group"
      aria-label="The stage's scale"
      data-lab-scale=""
      title="Whole fits every frame on the screen; 1:1 draws them at their true size. Press f to swap."
      className="inline-flex h-6 items-center rounded-md border border-border p-px text-[11px] tabular-nums"
    >
      {(["whole", "true"] as const).map((s) => (
        <button
          key={s}
          type="button"
          data-dir-press
          aria-pressed={stage === s}
          onClick={() => setLabPref("stage", s)}
          className={cn(
            "h-full rounded-[5px] px-1.5 transition-colors duration-150 motion-reduce:transition-none",
            stage === s
              ? "bg-muted text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {s === "whole"
            ? scaled
              ? `Whole ${Math.round((k ?? 1) * 100)}%`
              : "Whole"
            : wide && stage === "true"
              ? "1:1 · scroll sideways"
              : "1:1"}
        </button>
      ))}
    </span>
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
  gains,
  costs,
  recommended,
  chosen,
  onPress,
  dashed,
}: {
  n?: number;
  label: string;
  means?: string;
  gains?: string;
  costs?: string;
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
        {gains && (
          <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">
            <span className="font-medium text-foreground">Gains: </span>
            {gains}
          </span>
        )}
        {costs && (
          <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">
            <span className="font-medium text-foreground">Costs: </span>
            {costs}
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
 * the card is the pick now) and wears the ring on the card that won. The
 * cards are the stage, so they are drawn whole with the rest.
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
  stage,
  onPress,
  onChoose,
}: {
  step: AskStep;
  board: StepBoard;
  choice: string;
  shown: string | null;
  stage: LabStage;
  onPress: (o: SessionOption) => void;
  onChoose: (id: string) => void;
}) {
  const none = step.options.find((o) => o.id === NONE);
  const cards = step.options.filter((o) => o.id !== NONE);
  const grid = step.catalogSection;
  if (!grid) return null;
  return (
    <>
      <FitStage stage={stage} deps={[board.state, choice, shown]}>
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
      </FitStage>
      {none && (
        <div className="flex max-w-xl flex-wrap items-center gap-x-3 gap-y-1">
          <div className="min-w-0 flex-1">
            <OptionCard
              label={none.label}
              means={none.means}
              chosen={choice === NONE}
              dashed
              onPress={() => onChoose(NONE)}
            />
          </div>
          <p className="text-[10px] leading-relaxed text-muted-foreground">
            Or mark a card refine with a note, and the next round works from it.
          </p>
        </div>
      )}
    </>
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
function ItemsBody({
  step,
  board,
  stage,
}: {
  step: ItemsStep;
  board?: StepBoard;
  stage: LabStage;
}) {
  const one = step.walk === "one-at-a-time";
  const [k, setK] = useState(0);
  const card = step.items[Math.min(k, step.items.length - 1)];

  useEffect(() => {
    if (!one || !card) return;
    const id = card.id;
    // Null and a microtask late, for the reasons on `useBoardState`'s write (`board-state.tsx`): this
    // runs on the first commit too, before Next has patched `replaceState`, and Next has to hear the
    // card or `CopyLink` names another.
    queueMicrotask(() => {
      const url = new URL(window.location.href);
      url.searchParams.set(CARD_PARAM, id);
      window.history.replaceState(null, "", url.toString());
    });
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
      <FitStage stage={stage} deps={[board.state]}>
        <div data-lab-specimen="" className="min-w-0">
          {board.evidence(step.section, board.state)}
        </div>
      </FitStage>
    );
  }

  return (
    <>
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
      <FitStage stage={stage} deps={[board.state, card?.id]}>
        <CatalogTiles value={{ only: card?.id }}>
          <div data-lab-specimen="" className="min-w-0">
            {board.evidence(step.section, board.state)}
          </div>
        </CatalogTiles>
      </FitStage>
    </>
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
 * THE CONFIG STRIP: the handful of controls this question needs, on the
 * stage's quiet row, rather than the board's whole dock. An ask declares them
 * (`strip`), which is what keeps a step from growing back into the
 * twenty-switch dock the stepped round deleted.
 */
function ConfigStrip({ step, board }: { step: AskStep; board: StepBoard }) {
  const wanted = new Set(step.strip ?? []);
  const controls = (board.controls ?? []).filter((c) => wanted.has(c.id));
  if (controls.length === 0) return null;
  return (
    <div data-lab-strip="" className="flex items-center gap-3">
      <ControlKnobs
        controls={controls}
        state={board.state}
        setState={board.setState}
        quiet
      />
    </div>
  );
}

/* ── the dock ─────────────────────────────────────────────────────────────── */

/**
 * THE ANSWER, ALWAYS ON SCREEN (the dock round, 2026-09-18): at the foot of
 * the window whether the stage is whole or scrolls. The options left it for
 * the tabs over the stage (lab-focus, 2026-09-29), so it is the answer alone:
 * the note, "not clear to me", Back, Pick and Next, one row at a desk and at
 * a phone.
 */
function Dock({
  step,
  pictured,
  choice,
  shown,
  sent,
  note,
  unclear,
  needsWhy,
  noteRef,
  onChoose,
  onNote,
  onUnclear,
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
  needsWhy: boolean;
  noteRef: RefObject<HTMLInputElement | null>;
  onChoose: (id: string) => void;
  onNote: (v: string) => void;
  onUnclear: () => void;
  back?: () => void;
  next?: () => void;
  filled: boolean;
}) {
  const live = pictured.find((o) => o.id === shown);
  const picked = live !== undefined && choice === live.id;
  return (
    <div data-lab-dock="" className="lab-dock">
      {step.kind === "ask" && (
        /* ★ THE NOTE KEEPS A USABLE WIDTH. A field, a dashed answer and the
           words beside them cannot share 224 px (measured on a long board,
           the field came out at 26 px), so the field has a floor and the
           words beside it wrap under it where there is no room. */
        <div className="lab-dock-note">
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
              "h-9 min-w-[5rem] flex-1 rounded-lg border bg-card px-3 text-[12px] transition-colors duration-150 outline-none placeholder:text-faint focus:border-foreground/40 motion-reduce:transition-none",
              needsWhy ? "border-foreground/40" : "border-border",
            )}
          />
          {/* "?" is recorded, not skipped: the ledger then says which question
              failed and why, and the board owes a clearer one. */}
          <button
            type="button"
            data-dir-press
            aria-pressed={unclear}
            aria-label={unclear ? "Marked: not clear to me" : "Not clear to me"}
            title="Not clear to me (?)"
            onClick={onUnclear}
            className={cn(
              "h-9 shrink-0 rounded-lg border border-dashed px-3 text-[11px] font-medium transition-colors duration-150 motion-reduce:transition-none",
              unclear
                ? "border-foreground/40 bg-card text-foreground"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            <span className="hidden sm:inline">
              {unclear ? "Marked: not clear to me" : "Not clear to me"}
            </span>
            <span aria-hidden className="sm:hidden">
              ?
            </span>
          </button>
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
          are one gesture apart. */}
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
              "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-[12px] font-medium transition-colors duration-150 motion-reduce:transition-none",
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
    "inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition-colors duration-150 motion-reduce:transition-none",
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
      aria-label={label}
      className={cn(shape, "disabled:opacity-40")}
    >
      {dir === "back" && <ArrowLeft className="size-3.5" aria-hidden />}
      {/* Back and Next are their arrows at a phone, where the dock is one
          row; Pick keeps its words, since it is the answer. */}
      <span className="hidden sm:inline">{label}</span>
      {dir === "next" && <ArrowRight className="size-3.5" aria-hidden />}
    </button>
  );
}
