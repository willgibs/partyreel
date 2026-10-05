/**
 * THE GUEST ALBUM'S ADMIN READS, PAST THE 1,000-ROW CAP.
 *
 * PostgREST cuts every read at 1,000 rows with no error, so each read here is proved on the fake
 * PostgREST (`src/lib/db/testing/fake-postgrest.ts`), which clamps exactly where the platform does,
 * with fixtures past 2,000 rows:
 *
 *  - `getApprovedMediaForUnlock`: the unlocked password album, read whole, every approved item in
 *    the open album's own order (`created_at desc, id desc`), paged on the composite cursor, a
 *    timestamp tie straddling a page boundary included;
 *  - `getUploaderIdentities`: the credits reach every item (the host's album, its review room, its
 *    reel pages and the guest album all read them), through `readAllPages` on `id`;
 *  - `countApprovedMedia` and `getGalleryStats`: the album's size is a head count, exact past the
 *    cap, never a list's length;
 *  - `getApprovedPhotoTeaser`: the nine newest photographs, in the album's order with the id as the
 *    tiebreak, so the teaser's ETag cannot roll for nothing.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  asSupabase,
  createFakePostgrest,
  type FakePostgrest,
  type FakeRow,
} from "@/lib/db/testing/fake-postgrest";
import { MAX_ROWS } from "@/lib/db/read-all";
import { issueDoorPass } from "@/lib/event/door/pass.server";

vi.mock("server-only", () => ({}));
const isUnlocked = vi.fn();
vi.mock("@/lib/events/unlock-cookie", () => ({
  isUnlocked: (...args: unknown[]) => isUnlocked(...args),
}));
// The host of the event, as the album's reads ask it (gallery-access-owner.server.test.ts's own).
const isRequestOwner = vi.fn();
vi.mock("@/lib/events/gallery-access-owner.server", () => ({
  isRequestOwner: (...args: unknown[]) => isRequestOwner(...args),
}));
vi.mock("@/lib/db/queries/social", () => ({
  getEventGuests: vi.fn().mockResolvedValue({
    verifiedUserIds: [],
    unverifiedRows: [],
  }),
}));
vi.mock("@/lib/supabase/avatar-storage", () => ({ getAvatarUrl: vi.fn() }));
const captureWarning = vi.fn();
vi.mock("@/lib/observability/sentry", () => ({
  captureWarning: (...args: unknown[]) => captureWarning(...args),
}));
// guest-events.ts (the cursor helpers' home) imports the server client; nothing here reads through
// it, and its env check would refuse the unit runner.
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/supabase/anon", () => ({ createAnonClient: vi.fn() }));

/** The fake the admin client answers from; each test seeds its own. */
let fake: FakePostgrest;
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => asSupabase(fake),
}));

const {
  countApprovedMedia,
  getApprovedMediaForUnlock,
  getApprovedPhotoTeaser,
  getGalleryStats,
  getLiveReelServerFacts,
  getUploaderIdentities,
  resetLiveReelServerFactsCache,
} = await import("@/lib/db/queries/guest-events-admin");

const EVENT = "e0000000-0000-4000-8000-000000000001";
const OTHER_EVENT = "e0000000-0000-4000-8000-000000000002";

/** A uuid-shaped id whose text order is its number's order, as Postgres orders a uuid. */
function uid(n: number): string {
  return `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
}

/** Postgres's own timestamp text, microseconds and all: the only format a fixture may use. */
function stamp(second: number, micro = 0): string {
  const at = new Date(Date.UTC(2026, 8, 23, 12, 0, 0) + second * 1000);
  return `${at.toISOString().slice(0, 19)}.${String(micro).padStart(6, "0")}+00:00`;
}

/**
 * `n` media rows of one event, one a second, every row carrying the columns the reads select.
 * `tieAt` gives the row after each listed one the listed row's timestamp, so only the id can
 * order the pair; `status` and `type` decide each row's state and kind.
 */
function album(
  n: number,
  opts: {
    eventId?: string;
    status?: (i: number) => string;
    type?: (i: number) => string;
    tieAt?: number[];
  } = {},
): FakeRow[] {
  const ties = new Set(opts.tieAt ?? []);
  return Array.from({ length: n }, (_, i) => ({
    id: uid(i + 1),
    event_id: opts.eventId ?? EVENT,
    status: opts.status?.(i) ?? "approved",
    type: opts.type?.(i) ?? "photo",
    original_key: `events/e/photo/${i}/original.jpg`,
    preview_key: i % 3 === 0 ? null : `events/e/photo/${i}/preview.webp`,
    width: 320,
    height: 240,
    duration_seconds: null,
    // Now and then a clip saved to the album (the live reel's `reel_eligible`).
    reel_eligible: i % 5 !== 4,
    created_at: ties.has(i - 1) ? stamp(i - 1, 250) : stamp(i, 250),
    guest_id: i % 2 === 0 ? `g${i}` : null,
    guests:
      i % 2 === 0
        ? {
            user_id: null,
            email: null,
            display_name: `Guest ${i}`,
            verified_at: null,
            profiles: null,
          }
        : null,
  }));
}

/** Newest first, the id breaking a tie: the order both album arms must return. */
function newestFirst(rows: FakeRow[]): FakeRow[] {
  return [...rows].sort((a, b) => {
    const at = String(b.created_at).localeCompare(String(a.created_at));
    return at !== 0 ? at : String(b.id).localeCompare(String(a.id));
  });
}

function seed(media: FakeRow[]) {
  fake = createFakePostgrest({
    tables: {
      media,
      events: [{ id: EVENT, host_id: "host-1" }],
      profiles: [{ id: "host-1", display_name: "Maya" }],
    },
  });
}

beforeEach(() => {
  isUnlocked.mockReset();
  isRequestOwner.mockReset().mockResolvedValue(false);
  seed([]);
});

describe("getApprovedMediaForUnlock: the unlocked password album, read whole", () => {
  it("returns every approved item of more than 2,000 in the open album's order, past the cap", async () => {
    isUnlocked.mockResolvedValue(true);
    // 2,600 rows: every tenth pending and every thirteenth removed, two ties, and another event's
    // rows in the same table that must never leak in.
    const media: FakeRow[] = [
      ...album(2600, {
        status: (i) =>
          i % 10 === 0 ? "pending" : i % 13 === 0 ? "removed" : "approved",
        tieAt: [1400, 2000],
      }),
      ...album(50, { eventId: OTHER_EVENT }).map((r, i) => ({
        ...r,
        id: `f0000000-0000-4000-8000-${String(i).padStart(12, "0")}`,
      })),
    ];
    seed(media);
    const approved = newestFirst(
      media.filter((r) => r.event_id === EVENT && r.status === "approved"),
    );
    expect(approved.length).toBeGreaterThan(2000);

    const rows = await getApprovedMediaForUnlock({ id: EVENT });

    expect(rows.map((r) => r.id)).toEqual(approved.map((r) => r.id));
    expect(new Set(rows.map((r) => r.id)).size).toBe(rows.length);
    // The raw timestamp rides every row (the next page's cursor, never a Date).
    expect(rows[0].created_at).toBe(approved[0].created_at);
    expect(rows.at(-1)?.created_at).toMatch(/\.\d{6}\+00:00$/);
    // The live reel's column rides the unlocked album too, so a password event's clips stay out.
    expect(rows.map((r) => r.reel_eligible)).toEqual(
      approved.map((r) => r.reel_eligible),
    );
    expect(rows.some((r) => r.reel_eligible === false)).toBe(true);
    // Every page asked for MAX_ROWS, none failed, and each page after the first carried the
    // composite cursor. ★ Reshaped by disposable-foundation (20261002200000): every page also carries the seal's
    // own logic tree (`unsealedFilter`, `lib/disposable/seal.ts`), an `or` of its own, which PostgREST ANDs with the
    // cursor's; so the first page holds one `or` (the seal) where it held none, and every later page two.
    const pages = fake.requests.filter((r) => r.name === "media");
    expect(pages.length).toBe(Math.ceil(approved.length / MAX_ROWS));
    expect(pages.every((p) => !p.failed && p.limit === MAX_ROWS)).toBe(true);
    const ors = (page: (typeof pages)[number]) =>
      page.filters.filter((f) => f.op === "or").map((f) => String(f.value));
    const SEAL = /^sealed_until\.is\.null,sealed_until\.lte\..+$/;
    expect(ors(pages[0])).toHaveLength(1);
    expect(ors(pages[0])[0]).toMatch(SEAL);
    for (const page of pages.slice(1)) {
      const trees = ors(page);
      expect(trees).toHaveLength(2);
      expect(trees.filter((t) => SEAL.test(t))).toHaveLength(1);
      expect(trees.find((t) => !SEAL.test(t))).toMatch(
        /^created_at\.lt\..+,and\(created_at\.eq\..+,id\.lt\..+\)$/,
      );
    }
  });

  it("pages across a timestamp tie that falls exactly on a page boundary, skipping nothing", async () => {
    isUnlocked.mockResolvedValue(true);
    // 2,100 approved rows, newest first: display positions 999 and 1,000 (0-based) share one
    // timestamp, so the first page ends INSIDE the tie and only the id can hand the rest on.
    const n = 2100;
    const media = album(n, { tieAt: [n - 1 - 1000] });
    seed(media);
    const expected = newestFirst(media);
    expect(expected[999].created_at).toBe(expected[1000].created_at);

    const rows = await getApprovedMediaForUnlock({ id: EVENT });

    expect(rows.map((r) => r.id)).toEqual(expected.map((r) => r.id));
  });

  it("reads nothing at all without this request's unlock cookie (the self-guard)", async () => {
    isUnlocked.mockResolvedValue(false);
    seed(album(20));
    expect(await getApprovedMediaForUnlock({ id: EVENT })).toEqual([]);
    expect(fake.requests).toHaveLength(0);
    expect(isRequestOwner).toHaveBeenCalledWith(EVENT);
  });

  it("★ reads the whole album for its HOST, who never holds the cookie (their own Download all)", async () => {
    isUnlocked.mockResolvedValue(false);
    isRequestOwner.mockResolvedValue(true);
    seed(album(20));
    expect(await getApprovedMediaForUnlock({ id: EVENT })).toHaveLength(20);
  });

  it("an unlocked guest never costs an owner check", async () => {
    isUnlocked.mockResolvedValue(true);
    seed(album(3));
    expect(await getApprovedMediaForUnlock({ id: EVENT })).toHaveLength(3);
    expect(isRequestOwner).not.toHaveBeenCalled();
  });

  it("★ the door's pass reads the album for someone the door let in, with no cookie (the doors)", async () => {
    isUnlocked.mockResolvedValue(false);
    isRequestOwner.mockResolvedValue(false);
    seed(album(4));
    const { issueDoorPass } = await import("@/lib/event/door/pass.server");
    const doorPass = issueDoorPass(EVENT);
    expect(
      await getApprovedMediaForUnlock({ id: EVENT, doorPass }),
    ).toHaveLength(4);
    expect(isUnlocked).not.toHaveBeenCalled();
  });

  it("★ a pass for another album, or one built by hand, reads nothing", async () => {
    isUnlocked.mockResolvedValue(false);
    isRequestOwner.mockResolvedValue(false);
    seed(album(4));
    const { issueDoorPass } = await import("@/lib/event/door/pass.server");
    const elsewhere = issueDoorPass(OTHER_EVENT);
    expect(
      await getApprovedMediaForUnlock({ id: EVENT, doorPass: elsewhere }),
    ).toEqual([]);
    expect(
      await getApprovedMediaForUnlock({
        id: EVENT,
        doorPass: { eventId: EVENT },
      }),
    ).toEqual([]);
    expect(fake.requests).toHaveLength(0);
  });
});

describe("getUploaderIdentities: every item's credit, however big the album", () => {
  it("credits all 2,500 items through keyset pages on id, the last item too", async () => {
    const media = album(2500, {
      status: (i) => (i % 7 === 0 ? "pending" : "approved"),
    });
    seed(media);

    const identities = await getUploaderIdentities(EVENT);

    // Every status: the host's album and review room read these credits too.
    expect(identities.size).toBe(2500);
    const last = media[media.length - 1];
    expect(identities.get(String(last.id))).toMatchObject({ isHost: true });
    expect(identities.get(uid(2499))).toMatchObject({
      displayName: "Guest 2498",
      isVerified: false,
    });
    const pages = fake.requests.filter((r) => r.name === "media");
    expect(pages).toHaveLength(3);
    // The cursor is the last id of the page before, never an offset.
    expect(
      pages.map((p) => p.filters.find((f) => f.op === "gt")?.value),
    ).toEqual([undefined, uid(1000), uid(2000)]);
    expect(pages.every((p) => !p.failed && p.offset === null)).toBe(true);
  });

  it("reads a small album in ONE media round trip", async () => {
    seed(album(12));
    const identities = await getUploaderIdentities(EVENT);
    expect(identities.size).toBe(12);
    expect(fake.requests.filter((r) => r.name === "media")).toHaveLength(1);
  });

  it("gives the host's own uploads the host's name", async () => {
    seed(album(3));
    const identities = await getUploaderIdentities(EVENT);
    expect(identities.get(uid(2))).toMatchObject({
      displayName: "Maya",
      isHost: true,
    });
  });
});

describe("countApprovedMedia: the album's size is counted, never listed", () => {
  it("is exact past the cap, in one head request that returns no rows", async () => {
    const media = album(2400, {
      status: (i) => (i % 4 === 0 ? "removed" : "approved"),
    });
    seed(media);

    const total = await countApprovedMedia({ id: EVENT, visibility: "open" });

    expect(total).toBe(media.filter((r) => r.status === "approved").length);
    expect(total).toBeGreaterThan(MAX_ROWS);
    expect(fake.requests).toHaveLength(1);
    expect(fake.requests[0]).toMatchObject({ method: "HEAD", returned: 0 });
  });

  it("counts a locked password album too (the entry tease), and never a private one", async () => {
    seed(album(5));
    expect(
      await countApprovedMedia({ id: EVENT, visibility: "password" }),
    ).toBe(5);
    expect(await countApprovedMedia({ id: EVENT, visibility: "private" })).toBe(
      0,
    );
    expect(fake.requests).toHaveLength(1);
  });

  it("throws on a failed count rather than calling the album empty", async () => {
    fake = createFakePostgrest({ tables: {} });
    await expect(
      countApprovedMedia({ id: EVENT, visibility: "open" }),
    ).rejects.toThrow("guest album: approved count");
  });

  it("getGalleryStats says the same number", async () => {
    seed(album(1500));
    expect(await getGalleryStats({ id: EVENT, visibility: "open" })).toEqual({
      approvedTotal: 1500,
      guestCount: 0,
      kinds: { photos: 1500, videos: 0 },
    });
  });
});

/**
 * ★ THE COVER NAMES ITS KINDS FROM THE FIRST BYTE (crumbs-74): the first paint's stats carry what the album holds by
 * kind, so "12 photos" is said before the live album has told, in the words the live source says it in. The cost is
 * pinned here with the answer: one more head count (the videos), never a row read.
 */
describe("getGalleryStats: the album's kinds ride the first paint", () => {
  const open = { id: EVENT, visibility: "open" } as const;
  const mixed = (i: number) => (i % 2 === 0 ? "video" : "photo");
  const mediaReads = () => fake.requests.filter((r) => r.name === "media");

  beforeEach(() => {
    captureWarning.mockReset();
  });

  it("★ names photos and videos, counted never listed, and they add up to the total the header shows", async () => {
    // 2,400 rows past the cap: every fourth removed, every seventh a clip.
    const media = album(2400, {
      status: (i) => (i % 4 === 0 ? "removed" : "approved"),
      type: (i) => (i % 7 === 0 ? "video" : "photo"),
    });
    seed(media);
    const approved = media.filter((r) => r.status === "approved");
    const videos = approved.filter((r) => r.type === "video").length;
    expect(approved.length).toBeGreaterThan(MAX_ROWS);
    expect(videos).toBeGreaterThan(0);

    const stats = await getGalleryStats(open);

    expect(stats.approvedTotal).toBe(approved.length);
    expect(stats.kinds).toEqual({ photos: approved.length - videos, videos });
    expect(stats.kinds!.photos + stats.kinds!.videos).toBe(stats.approvedTotal);
    // The cost: the total's head count and ONE more (the videos): two heads, no row read, no per-row scan.
    expect(mediaReads()).toHaveLength(2);
    expect(
      mediaReads().every(
        (r) => r.method === "HEAD" && r.returned === 0 && !r.failed,
      ),
    ).toBe(true);
    // The videos' head asks the very predicate the total does, and one more (each reads its own clock: the seal's
    // timestamp is the one thing that may differ by a millisecond).
    const asked = (r: (typeof fake.requests)[number]) =>
      r.filters.map((f) =>
        `${f.column}.${f.op}.${String(f.value)}`.replace(
          /\d{4}-\d\d-\d\dT[\d:.]+Z/,
          "<now>",
        ),
      );
    const [totalRead, videoRead] = mediaReads();
    expect(asked(videoRead)).toEqual(expect.arrayContaining(asked(totalRead)));
    expect(asked(videoRead)).toContain("type.eq.video");
  });

  it("names an album of photographs alone, and one of clips alone", async () => {
    seed(album(12));
    expect((await getGalleryStats(open)).kinds).toEqual({
      photos: 12,
      videos: 0,
    });
    seed(album(3, { type: () => "video" }));
    expect((await getGalleryStats(open)).kinds).toEqual({
      photos: 0,
      videos: 3,
    });
    seed([]);
    expect(await getGalleryStats(open)).toEqual({
      approvedTotal: 0,
      guestCount: 0,
      kinds: { photos: 0, videos: 0 },
    });
  });

  it("★ names exactly the items the total counts: a sealed shot (the develop) is in neither", async () => {
    const media = album(10, { type: (i) => (i < 4 ? "video" : "photo") });
    // Rows 0 (a clip) and 9 (a photograph) are sealed until the develop: nobody's to see yet.
    media[0].sealed_until = "2999-01-01T00:00:00.000Z";
    media[9].sealed_until = "2999-01-01T00:00:00.000Z";
    seed(media);

    expect(await getGalleryStats(open)).toMatchObject({
      approvedTotal: 8,
      kinds: { photos: 5, videos: 3 },
    });
  });

  it("★ a locked password page carries the count alone: no kinds, and no kinds read", async () => {
    seed(album(6, { type: mixed }));
    isUnlocked.mockResolvedValue(false);

    const stats = await getGalleryStats({ id: EVENT, visibility: "password" });

    expect(stats).toEqual({ approvedTotal: 6, guestCount: 0, kinds: null });
    expect(mediaReads()).toHaveLength(1);
  });

  it("a password album this request has unlocked names them", async () => {
    seed(album(6, { type: mixed }));
    isUnlocked.mockResolvedValue(true);

    expect(
      (await getGalleryStats({ id: EVENT, visibility: "password" })).kinds,
    ).toEqual({ photos: 3, videos: 3 });
  });

  it("a gated album names them to someone its door let through (the pass), and only to her", async () => {
    seed(album(6, { type: mixed }));
    // A gated album reads as private; the door's pass is what opens it.
    const gated = {
      id: EVENT,
      visibility: "private",
      door: "approve",
    } as const;

    const through = await getGalleryStats({
      ...gated,
      doorPass: issueDoorPass(EVENT),
    });
    expect(through.kinds).toEqual({ photos: 3, videos: 3 });

    // A pass is an object the door made: a literal that looks like one opens nothing.
    const forged = await getGalleryStats({
      ...gated,
      doorPass: { eventId: EVENT },
    });
    expect(forged).toMatchObject({ approvedTotal: 6, kinds: null });
    // A newcomer at the door hears how much is inside, never what it holds.
    expect(await getGalleryStats(gated)).toMatchObject({
      approvedTotal: 6,
      kinds: null,
    });
  });

  it("says nothing of a private album", async () => {
    seed(album(6));
    expect(await getGalleryStats({ id: EVENT, visibility: "private" })).toEqual(
      {
        approvedTotal: 0,
        guestCount: 0,
        kinds: null,
      },
    );
    expect(fake.requests).toHaveLength(0);
  });

  it("★ a failed kinds read is the cover's old words, reported, never the page's failure", async () => {
    // The videos' request is the total's plus one filter, so a URL limit at the total's own length lets the total
    // through and fails only the videos' read, the way a fetch that never completes would.
    const media = album(5, { type: mixed });
    seed(media);
    await getGalleryStats(open);
    const limit = mediaReads()[0].urlLength;
    fake = createFakePostgrest({
      tables: { media, events: [], profiles: [] },
      urlLengthLimit: limit,
    });

    const stats = await getGalleryStats(open);

    expect(stats).toEqual({ approvedTotal: 5, guestCount: 0, kinds: null });
    expect(captureWarning).toHaveBeenCalledWith(
      "media",
      "guest album: the kinds could not be counted",
      expect.objectContaining({ eventId: EVENT }),
    );
  });

  it("★ clips counted past the total are no answer: the two heads are not one snapshot", async () => {
    // Between the total's head and the videos' (the unlock check the videos' read waits on), five clips are approved.
    const media = album(2);
    seed(media);
    isUnlocked.mockImplementation(async () => {
      // A tick on: the total's head has been read by now, and the videos' is still to come.
      await new Promise((resolve) => setTimeout(resolve, 0));
      media.push(
        ...album(5, { type: () => "video" }).map((r, i) => ({
          ...r,
          id: uid(100 + i),
        })),
      );
      return true;
    });

    const stats = await getGalleryStats({ id: EVENT, visibility: "password" });

    expect(stats.approvedTotal).toBe(2);
    expect(stats.kinds).toBeNull();
  });
});

describe("getApprovedPhotoTeaser: the nine newest photographs, in the album's order", () => {
  it("breaks a timestamp tie by id and carries the true photo total", async () => {
    const media = album(40, {
      type: (i) => (i % 5 === 0 ? "video" : "photo"),
      tieAt: [37],
    });
    seed(media);
    const photos = newestFirst(media.filter((r) => r.type === "photo"));

    const teaser = await getApprovedPhotoTeaser(
      { id: EVENT, visibility: "open" },
      9,
    );

    expect(teaser.rows.map((r) => r.id)).toEqual(
      photos.slice(0, 9).map((r) => r.id),
    );
    expect(teaser.rows[0].created_at).toBe(photos[0].created_at);
    expect(teaser.total).toBe(photos.length);
  });

  it("★ keeps the lock's posture (`pastTheLock`, the kinds' too): a locked password album and a private one answer nothing; an unlocked one, or one the door passed, its photographs", async () => {
    seed(album(12));
    isUnlocked.mockResolvedValue(false);
    const none = { rows: [], total: 0 };
    expect(
      await getApprovedPhotoTeaser({ id: EVENT, visibility: "password" }, 9),
    ).toEqual(none);
    expect(
      await getApprovedPhotoTeaser({ id: EVENT, visibility: "private" }, 9),
    ).toEqual(none);
    expect(fake.requests).toHaveLength(0);

    isUnlocked.mockResolvedValue(true);
    expect(
      (await getApprovedPhotoTeaser({ id: EVENT, visibility: "password" }, 9))
        .total,
    ).toBe(12);
    isUnlocked.mockResolvedValue(false);
    expect(
      (
        await getApprovedPhotoTeaser(
          { id: EVENT, visibility: "private", doorPass: issueDoorPass(EVENT) },
          9,
        )
      ).total,
    ).toBe(12);
  });
});

describe("getLiveReelServerFacts: the lever and the plan behind the live reel", () => {
  beforeEach(() => {
    resetLiveReelServerFactsCache();
    captureWarning.mockReset();
  });

  function seedFacts(opts: {
    flag?: boolean | null;
    tier?: string | null;
    host?: string | null;
  }) {
    fake = createFakePostgrest({
      tables: {
        ops_flags:
          opts.flag === null
            ? []
            : [{ key: "live_reel_enabled", enabled: opts.flag ?? true }],
        events: [
          {
            id: EVENT,
            host_id: opts.host === undefined ? "host-1" : opts.host,
          },
        ],
        profiles:
          opts.tier === null
            ? []
            : [{ id: "host-1", tier: opts.tier ?? "pro" }],
      },
    });
  }

  it("reads the lever and the host's plan", async () => {
    seedFacts({ flag: false, tier: "pro" });
    expect(await getLiveReelServerFacts(EVENT)).toEqual({
      liveReelEnabled: false,
      tier: "pro",
    });
  });

  it("reads a genuinely absent lever as the seeded default, on", async () => {
    seedFacts({ flag: null, tier: "free" });
    expect(await getLiveReelServerFacts(EVENT)).toEqual({
      liveReelEnabled: true,
      tier: "free",
    });
  });

  it("maps a legacy tier onto the billing tier (max reads as pro)", async () => {
    seedFacts({ tier: "max" });
    expect((await getLiveReelServerFacts(EVENT)).tier).toBe("pro");
  });

  it("never guesses a plan it could not read: null, reported, and not remembered", async () => {
    seedFacts({ tier: null });
    expect(await getLiveReelServerFacts(EVENT)).toEqual({
      liveReelEnabled: true,
      tier: null,
    });
    expect(captureWarning).toHaveBeenCalledWith(
      "reel",
      "live reel: the host's plan could not be read",
      expect.objectContaining({ eventId: EVENT }),
    );
    // The next ask reads again rather than serving the gap for the whole TTL.
    seedFacts({ tier: "event_pass" });
    expect((await getLiveReelServerFacts(EVENT)).tier).toBe("event_pass");
  });

  it("serves a good answer from the cache for half a minute (the poll asks every call)", async () => {
    seedFacts({ flag: true, tier: "pro" });
    await getLiveReelServerFacts(EVENT);
    const reads = fake.requests.length;
    seedFacts({ flag: false, tier: "free" });
    expect(await getLiveReelServerFacts(EVENT)).toEqual({
      liveReelEnabled: true,
      tier: "pro",
    });
    expect(fake.requests.length).toBe(0);
    expect(reads).toBeGreaterThan(0);
  });
});
