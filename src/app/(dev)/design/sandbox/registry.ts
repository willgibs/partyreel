import type { BoardSpec } from "@/components/lab/board-spec";

import { ADMIN } from "./admin/spec";
import { ALBUM_HERO } from "./album-hero/spec";
import { ALBUM_PAGE } from "./album-page/spec";
import { BODY_TYPE } from "./body-type/spec";
import { GALLERY_WIDTH } from "./gallery-width/spec";
import { GLASS } from "./glass/spec";
import { IMAGE_TRAIL } from "./image-trail/spec";
import { LOOSE_ENDS } from "./loose-ends/spec";
import { PRIVACY_HERO } from "./privacy-hero/spec";
import { RIVER_CARD } from "./river-card/spec";
import { RIVER_VISUAL } from "./river-visual/spec";
import { VOICE } from "./voice/spec";

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
 * ★ A BOARD LEAVES THIS LIST WHEN ITS RULING LANDS, and its directory goes with
 * it: the ruling lives on in its RULINGS row (touchpoints.ts), the words in
 * docs/design/rulings.md, and the board in git. A lane adds or removes ONLY its
 * own board's lines here (the registration and retirement exceptions,
 * docs/tracks/orchestrator.md): a new board at the head of the list.
 */
export const BOARDS: readonly BoardSpec[] = [
  IMAGE_TRAIL,
  ADMIN,
  LOOSE_ENDS,
  GLASS,
  BODY_TYPE,
  VOICE,
  PRIVACY_HERO,
  ALBUM_PAGE,
  RIVER_CARD,
  GALLERY_WIDTH,
  RIVER_VISUAL,
  ALBUM_HERO,
];

export function boardSpec(id: string): BoardSpec | undefined {
  return BOARDS.find((b) => b.id === id);
}
