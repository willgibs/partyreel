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
 * not own. The camera's numbers below are that board's settled ones, retyped,
 * and its pictures are drawn in its round-three picks (the camera on a
 * timeline, the contact sheet while it develops).
 *
 * ★ WHAT IS LEFT IS PRODUCTION'S OWN FUNCTION, never a list typed here: the
 * beat reads `readiness(...)` over `newEventFacts(...)`, the very call the
 * wizard makes after Create, so a word ready-wiring changes is a word every
 * frame here changes with it. The one fact this round adds is the account's
 * storage (the ROADMAP's Host line: `/dashboard/new` reads none today), drawn
 * as the route would pass it.
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

/** The disposable camera's settled numbers (disposable-mode r1 to r3): a roll each, developed next morning. */
export const ROLL = { shots: 24, develops: "9 am" } as const;

/** The night the add step's pictures run through: arriving, the party, the morning after. */
export const HOURS = [
  { id: "arrive", at: "8 pm", label: "Arriving", photos: 0 },
  { id: "party", at: "10:40 pm", label: "The party", photos: 142 },
  { id: "morning", at: "9 am", label: "Next morning", photos: 214 },
] as const;

export type HourId = (typeof HOURS)[number]["id"];

export const hourOf = (id: HourId) => HOURS.find((h) => h.id === id)!;

export const HOUR_IDS: readonly HourId[] = HOURS.map((h) => h.id);

/** Guests at the party, and the shots Priya has spent by 10:40 pm. */
export const PARTY = { guests: 12, hers: 6 } as const;

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

/** The camera's live picture at 8 pm: the arch, before anyone has shot. */
export const ARRIVING = still("wedding-arch");

/** The roll's premiere at 9 am: the toast under the string lights. */
export const PREMIERE = still("wedding-toast");

/** Priya's own six shots, the only ones a contact sheet may show her before 9 am. */
export const HERS: readonly Still[] = [
  "wedding-golden",
  "wedding-petals",
  "party-dj",
  "wedding-rings",
  "reception-table",
  "wedding-toast",
].map(still);

/** The room's screen behind the slideshow's code (the look step's `places`). */
export const SLIDESHOW = still("party-dj");

/* ── what is left, read from production ──────────────────────────────────── */

/** What the new wedding holds the moment Create returns it: the schema's defaults. */
const CREATED = { visibility: "open", accepting_uploads: true } as const;

/** The beat's readiness as it lands: nobody has opened the code yet. */
export const NEW_EVENT: Readiness = readiness(newEventFacts(CREATED));

/**
 * The same beat for a host whose account is 92% full: the route passes the
 * account's storage (as the hub's checklist reads it), so room joins what is
 * left. Past 85% it is worth doing; at 100% a guest needs it.
 */
export const ROOM_LOW_PCT = 92;
export const ROOM_LOW: Readiness = readiness({
  ...newEventFacts(CREATED),
  storagePct: ROOM_LOW_PCT,
});

export const headOf = readyHead;

/**
 * SETTINGS' FIVE STEPS, IN ITS RAIL'S ORDER, each ticked off the same readiness
 * the beat reads: the four groups (their titles from production's one home),
 * then the code. Room is the plan's, never a step (`settingsReadiness`), so
 * the beat says it beside the rail rather than on it.
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

/** Room, when the account is running short: the readiness item itself, or null. */
export const roomOf = (r: Readiness) =>
  r.items.find((i) => i.id === "room") ?? null;
