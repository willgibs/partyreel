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
import {
  setAnswerNote,
  toggleAnswer,
  useReviewStore,
} from "@/app/(dev)/design/(shell)/lab/_desk/review-store";
import {
  SESSION_END,
  stepDone,
  stepHeld,
  type SessionStep,
  stepParam,
  UNCLEAR,
} from "@/app/(dev)/design/(shell)/lab/_desk/session-step";
import { holdId } from "@/app/(dev)/design/(shell)/lab/_desk/step-id";

import { DOCK_PILL } from "./dock";
import { scrollToSection, useDesignKey } from "./walk";

/**
 * THE REVIEW CARD (the clarity round, 2026-09-15): the answering, moved onto
 * the board.
 *
 * ★ THE ASK AND ITS EVIDENCE ON ONE SCREEN. Will's first review through the
 * desk stopped at "Depth in dark: family | lift | neither" with "hard to
 * visibly tell what Family and Lift are from the previews": the desk showed a
 * label and three tokens, and the thing being judged opened in another tab. A
 * question about a picture has to be asked in front of the picture. So the desk
 * still owns the QUEUE and the summary, and this owns the ANSWERING: pinned
 * under the dock on the board's own page, with the section that argues the ask
 * scrolled into view beneath it.
 *
 * ★ LANDING ON A STEP IS AN ACT, NOT A LINK. The card applies the ask's
 * declared `state` through the board's own `setState` and scrolls its evidence
 * section under the chrome, so the reader arrives looking at the right thing in
 * the right state. A step that landed on the right section in the wrong state
 * shows him something the question does not describe, which is worse than no
 * card at all (the walk learned this first).
 *
 * ★ AND A PICK IS A PREVIEW. When an ask names a `control` whose option ids are
 * its own, choosing an option sets that control, so the answer and the evidence
 * for it are the same gesture.
 *
 * The position rides `?session=<board>.<ask>`, written with replaceState (a
 * step is not a navigation); the answers live in the desk's own store
 * (localStorage, per viewer), so a reader can start on the desk, answer three
 * on one board, cross to the next and finish at the desk's summary with
 * everything still held. THE UI NEVER WRITES THE REPO (Will, 2026-09-15): this
 * composes nothing and appends nothing; `pnpm lab:review` is the only thing
 * that touches docs/reviews/.
 *
 * ★ A CATALOG IS ONE STEP, AND THE CARD STAYS OUT OF ITS WAY (the revamp,
 * 2026-09-16). An items step says what to rule on, counts the verdicts as they
 * land and fills Next when every card has one; it renders no controls of its
 * own, because the controls belong on the cards in the catalog underneath. A
 * sticky card that listed twelve palettes with three buttons each would cover
 * the twelve palettes.
 *
 * Keys: 1..9 picks, Enter and the arrows step, Escape lets the note go. It
 * registers with `review-keys.ts` exactly as the desk's session does, so the
 * two can never both hold a key.
 */
export function ReviewCard({
  boardId,
  steps,
  param,
  setState,
  className,
}: {
  /** The board this card is mounted on; a step for any other board renders nothing. */
  boardId: string;
  /** The WHOLE open queue, so "Step N of M" counts the review and Next can cross. */
  steps: readonly SessionStep[];
  /** The `session` value the server read, so the first paint is the right step. */
  param: string | null;
  /** The board's own state setter (`useBoardState`), which the ask's state rides. */
  setState: (patch: Record<string, string>) => void;
  className?: string;
}) {
  const store = useReviewStore();
  const router = useRouter();
  const key = useDesignKey();
  const ref = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(true);
  // Null until the reader moves: the opening step is the one the URL names, so
  // the first paint is right and no effect has to correct it.
  const [chosen, setChosen] = useState<number | null>(null);
  const landed = useRef<string | null>(null);

  const from = steps.findIndex((s) => stepParam(s) === param);
  const at = chosen ?? from;
  const step = at >= 0 ? steps[at] : undefined;
  // Crossing a board is a navigation, so `chosen` can never leave this board;
  // a step for another board means the URL named one, and that board's card
  // renders it, not this one.
  const mine = step?.board === boardId;

  const held =
    step?.kind === "ask"
      ? store.answers[holdId(step.board, step.round, step.askId)]
      : undefined;
  const choice = held?.choice ?? "";

  /* ── what Next and Back reach ─────────────────────────────────────────── */

  // Within this board a step is a state change; the next board is a link that
  // opens ITS card on ITS first open ask. `end` is the desk's summary.
  const hop = (i: number): { to: number } | { href: string } | null => {
    if (i < 0) return null;
    if (i >= steps.length)
      return {
        href: withDesignKey(`/design/lab?session=${SESSION_END}`, key ?? null),
      };
    const next = steps[i];
    if (next.board === boardId) return { to: i };
    return {
      href: withDesignKey(
        `/design/lab/${next.board}?session=${stepParam(next)}`,
        key ?? null,
      ),
    };
  };

  const goTo = (i: number) => {
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

  /* ── the answers ──────────────────────────────────────────────────────── */

  const write = (patch: { note: string }) => {
    if (step?.kind !== "ask") return;
    setAnswerNote(step.board, step.round, step.askId, patch.note);
  };

  const pick = (id: string) => {
    if (step?.kind !== "ask") return;
    // A second click on the picked option clears it (the store's one toggle
    // rule); only a SET previews. The pick IS the preview: an ask that names
    // a control shares its option ids with it, so choosing puts the board in
    // the state being chosen.
    const set = toggleAnswer(step.board, step.round, step.askId, id);
    if (set && step.control && id !== UNCLEAR) setState({ [step.control]: id });
  };

  /* ── landing: the state, then the evidence ────────────────────────────── */

  useEffect(() => {
    if (!step || !mine) return;
    const id = stepParam(step);
    if (landed.current === id) return;
    landed.current = id;
    if (step.state) setState(step.state);
    if (!step.section) return;
    // One frame, so the state above has re-rendered the evidence and the card
    // has been measured before anything is scrolled to a position.
    const section = step.section;
    const raf = requestAnimationFrame(() => scrollToSection(boardId, section));
    return () => cancelAnimationFrame(raf);
  }, [step, mine, setState, boardId]);

  /* ── the card's own height, for everything that scrolls under it ──────── */

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const html = document.documentElement;
    const sync = () => {
      // Zero while the card is in the flow (at 375 it is static, like the
      // dock): a card nobody has to scroll past clears nothing.
      const stuck = getComputedStyle(el).position === "sticky";
      const h = stuck ? Math.round(el.getBoundingClientRect().height) : 0;
      html.style.setProperty("--review-card-h", `${h}px`);
    };
    sync();
    // A ResizeObserver does not re-fire in a background tab, so re-sync one
    // frame after mount and on every window resize as well (the dock's lesson).
    const raf = requestAnimationFrame(sync);
    window.addEventListener("resize", sync);
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", sync);
      ro.disconnect();
      html.style.removeProperty("--review-card-h");
    };
  }, []);

  /* ── the keys ─────────────────────────────────────────────────────────── */

  const onKey = (pressed: string): boolean => {
    if (!step || !mine) return false;
    const n = Number(pressed);
    // A digit on an items step does nothing: the verdicts are on the cards,
    // and nine of twelve would be an arbitrary half of a catalog.
    if (
      step.kind === "ask" &&
      Number.isInteger(n) &&
      n >= 1 &&
      n <= step.options.length
    ) {
      pick(step.options[n - 1].id);
      setOpen(true);
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
      // ★ ENTER BELONGS TO WHATEVER IS FOCUSED. On the desk the session is the
      // only thing on the page; a board is a hundred buttons, folds and links,
      // and an Enter that both pressed the focused control AND advanced the
      // review answered a question the reader never looked at. The digits and
      // the arrows are safe (nothing on a board answers to them), Enter is not.
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

  const section = step.section;
  const unclear = step.kind === "ask" && choice === UNCLEAR;
  const picked =
    step.kind === "ask" ? step.options.find((o) => o.id === choice) : undefined;
  // One derivation for all three counts (session-step.ts), so the card, the
  // desk's progress and "carry on" can never disagree about what is finished.
  const here = stepHeld(step, store);
  const filled = stepDone(step, store);
  const done = steps.filter((s) => stepDone(s, store)).length;

  return (
    <div
      ref={ref}
      data-review-card
      role="region"
      aria-label={`${step.boardTitle}: the step being reviewed`}
      className={cn(
        // ★ THE NEGATIVE TOP MARGIN EATS THE TEMPLATE'S `gap-10`. The card and
        // the dock are two sticky layers that have to meet with no seam, and
        // they cannot share a wrapper: a sticky element only sticks while its
        // PARENT is on screen, so a div around the pair would unstick both a
        // hundred pixels down the board.
        "relative -mx-4 -mt-10 border-b border-border bg-background/90 px-4 pt-2 pb-2.5 backdrop-blur",
        "sm:sticky sm:top-[calc(var(--lab-topbar-h,0px)+var(--board-dock-h,0px))] sm:z-20",
        className,
      )}
    >
      {/* The spine: where you are, and the way on. It survives the collapse. */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <span className="text-[11px] text-muted-foreground tabular-nums">
          Step {at + 1} of {steps.length}
        </span>
        <span className="hidden text-[11px] text-muted-foreground sm:inline">
          {step.boardTitle}
        </span>
        {!open && picked && (
          <span className="inline-flex min-w-0 items-center gap-1.5 rounded-lg border border-foreground/25 bg-card px-2 py-0.5 text-[11px]">
            <Check className="size-3 shrink-0" aria-hidden />
            <span className="truncate font-medium">{picked.label}</span>
          </span>
        )}
        {!open && unclear && (
          <span className="rounded-lg border border-dashed border-border px-2 py-0.5 text-[11px]">
            not clear to me
          </span>
        )}
        <span className="ml-auto flex flex-wrap items-center gap-1.5">
          {step.kind === "items" && (
            <span className="text-[11px] text-muted-foreground tabular-nums">
              {here.held} of {here.of} ruled
            </span>
          )}
          <span className="text-[11px] text-muted-foreground tabular-nums">
            {done} done
          </span>
          <CopySoFar />
          <Step
            dir="back"
            href={hrefOf(hop(at - 1))}
            onGo={at > 0 ? () => goTo(at - 1) : undefined}
          />
          <Step
            dir="next"
            href={hrefOf(hop(at + 1))}
            onGo={() => goTo(at + 1)}
            filled={filled}
          />
          <button
            type="button"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
            className={DOCK_PILL}
          >
            {open
              ? "Collapse"
              : step.kind === "items"
                ? "The catalog"
                : "The ask"}
          </button>
        </span>
      </div>

      <article
        key={stepParam(step)}
        data-dir-enter
        style={{ "--dir-duration": "160ms" } as React.CSSProperties}
        className="mt-1.5"
      >
        <h2
          className={cn(
            "text-sm leading-snug font-medium text-balance",
            !open && "truncate",
          )}
        >
          {step.kind === "items"
            ? `Rule on the ${step.items.length} in ${step.sectionTitle}`
            : step.question}
        </h2>

        {/* ── A CATALOG: the card says what to do and gets out of the way ── */}
        {open && step.kind === "items" && (
          <>
            <p className="mt-1 max-w-3xl text-[11px] leading-relaxed text-muted-foreground">
              Keep, refine or kill each card in the grid below, with a note
              where the word is not enough. A second press on the same word
              clears it; the note stays. Next fills once every card has a
              verdict, and an unruled card is simply left out of the message.
            </p>
            {section && (
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                <span className="font-medium text-foreground/80">
                  Where to look:{" "}
                </span>
                {step.sectionTitle}, under this card.
                <button
                  type="button"
                  onClick={() => scrollToSection(boardId, section)}
                  className="ml-1 font-medium text-foreground underline decoration-foreground/30 underline-offset-2 transition-colors duration-150 hover:decoration-foreground motion-reduce:transition-none"
                >
                  Take me there
                </button>
              </p>
            )}
          </>
        )}

        {/* ── AN ASK: the question, the options in words, the note ───────── */}
        {open && step.kind === "ask" && (
          <>
            {step.context && (
              <p className="mt-1 max-w-3xl text-[11px] leading-relaxed text-muted-foreground">
                {step.context}
              </p>
            )}
            {(step.look || section) && (
              <p className="mt-1 max-w-3xl text-[11px] leading-relaxed text-muted-foreground">
                <span className="font-medium text-foreground/80">
                  Where to look:{" "}
                </span>
                {step.look}
                {section && (
                  <button
                    type="button"
                    onClick={() => scrollToSection(boardId, section)}
                    className="ml-1 font-medium text-foreground underline decoration-foreground/30 underline-offset-2 transition-colors duration-150 hover:decoration-foreground motion-reduce:transition-none"
                  >
                    Take me there
                  </button>
                )}
              </p>
            )}

            <ul className="mt-2 flex flex-wrap gap-1.5">
              {step.options.map((option, i) => {
                const on = choice === option.id;
                return (
                  <li
                    key={option.id}
                    className="min-w-0 flex-1 basis-[15rem] list-none"
                  >
                    <button
                      type="button"
                      data-dir-press
                      aria-pressed={on}
                      onClick={() => pick(option.id)}
                      className={cn(
                        "flex h-full w-full items-start gap-2 rounded-xl border px-2.5 py-2 text-left transition-colors duration-150",
                        on
                          ? "border-foreground/40 bg-card"
                          : "border-border hover:bg-muted/40",
                      )}
                    >
                      <span
                        aria-hidden
                        className={cn(
                          "mt-px inline-flex size-4.5 shrink-0 items-center justify-center rounded-md border text-[10px] tabular-nums transition-colors duration-150",
                          on
                            ? "border-transparent bg-foreground text-background"
                            : "border-border text-muted-foreground",
                        )}
                      >
                        {on ? <Check className="size-2.5" /> : i + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[12px] leading-snug font-medium break-words">
                          {option.label}
                          {option.id === step.recommended && (
                            <span className="ml-1.5 text-[10px] font-normal text-muted-foreground">
                              the board says
                            </span>
                          )}
                        </span>
                        {option.means && (
                          <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">
                            {option.means}
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            {step.control && (
              <p className="mt-1 text-[10px] text-muted-foreground">
                Picking one sets the board&rsquo;s {step.control}, so the choice
                is the preview.
              </p>
            )}

            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <input
                type="text"
                value={held?.note ?? ""}
                onChange={(e) => write({ note: e.target.value })}
                aria-label={`Your note on: ${step.question}`}
                placeholder={
                  unclear
                    ? "Say what was unclear. It rides the answer into the ledger."
                    : "A note on this one (optional). It rides the answer into the ledger."
                }
                className="h-8 min-w-0 flex-1 basis-[18rem] rounded-lg border border-border bg-card px-2.5 text-[12px] transition-colors duration-150 outline-none placeholder:text-muted-foreground/70 focus:border-foreground/40"
              />
              {/* "?" is recorded, not skipped: the ledger then says which
                  question failed and why, and the board owes a clearer one. */}
              <button
                type="button"
                data-dir-press
                aria-pressed={unclear}
                onClick={(e) => {
                  pick(UNCLEAR);
                  const row = e.currentTarget.parentElement;
                  row?.querySelector("input")?.focus();
                }}
                className={cn(
                  "rounded-lg border border-dashed px-2.5 py-1.5 text-[11px] font-medium transition-colors duration-150",
                  unclear
                    ? "border-foreground/40 bg-card text-foreground"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {unclear
                  ? "Marked: not clear to me"
                  : "This question is not clear to me"}
              </button>
              <span className="text-[10px] text-muted-foreground">
                1 to {step.options.length} picks, Enter goes on.
              </span>
            </div>
          </>
        )}
      </article>

      {/* The progress is the card's own bottom edge rather than a bar of its
          own: a review that is 3 of 47 should say so without costing a row. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 block h-px bg-foreground/50 transition-[width] duration-200 ease-out motion-reduce:transition-none"
        style={{ width: `${Math.round(((at + 1) / steps.length) * 100)}%` }}
      />
    </div>
  );
}

const hrefOf = (h: { to: number } | { href: string } | null) =>
  h && "href" in h ? h.href : null;

/**
 * Back and Next, which are a button inside a board and a link out of it. The
 * two look identical on purpose: whether the next ask happens to be on this
 * board is the reader's least interesting fact about it.
 */
function Step({
  dir,
  href,
  onGo,
  filled,
}: {
  dir: "back" | "next";
  href: string | null;
  onGo?: () => void;
  filled?: boolean;
}) {
  const label = dir === "back" ? "Back" : "Next";
  const body = (
    <>
      {dir === "back" && <ArrowLeft className="size-3" aria-hidden />}
      {label}
      {dir === "next" && <ArrowRight className="size-3" aria-hidden />}
    </>
  );
  const shape = cn(
    "inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors duration-150",
    filled
      ? "border border-foreground/40 bg-card text-foreground"
      : "border border-border text-muted-foreground hover:text-foreground",
  );
  if (href)
    return (
      <Link href={href} data-dir-press className={shape}>
        {body}
      </Link>
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
