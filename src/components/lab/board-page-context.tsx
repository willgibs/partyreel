"use client";

import { createContext, useContext } from "react";

/**
 * WHAT A BOARD PAGE TELLS ITS DOCK (the Library x Lab round, 2026-09-15): the
 * board's identity, its sections (for the dock's Sections menu) and its
 * neighbours (prev and next in registry order), provided by the board page
 * template so the dock never has to know the board. The kit's `BoardPage`
 * fills it from the spec; a legacy board gets the id and title only.
 */
export type BoardSectionLink = { id: string; label: string };

export type BoardPageContextValue = {
  id: string;
  title: string;
  /** Anchors are `${boardId}-${sectionId}`; the dock links `#${id}`. */
  sections: readonly BoardSectionLink[];
  prev?: { href: string; label: string };
  next?: { href: string; label: string };
};

const Ctx = createContext<BoardPageContextValue | null>(null);

export const BoardPageProvider = Ctx.Provider;

/** Null outside a board page (a kit specimen on the library, a tool). */
export function useBoardPage(): BoardPageContextValue | null {
  return useContext(Ctx);
}
