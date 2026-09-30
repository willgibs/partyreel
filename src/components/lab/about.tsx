"use client";

import { X } from "lucide-react";

import { cn } from "@/lib/utils";

import type {
  AskStep,
  SessionStep,
} from "@/app/(dev)/design/(shell)/lab/_desk/session-step";

import type { Term } from "./board-spec";
import { Lines, TermList } from "./opening";
import { askTexts, openingTexts, termsIn } from "./terms";

/**
 * EVERYTHING ELSE A BOARD KNOWS, ONE PRESS AWAY, IN ONE PLACE (lab-focus,
 * 2026-09-29).
 *
 * ★ WHY IT IS A PANEL AND NOT THE PAGE. The context layer (Will, the same
 * morning: "never dropped in the middle of nowhere") grew block by block into
 * a wall above the pictures: the board's opening, a breadcrumb, a context
 * sentence, a two-line question and its description, the words here twice, a
 * column of what it decides, why it matters and what the board says. Both of
 * his notes hold, so nothing left: where it happens stays in the step's one
 * line, and the rest lives here, a press on About (or `i`) away, and stays
 * open for him once he opens it (`lab-prefs.ts`, a per-viewer convenience).
 *
 * ★ THE ORDER IS THE READING ORDER OF A QUESTION: what this question decides,
 * why it matters and what the board says about it; then the board it stands
 * on (what it is about, what is settled, what he picked and said before);
 * then the words the two use. A spec's fields are rendered here as written,
 * never reworded: the panel moves them, it does not reshape them.
 */
export function AboutPanel({
  step,
  id,
  onClose,
  className,
}: {
  step: SessionStep;
  /** The panel's id, which the About button names in `aria-controls`. */
  id: string;
  onClose: () => void;
  className?: string;
}) {
  const ask = step.kind === "ask" ? step : null;
  const terms = panelTerms(step);
  return (
    <aside
      id={id}
      data-lab-about=""
      aria-label="About this question and its board"
      className={cn("lab-about", className)}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
          About
        </p>
        <button
          type="button"
          data-dir-press
          onClick={onClose}
          aria-label="Close About"
          title="Close (i)"
          className="-mr-1 inline-flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 hover:text-foreground motion-reduce:transition-none"
        >
          <X className="size-3.5" aria-hidden />
        </button>
      </div>
      {ask && <ThisQuestion ask={ask} />}
      {ask?.opening && (
        <section data-lab-opening="" aria-label="About this board">
          <Group label="This board">
            <p className="text-xs leading-relaxed text-foreground">
              {ask.opening.about}
            </p>
            <Lines label="Already settled" lines={ask.opening.settled} />
            <Lines
              label="What you picked and said before"
              lines={ask.opening.earlier}
            />
          </Group>
        </section>
      )}
      <TermList terms={terms} />
    </aside>
  );
}

/** What the question decides, why it matters, what the board says and why. */
function ThisQuestion({ ask }: { ask: AskStep }) {
  const recommended = ask.options.find((o) => o.id === ask.recommended);
  if (
    !ask.lands &&
    !ask.matters &&
    !ask.context &&
    !ask.look &&
    !(recommended && ask.because)
  )
    return null;
  return (
    <Group label="This question">
      {ask.lands && <Line label="It decides">{ask.lands}</Line>}
      {ask.matters && (
        <Line label="Why it matters" data="matters">
          {ask.matters}
        </Line>
      )}
      {recommended && ask.because && (
        <Line label="The board says" data="reason">
          <span className="font-medium text-foreground">
            {recommended.label}
          </span>
          {`. ${ask.because}`}
        </Line>
      )}
      {ask.context && <Line label="What the previews draw">{ask.context}</Line>}
      {ask.look && <Line label="What to look at">{ask.look}</Line>}
    </Group>
  );
}

function Group({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[11px] font-medium text-foreground">{label}</p>
      {children}
    </div>
  );
}

function Line({
  label,
  data,
  children,
}: {
  label: string;
  /** `data-lab-<data>`, the hook a test or a tool reads the line by. */
  data?: "matters" | "reason";
  children: React.ReactNode;
}) {
  return (
    <p
      {...(data ? { [`data-lab-${data}`]: "" } : {})}
      className="text-xs leading-relaxed text-muted-foreground"
    >
      <span className="text-foreground">{label}: </span>
      {children}
    </p>
  );
}

/**
 * The board's words this step says or its opening does, in the board's order:
 * everything the question view and this panel print, so every coined word in
 * sight has its meaning here.
 */
export function panelTerms(step: SessionStep): Term[] {
  if (step.kind !== "ask") return [];
  return termsIn(
    [...askTexts(step), ...openingTexts(step.opening)],
    step.terms,
  );
}

/** Whether a step has anything for the panel to say. */
export function hasAbout(step: SessionStep): boolean {
  if (step.kind !== "ask") return false;
  return Boolean(
    step.opening ||
    step.lands ||
    step.matters ||
    step.context ||
    step.look ||
    step.because ||
    panelTerms(step).length,
  );
}
