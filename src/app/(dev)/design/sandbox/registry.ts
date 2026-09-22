import type { BoardSpec } from "@/components/lab/board-spec";
import { DESK_ORDER } from "@/app/(dev)/design/touchpoints";

import { REEL_HOST } from "./reel-host/spec";
import { REEL_VIEW } from "./reel-view/spec";
import { IDENTITY_DOOR } from "./identity-door/spec";
import { IDENTITY_CLAIMS } from "./identity-claims/spec";
import { IDENTITY_PROFILE } from "./identity-profile/spec";
import { REEL_SCREEN } from "./reel-screen/spec";
import { GUEST_CAPTURE } from "./guest-capture/spec";
import { REEL_FRONT } from "./reel-front/spec";
import { SITE_CHROME } from "./site-chrome/spec";
import { PROFILE_PAGE } from "./profile-page/spec";
import { EXPORT_FLOW } from "./export-flow/spec";
import { ADMIN_TRIAGE } from "./admin-triage/spec";
import { REEL_STORY } from "./reel-story/spec";
import { MEDIA_VIEWER } from "./media-viewer/spec";
import { EMAILS } from "./emails/spec";
import { HELP_CENTER } from "./help-center/spec";
import { HOST_CURATION } from "./host-curation/spec";
import { REEL_CUT } from "./reel-cut/spec";

import { PRESS_PAGE } from "./press-page/spec";
import { CONTACT_PAGE } from "./contact-page/spec";
import { ALBUM_MOTION } from "./album-motion/spec";

import { LOOSE_ENDS } from "./loose-ends/spec";
import { PRIVACY_HERO } from "./privacy-hero/spec";

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
 * ★ A BOARD LEAVES THIS LIST WHEN ITS WINNER IS WIRED, and its directory goes
 * with it: the rule it became lives in the Library (its RULINGS row in
 * touchpoints.ts, the component's contract) and the board in git. A lane adds or
 * removes ONLY its own board's lines here (the registration and retirement
 * exceptions): a new board directly after the neighbour its manifest names, never
 * at the head of the list, moved into its leverage place by the Orchestrator.
 */
/**
 * ★ ORDERED BY LEVERAGE AT EXPORT. The one home of the desk's order is
 * `DESK_ORDER` in touchpoints.ts (Will, 2026-09-19: the earlier influence
 * first); the literal below is the REGISTRATION list, where a lane adds a new
 * board at the head so merges stay line-disjoint, and `BOARDS` is that list
 * sorted by `DESK_ORDER` so the desk, the paging and every walk agree. A board
 * missing from `DESK_ORDER` sorts to the foot until the Orchestrator places it.
 */
const REGISTERED: readonly BoardSpec[] = [
  REEL_HOST,
  REEL_VIEW,

  IDENTITY_DOOR,
  IDENTITY_CLAIMS,

  IDENTITY_PROFILE,
  REEL_SCREEN,
  GUEST_CAPTURE,
  REEL_FRONT,

  MEDIA_VIEWER,
  HOST_CURATION,
  // Registered beside its named neighbour rather than at the head: three reel
  // boards register in the same wave, and the head is one line for all of them.
  REEL_CUT,
  EXPORT_FLOW,
  ADMIN_TRIAGE,
  REEL_STORY,
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

const deskIndex = (id: string): number => {
  const i = (DESK_ORDER as readonly string[]).indexOf(id);
  return i < 0 ? DESK_ORDER.length : i;
};

export const BOARDS: readonly BoardSpec[] = [...REGISTERED].sort(
  (a, b) => deskIndex(a.id) - deskIndex(b.id),
);

export function boardSpec(id: string): BoardSpec | undefined {
  return BOARDS.find((b) => b.id === id);
}
