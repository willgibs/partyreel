"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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

import type { BoardState, Control } from "./board-spec";
import { ControlKnobs } from "./board-state";
import { CatalogTiles } from "./catalog";
import { FitStage } from "./stage";
import { useDesignKey } from "./walk";

/**
 * THE STEP (the stepped review, 2026-09-16): one context and its question,
 * alone on the screen.
 *
 * ★ WILL'S WORDS ARE THE SPEC. "The review process favors you and makes me
 * spend tons of time per track figuring what I'm even being asked"; what he
 * wants instead is "more similar to a multi-step onboarding form where all
 * context is made available for 1+ questions around the same content, then onto
 * the next context". The surface this replaces put about 840 words and 250
 * controls around the evidence on one catalog board, printed every ask three or
 * four times (the Answer's pills, the section's "Rule on:", the review panel,
 * the card), and could only preview an option by RECORDING it. So: one
 * question, its options drawn as tiles on one specimen, the real thing on a
 * stage below, Back and Next, and nothing else on the page.
 *
 * ★ SHOWING IS NOT CHOOSING, AND THAT IS THE WHOLE MECHANISM. The old card
 * could not show you an option without writing it into the ledger draft, so
 * looking at the five palettes meant answering the question five times. A press
 * on a tile SHOWS it (the URL's declared state, which nothing reads back); a
 * press on the tile already shown, or the Choose beside it, RECORDS it; a
 * second Choose clears the answer and puts the stage back where it started.
 * Nothing is recorded by looking, which is what makes looking free.
 *
 * ★ A STEP IS STAGED UNTIL ITS QUESTION EXISTS. An ask that declares `after`
 * (the aurora's landing, once the aurora is kept) is skipped by Back, Next and
 * Start the review until its prerequisite is decided, and dropped as moot when
 * it went the other way: `stepBlocked` is the one rule, shared with the desk.
 *
 * ★ AND THE EVIDENCE IS THE BOARD'S OWN. This renders no pictures: the tiles
 * and the stage call the board's `evidence(section, state)` in the state being
 * shown, so what a reviewer judges is the real section the board draws, in the
 * option's own state. Off a board page (the desk's dry run) there is no
 * evidence function, and the tiles degrade to what the spec declares in words.
 *
 * Keys: 1..9 picks, Enter and the arrows step, Escape lets a note field go.
 * Enter belongs to whatever is focused: a board is a hundred buttons and an
 * Enter that both pressed the focused control AND advanced the review answered
 * a question the reader never looked at.
 */

/** The board's own surface, when the step is mounted on one. */
export type StepBoard = {
  /** The board's declared controls, for an ask's config strip. */
  controls?: readonly Control[];
  /** The live board state (`useBoardState`), which the stage and tiles read. */
  state: BoardState;
  setState: (patch: Record<string, string>) => void;
  /** One section's evidence, in whatever state it is handed. */
  evidence: (sectionId: string, state: BoardState) => React.ReactNode;
};

export function Step({
  boardId,
  steps,
  param,
  board,
  transcribed,
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
  /** The option on the stage that has NOT been recorded. */
  const [shown, setShown] = useState<string | null>(null);
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
  const choice = held?.choice ?? "";

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

  /* ── showing, and choosing ────────────────────────────────────────────── */

  /**
   * THE CONTROLS THAT DRAW AN OPTION: the ask's own state, then the option's,
   * then the control mirror. With no option it is the state the question is
   * asked in, and the mirrored control goes back to its DECLARED DEFAULT: a
   * cleared answer that left the board wearing the cleared choice would be the
   * un-unpickable pick all over again (Will, 2026-09-16).
   */
  const stateFor = (s: AskStep, option?: SessionOption) => {
    const cleared =
      s.control && !option
        ? board?.controls?.find((c) => c.id === s.control)?.default
        : undefined;
    return {
      ...s.state,
      ...option?.state,
      ...(s.control && option && option.id !== UNCLEAR
        ? { [s.control]: option.id }
        : {}),
      ...(s.control && cleared ? { [s.control]: cleared } : {}),
    };
  };

  const show = (option: SessionOption) => {
    if (step?.kind !== "ask") return;
    setShown(option.id);
    board?.setState(stateFor(step, option));
  };

  const choose = (id: string) => {
    if (step?.kind !== "ask") return;
    const option = step.options.find((o) => o.id === id);
    const set = toggleAnswer(step.board, step.round, step.askId, id);
    if (set) {
      setShown(id);
      if (option) board?.setState(stateFor(step, option));
      return;
    }
    // Cleared: the stage goes back to the state the question was asked in, or
    // this step would keep arguing for an answer that is no longer held.
    setShown(null);
    board?.setState(stateFor(step));
  };

  /**
   * A press on a tile: show it, or choose the one already shown.
   *
   * ★ A TEXT TILE CHOOSES ON THE FIRST PRESS. Show-then-choose buys a free look
   * at a preview; an option that declares no way to be drawn (a rule, not a
   * look) has nothing to look at, so a first press that did nothing visible
   * would read as a dead button. Off a board page every tile is a text tile,
   * which is what keeps the desk's dry run answerable in one press.
   */
  const press = (option: SessionOption) => {
    if (step?.kind !== "ask") return;
    if (!drawable(step, option, board)) choose(option.id);
    else if (shown === option.id || choice === option.id) choose(option.id);
    else show(option);
  };

  const writeNote = (note: string) => {
    if (step?.kind !== "ask") return;
    setAnswerNote(step.board, step.round, step.askId, note);
  };

  /* ── landing: the state the question is asked in ──────────────────────── */

  useEffect(() => {
    if (!step || !mine) return;
    const id = stepParam(step);
    if (landed.current === id) return;
    landed.current = id;
    setShown(null);
    if (step.state) board?.setState(step.state);
    window.scrollTo({ top: 0 });
  }, [step, mine, board]);

  /* ── the keys ─────────────────────────────────────────────────────────── */

  const onKey = (pressed: string): boolean => {
    if (!step || !mine) return false;
    const n = Number(pressed);
    // A digit on a catalog step does nothing: the verdicts are on the cards,
    // and nine of twelve would be an arbitrary half of a catalog.
    if (
      step.kind === "ask" &&
      Number.isInteger(n) &&
      n >= 1 &&
      n <= step.options.length
    ) {
      press(step.options[n - 1]);
      return true;
    }
    if (pressed === "Enter" || pressed === "ArrowRight") {
      goTo(at + 1);
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

  const unclear = step.kind === "ask" && choice === UNCLEAR;
  // ★ "?" IS AN ANSWER, AND IT OWES ITS REASON. The ledger grammar is
  // `<ask>=? "why"`, and `pnpm lab:review` refuses the line without the note:
  // an unclear question that never says what was unclear cannot be rewritten.
  const needsWhy = unclear && !(held?.note ?? "").trim();
  const filled = stepDone(step, store) && !needsWhy;
  // The walk's own numbering: a staged step is not a step the reviewer has.
  const walk = steps.filter((s) => stepBlocked(s, store) === null);
  const n = walk.indexOf(step) + 1;

  return (
    <div
      data-review-step
      role="region"
      aria-label={`${step.boardTitle}: the step being reviewed`}
      className={cn("flex min-w-0 flex-col gap-5 pb-24 sm:pb-8", className)}
    >
      <Spine
        step={step}
        n={n > 0 ? n : walk.length + 1}
        of={Math.max(walk.length, 1)}
        transcribed={transcribed}
      />

      <header className="max-w-3xl">
        <h1 className="font-heading text-2xl leading-tight tracking-tight text-balance sm:text-3xl">
          {step.kind === "items" ? headingFor(step) : step.question}
        </h1>
        {step.kind === "ask" ? (
          <>
            {step.context && (
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {step.context}
              </p>
            )}
            {step.lands && (
              <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                <span className="text-foreground">It decides: </span>
                {step.lands}
              </p>
            )}
          </>
        ) : (
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {step.walk === "one-at-a-time"
              ? "One card at a time, as it would land. Keep it, refine it, or kill it, with a note where the word is not enough."
              : "Keep, refine or kill each card. A second press on the same word clears it; the note stays."}
          </p>
        )}
      </header>

      {step.kind === "ask" ? (
        <AskBody
          step={step}
          board={board}
          choice={choice}
          shown={shown}
          onPress={press}
          onChoose={choose}
          stateFor={stateFor}
        />
      ) : (
        <ItemsBody step={step} board={board} />
      )}

      {step.kind === "ask" && (
        <NoteRow
          note={held?.note ?? ""}
          unclear={unclear}
          needsWhy={needsWhy}
          question={step.question}
          onNote={writeNote}
          onUnclear={() => choose(UNCLEAR)}
        />
      )}

      <Foot
        back={seek(at - 1, -1) >= 0 ? () => goTo(at - 1) : undefined}
        next={needsWhy ? undefined : () => goTo(at + 1)}
        filled={filled}
        blocked={needsWhy ? "Say what was unclear, then go on." : undefined}
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
  transcribed,
}: {
  step: SessionStep;
  n: number;
  of: number;
  transcribed?: Transcribed;
}) {
  const key = useDesignKey();
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <span className="text-[11px] font-medium">{step.boardTitle}</span>
        <span className="text-[11px] text-muted-foreground tabular-nums">
          step {n} of {of}
        </span>
        <span className="ml-auto flex flex-wrap items-center gap-2">
          <CopySoFar transcribed={transcribed} />
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
        <span
          className="block h-px bg-foreground transition-[width] duration-200 ease-out motion-reduce:transition-none"
          style={{ width: `${Math.round((n / Math.max(of, 1)) * 100)}%` }}
        />
      </span>
    </div>
  );
}

/* ── an ask ───────────────────────────────────────────────────────────────── */

function AskBody({
  step,
  board,
  choice,
  shown,
  onPress,
  onChoose,
  stateFor,
}: {
  step: AskStep;
  board?: StepBoard;
  choice: string;
  shown: string | null;
  onPress: (o: SessionOption) => void;
  onChoose: (id: string) => void;
  stateFor: (s: AskStep, o?: SessionOption) => Record<string, string>;
}) {
  // The state the stage wears: the option being looked at, else the one
  // recorded, else the state the question is asked in.
  const live = step.options.find((o) => o.id === (shown || choice));
  const stageState = { ...board?.state, ...stateFor(step, live) };
  const stageSection = step.stageSection ?? step.section;

  return (
    <>
      {step.winner && step.catalogSection && board ? (
        <GalleryStep
          step={step}
          board={board}
          choice={choice}
          shown={shown}
          onPress={onPress}
          onChoose={onChoose}
        />
      ) : (
        <OptionTiles
          step={step}
          board={board}
          choice={choice}
          shown={shown}
          onPress={onPress}
          stateFor={stateFor}
        />
      )}

      {board && step.strip && step.strip.length > 0 && (
        <ConfigStrip step={step} board={board} />
      )}

      {board && stageSection && (
        <div data-lab-specimen="" className="min-w-0">
          {board.evidence(stageSection, stageState)}
        </div>
      )}
    </>
  );
}

/**
 * THE OPTIONS AS TILES ON ONE SPECIMEN. Every option is the SAME section of the
 * board drawn in that option's own state, so the five things being compared
 * differ in exactly the one way the question is about; a press puts the chosen
 * one on the full-size stage below.
 *
 * ★ AN OPTION THAT CANNOT BE DRAWN IS A TEXT TILE, not a blank one. Plenty of
 * asks are about a rule rather than a look ("six families or the four named?"),
 * and those have no state to render: the tile is then the label and what
 * choosing it means, which is what the old card showed for everything.
 */
function OptionTiles({
  step,
  board,
  choice,
  shown,
  onPress,
  stateFor,
}: {
  step: AskStep;
  board?: StepBoard;
  choice: string;
  shown: string | null;
  onPress: (o: SessionOption) => void;
  stateFor: (s: AskStep, o?: SessionOption) => Record<string, string>;
}) {
  const section = step.section;
  return (
    <ul className="lab-tiles">
      {step.options.map((option, i) => {
        const drawn =
          section && drawable(step, option, board)
            ? board!.evidence(section, {
                ...board!.state,
                ...stateFor(step, option),
              })
            : null;
        return (
          <li key={option.id} className="min-w-0 list-none">
            <Tile
              n={i + 1}
              label={option.label}
              means={option.means}
              recommended={option.id === step.recommended}
              chosen={choice === option.id}
              shown={shown === option.id}
              onPress={() => onPress(option)}
            >
              {drawn ? (
                <FitStage mode="desktop" fit="zoom">
                  {drawn}
                </FitStage>
              ) : null}
            </Tile>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * ONE TILE: the preview, the name, the one line, and the ring when it is the
 * answer. The number is the key that picks it.
 */
function Tile({
  n,
  label,
  means,
  recommended,
  chosen,
  shown,
  onPress,
  dashed,
  children,
}: {
  n?: number;
  label: string;
  means?: string;
  recommended?: boolean;
  chosen: boolean;
  shown: boolean;
  onPress: () => void;
  /** The "None of these" exit, drawn as the one tile that is not a specimen. */
  dashed?: boolean;
  children?: React.ReactNode;
}) {
  return (
    // ★ NOT A <button>, AND THE PREVIEW IS INERT. A tile wraps the board's own
    // evidence, and a real section contains real buttons: a <button> around one
    // is invalid HTML and a hydration error (found live, 2026-09-16), and a
    // press that reached a control inside the preview would be answering the
    // question by fiddling with the picture of it. The preview is a picture:
    // `inert` takes it out of the tab order and the a11y tree, and the tile
    // itself is the only thing you can press.
    <div
      role="button"
      tabIndex={0}
      data-dir-press
      aria-pressed={chosen}
      onClick={onPress}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onPress();
        }
      }}
      className={cn(
        "flex h-full w-full min-w-0 cursor-pointer flex-col gap-2 rounded-xl border p-2.5 text-left transition-colors duration-150 outline-none focus-visible:border-foreground/40 motion-reduce:transition-none",
        dashed && "border-dashed",
        chosen
          ? "border-foreground/40 bg-muted/40 ring-1 ring-foreground/40"
          : shown
            ? "border-foreground/25 bg-card"
            : "border-border hover:bg-muted/40",
      )}
    >
      {children && (
        <span
          inert
          data-lab-specimen=""
          className="lab-tile-view block min-w-0"
        >
          {children}
        </span>
      )}
      <span className="flex min-w-0 items-start gap-2">
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
      </span>
    </div>
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
          <Tile
            label={none.label}
            means={none.means}
            chosen={choice === NONE}
            shown={false}
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

/* ── the furniture under the tiles ────────────────────────────────────────── */

/**
 * THE CONFIG STRIP: the handful of controls this question needs, beside the
 * stage, rather than the board's whole dock. An ask declares them (`strip`),
 * which is what keeps a step from growing back into the twenty-switch dock
 * this round is deleting.
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

function NoteRow({
  note,
  unclear,
  needsWhy,
  question,
  onNote,
  onUnclear,
}: {
  note: string;
  unclear: boolean;
  needsWhy: boolean;
  question: string;
  onNote: (v: string) => void;
  onUnclear: () => void;
}) {
  return (
    <div className="flex max-w-3xl flex-wrap items-center gap-2">
      <input
        type="text"
        value={note}
        onChange={(e) => onNote(e.target.value)}
        aria-label={`Your note on: ${question}`}
        aria-required={needsWhy}
        placeholder={
          unclear
            ? "Say what was unclear. It rides the answer into the ledger."
            : "A note on this one (optional)"
        }
        className={cn(
          "h-9 min-w-0 flex-1 basis-[18rem] rounded-lg border bg-card px-3 text-[12px] transition-colors duration-150 outline-none placeholder:text-faint focus:border-foreground/40 motion-reduce:transition-none",
          needsWhy ? "border-foreground/40" : "border-border",
        )}
      />
      {/* "?" is recorded, not skipped: the ledger then says which question
          failed and why, and the board owes a clearer one. */}
      <button
        type="button"
        data-dir-press
        aria-pressed={unclear}
        onClick={(e) => {
          onUnclear();
          e.currentTarget.parentElement?.querySelector("input")?.focus();
        }}
        className={cn(
          "rounded-lg border border-dashed px-3 py-2 text-[11px] font-medium transition-colors duration-150 motion-reduce:transition-none",
          unclear
            ? "border-foreground/40 bg-card text-foreground"
            : "border-border text-muted-foreground hover:text-foreground",
        )}
      >
        {unclear
          ? "Marked: not clear to me"
          : "This question is not clear to me"}
      </button>
    </div>
  );
}

/**
 * BACK AND NEXT, at the foot where a form's are. At 375 they are fixed to the
 * bottom of the window: a step whose stage is three screens tall would
 * otherwise put the way on below all of it.
 */
function Foot({
  back,
  next,
  filled,
  blocked,
}: {
  back?: () => void;
  next?: () => void;
  filled: boolean;
  blocked?: string;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 flex flex-wrap items-center gap-2 border-t border-border bg-background/90 px-4 py-2.5 backdrop-blur sm:static sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none">
      {blocked && (
        <span className="order-last basis-full text-[11px] text-muted-foreground sm:order-none sm:basis-auto">
          {blocked}
        </span>
      )}
      <span className="ml-auto flex items-center gap-2">
        <Way dir="back" onGo={back} />
        <Way dir="next" onGo={next} filled={filled} />
      </span>
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
  const body = (
    <>
      {dir === "back" && <ArrowLeft className="size-3.5" aria-hidden />}
      {label}
      {dir === "next" && <ArrowRight className="size-3.5" aria-hidden />}
    </>
  );
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
      {body}
    </button>
  );
}
