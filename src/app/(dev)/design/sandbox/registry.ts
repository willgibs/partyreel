import type { BoardSpec } from "@/components/lab/board-spec";

import { ALBUM_HERO } from "./album-hero/spec";
import { GLOW_DOCTRINE } from "./glow-doctrine/spec";
import { GLOW_MOMENTS } from "./glow-moments/spec";
import { MEDIA_KIT } from "./media-kit/spec";
import { RIVER_VISUAL } from "./river-visual/spec";
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
 * drops `legacy` flags board by board; a board LEAVES this list only when its
 * ruling lands and its directory goes, which five did on 2026-09-17: the
 * palette (Graphite, now the token set), home-hero (whose favourite now ships
 * as the production hero), type-scale (B, rungs, now the nine `--text-*`
 * steps in theme.css and the Library's own Type section), light (both
 * shadows by role and the bright edge, now `--shadow-lift`, `--shadow-layer`
 * and `[data-lit]` in globals.css and the Library's Elevation and bright
 * edge sections) and floating-surfaces (Card's anatomy, the nested corner and
 * the entrances by frequency, now `ui/floating-layer.ts`, the menu's new parts
 * in `ui/dropdown-menu.tsx` and the Library's floating-layer section).
 */
export const BOARDS: readonly BoardSpec[] = [
  RIVER_VISUAL,
  GLOW_DOCTRINE,
  GLOW_MOMENTS,
  MEDIA_KIT,
  ROUNDING,
  ALBUM_HERO,
];

export function boardSpec(id: string): BoardSpec | undefined {
  return BOARDS.find((b) => b.id === id);
}
