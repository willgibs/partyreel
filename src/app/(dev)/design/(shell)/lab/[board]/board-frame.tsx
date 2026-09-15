"use client";

import {
  BoardPageProvider,
  type BoardPageContextValue,
} from "@/components/dev/board/board-page-context";

/** Provides the board's identity, sections and neighbours to its dock. */
export function BoardFrame({
  children,
  ...value
}: BoardPageContextValue & { children: React.ReactNode }) {
  return <BoardPageProvider value={value}>{children}</BoardPageProvider>;
}
