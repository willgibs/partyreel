/**
 * THE GUEST'S "DOWNLOAD ALL", MEASURED WHOLE (the 1,000-row round, C11).
 *
 * The export's byte sizes are the 20 GB ceiling's only input, and the album is read whole now (C7),
 * so the size read has to reach every item. It was one `.in("id", ids)` over the whole album: every
 * id in a single URL, which fails outright past about 200 ids, and `sizeById.get(id) ?? 0` would
 * have under-counted the ceiling for any id it missed. These run the route on the fake PostgREST
 * (which fails a URL past 8,000 characters, as postgrest-js does) with albums past 2,000 items:
 * every size is read, in chunks whose URLs stay under the limit, and an unmeasured row is never
 * counted as zero bytes.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { summarizeMedia } from "@/lib/export/build-manifest";
import { IN_CHUNK } from "@/lib/db/read-all";
import {
  asSupabase,
  createFakePostgrest,
  type FakePostgrest,
  type FakeRow,
} from "@/lib/db/testing/fake-postgrest";

vi.mock("server-only", () => ({}));

const getEventByQrToken = vi.fn();
vi.mock("@/lib/db/queries/guest-events", () => ({
  getEventByQrToken: (...a: unknown[]) => getEventByQrToken(...a),
}));
const resolveViewerDecision = vi.fn();
const loadGalleryRowsForAccess = vi.fn();
vi.mock("@/lib/events/gallery-access.server", () => ({
  resolveViewerDecision: (...a: unknown[]) => resolveViewerDecision(...a),
  isEventOwner: vi.fn().mockResolvedValue(false),
  loadGalleryRowsForAccess: (...a: unknown[]) => loadGalleryRowsForAccess(...a),
}));
vi.mock("@/lib/events/unlock-cookie", () => ({
  isUnlocked: vi.fn().mockResolvedValue(true),
}));
const readGuestSessionCookie = vi.fn();
vi.mock("@/lib/guest/session-cookie", () => ({
  readGuestSessionCookie: (...a: unknown[]) => readGuestSessionCookie(...a),
}));
let demo = false;
vi.mock("@/lib/demo", () => ({ isDemoToken: () => demo }));
/** Who `getUser()` says is asking (null: signed out). */
let authUser: { id: string; email_confirmed_at: string | null } | null = null;
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: authUser } }) },
  }),
}));
// YOURS' OWN READ (`yours.server.ts`): what the server knows is hers, by account and by ticket.
const ownMediaIds = vi.fn();
vi.mock("@/lib/export/yours.server", () => ({
  ownMediaIds: (...a: unknown[]) => ownMediaIds(...a),
}));
// HER OWN SEALED SHOTS (20261002200000): the read's own cells are the leak matrix's (src/lib/disposable/); here,
// what the route does with what it answers. None, unless a test says.
const readOwnSealedMedia = vi.fn();
vi.mock("@/lib/db/queries/guest-events-admin", () => ({
  readOwnSealedMedia: (...a: unknown[]) => readOwnSealedMedia(...a),
}));
const mintExport = vi.fn();
vi.mock("@/lib/export/export-service", () => ({
  exportSummary: (rows: Parameters<typeof summarizeMedia>[0]) =>
    summarizeMedia(rows),
  mintExport: (...a: unknown[]) => mintExport(...a),
  mintResponse: () =>
    new Response(JSON.stringify({ ok: true }), { status: 200 }),
}));

// Her Save's links and the phone copies' read (take-home-wiring): the presigner and the capture stood in.
vi.mock("@/lib/r2/presign", () => ({
  presignDownload: async (p: { key: string }) => `https://r2.example/${p.key}`,
}));
vi.mock("@/lib/observability/sentry", () => ({
  captureWarning: () => {},
  captureError: () => {},
}));

/** The fake the admin client answers from; each test seeds its own. */
let fake: FakePostgrest;
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => asSupabase(fake),
}));

// ★ THE DOOR (the doors, 20260929120000): a private album, or a ticket a block holds, shuts it. Its own
// rule is decide.test.ts's and closed-door.server.test.ts's; here a held ticket stands in for a shut
// door, so the route's answer to it can be read against its answer to a private album, word for word.
const ticketBlocked = vi.fn();
const callerOptions = vi.fn();
vi.mock("@/lib/events/closed-door.server", async () =>
  (await import("@/lib/events/testing/door-double")).doorDouble({
    blocked: (event, tickets) => ticketBlocked(event, tickets),
    callerOptions: (options) => callerOptions(options),
  }),
);

const { POST } = await import("@/app/api/export/guest/route");

const QR = "d02631f1bfb3455188d224e41bf9510f";

function uid(n: number): string {
  return `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
}

/** `n` approved items: the gallery rows the loader hands the route, and the media table's sizes. */
function album(n: number) {
  const rows = Array.from({ length: n }, (_, i) => ({
    id: uid(i + 1),
    type: i % 10 === 0 ? ("video" as const) : ("photo" as const),
    original_key: `events/probe/photo/${i}/original.jpg`,
    preview_key: null,
    width: 320,
    height: 240,
    duration_seconds: null,
    created_at: "2026-09-23T23:13:38.122749+00:00",
  }));
  const media: FakeRow[] = rows.map((r, i) => ({
    id: r.id,
    file_size_bytes: 1000 + i,
  }));
  return { rows, media };
}

function post(body: unknown) {
  return POST(
    new Request("https://partyreel.com/api/export/guest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

/** The size reads alone (the phone copies' read rides beside them, take-home-wiring). */
const sizeReads = () =>
  fake.requests.filter((r) => r.url.includes("file_size_bytes"));

function galleryOf(rows: ReturnType<typeof album>["rows"]) {
  return {
    rows,
    identities: undefined,
    teaserTotal: null,
    approvedTotal: rows.length,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  demo = false;
  authUser = null;
  readGuestSessionCookie.mockResolvedValue(null);
  ownMediaIds.mockResolvedValue(new Set());
  readOwnSealedMedia.mockResolvedValue([]);
  getEventByQrToken.mockResolvedValue({
    ok: true,
    data: {
      id: "evt-1",
      visibility: "open",
      qr_token: QR,
      name: "Scale probe",
    },
  });
  resolveViewerDecision.mockResolvedValue({ access: "full", gate: null });
});

describe("the size read reaches every item (C11)", () => {
  it("the old shape fails outright: every id of a 2,300-item album in one URL", async () => {
    const { rows, media } = album(2300);
    fake = createFakePostgrest({ tables: { media } });
    const { data, error } = await fake
      .from("media")
      .select("id, file_size_bytes")
      .in(
        "id",
        rows.map((r) => r.id),
      );
    expect(data).toBeNull();
    expect(error?.message).toBe("TypeError: fetch failed");
  });

  it("measures all 2,300 items, in chunks whose URLs stay under the limit", async () => {
    const { rows, media } = album(2300);
    fake = createFakePostgrest({ tables: { media } });
    loadGalleryRowsForAccess.mockResolvedValue(galleryOf(rows));

    const res = await post({ step: "summary", qr_token: QR });
    const body = (await res.json()) as {
      ok: boolean;
      summary: ReturnType<typeof summarizeMedia>;
    };

    const bytes = media.reduce((sum, m) => sum + Number(m.file_size_bytes), 0);
    const { photo, video } = body.summary.shown;
    expect(photo.count + video.count).toBe(2300);
    expect(photo.bytes + video.bytes).toBe(bytes);
    expect(video.count).toBe(230);
    // Ceil(2,300 / 150) size requests, each at most IN_CHUNK ids and under the URL limit, none failed (reshaped
    // by take-home-wiring: the photographs' phone-size copies are read beside them, in id chunks of their own).
    expect(sizeReads()).toHaveLength(Math.ceil(2300 / IN_CHUNK));
    for (const request of fake.requests) {
      const ids = request.filters.find((f) => f.op === "in")?.value as string[];
      expect(ids.length).toBeLessThanOrEqual(IN_CHUNK);
      expect(request.urlLength).toBeLessThan(8000);
      expect(request.failed).toBe(false);
    }
  });

  it("mints over the whole album too, never a clipped one", async () => {
    const { rows, media } = album(2100);
    fake = createFakePostgrest({ tables: { media } });
    loadGalleryRowsForAccess.mockResolvedValue(galleryOf(rows));
    mintExport.mockResolvedValue({ ok: true, token: "t", workerUrl: "w" });

    await post({ step: "mint", qr_token: QR });

    const input = mintExport.mock.calls[0][0] as {
      rows: { file_size_bytes: number; status: string }[];
    };
    expect(input.rows).toHaveLength(2100);
    expect(input.rows.every((r) => r.status === "approved")).toBe(true);
    expect(input.rows.at(-1)?.file_size_bytes).toBe(1000 + 2099);
  });

  it("an item whose size cannot be read is left out, never counted as zero bytes", async () => {
    const { rows, media } = album(1200);
    // One row vanished between the album read and the size read (a purge racing the request).
    fake = createFakePostgrest({
      tables: { media: media.filter((m) => m.id !== uid(1111)) },
    });
    loadGalleryRowsForAccess.mockResolvedValue(galleryOf(rows));

    const res = await post({ step: "summary", qr_token: QR });
    const { summary } = (await res.json()) as {
      summary: ReturnType<typeof summarizeMedia>;
    };

    expect(summary.shown.photo.count + summary.shown.video.count).toBe(1199);
  });

  it("a failed chunk aborts the export rather than approving an unmeasured album", async () => {
    const { rows } = album(400);
    // No media table at all: every chunk answers an error.
    fake = createFakePostgrest({ tables: {} });
    loadGalleryRowsForAccess.mockResolvedValue(galleryOf(rows));

    await expect(post({ step: "summary", qr_token: QR })).rejects.toThrow(
      "export/guest: media sizes",
    );
  });

  it("the teaser measures its nine in one request", async () => {
    const { rows, media } = album(9);
    fake = createFakePostgrest({ tables: { media } });
    resolveViewerDecision.mockResolvedValue({
      access: "teaser",
      gate: "account",
    });
    loadGalleryRowsForAccess.mockResolvedValue(galleryOf(rows));

    const res = await post({ step: "summary", qr_token: QR });
    const { summary } = (await res.json()) as {
      summary: ReturnType<typeof summarizeMedia>;
    };

    expect(summary.shown.photo.count + summary.shown.video.count).toBe(9);
    expect(sizeReads()).toHaveLength(1);
  });

  it("a locked album is refused before anything is read", async () => {
    fake = createFakePostgrest({ tables: { media: [] } });
    resolveViewerDecision.mockResolvedValue({
      access: "none",
      gate: "password",
    });

    const res = await post({ step: "summary", qr_token: QR });

    expect(res.status).toBe(403);
    expect(loadGalleryRowsForAccess).not.toHaveBeenCalled();
    expect(fake.requests).toHaveLength(0);
  });
});

describe("the closed door: an album closed to this browser exports nothing", () => {
  it("answers a ticket a block holds exactly as it answers a private album, reading nothing", async () => {
    const body = { step: "summary", qr_token: QR };
    getEventByQrToken.mockResolvedValue({
      ok: true,
      data: { id: "evt-1", visibility: "private", qr_token: QR, name: "" },
    });
    const shut = await post(body);
    const shutBody = await shut.json();

    getEventByQrToken.mockResolvedValue({
      ok: true,
      data: {
        id: "evt-1",
        visibility: "open",
        qr_token: QR,
        name: "Scale probe",
      },
    });
    ticketBlocked.mockResolvedValue(true);
    const held = await post(body);
    ticketBlocked.mockReset();

    expect(held.status).toBe(shut.status);
    expect(await held.json()).toEqual(shutBody);
    expect(resolveViewerDecision).not.toHaveBeenCalled();
    expect(loadGalleryRowsForAccess).not.toHaveBeenCalled();
  });
});

/**
 * ★ YOURS IS HER OWN, AS THE SERVER KNOWS IT (`export-flow` r1, `means=mine`). The Yours row and its
 * zip come from `ownMediaIds` (her account's rows and this browser's ticket's, `yours.server.ts`),
 * intersected with what she can see; nothing in the request ever makes a photograph hers.
 */
describe("Yours: her own uploads, filtered on the server", () => {
  const TICKET = "a".repeat(64);

  it("the summary counts Yours inside the album, and only what she can see of it", async () => {
    const { rows, media } = album(30);
    fake = createFakePostgrest({ tables: { media } });
    loadGalleryRowsForAccess.mockResolvedValue(galleryOf(rows));
    readGuestSessionCookie.mockResolvedValue(TICKET);
    // Hers: three in the album, and one the album does not show her (held, or someone else's view).
    ownMediaIds.mockResolvedValue(new Set([uid(1), uid(2), uid(11), uid(999)]));

    const res = await post({ step: "summary", qr_token: QR });
    const body = (await res.json()) as {
      summary: ReturnType<typeof summarizeMedia>;
      yours: ReturnType<typeof summarizeMedia> | null;
    };

    expect(ownMediaIds).toHaveBeenCalledWith({
      eventId: "evt-1",
      userId: null,
      sessionToken: TICKET,
    });
    expect(
      body.summary.shown.photo.count + body.summary.shown.video.count,
    ).toBe(30);
    // Every tenth row from the first is a video (uid 1 and uid 11); uid(999) is not in the album.
    expect(body.yours?.shown.photo).toEqual({
      count: 1,
      bytes: 1001,
      phone: 1001,
    });
    expect(body.yours?.shown.video).toEqual({
      count: 2,
      bytes: 1000 + 1010,
      phone: 1000 + 1010,
    });
  });

  it("the summary says no Yours when she has nothing here", async () => {
    const { rows, media } = album(5);
    fake = createFakePostgrest({ tables: { media } });
    loadGalleryRowsForAccess.mockResolvedValue(galleryOf(rows));

    const res = await post({ step: "summary", qr_token: QR });
    expect((await res.json()).yours).toBeNull();
  });

  it("a Yours zip holds hers alone, named for them, and measures only them", async () => {
    const { rows, media } = album(400);
    fake = createFakePostgrest({ tables: { media } });
    loadGalleryRowsForAccess.mockResolvedValue(galleryOf(rows));
    authUser = { id: "user-1", email_confirmed_at: "2026-09-01T00:00:00Z" };
    ownMediaIds.mockResolvedValue(new Set([uid(3), uid(250)]));
    mintExport.mockResolvedValue({ ok: true, token: "t", workerUrl: "w" });

    await post({ step: "mint", qr_token: QR, set: "yours", part: 1 });

    expect(ownMediaIds).toHaveBeenCalledWith({
      eventId: "evt-1",
      userId: "user-1",
      sessionToken: null,
    });
    const input = mintExport.mock.calls[0][0] as {
      rows: { id: string }[];
      zipLabel?: string;
      walk?: unknown;
    };
    expect(input.rows.map((r) => r.id)).toEqual([uid(3), uid(250)]);
    expect(input.zipLabel).toBe("yours");
    expect(input.walk).toEqual({ part: 1, after: null });
    // Two sizes read, in one request: never the whole album's.
    expect(fake.requests).toHaveLength(1);
  });

  it("ids in the request never make a photograph hers: they only narrow her own", async () => {
    const { rows, media } = album(40);
    fake = createFakePostgrest({ tables: { media } });
    loadGalleryRowsForAccess.mockResolvedValue(galleryOf(rows));
    ownMediaIds.mockResolvedValue(new Set([uid(4)]));
    mintExport.mockResolvedValue({ ok: true, token: "t", workerUrl: "w" });

    await post({
      step: "mint",
      qr_token: QR,
      set: "yours",
      ids: [uid(4), uid(5), uid(6)],
      part: 1,
    });

    const input = mintExport.mock.calls[0][0] as { rows: { id: string }[] };
    expect(input.rows.map((r) => r.id)).toEqual([uid(4)]);
  });

  it("a body's own session token is ignored: the ticket is this browser's cookie", async () => {
    const { rows, media } = album(3);
    fake = createFakePostgrest({ tables: { media } });
    loadGalleryRowsForAccess.mockResolvedValue(galleryOf(rows));
    mintExport.mockResolvedValue({ ok: true, token: "t", workerUrl: "w" });

    await post({
      step: "mint",
      qr_token: QR,
      set: "yours",
      session_token: "b".repeat(64),
      part: 1,
    });

    expect(ownMediaIds).toHaveBeenCalledWith({
      eventId: "evt-1",
      userId: null,
      sessionToken: null,
    });
    // Nothing is hers, so nothing is in the zip (the mint says it is empty).
    const input = mintExport.mock.calls[0][0] as { rows: unknown[] };
    expect(input.rows).toEqual([]);
  });

  it("the demo has no Yours: nobody is anybody there", async () => {
    demo = true;
    const { rows, media } = album(3);
    fake = createFakePostgrest({ tables: { media } });
    loadGalleryRowsForAccess.mockResolvedValue(galleryOf(rows));

    const res = await post({ step: "summary", qr_token: QR });

    expect(ownMediaIds).not.toHaveBeenCalled();
    expect(readGuestSessionCookie).not.toHaveBeenCalled();
    expect((await res.json()).yours).toBeNull();
  });

  it("★ her own sealed shots are hers to take: Yours carries them, the album's own summary never", async () => {
    const { rows, media } = album(30);
    const sealed = {
      ...rows[0],
      id: uid(500),
      type: "photo" as const,
      original_key: "events/probe/photo/500/original.jpg",
    };
    fake = createFakePostgrest({
      tables: { media: [...media, { id: uid(500), file_size_bytes: 5000 }] },
    });
    loadGalleryRowsForAccess.mockResolvedValue(galleryOf(rows));
    readGuestSessionCookie.mockResolvedValue(TICKET);
    ownMediaIds.mockResolvedValue(new Set([uid(2), uid(500)]));
    readOwnSealedMedia.mockResolvedValue([sealed]);

    const res = await post({ step: "summary", qr_token: QR });
    const body = (await res.json()) as {
      summary: ReturnType<typeof summarizeMedia>;
      yours: ReturnType<typeof summarizeMedia> | null;
    };
    // Asked of exactly the ids the server found hers, never a request's.
    expect(readOwnSealedMedia).toHaveBeenCalledWith("evt-1", [
      uid(2),
      uid(500),
    ]);
    // The album's summary is the album: thirty, her sealed shot none of it.
    expect(
      body.summary.shown.photo.count + body.summary.shown.video.count,
    ).toBe(30);
    // Yours: her one photo in the album, and her sealed one.
    expect(body.yours?.shown.photo).toEqual({
      count: 2,
      bytes: 1001 + 5000,
      phone: 1001 + 5000,
    });

    mintExport.mockResolvedValue({ ok: true, token: "t", workerUrl: "w" });
    await post({ step: "mint", qr_token: QR, set: "yours", part: 1 });
    const input = mintExport.mock.calls[0][0] as { rows: { id: string }[] };
    expect(input.rows.map((r) => r.id).sort()).toEqual([uid(2), uid(500)]);
  });

  it("a sealed shot that developed between the two reads is the album's, never counted twice", async () => {
    const { rows, media } = album(3);
    fake = createFakePostgrest({ tables: { media } });
    loadGalleryRowsForAccess.mockResolvedValue(galleryOf(rows));
    readGuestSessionCookie.mockResolvedValue(TICKET);
    ownMediaIds.mockResolvedValue(new Set([uid(2)]));
    // The second read, on its own clock, still calls it sealed.
    readOwnSealedMedia.mockResolvedValue([rows[1]]);
    const body = await (await post({ step: "summary", qr_token: QR })).json();
    expect(body.yours.shown.photo.count + body.yours.shown.video.count).toBe(1);
    expect(
      body.summary.shown.photo.count + body.summary.shown.video.count,
    ).toBe(3);
  });

  it("an album zip never asks who she is", async () => {
    const { rows, media } = album(3);
    fake = createFakePostgrest({ tables: { media } });
    loadGalleryRowsForAccess.mockResolvedValue(galleryOf(rows));
    mintExport.mockResolvedValue({ ok: true, token: "t", workerUrl: "w" });

    await post({ step: "mint", qr_token: QR, part: 1 });

    expect(ownMediaIds).not.toHaveBeenCalled();
    expect(readOwnSealedMedia).not.toHaveBeenCalled();
    expect(
      (mintExport.mock.calls[0][0] as { rows: unknown[] }).rows,
    ).toHaveLength(3);
  });
});

describe("the album's own narrowing and walk", () => {
  it("a zip's missed ones, asked again, are only ever what she can see", async () => {
    const { rows, media } = album(20);
    fake = createFakePostgrest({ tables: { media } });
    loadGalleryRowsForAccess.mockResolvedValue(galleryOf(rows));
    mintExport.mockResolvedValue({ ok: true, token: "t", workerUrl: "w" });
    const foreign = "11111111-2222-4333-8444-555555555555";

    await post({ step: "mint", qr_token: QR, ids: [uid(7), foreign], part: 1 });

    const input = mintExport.mock.calls[0][0] as { rows: { id: string }[] };
    expect(input.rows.map((r) => r.id)).toEqual([uid(7)]);
  });

  it("carries a walk's part and position to the mint, and none without one", async () => {
    const { rows, media } = album(3);
    fake = createFakePostgrest({ tables: { media } });
    loadGalleryRowsForAccess.mockResolvedValue(galleryOf(rows));
    mintExport.mockResolvedValue({ ok: true, token: "t", workerUrl: "w" });
    const after = `1727130818122_${uid(2)}`;

    await post({ step: "mint", qr_token: QR, part: 2, after });
    await post({ step: "mint", qr_token: QR });

    expect(mintExport.mock.calls[0][0]).toMatchObject({
      walk: { part: 2, after },
    });
    expect(
      (mintExport.mock.calls[1][0] as { walk?: unknown }).walk,
    ).toBeUndefined();
  });

  it("refuses a position with no part, or one that is no position", async () => {
    for (const body of [
      { step: "mint", qr_token: QR, after: `1727130818122_${uid(2)}` },
      { step: "mint", qr_token: QR, part: 1, after: `1727130818122_${uid(2)}` },
      { step: "mint", qr_token: QR, part: 2, after: "'; drop table media; --" },
      { step: "mint", qr_token: QR, set: "everyone" },
      { step: "mint", qr_token: QR, ids: ["not-a-uuid"] },
    ]) {
      const res = await post(body);
      expect(res.status).toBe(400);
    }
    expect(loadGalleryRowsForAccess).not.toHaveBeenCalled();
    expect(mintExport).not.toHaveBeenCalled();
  });
});

/**
 * ★ THE BLOCK'S DOOR STAYS ON EVERY EXPORT PATH (`safety-wiring`'s closed door). Yours, a narrowed
 * retry and every part of a walk answer a ticket a block holds exactly as they answer a private
 * album, and read nothing: not the album, not her own, not a size.
 */
describe("the closed door on every path export-flow added", () => {
  const AFTER = `1727130818122_${uid(2)}`;
  const variants: [string, Record<string, unknown>][] = [
    ["the summary (Yours' counts)", { step: "summary" }],
    ["a Yours zip", { step: "mint", set: "yours", part: 1 }],
    ["a narrowed retry", { step: "mint", ids: [uid(1)], part: 1 }],
    ["a walk's second part", { step: "mint", part: 2, after: AFTER }],
    [
      "Yours' second part",
      { step: "mint", set: "yours", part: 2, after: AFTER },
    ],
  ];

  it.each(variants)(
    "%s: held exactly as a private album is",
    async (_, extra) => {
      const body = { qr_token: QR, ...extra };
      readGuestSessionCookie.mockResolvedValue("c".repeat(64));

      getEventByQrToken.mockResolvedValue({
        ok: true,
        data: { id: "evt-1", visibility: "private", qr_token: QR, name: "" },
      });
      const shut = await post(body);
      const shutBody = await shut.json();

      getEventByQrToken.mockResolvedValue({
        ok: true,
        data: {
          id: "evt-1",
          visibility: "open",
          qr_token: QR,
          name: "Scale probe",
        },
      });
      ticketBlocked.mockResolvedValue(true);
      const held = await post(body);
      ticketBlocked.mockReset();

      expect(held.status).toBe(shut.status);
      expect(held.status).toBe(403);
      expect(await held.json()).toEqual(shutBody);
      expect(resolveViewerDecision).not.toHaveBeenCalled();
      expect(loadGalleryRowsForAccess).not.toHaveBeenCalled();
      expect(ownMediaIds).not.toHaveBeenCalled();
      expect(mintExport).not.toHaveBeenCalled();
    },
  );
});
