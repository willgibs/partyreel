import type { BoardSpec } from "@/components/lab/board-spec";

import { HOME_HERO } from "./home-hero/spec";
import { LIGHT } from "./light/spec";
import { ROUNDING } from "./rounding/spec";

/**
 * THE BOARD REGISTRY (the Library x Lab round, 2026-09-15): every standing
 * board's spec, imported here and nowhere else, so the desk, the board page,
 * the record route and the review ledger read one list.
 *
 * ★ SERVER-SAFE BY CONSTRUCTION. A spec is pure data (registry.test.ts refuses
 * one that imports React, a stylesheet or its own board), so this module never
 * drags a board's components into a server page or a node test. The board route
 * reads the question for its header from here; the component comes from
 * `(shell)/lab/boards.ts`, which is the client half.
 *
 * A board without a spec renders through the legacy path in `boards.ts` and the
 * desk shows its touchpoints.ts note instead. The migration wave adds specs and
 * drops `legacy` flags board by board; this list only grows.
 */
export const BOARDS: readonly BoardSpec[] = [HOME_HERO, LIGHT, ROUNDING];

export function boardSpec(id: string): BoardSpec | undefined {
  return BOARDS.find((b) => b.id === id);
}
