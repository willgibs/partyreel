import { marketingImage } from "@/lib/constants/marketing-media";
import { SETTINGS_GROUP_TITLES } from "@/lib/events/guest-experience-summary";
import {
  newEventFacts,
  type Readiness,
  readiness,
  readyHead,
} from "@/lib/events/readiness";
import { eventUrl, previewJoinUrl } from "@/lib/events/share-urls";

/**
 * ONE WEDDING, THE SITE'S OWN: Maya & Jay's (hosted by Maya), the one
 * fictional album the marketing site and the desk's boards already follow.
 *
 * ★ A SEPARATE FILE, NOT AN IMPORT, ON PURPOSE (every board's rule). A
 * board's folder is deleted the moment the board retires, so importing
 * `disposable-mode`'s fixtures would tie this board's life to a folder it does
 * not own. The camera's numbers below are that board's settled ones, retyped.
 *
 * ★ WHAT IS LEFT IS PRODUCTION'S OWN FUNCTION, never a list typed here: the
 * beat's rail reads `readiness(newEventFacts(...))`, the very call the wizard
 * makes after Create, so a word ready-wiring changes is a word every frame
 * here changes with it.
 *
 * ★ THE STILLS ARE THE MARKETING IMAGES EVERY BOARD REUSES (bible 9: no new
 * asset, nothing to track the rights of), standing in for a guest's photos and
 * for the camera's live picture until the slot's own photographs are made.
 */

export const EVENT = {
  name: "Maya & Jay's Wedding",
  short: "Maya & Jay",
  host: "Maya",
  seed: "cw-maya",
} as const;

const SITE = "https://partyreel.com";

/** What the style step's samples encode: production's stand-in, which opens no album. */
export const SAMPLE_LINK = previewJoinUrl(SITE);

/** The event's own link once Create has made it (a 32-hex token, as the DB writes one). */
export const REAL_LINK = eventUrl(SITE, "7f3a9c2e5b8d4f1a9e6c3b7d2a5f8e1c");

/** The disposable camera's settled defaults (disposable-mode r1): a roll each, developed next morning. */
export const ROLL = { shots: 24, develops: "9 am" } as const;

/** The night the mode step's pictures run through: arriving, the party, the morning after. */
export const HOURS = [
  { id: "arrive", at: "8 pm", label: "Arriving", photos: 0 },
  { id: "party", at: "10:40 pm", label: "The party", photos: 142 },
  { id: "morning", at: "9 am", label: "Next morning", photos: 214 },
] as const;

export type HourId = (typeof HOURS)[number]["id"];

export const hourOf = (id: HourId) => HOURS.find((h) => h.id === id)!;

/** Shots Priya has left at 10:40 pm, six into her roll. */
export const LEFT_AT_PARTY = ROLL.shots - 6;

/* ── the stills ──────────────────────────────────────────────────────────── */

export type Still = { id: string; src: string };

const still = (id: string): Still => ({ id, src: marketingImage(id).src });

/** What a guest's album holds, newest first, the way the rows lay it. */
export const ALBUM_STILLS: readonly Still[] = [
  "wedding-toast",
  "wedding-petals",
  "party-dj",
  "wedding-golden",
  "reception-table",
  "wedding-rings",
  "concert-confetti",
  "wedding-arch",
  "reception-hall",
  "party-balloons",
  "festival-lights",
  "wedding-toast",
].map(still);

/** The camera's live picture: the toast under the string lights. */
export const VIEWFINDER = still("wedding-toast");

/** The room before anyone has shot: the arch, at 8 pm. */
export const ARRIVING = still("wedding-arch");

/* ── what is left, read from production ──────────────────────────────────── */

/** What the new wedding holds the moment Create returns it: the schema's defaults. */
const CREATED = { visibility: "open", accepting_uploads: true } as const;

/** The beat's readiness as it lands: nobody has opened the code yet. */
export const NEW_EVENT: Readiness = readiness(newEventFacts(CREATED));

/** Once the code has been opened once (her own scan counts, as the hub's Views do). */
export const SCANNED: Readiness = readiness({
  ...newEventFacts(CREATED),
  opened: 1,
});

export const headOf = readyHead;

/**
 * SETTINGS' FIVE STEPS, IN ITS RAIL'S ORDER, each ticked off the same readiness
 * the beat reads: the four groups (their titles from production's one home),
 * then the code. The step each checklist item finishes is the rail's own
 * pairing (`settings-rows.tsx`'s `STEP_ITEM`).
 */
export type RailStep = { n: number; title: string; done: boolean };

export function railOf(r: Readiness): RailStep[] {
  const done = (id: string) => r.items.find((i) => i.id === id)?.done ?? false;
  return [
    { n: 1, title: SETTINGS_GROUP_TITLES.door, done: done("door") },
    { n: 2, title: SETTINGS_GROUP_TITLES.adds, done: done("adds") },
    { n: 3, title: SETTINGS_GROUP_TITLES.reel, done: done("photos") },
    { n: 4, title: SETTINGS_GROUP_TITLES.event, done: done("welcome") },
    { n: 5, title: "The code", done: done("code") },
  ];
}
