import { z } from "zod";

/**
 * THE CARDS' TWO JSONB ANSWERS, PARSED (the 1,000-row round, Will 2026-09-23: "Let's ensure we will
 * not face any of those issues here").
 *
 * The event cards used to read one media row per item of every event and count or pick in
 * TypeScript, so past PostgREST's 1,000 rows a big album stopped at 1,000 items and the other
 * cards lost their counts and their covers. Two SQL functions answer the same questions as ONE
 * jsonb each, whatever the albums hold (`20260924020000_row_cap_host.sql`):
 *
 *   event_card_stats(uuid[])  { "<event id>": { "approved": n, "pending": n } }, every input id
 *   event_covers(uuid[])      { "<event id>": { "preview_key": key or null, "original_key": key } },
 *                             the newest approved photo; an event with none is absent
 *   event_stills(uuid[], n)   { "<event id>": [preview key, ...] }, up to n newest previewed
 *                             approved photos (the cards' crossfade); an event with none is absent
 *
 * Both take the id list in the POST body, so no URL grows with the host's events. This module is
 * the pure half: it turns the jsonb into maps and REFUSES a shape it does not recognise (a changed
 * function must fail loudly, never read as "no items" or "no cover"). Pure and server-free, so it
 * is unit-tested and shared by the dashboard (`queries/events.ts`) and the profile and Guest cards
 * (`queries/social.ts`).
 */

/** Per-event counts for a card: `approved` is the album ("N items"), `pending` the review chip. */
export type EventCardStats = { approved: number; pending: number };

const count = z.number().int().nonnegative();
const cardStatsSchema = z.record(
  z.string(),
  z.object({ approved: count, pending: count }),
);

/** `event_card_stats`' answer as a map; throws on any other shape. */
export function parseEventCardStats(
  json: unknown,
): Map<string, EventCardStats> {
  const parsed = cardStatsSchema.safeParse(json ?? {});
  if (!parsed.success) {
    throw new Error(
      `event_card_stats answered a shape the cards cannot read: ${parsed.error.issues[0]?.message ?? "unknown"}`,
    );
  }
  return new Map(
    Object.entries(parsed.data).map(([id, s]) => [
      id,
      { approved: s.approved, pending: s.pending },
    ]),
  );
}

/** The two keys of an event's cover photo. Keys never leave the server: the caller presigns. */
export type EventCoverKeys = { previewKey: string | null; originalKey: string };

const coversSchema = z.record(
  z.string(),
  z.object({
    preview_key: z.string().nullable(),
    original_key: z.string().min(1),
  }),
);

/** `event_covers`' answer as a map; an event with no approved photo is absent. Throws on any other shape. */
export function parseEventCovers(json: unknown): Map<string, EventCoverKeys> {
  const parsed = coversSchema.safeParse(json ?? {});
  if (!parsed.success) {
    throw new Error(
      `event_covers answered a shape the cards cannot read: ${parsed.error.issues[0]?.message ?? "unknown"}`,
    );
  }
  return new Map(
    Object.entries(parsed.data).map(([id, c]) => [
      id,
      { previewKey: c.preview_key, originalKey: c.original_key },
    ]),
  );
}

const stillsSchema = z.record(z.string(), z.array(z.string().min(1)));

/**
 * `event_stills`' answer as a map of preview keys, newest first; an event with no previewed
 * photo is absent. Throws on any other shape.
 */
export function parseEventStills(json: unknown): Map<string, string[]> {
  const parsed = stillsSchema.safeParse(json ?? {});
  if (!parsed.success) {
    throw new Error(
      `event_stills answered a shape the cards cannot read: ${parsed.error.issues[0]?.message ?? "unknown"}`,
    );
  }
  return new Map(Object.entries(parsed.data));
}

/**
 * THE STILLS A CARD DISSOLVES THROUGH, AS KEYS: its cover first, then its newest previewed photos,
 * none twice, at most `max`. The cover leads because the card PAINTS it (server-rendered, before
 * any script), so the first dissolve is to a new photograph, never to the cover's own preview.
 * Pure: keys in, keys out; the caller presigns.
 */
export function cardStillKeys(
  cover: EventCoverKeys | undefined,
  stills: readonly string[] | undefined,
  max: number,
): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const add = (key: string) => {
    if (out.length >= max || seen.has(key)) return;
    seen.add(key);
    out.push(key);
  };
  if (cover) {
    add(coverKey(cover));
    // The cover's other key is the same photograph: never a second still.
    seen.add(cover.originalKey);
    if (cover.previewKey) seen.add(cover.previewKey);
  }
  for (const key of stills ?? []) add(key);
  return out;
}

/**
 * The key a card draws: the small WebP preview when there is one, else the original. A page of
 * cards pulling every full-resolution original to paint thumbnails cost a phone tens of MB, and a
 * pre-preview row (or one whose preview was skipped) still gets its cover from the original.
 */
export function coverKey(keys: EventCoverKeys): string {
  return keys.previewKey ?? keys.originalKey;
}
