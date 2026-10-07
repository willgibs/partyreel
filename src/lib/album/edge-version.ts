/**
 * AN OPEN ALBUM'S "HAS ANYTHING CHANGED?", ANSWERED AT THE CDN (X5, Will's yes 2026-10-07). A lit room of
 * phones asked the function itself on every poll; for an album everyone holding its link sees whole, the
 * answer is the same for all of them (its validator, the version a 304 is checked against), so the CDN keeps
 * it for a few seconds and a room's polls inside that window cost the function one call.
 *
 * ★ ONLY A VERSION, AND ONLY WHAT IS NOBODY'S. The cached answer is the album's validator alone: never a
 * photograph, a link, a count or a name. It is cached only when the album is open to anyone with the link
 * at full access (`albumIsOpenToAnyone`, the route's), and the route that answers it reads with no identity
 * at all (no cookie reaches it, `credentials: "omit"`; the event is read anonymously, `anon.ts`), so no
 * answer that depends on the viewer (her door, a block, a password, a host's preview) can ever be built
 * there, let alone shared. Everything else answers `ask`, never cached: ask the album itself.
 *
 * ★ THE CAPABILITY STAYS OUT OF THE URL. The CDN keys on the URL, so the URL names the album by a key
 * derived from its token (`k`, which a real sync hands the device, `ALBUM_EDGE_HEADER`) and the token
 * itself rides a request header the CDN never keys on: the function checks the two agree before it fills,
 * so no one can fill one album's key with another's answer.
 *
 * ★ EACH WINDOW IS ITS OWN URL (`w`). Vercel serves an entry past its `max-age` as stale while it
 * revalidates, so on one fixed URL a quiet album's every poll would read the answer the previous poll
 * filled. A window in the URL means an entry is only ever asked for inside its own few seconds: a room's
 * polls share it, and the first ask of the next window reads the album afresh. The device's clock picks the
 * window, the server fills only its own or a neighbour (`windowInReach`), and a device whose clock is
 * further off is told the server's time (`clock`) and asks the album itself that once.
 *
 * Pure and isomorphic: the route and the browser's transport read the same numbers.
 */

/** One cached answer's window. A few seconds: what a lit room's polls inside it cost the function is one fill. */
export const ALBUM_EDGE_WINDOW_MS = 5_000;

/**
 * How long a cached "nothing changed" may stand in for the album's own answer. A version cannot say what
 * is only the viewer's (a block on her, her ticket's heal), so a device asks the album itself at least this
 * often while it polls: the resting net's own step, so a block reaches a lit page within it.
 */
export const ALBUM_EDGE_TRUST_MS = 5 * 60_000;

/** The response header a real sync names the album's edge key in, only for an open album at full access. */
export const ALBUM_EDGE_HEADER = "x-album-edge";

/** The request header the version ask carries the album's capability in (never its URL). */
export const ALBUM_TOKEN_HEADER = "x-album-token";

/** The cheap ask's route. */
export const ALBUM_VERSION_PATH = "/api/album/guest/sync/version";

/** An edge key's shape: 22 base64url characters (132 bits of a digest). */
const EDGE_KEY_SHAPE = /^[A-Za-z0-9_-]{22}$/;

export type AlbumVersionAnswer =
  /** An open album at full access: its validator, the same string its sync's ETag carries. */
  | { kind: "version"; v: string }
  /** Anything else (gone, private, a door, a password, a gate): nothing said, ask the album itself. */
  | { kind: "ask" }
  /** The window asked for is off the server's clock: its time (ms), so the device asks the right one next. */
  | { kind: "clock"; now: number };

/**
 * A version answer as the browser received it: the answer, and whether the CDN answered it from its cache
 * (`fromCache`) rather than asking the function. A room of devices asking one album shares each window's
 * fill, so their asks come back from the cache; a device asking alone fills its own windows, each a call.
 */
export type AlbumVersionReply = {
  answer: AlbumVersionAnswer;
  fromCache: boolean;
};

/**
 * Whether a response came from the CDN's cache: Vercel's own word (`x-vercel-cache`: HIT, or STALE while it
 * revalidates), else a cache's `Age`. Anything else, the local server's answer above all, is the function's.
 */
export function servedFromCache(headers: {
  get(name: string): string | null;
}): boolean {
  const vercel = headers.get("x-vercel-cache");
  if (vercel) return /^(HIT|STALE)$/i.test(vercel.trim());
  const age = Number(headers.get("age"));
  return Number.isFinite(age) && age > 0;
}

/** The window a moment falls in. */
export function edgeWindowOf(now: number): number {
  return Math.floor(now / ALBUM_EDGE_WINDOW_MS);
}

/** A window the server fills at `now`: its own, or one either side (a device's clock a little off). */
export function windowInReach(window: number, now: number): boolean {
  return Math.abs(window - edgeWindowOf(now)) <= 1;
}

/** A header's value as an edge key, or null (a wire value is data: anything else is no key). */
export function edgeKeyOf(value: string | null | undefined): string | null {
  return typeof value === "string" && EDGE_KEY_SHAPE.test(value) ? value : null;
}

/** The cheap ask's URL: the album's key and the window, and nothing else (never the token). */
export function albumVersionUrl(key: string, window: number): string {
  return `${ALBUM_VERSION_PATH}?k=${encodeURIComponent(key)}&w=${window}`;
}

/** An answer off the wire, or null for anything that is not one. */
export function readVersionAnswer(raw: unknown): AlbumVersionAnswer | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Record<string, unknown>;
  if (value.kind === "version" && typeof value.v === "string" && value.v)
    return { kind: "version", v: value.v };
  if (value.kind === "ask") return { kind: "ask" };
  if (
    value.kind === "clock" &&
    typeof value.now === "number" &&
    Number.isFinite(value.now)
  )
    return { kind: "clock", now: value.now };
  return null;
}
