"use client";

import { createContext, useContext } from "react";

import type { Transcribed } from "@/app/(dev)/design/(shell)/lab/_desk/review-message";
import type { SessionStep } from "@/app/(dev)/design/(shell)/lab/_desk/session-step";

/**
 * WHAT A BOARD PAGE TELLS ITS DOCK (the Library x Lab round, 2026-09-15): the
 * board's identity, its sections (for the dock's Sections menu) and its
 * neighbours (prev and next in registry order), provided by the board page
 * template so the dock never has to know the board. The kit's `BoardPage`
 * fills it from the spec; a legacy board gets the id and title only.
 *
 * It also carries the REVIEW when there is one (the clarity round,
 * 2026-09-15): the open queue and the `?session=` the route read. The queue is
 * SERVER data (every board's spec joined to its ledger on disk), so it arrives
 * as a prop rather than being fetched by the card, and the route builds it only
 * when the session names an ask on this board: a board nobody is reviewing
 * pays nothing and mounts no card.
 */
export type BoardSectionLink = { id: string; label: string };

export type BoardReview = {
  /** The whole open queue, in board order, so Next can cross to the next board. */
  steps: readonly SessionStep[];
  /** The `session` value the route read, `<board>.<ask>`. */
  param: string | null;
  /** What the ledger already holds, so "Copy so far" omits what was sent. */
  transcribed?: Transcribed;
  /** The commit this page was built from; it rides the paste as a `#` line. */
  build?: string | null;
};

export type BoardPageContextValue = {
  id: string;
  title: string;
  /** Anchors are `${boardId}-${sectionId}`; the dock links `#${id}`. */
  sections: readonly BoardSectionLink[];
  prev?: { href: string; label: string };
  next?: { href: string; label: string };
  review?: BoardReview;
};

const Ctx = createContext<BoardPageContextValue | null>(null);

export const BoardPageProvider = Ctx.Provider;

/** Null outside a board page (a kit specimen on the library, a tool). */
export function useBoardPage(): BoardPageContextValue | null {
  return useContext(Ctx);
}
