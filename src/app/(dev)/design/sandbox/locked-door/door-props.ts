import type { Reader } from "./fixtures";
import type { StateId, WaitId } from "./words";

/** The album's hues, or the house five: a lit piece's three (and more) hues. */
export type Hues = readonly number[];

/** What a state stands in: the held sheet over the page, or a page of its own. */
export type Container = "sheet" | "page";

/**
 * Where the welcome stands: a Public album's first screen, or a gate's first
 * step (a password album, before the password: `guest-flow.md`'s access `none`,
 * where the page shows the name and the count and nothing else of the album).
 */
export type WelcomeAt = "public" | "gate";

/**
 * ONE DOOR SCREEN, as every direction takes it: which state (the four, plus the
 * beat the wait opens into and the 404), where it stands, who is reading, the
 * wait's shape, where the welcome is met, and the album's own sampled hues for
 * the states that may wear them (a Public album's welcome and the beat;
 * everything else is the house five, since nothing of a closed album may be
 * sampled).
 */
export type DoorProps = {
  state: StateId | "beat" | "lost";
  container: Container;
  reader: Reader;
  wait: WaitId;
  welcomeAt: WelcomeAt;
  album: Hues;
};

/**
 * Whether a screen may wear the album's own light and show its photographs:
 * only a Public album's welcome, and the beat (she is in).
 */
export const seesAlbum = (p: Pick<DoorProps, "state" | "welcomeAt">) =>
  p.state === "beat" || (p.state === "welcome" && p.welcomeAt === "public");
