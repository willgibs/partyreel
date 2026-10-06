import { newEventFacts, readiness } from "@/lib/events/readiness";
import { eventUrl, previewJoinUrl } from "@/lib/events/share-urls";

/**
 * ONE WEDDING, THE SITE'S OWN: Maya & Jay's (hosted by Maya), the one
 * fictional album the marketing site and the desk's boards already follow.
 *
 * ★ A SEPARATE FILE, NOT AN IMPORT, ON PURPOSE (every board's rule). A
 * board's folder is deleted the moment the board retires, so importing
 * another board's fixtures would tie this board's life to a folder it does
 * not own. Everything a host reads in a frame is production's own words
 * (`album-style.ts`, `readiness.ts`, the beat's), never retyped here; what
 * this file holds is the wedding, the stand-in links and the waits.
 */

export const EVENT = {
  name: "Maya & Jay's Wedding",
  host: "Maya",
} as const;

export const SITE = "https://partyreel.com";

/** What every sample code encodes: production's stand-in, which opens no album. */
export const SAMPLE_LINK = previewJoinUrl(SITE);

/** The stand-in event Create event answers with: a 32-hex token, as the database writes one. */
export const REAL_LINK = eventUrl(SITE, "7f3a9c2e5b8d4f1a9e6c3b7d2a5f8e1c");

/**
 * What is left on the new wedding the moment Create returns it: production's
 * readiness over the schema's defaults (the door and the adds done; the code,
 * the reel and the welcome not), the very thing the close draws.
 */
export const LEFT = readiness(
  newEventFacts({ visibility: "open", accepting_uploads: true }),
);

/**
 * ★ THE WAITS, AS A HOST MEETS THEM. A Create answers in about a second on a
 * good line (`CREATE_MS`); Try it on the wait plays a slow line (`SLOW_MS`),
 * so the wait is long enough to be judged rather than glimpsed.
 */
export const CREATE_MS = 1100;
export const SLOW_MS = 2600;

/** What the failure says: production's toast, its title and the house's default message. */
export const FAILED_TITLE = "Couldn't create the event.";
