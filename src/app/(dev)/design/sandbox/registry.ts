import type { BoardSpec } from "@/components/lab/board-spec";
import { DESK_ORDER } from "@/app/(dev)/design/touchpoints";

import { IDENTITY_DOOR } from "./identity-door/spec";
import { IDENTITY_CLAIMS } from "./identity-claims/spec";
import { IDENTITY_PROFILE } from "./identity-profile/spec";
import { GUEST_CAPTURE } from "./guest-capture/spec";
import { VOICE_GUEST } from "./voice-guest/spec";
import { SITE_CHROME } from "./site-chrome/spec";
import { PROFILE_PAGE } from "./profile-page/spec";
import { EXPORT_FLOW } from "./export-flow/spec";
import { ADMIN_TRIAGE } from "./admin-triage/spec";
import { REEL_STORY } from "./reel-story/spec";
import { MEDIA_VIEWER } from "./media-viewer/spec";
import { EMAILS } from "./emails/spec";
import { HELP_CENTER } from "./help-center/spec";
import { HOST_CURATION } from "./host-curation/spec";
import { HOST_STORAGE } from "./host-storage/spec";
import { EVENT_SAFETY } from "./event-safety/spec";

import { PRESS_PAGE } from "./press-page/spec";
import { CONTACT_PAGE } from "./contact-page/spec";
import { ALBUM_MOTION } from "./album-motion/spec";

import { LOOSE_ENDS } from "./loose-ends/spec";
import { PRIVACY_HERO } from "./privacy-hero/spec";

/**
 * THE BOARD REGISTRY: every standing board's spec, imported here and nowhere
 * else, so the desk, the board page, the record route and the review ledger
 * read one list.
 *
 * ★ SERVER-SAFE BY CONSTRUCTION. A spec is pure data (registry.test.ts refuses
 * one that imports React, a stylesheet or its own board), so this module never
 * drags a board's components into a server page or a node test. The board route
 * reads the question for its header from here; the component comes from
 * `(shell)/lab/boards.ts`, which is the client half.
 *
 * A board leaves this list when its picks are built, and its directory and its
 * touchpoints.ts row go with it: the answer lives in production (and in the
 * Library's catalog when it is a component), the board in git. A lane adds or
 * removes only its own board's lines here (the registration and retirement
 * exceptions): a new board directly after the neighbour its brief names, never
 * at the head of the list, because two boards on one spot mangle the merge; the
 * Orchestrator moves it to its leverage place.
 */
/**
 * ★ ORDERED BY LEVERAGE AT EXPORT. The one home of the desk's order is
 * `DESK_ORDER` in touchpoints.ts, the boards whose answers shape others first;
 * the literal below is the registration list, and `BOARDS` is that list
 * sorted by `DESK_ORDER` so the desk, the paging and every walk agree. A board
 * missing from `DESK_ORDER` sorts to the foot until the Orchestrator places it.
 */
const REGISTERED: readonly BoardSpec[] = [
  IDENTITY_DOOR,
  IDENTITY_CLAIMS,

  IDENTITY_PROFILE,
  GUEST_CAPTURE,
  VOICE_GUEST,

  MEDIA_VIEWER,
  HOST_CURATION,
  HOST_STORAGE,
  EVENT_SAFETY,
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
