"use client";

import "./first-follow-line.css";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { followWords, PrivateLine } from "./private-line";

/**
 * THE LINE AT A FIRST FOLLOW (`account-moments` r2, `follow=once`, Will 2026-10-07): her first follow ever says, under
 * the button that made it, that only she sees who she follows; every follow after is the button alone. The control that
 * follows (`relation-toggle.tsx`) decides when (the Server Function says `first`) and this draws it, so every seat she
 * follows from gets it with no edit of its own.
 *
 * ★ THE LINE OPENS ITS OWN ROW AS IT FADES IN, so the page below eases down rather than jumping (240 ms on the emphasis
 * curve; none under reduced motion): the board's `am-open`. It stands in the row of the button that made it, which wraps
 * while the line stands (`first-follow-line.css`), so a seat whose row was a single line (the guest list's chip, the
 * moment card's host, a claim's follow-up) needs no change of its own.
 *
 * ★ HER PAGE DRAWS IT UNDER THE HEAD, WHERE THE BOARD DREW IT. The head's actions are a narrow box at a desk (a line
 * inside it would widen it, and the name beside it would be squeezed), so the page wraps the head in a scope and puts the
 * slot under it (`u/[slug]/page.tsx`): the control reports into the scope instead of drawing, and the slot draws, flush
 * with the actions' end at a desk and with the row's start in a hand.
 *
 * ★ A SCREEN READER HEARS IT FROM THE CONTROL (a standing live region that holds the words once they are true), never
 * from here: this line is decoration for the eye (`aria-hidden`), so it is not read twice, and it is not a live region
 * that appears with its text (those are announced unreliably).
 */

type Scope = {
  /** Whom the slot names, from the page that knows (her first name); null says "They". */
  name: string | null;
  /** Whether the line stands now. */
  said: boolean;
  /** The control's report: a first follow just landed (true), or the line was taken away (false). */
  say: (said: boolean) => void;
};

const ScopeContext = createContext<Scope | null>(null);

/** The scope the control sits in, or null where it draws its own line beside itself. */
export function useFirstFollowScope(): Scope | null {
  return useContext(ScopeContext);
}

/** A page that draws the line itself (under its head) wraps the head and the slot in this. */
export function FirstFollowScope({
  name,
  children,
}: {
  name?: string | null;
  children: ReactNode;
}) {
  const [said, say] = useState(false);
  const value = useMemo(
    () => ({ name: name ?? null, said, say }),
    [name, said],
  );
  return (
    <ScopeContext.Provider value={value}>{children}</ScopeContext.Provider>
  );
}

/** The line itself: the private line in a row that opens as it arrives. Decoration for the eye; the control announces it. */
export function FirstFollowLine({
  words,
  className,
}: {
  words: string;
  className?: string;
}) {
  return (
    <div data-follow-line className={className}>
      <div>
        <PrivateLine className="pt-3" aria-hidden>
          {words}
        </PrivateLine>
      </div>
    </div>
  );
}

/** Where a page that wrapped its head in a scope draws the line: under the head, flush with the actions at a desk. */
export function FirstFollowSlot() {
  const scope = useFirstFollowScope();
  if (!scope?.said) return null;
  return (
    <FirstFollowLine words={followWords(scope.name)} className="ffl-slot" />
  );
}
