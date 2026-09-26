/**
 * THE HOST'S ALBUM READS: NEVER A GUEST'S WITHDRAWAL, AND ALWAYS WHOLE.
 *
 * Every pin here runs on the clamping PostgREST fake (`src/lib/db/testing/fake-postgrest.ts`),
 * which applies the filters a read actually sends and answers every read with at most 1,000 rows,
 * exactly as the platform does. So what is pinned is the ANSWER, whatever shape of query gets there.
 *
 * 1. A GUEST'S OWN DELETE IS GONE EVERYWHERE FOR THE HOST (delete-final, Will 2026-09-23: "if a
 *    guest deletes their own uploads, it should not be recoverable by the host ... I want it gone
 *    everywhere, not still visible to the host as well"). A withdrawal is a removed row marked
 *    `removed_by_uploader` (remove_my_upload's guest arm, remove_my_upload_by_session,
 *    disown_guest_rows_by_email). Each host read that lists media runs against ONE fixture holding
 *    two withdrawals beside a live album and a host's own removal. Withdrawn rows are built to be
 *    the easiest to leak: one is the NEWEST upload in the event (a read that forgot the rule would
 *    put it first), the other is the bin's SOONEST purge (a nudge that forgot it would fire on it).
 *
 * 2. EVERY LIST IS WHOLE AND EVERY COUNT COUNTED (the 1,000-row round, 2026-09-23). PostgREST ends a
 *    read at 1,000 rows with no error, so each read below is run against a fixture past 2,000 rows:
 *    a read that pages comes back whole, one that does not comes back with 1,000. Timestamps are
 *    shared by runs of rows, so a tie always straddles a page boundary, which only the id
 *    tiebreak in the cursor survives.
 *
 * Pinned elsewhere, not repeated here: restore_media's refusal (forensics/migration-guards.test.ts),
 * the reel's membership (reel.test.ts), the reel's timeline (reel/render-service.test.ts), the guest
 * count and the Guests room (the approved-only read in social.guest-identity.test.ts), the zip's
 * manifest (export/build-manifest.test.ts), the storage meter's Deleted figure
 * (billing/storage-summary.test.ts), and the dashboard's pulse and event cards (queries/pulse.test.ts
 * and queries/events.test.ts, where the counts and covers are SQL).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MAX_ROWS } from "@/lib/db/read-all";
import {
  asSupabase,
  createFakePostgrest,
  type FakePostgrest,
  type FakeRow,
} from "@/lib/db/testing/fake-postgrest";

let fake: FakePostgrest;

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/request-auth", () => ({
  getRequestAuth: async () => ({
    supabase: asSupabase(fake),
    user: { id: "host-1" },
  }),
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => asSupabase(fake),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => asSupabase(fake),
}));
vi.mock("@/lib/r2/presign", () => ({
  presignDownload: async ({ key }: { key: string }) => `signed:${key}`,
  headObject: async () => null,
  presignUpload: async () => ({}),
}));
vi.mock("@/lib/observability/sentry", () => ({
  captureWarning: () => {},
  captureError: () => {},
}));
vi.mock("@/lib/security/abuse-rate-limit-store", () => ({
  abuseHashes: () => ({ ipHash: "ip", scopeHash: "scope" }),
  checkAbuseRate: async () => ({ allowed: true }),
  recordAbuseEvent: async () => {},
}));

const { listEventMedia, listRecentlyDeletedMedia, readBinMediaByIds } =
  await import("@/lib/db/queries/media");
const { getNotificationData } = await import("@/lib/db/queries/notifications");

const NOW = Date.parse("2026-09-23T12:00:00.000Z");
const SECOND = 1000;
const MINUTE = 60_000;
const DAY = 86_400_000;
/** A timestamp as Postgres returns it: microseconds and an explicit offset, never a JS `Date`. */
const at = (offsetMs: number) =>
  new Date(NOW + offsetMs).toISOString().replace("Z", "000+00:00");
/** A 36-character id that sorts as its index does, the way Postgres orders a uuid. */
const uuid = (i: number) =>
  `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`;

const EVENT = {
  id: "ev-1",
  host_id: "host-1",
  name: "Garden party",
  deleted_at: null,
  purge_at: null,
};

/** A media row, every column a host read selects. */
function media(id: string, fields: FakeRow): FakeRow {
  const row: FakeRow = {
    id,
    event_id: "ev-1",
    guest_id: "g-1",
    type: "photo",
    original_key: `events/ev-1/photo/${id}/original.jpg`,
    preview_key: null,
    file_size_bytes: 1000,
    status: "approved",
    removed_at: null,
    purge_at: null,
    removed_by_uploader: false,
    width: null,
    height: null,
    duration_seconds: null,
    ...fields,
  };
  if (!("updated_at" in row)) row.updated_at = row.created_at;
  return row;
}

/** Postgres's text order for these fixtures: by code unit, never the locale's collation. */
const byCodeUnit = (a: unknown, b: unknown) =>
  String(a) < String(b) ? -1 : String(a) > String(b) ? 1 : 0;

/** The display order, computed apart from the code under test: `<column>` desc, then id desc. */
function newestFirstRows(rows: FakeRow[], column = "created_at"): FakeRow[] {
  return [...rows].sort(
    (a, b) => byCodeUnit(b[column], a[column]) || byCodeUnit(b.id, a.id),
  );
}
const newestFirst = (rows: FakeRow[], column = "created_at") =>
  newestFirstRows(rows, column).map((r) => String(r.id));

const LIVE = media("m-live", { created_at: at(-120 * MINUTE) });
const PENDING = media("m-pending", {
  status: "pending",
  created_at: at(-90 * MINUTE),
});
const HIDDEN = media("m-hidden", {
  status: "hidden",
  created_at: at(-180 * MINUTE),
});
const HOST_REMOVED = media("m-host-removed", {
  status: "removed",
  created_at: at(-5 * DAY),
  removed_at: at(-2 * DAY),
  purge_at: at(28 * DAY),
});
/** A pending upload its guest deleted ten minutes ago: the NEWEST upload in the event. */
const WITHDRAWN_NEW = media("m-withdrawn-new", {
  status: "removed",
  created_at: at(-20 * MINUTE),
  removed_at: at(-10 * MINUTE),
  purge_at: at(30 * DAY - 10 * MINUTE),
  removed_by_uploader: true,
});
/** A withdrawal from weeks ago: the SOONEST purge anywhere in the host's bin. */
const WITHDRAWN_OLD = media("m-withdrawn-old", {
  status: "removed",
  created_at: at(-26 * DAY),
  removed_at: at(-25 * DAY),
  purge_at: at(5 * DAY),
  removed_by_uploader: true,
});

const ids = (rows: readonly { id: string }[]) => rows.map((r) => r.id);

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
  fake = createFakePostgrest({
    user: { id: "host-1" },
    tables: {
      media: [
        LIVE,
        PENDING,
        HIDDEN,
        HOST_REMOVED,
        WITHDRAWN_NEW,
        WITHDRAWN_OLD,
      ],
      events: [EVENT],
      profiles: [
        {
          id: "host-1",
          tier: "pro",
          tier_expires_at: null,
          storage_grace_until: null,
          announcements_seen_at: null,
        },
      ],
      announcements: [],
    },
  });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("a guest's own withdrawal never reaches a host read", () => {
  it("★ the live album (the grid, the viewer, Review's queue, Download all) never returns it", async () => {
    const album = await listEventMedia("ev-1");
    expect(ids(album)).toEqual(["m-pending", "m-live", "m-hidden"]);
    // Each slice keeps the rule: the hub's grid and the Studio's items, and Review's queue.
    expect(ids(await listEventMedia("ev-1", "album"))).toEqual([
      "m-live",
      "m-hidden",
    ]);
    expect(ids(await listEventMedia("ev-1", "pending"))).toEqual(["m-pending"]);
    // The clip creator's hidden moments: the hidden slice alone.
    expect(ids(await listEventMedia("ev-1", "hidden"))).toEqual(["m-hidden"]);
  });

  // The hub's counts ("★ the hub's counts count neither the bin nor a withdrawal", countEventMedia)
  // moved with the hub onto the paged album (album-host-wiring): they are `album_changes_since`'s,
  // counted by status in the version's snapshot, so a removed row, the host's own or a guest's
  // withdrawal, is in none of approved, hidden and pending by construction (migration-guards.test.ts,
  // the paged album's section, pins the reader). The read retired with the host fingerprint route.

  it("★ the bin's links never mint a withdrawal, an aged removal or anything not in the bin", async () => {
    const rows = await readBinMediaByIds(
      asSupabase(fake),
      "ev-1",
      [
        "m-host-removed",
        "m-withdrawn-new",
        "m-withdrawn-old",
        "m-live",
        "m-hidden",
      ],
      NOW,
    );
    expect(ids(rows)).toEqual(["m-host-removed"]);
    // Past the recovery window the row is the sweep's, not the bin's.
    const later = await readBinMediaByIds(
      asSupabase(fake),
      "ev-1",
      ["m-host-removed"],
      NOW + 29 * DAY,
    );
    expect(later).toEqual([]);
  });

  it("★ Deleted lists the host's own removal and never a withdrawal", async () => {
    const bin = await listRecentlyDeletedMedia("ev-1");
    expect(ids(bin)).toEqual(["m-host-removed"]);
    expect(bin[0].countdownDays).toBe(28);
  });

  /*
   * The bell's "Items in Deleted are about to be cleared" nudge reads the SOONEST purge among the host's
   * removed media and skips a guest's withdrawal (`.eq("removed_by_uploader", false)` in
   * src/lib/db/queries/notifications.ts), so a withdrawal never points the host at a Deleted that does
   * not show it.
   */
  it("the bell's about-to-be-cleared nudge never counts it", async () => {
    const signals = await getNotificationData();
    expect(signals.recoverySoonestPurgeAt).toBe(HOST_REMOVED.purge_at);
  });
});

/* ───────────────────────────── the 1,000-row round ───────────────────────────── */

/**
 * The status of the `i`th row of a big album: of every twenty rows, 14 approved, 2 hidden,
 * 2 pending, 1 removed by the host and 1 withdrawn by its guest.
 */
function statusOf(i: number): FakeRow {
  const slot = i % 20;
  if (slot < 14) return { status: "approved" };
  if (slot < 16) return { status: "hidden" };
  if (slot < 18) return { status: "pending" };
  return {
    status: "removed",
    removed_at: at(-DAY - i * SECOND),
    purge_at: at(29 * DAY - i * SECOND),
    removed_by_uploader: slot === 19,
  };
}

/**
 * `n` rows of event `ev-big`, row 0 the newest, every `tie` consecutive rows sharing one
 * timestamp, so a run of equal timestamps straddles the page boundaries.
 */
function bigAlbum(
  n: number,
  status: (i: number) => FakeRow = statusOf,
  tie = 7,
): FakeRow[] {
  return Array.from({ length: n }, (_, i) =>
    media(uuid(i), {
      event_id: "ev-big",
      original_key: `events/ev-big/photo/${uuid(i)}/original.jpg`,
      created_at: at(-Math.floor(i / tie) * SECOND),
      ...status(i),
    }),
  );
}

function useBigAlbum(rows: FakeRow[]) {
  fake = createFakePostgrest({
    user: { id: "host-1" },
    tables: { media: rows, events: [{ ...EVENT, id: "ev-big" }] },
  });
}

describe("the host's album is read whole", () => {
  it("returns every one of 2,700 non-removed rows in display order, three full pages deep", async () => {
    const rows = bigAlbum(3000);
    useBigAlbum(rows);
    const live = rows.filter((r) => r.status !== "removed");
    expect(live).toHaveLength(2700);

    const album = await listEventMedia("ev-big");

    expect(ids(album)).toEqual(newestFirst(live));
    expect(new Set(ids(album)).size).toBe(2700);
    // Every page asked for MAX_ROWS; the short third one ends the read.
    expect(fake.requests.map((r) => r.limit)).toEqual([
      MAX_ROWS,
      MAX_ROWS,
      MAX_ROWS,
    ]);
    expect(fake.requests.every((r) => !r.failed)).toBe(true);
  });

  it("carries the cursor through a run of equal timestamps that straddles the page boundary", async () => {
    // Every row approved and seven to a timestamp: rows 994 to 1,000 share one, so the first page
    // ends inside the tie and only the id tiebreak hands the rest of it to the second page, once.
    const rows = bigAlbum(2100, () => ({ status: "approved" }));
    useBigAlbum(rows);
    const order = newestFirstRows(rows);
    const [lastOfPage, firstOfNext] = [order[MAX_ROWS - 1], order[MAX_ROWS]];
    expect(lastOfPage.created_at).toBe(firstOfNext.created_at);

    const album = await listEventMedia("ev-big", "album");

    expect(ids(album)).toEqual(newestFirst(rows));
    // The second page's cursor is the first page's last row: its raw string and its id, quoted.
    const cursor = fake.requests[1].filters.find((f) => f.op === "or");
    expect(cursor?.value).toBe(
      `created_at.lt."${lastOfPage.created_at}",and(created_at.eq."${lastOfPage.created_at}",id.lt."${lastOfPage.id}")`,
    );
  });

  it("reads each slice whole: the album, and Review's queue alone", async () => {
    const rows = bigAlbum(3000, statusOf, 3);
    useBigAlbum(rows);

    const album = await listEventMedia("ev-big", "album");
    expect(album).toHaveLength(2400);
    expect(ids(album)).toEqual(
      newestFirst(
        rows.filter((r) => r.status === "approved" || r.status === "hidden"),
      ),
    );

    // Review reads its queue and not the album: 300 pending rows come back in one page, and
    // nothing else was read to find them.
    fake.requests.length = 0;
    const pending = await listEventMedia("ev-big", "pending");
    expect(ids(pending)).toEqual(
      newestFirst(rows.filter((r) => r.status === "pending")),
    );
    expect(fake.requests).toHaveLength(1);
  });

  it("reads a 2,500-item queue whole, the case a held wedding reaches", async () => {
    useBigAlbum(bigAlbum(2500, () => ({ status: "pending" })));
    expect(await listEventMedia("ev-big", "pending")).toHaveLength(2500);
  });

  it("throws a labelled error when a page fails, never a shorter album", async () => {
    useBigAlbum(bigAlbum(10));
    delete fake.tables.media;
    await expect(listEventMedia("ev-big")).rejects.toThrow(
      /media: the live album/,
    );
  });
});

describe("the hidden slice is read whole", () => {
  it("reads 300 hidden items of a 3,000-item album in one page, and nothing else", async () => {
    // The clip creator used to read the whole album to find its hidden moments (the clip lane's
    // deferral): the slice reads exactly them, however big the album around them grows.
    const rows = bigAlbum(3000, statusOf, 3);
    useBigAlbum(rows);
    const hidden = await listEventMedia("ev-big", "hidden");
    expect(ids(hidden)).toEqual(
      newestFirst(rows.filter((r) => r.status === "hidden")),
    );
    expect(fake.requests).toHaveLength(1);
  });

  it("reads 2,500 hidden items whole, through the pages", async () => {
    useBigAlbum(bigAlbum(2500, () => ({ status: "hidden" })));
    expect(await listEventMedia("ev-big", "hidden")).toHaveLength(2500);
  });
});

describe("the Recently deleted bin is read whole", () => {
  it("lists every one of 2,150 host removals in the window, a bulk Delete's shared stamp included", async () => {
    // One bulk Delete stamped 1,150 rows with ONE removed_at (removeMediaBulk's single stamp), so
    // the bin's keyset walks a thousand-row tie by id. Withdrawals and rows past the window stay out.
    const bulkStamp = at(-3 * DAY);
    const rows = Array.from({ length: 2400 }, (_, i) => {
      const bulk = i < 1150;
      const withdrawn = i >= 2150 && i < 2300;
      const aged = i >= 2300;
      return media(uuid(i), {
        event_id: "ev-big",
        created_at: at(-50 * DAY),
        status: "removed",
        removed_at: bulk
          ? bulkStamp
          : aged
            ? at(-40 * DAY - i * SECOND)
            : at(-4 * DAY - i * SECOND),
        purge_at: at(26 * DAY),
        removed_by_uploader: withdrawn,
      });
    });
    useBigAlbum(rows);

    const bin = await listRecentlyDeletedMedia("ev-big");

    const expected = rows.filter(
      (r) => !r.removed_by_uploader && String(r.removed_at) >= at(-30 * DAY),
    );
    expect(expected).toHaveLength(2150);
    expect(ids(bin)).toEqual(newestFirst(expected, "removed_at"));
    expect(bin.every((m) => m.countdownDays === 26)).toBe(true);
    expect(fake.requests).toHaveLength(3);
    expect(fake.requests.every((r) => !r.failed)).toBe(true);
  });
});
