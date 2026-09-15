import type { BoardSpec } from "@/components/lab/board-spec";

/**
 * THE BOARD REGISTRY (the Library x Lab round, 2026-09-15): every standing
 * board's spec, imported here and nowhere else, so the desk, the board page,
 * the record route and the review ledger read one list. Server-safe by
 * construction: a spec is pure data (`registry.test.ts` refuses a spec that
 * imports React, CSS or a board), so this module never drags a board's
 * components into a server page or a node test.
 *
 * Stub until the `lab-kit` track lands the first specs (light and rounding are
 * the pilots); a board without a spec renders through the legacy path in
 * `(shell)/lab/boards.ts` and the desk shows its touchpoints.ts note instead.
 */
export const BOARDS: readonly BoardSpec[] = [];

export function boardSpec(id: string): BoardSpec | undefined {
  return BOARDS.find((b) => b.id === id);
}
