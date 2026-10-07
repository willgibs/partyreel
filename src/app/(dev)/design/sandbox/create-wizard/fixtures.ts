import type { HeadStill } from "@/components/guest/event-experience-head";
import { marketingImage } from "@/lib/constants/marketing-media";
import { newEventFacts, type ReadyFacts } from "@/lib/events/readiness";
import { eventUrl, previewJoinUrl } from "@/lib/events/share-urls";

/**
 * ONE WEDDING, THE SITE'S OWN: Maya & Jay's (hosted by Maya), the one
 * fictional album the marketing site and the desk's boards already follow.
 *
 * ★ A SEPARATE FILE, NOT AN IMPORT, ON PURPOSE (every board's rule). A
 * board's folder is deleted the moment the board retires, so importing
 * another board's fixtures (or the Library's) would tie this board's life to a
 * folder it does not own. Everything a host reads in a frame is production's
 * own words (`album-style.ts`, `readiness.ts`, the beat's, the hub's), never
 * retyped here; what this file holds is the wedding, the stand-in links, her
 * first photos and the waits.
 */

export const EVENT = {
  name: "Maya & Jay's Wedding",
  host: "Maya",
} as const;

export const SITE = "https://partyreel.com";

/** What every sample code encodes: production's stand-in, which opens no album. */
export const SAMPLE_LINK = previewJoinUrl(SITE);

/** The stand-in event Create event answers with: an id and a 32-hex token, as the database writes one. */
export const EVENT_ID = "create-wizard-r5";
export const TOKEN = "7f3a9c2e5b8d4f1a9e6c3b7d2a5f8e1c";
export const REAL_LINK = eventUrl(SITE, TOKEN);

/**
 * THE NEW WEDDING'S FACTS, the moment Create returns it: production's own
 * defaults (`newEventFacts`: the door open, uploads open, nothing in it,
 * never opened), the storage a new Free account holds.
 */
export const NEW_FACTS: ReadyFacts = newEventFacts(
  { visibility: "open", accepting_uploads: true },
  4,
);

/**
 * HER FIRST PHOTOS (`close=photos`): four stills of the marketing set, the
 * Library's own wedding, standing in for the few she picks from her phone.
 * Each is a cover still (`HeadStill`) and a tile.
 */
export const HER_PHOTOS: readonly HeadStill[] = [
  "wedding-toast",
  "reception-hall",
  "wedding-golden",
  "wedding-arch",
].map((id) => ({ id, tile: marketingImage(id).src }));

/** Her facts once her photos are in: four in the album, the reel playing from two. */
export const WITH_PHOTOS: ReadyFacts = {
  ...NEW_FACTS,
  approved: HER_PHOTOS.length,
  playable: HER_PHOTOS.length,
};

/**
 * The minute this page was loaded, read once: her photos land in it, so the cover's strip lights their marks as it
 * does while photographs land (the Library's `TONIGHT`, the same reading).
 */
export const NOW_MINUTE = Math.floor(Date.now() / 60_000);

/**
 * ★ THE WAITS, AS A HOST MEETS THEM. A Create answers in about a second on a
 * good line (`CREATE_MS`); her photos go up a little slower, one after
 * another (`PHOTO_MS` apart), the last held sharp a moment before the room
 * opens into her event (`LANDED_MS`).
 */
export const CREATE_MS = 1100;
export const PHOTO_MS = 520;
export const LANDED_MS = 500;
