/**
 * QUICK-ADD: the "zero to reel" pick. Pure, deterministic, no DOM, no DB.
 *
 * What it replaces: `[...approved].sort(() => Math.random() - 0.5)`. That shipped a reel whose first
 * cut was literally random — a different set on every tap, no regard for what the host had liked, and
 * whole guests missing while one prolific uploader's camera roll filled the montage. A host who taps
 * "start with the crowd favorites" and gets a random dozen learns not to trust the button.
 *
 * The pick blends four honest signals:
 *   LIKES     — rank-normalized, so 40 likes on one photo doesn't drown everything else, and the term
 *               collapses to nothing when no one has liked anything yet (early in an event).
 *   RECENCY   — exponential decay from the newest upload, so a fresh batch is favored without the
 *               older half of the night being unreachable.
 *   COVERAGE  — round-robin over uploaders, so every guest who showed up appears before any guest
 *               appears twice. This is the one that makes the reel feel like the PARTY.
 *   MIX       — at least one video when the album has any, capped near a third so the montage stays
 *               a montage.
 *
 * DETERMINISM is a hard requirement: the reel's seed already guarantees the player and the exported
 * mp4 agree, and a quick-add that shuffled differently on each render would make "the same reel"
 * meaningless. Every tie here breaks through mulberry32 seeded off the reel's own seed — there is no
 * Math.random in this file, and there must never be. (Determinism is per (items-in-that-order, seed);
 * the caller's item order is itself stable, coming from one indexed query.)
 */

import { seeded } from "@/lib/reel/engine/seed";

/**
 * How many moments a quick-add reaches for, and the count a small-pool pick tops up to (see `count`
 * below). MIN no longer gates the builder's button — a smaller pool comes back whole, and since
 * ADR-0024 removed the per-tile reel chip the button must exist at ANY size — it only marks where
 * the builder's copy stops promising a guest-wide "mix".
 */
export const QUICK_ADD_MAX = 12;
export const QUICK_ADD_MIN = 4;

/** Signal weights. Likes and recency both land in [0,1], so these are directly comparable. */
const LIKE_WEIGHT = 1;
const RECENCY_WEIGHT = 0.6;
/** Small enough to only ever break a tie, never to outvote a real signal. */
const JITTER_WEIGHT = 0.08;

/** Recency half-life: a photo from 18h ago scores half of one from just now. */
const RECENCY_HALF_LIFE_HOURS = 18;
const HOUR_MS = 3_600_000;

/** Video ceiling as a share of the pick (~1/3), with a floor of 1 so a video always gets in. */
const VIDEO_SHARE = 1 / 3;

/** How many liked moments must actually MAKE the cut before we may call the pick likes-driven. */
const LIKES_SIGNAL_MIN = 3;

/** Independent seeded streams (salts) so the like tie-break and the score jitter never correlate. */
const SALT_LIKE_TIE = 11;
const SALT_SCORE_JITTER = 23;

/** Uploaders we can't name share ONE bucket, so anonymous uploads can't crowd out named guests.
 *  Cannot collide with a real key: an uploaderKey is either a uuid guest_id or the literal "host". */
const ANONYMOUS_BUCKET = "__anonymous__";

export type QuickAddCandidate = {
  id: string;
  type: "photo" | "video";
  /** media.created_at (ISO). Missing/unparseable is treated as the oldest, never as "now". */
  createdAt?: string | null;
  /** guest_id, "host", or null (the shared anonymous bucket). Drives per-uploader coverage. */
  uploaderKey?: string | null;
  /** Host-only like count; absent or 0 = unliked. */
  likeCount?: number;
};

export type QuickAddPick = {
  /** The chosen media ids, CHRONOLOGICAL (oldest first) so the first cut reads as the night's story. */
  ids: string[];
  signals: {
    /**
     * Whether likes genuinely shaped this pick (>= LIKES_SIGNAL_MIN liked moments made the cut).
     * The builder's copy switches on it: promising "crowd favorites" off one stray heart is the kind
     * of small lie that costs a host's trust in everything else the product says.
     */
    likes: boolean;
  };
};

type Entry = {
  item: QuickAddCandidate;
  /** Position in the caller's input array: the stable key every seeded stream indexes by. */
  index: number;
  score: number;
  time: number; // ms epoch, or NaN when unknown
  taken: boolean;
};

export function pickQuickAdd(
  items: readonly QuickAddCandidate[],
  opts: { seed: number; max?: number; min?: number },
): QuickAddPick {
  const max = opts.max ?? QUICK_ADD_MAX;
  const min = opts.min ?? QUICK_ADD_MIN;
  const seed = opts.seed;

  if (items.length === 0) return { ids: [], signals: { likes: false } };

  // Take up to `max`; a smaller pool comes whole. `min` is the floor a quick-add is worth offering at
  // (the builder gates its button on it) and the count the cap-relaxing pass below tops up to, so the
  // video cap can never quietly hand back a 2-item "reel" when the album has plenty.
  const count = Math.max(
    Math.min(min, items.length),
    Math.min(max, items.length),
  );

  const entries: Entry[] = items.map((item, index) => {
    const parsed = item.createdAt ? Date.parse(item.createdAt) : Number.NaN;
    return {
      item,
      index,
      score: 0,
      time: Number.isFinite(parsed) ? parsed : Number.NaN,
      taken: false,
    };
  });

  const likeScores = rankNormalizedLikes(entries, seed);
  const recencyScores = decayedRecency(entries);
  for (const entry of entries) {
    entry.score =
      LIKE_WEIGHT * likeScores[entry.index] +
      RECENCY_WEIGHT * recencyScores[entry.index] +
      JITTER_WEIGHT * seeded(seed, entry.index, SALT_SCORE_JITTER);
  }

  const byScore = [...entries].sort(
    (a, b) => b.score - a.score || a.index - b.index,
  );

  // Buckets in FIRST-APPEARANCE order, each sorted by score. Round-robin over them is the coverage
  // guarantee: uploader A's second-best moment never beats uploader B's best.
  const buckets = new Map<string, Entry[]>();
  for (const entry of byScore) {
    const key = entry.item.uploaderKey ?? ANONYMOUS_BUCKET;
    const bucket = buckets.get(key);
    if (bucket) bucket.push(entry);
    else buckets.set(key, [entry]);
  }
  // Strongest uploader first (their best moment leads), then first-appearance order. The jitter in
  // the score makes an exact tie here vanishingly unlikely, but the fallback keeps it total.
  const rings = [...buckets.values()].sort(
    (a, b) => b[0].score - a[0].score || a[0].index - b[0].index,
  );

  const videoCap = Math.max(1, Math.floor(count * VIDEO_SHARE));
  const picked: Entry[] = [];
  let videos = 0;

  const take = (entry: Entry) => {
    entry.taken = true;
    picked.push(entry);
    if (entry.item.type === "video") videos += 1;
  };

  // Pass 1: one moment per uploader per lap, honoring the video cap.
  let progressed = true;
  while (picked.length < count && progressed) {
    progressed = false;
    for (const ring of rings) {
      if (picked.length >= count) break;
      const next = ring.find(
        (e) => !e.taken && (e.item.type !== "video" || videos < videoCap),
      );
      if (!next) continue;
      take(next);
      progressed = true;
    }
  }

  // Pass 2: the cap is a preference, not a wall. A video-heavy album must still fill the count.
  if (picked.length < count) {
    for (const entry of byScore) {
      if (picked.length >= count) break;
      if (!entry.taken) take(entry);
    }
  }

  // At least ONE video when the album has any: swap the weakest picked photo for the best video. A
  // reel of only stills from an event full of clips reads as broken, not as a taste decision.
  if (videos === 0) {
    const video = byScore.find((e) => !e.taken && e.item.type === "video");
    if (video) {
      let weakest = -1;
      picked.forEach((e, i) => {
        if (e.item.type !== "photo") return;
        if (weakest < 0 || e.score < picked[weakest].score) weakest = i;
      });
      if (weakest >= 0) {
        picked[weakest].taken = false;
        picked[weakest] = video;
        video.taken = true;
        videos = 1;
      }
    }
  }

  const likedInCut = picked.filter((e) => (e.item.likeCount ?? 0) > 0).length;

  // Chronological output: the cut is a story of the night, not a leaderboard. Unknown timestamps sort
  // last (in selection order) rather than pretending to be the oldest moment of the evening.
  const ordered = [...picked].sort((a, b) => {
    const aKnown = Number.isFinite(a.time);
    const bKnown = Number.isFinite(b.time);
    if (aKnown && bKnown) return a.time - b.time || a.index - b.index;
    if (aKnown) return -1;
    if (bKnown) return 1;
    return picked.indexOf(a) - picked.indexOf(b);
  });

  return {
    ids: ordered.map((e) => e.item.id),
    signals: { likes: likedInCut >= LIKES_SIGNAL_MIN },
  };
}

/**
 * Likes as a RANK, not a magnitude, so one runaway-popular photo can't dominate the blend: the
 * most-liked moment scores 1 and the rest step down by rank. The step is `(n - rank) / n`, NOT
 * `1 - rank/(n-1)`, so the LAST liked moment still lands above 0 — being liked at all is itself the
 * signal, and the ordering only refines it. (With the naive form, the least-liked liked photo scored
 * exactly the same as a photo nobody touched, which is plainly wrong.) With nothing liked yet the
 * whole term is zero and the pick falls back cleanly to recency + coverage.
 */
function rankNormalizedLikes(entries: Entry[], seed: number): number[] {
  const scores = new Array<number>(entries.length).fill(0);
  const liked = entries.filter((e) => (e.item.likeCount ?? 0) > 0);
  if (liked.length === 0) return scores;
  const ranked = [...liked].sort(
    (a, b) =>
      (b.item.likeCount ?? 0) - (a.item.likeCount ?? 0) ||
      seeded(seed, a.index, SALT_LIKE_TIE) -
        seeded(seed, b.index, SALT_LIKE_TIE) ||
      a.index - b.index,
  );
  ranked.forEach((entry, rank) => {
    scores[entry.index] = (ranked.length - rank) / ranked.length;
  });
  return scores;
}

/**
 * Exponential decay measured from the NEWEST known upload (not wall-clock "now"), so a quick-add on
 * an album from last weekend behaves exactly like one taken during the party. No timestamps anywhere
 * (a pre-column-era album) collapses the term to a constant instead of guessing.
 */
function decayedRecency(entries: Entry[]): number[] {
  const known = entries.filter((e) => Number.isFinite(e.time));
  const scores = new Array<number>(entries.length).fill(1);
  if (known.length === 0) return scores;
  const newest = Math.max(...known.map((e) => e.time));
  for (const entry of entries) {
    if (!Number.isFinite(entry.time)) {
      scores[entry.index] = 0; // unknown = oldest, never "now"
      continue;
    }
    const ageHours = Math.max(0, (newest - entry.time) / HOUR_MS);
    scores[entry.index] = Math.pow(0.5, ageHours / RECENCY_HALF_LIFE_HOURS);
  }
  return scores;
}
