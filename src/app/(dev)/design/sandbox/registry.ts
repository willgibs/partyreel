import type { BoardSpec } from "@/components/lab/board-spec";

import { SITE_CHROME } from "./site-chrome/spec";
import { PROFILE_PAGE } from "./profile-page/spec";
import { EXPORT_FLOW } from "./export-flow/spec";
import { ADMIN_TRIAGE } from "./admin-triage/spec";
import { MEDIA_VIEWER } from "./media-viewer/spec";
import { EMAILS } from "./emails/spec";
import { REEL_STUDIO } from "./reel-studio/spec";
import { HELP_CENTER } from "./help-center/spec";
import { HOST_CURATION } from "./host-curation/spec";
import { GUEST_UPLOAD } from "./guest-upload/spec";
import { FIRST_EVENT } from "./first-event/spec";
import { APP_DOOR } from "./app-door/spec";
import { PRICING_PAGE } from "./pricing-page/spec";
import { APP_PRICING } from "./app-pricing/spec";
import { PRESS_PAGE } from "./press-page/spec";
import { CONTACT_PAGE } from "./contact-page/spec";
import { APP_VOCABULARY } from "./app-vocabulary/spec";
import { ADMIN } from "./admin/spec";
import { ALBUM_MOTION } from "./album-motion/spec";
import { DEMO_EVENT } from "./demo-event/spec";
import { APP_SHAPE } from "./app-shape/spec";
import { BODY_TYPE } from "./body-type/spec";
import { GLASS } from "./glass/spec";
import { GUEST_SHAPE } from "./guest-shape/spec";
import { LOOSE_ENDS } from "./loose-ends/spec";
import { PRIVACY_HERO } from "./privacy-hero/spec";
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
 * docs/tracks/orchestrator.md): a new board at the head of the list, moved
 * into its leverage place by the Orchestrator at the next record (below).
 */
/**
 * ★ THE DESK'S ORDER IS THIS ARRAY'S ORDER, AND IT IS ORDERED BY LEVERAGE (Will,
 * 2026-09-19, verbatim in docs/design/rulings.md): "our board groups should be
 * ordered by leverage, such that if a question/group compounds into a later
 * question/group, the more atomic question is handled first... for any
 * potential snowball effects, the earlier influence is addressed first." He
 * reviews what is presented, top to bottom, so a board whose answer changes
 * another board's question sits ABOVE it; boards that touch nothing else sit
 * at the foot in any order. The chain as it stands: the voice binds every line
 * on every board (bible 20 and 21); the body ladder sizes every reading slot;
 * Glass is the material the two shapes' chrome wears; the host app's shape and
 * the guest experience's shape decide the parts (app-vocabulary), the doors
 * (app-door, app-pricing), the first event, the upload, the viewer, curation,
 * the reel and the export; the admin's shape decides triage; the demo's promise
 * decides every demo door, the footer's included. A lane still adds a NEW board
 * at the head of this list (the registration exception keeps merges
 * line-disjoint); the Orchestrator moves it into its place at the next record.
 */
export const BOARDS: readonly BoardSpec[] = [
  VOICE,
  BODY_TYPE,
  GLASS,
  APP_SHAPE,
  GUEST_SHAPE,
  APP_VOCABULARY,
  ADMIN,
  APP_DOOR,
  DEMO_EVENT,
  PRICING_PAGE,
  APP_PRICING,
  FIRST_EVENT,
  GUEST_UPLOAD,
  MEDIA_VIEWER,
  HOST_CURATION,
  REEL_STUDIO,
  EXPORT_FLOW,
  ADMIN_TRIAGE,
  HELP_CENTER,
  EMAILS,
  SITE_CHROME,
  PROFILE_PAGE,
  PRIVACY_HERO,
  ALBUM_MOTION,
  LOOSE_ENDS,
  CONTACT_PAGE,
  PRESS_PAGE,
];

export function boardSpec(id: string): BoardSpec | undefined {
  return BOARDS.find((b) => b.id === id);
}
