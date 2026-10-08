import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * THE GUEST'S POLL: one row when nothing changed, the teaser inline, the paged album at full access,
 * and today's route rules (no validator on a locked answer, none while a heal is pending, never
 * across access levels or gates). A read the reads' own gate refuses answers locked behind the
 * password and is reported, never a 500; a read that FAILS is still a failure.
 */
import { edgeWindowOf } from "@/lib/album/edge-version";
import { planAlbumSync } from "@/lib/events/album-sync";

vi.mock("server-only", () => ({}));

const resolveAlbumViewer = vi.fn();
vi.mock("@/lib/events/album-viewer.server", () => ({
  resolveAlbumViewer: (...a: unknown[]) => resolveAlbumViewer(...a),
}));
// The plan's two reads behind the gate (the snapshot, then a manifest's first page), planned by the
// REAL `planAlbumSync`, as `planGuestAlbumSync` plans them.
const readGuestAlbumVersions = vi.fn();
const planRead = vi.fn();
const planPage = vi.fn();
const planGuestAlbumSync = vi.fn();
const readGuestAttribution = vi.fn();
// The rows behind a delta's carried links, through the reads' own gate (album-calm): what it leaves out (held,
// sealed, removed, another album's) carries no link.
const readGuestAlbumMedia = vi.fn();
vi.mock("@/lib/db/queries/album-guest", () => ({
  ALBUM_REFUSED: { access: "none", gate: "password" },
  readGuestAlbumVersions: (...a: unknown[]) => readGuestAlbumVersions(...a),
  planGuestAlbumSync: (...a: unknown[]) => planGuestAlbumSync(...a),
  readGuestAttribution: (...a: unknown[]) => readGuestAttribution(...a),
  readGuestAlbumMedia: (...a: unknown[]) => readGuestAlbumMedia(...a),
}));
const captureError = vi.fn();
vi.mock("@/lib/observability/sentry", () => ({
  captureError: (...a: unknown[]) => captureError(...a),
  captureWarning: vi.fn(),
}));
const getApprovedPhotoTeaser = vi.fn();
const countApprovedMedia = vi.fn();
const getGuestCount = vi.fn();
vi.mock("@/lib/db/queries/guest-events-admin", () => ({
  getApprovedPhotoTeaser: (...a: unknown[]) => getApprovedPhotoTeaser(...a),
  countApprovedMedia: (...a: unknown[]) => countApprovedMedia(...a),
  getGuestCount: (...a: unknown[]) => getGuestCount(...a),
}));
const loadGalleryReel = vi.fn();
const reportAlbumRefused = vi.fn();
vi.mock("@/lib/events/gallery-access.server", () => ({
  loadGalleryReel: (...a: unknown[]) => loadGalleryReel(...a),
  reportAlbumRefused: (...a: unknown[]) => reportAlbumRefused(...a),
}));
// THE DEVELOP (20261002200000): the read's develop, its own rules develop.server.test.ts's; here, only that the
// route asks it with the event before it reads a version.
const developIfDue = vi.fn();
vi.mock("@/lib/disposable/develop.server", () => ({
  developIfDue: (...a: unknown[]) => developIfDue(...a),
}));
vi.mock("@/lib/r2/presign", () => ({
  presignDownload: async ({
    key,
    downloadFilename,
  }: {
    key: string;
    downloadFilename?: string;
  }) => `https://r2.test/${key}?sig${downloadFilename ? "&dl" : ""}`,
}));

// The CDN's ask reads the event with no identity (X5); only its cross-check below asks it.
const getEventByQrTokenForAnyone = vi.fn();
vi.mock("@/lib/db/queries/guest-events", () => ({
  getEventByQrTokenForAnyone: (...a: unknown[]) =>
    getEventByQrTokenForAnyone(...a),
}));

const { POST } = await import("@/app/api/album/guest/sync/route");
const { albumEdgeKey } = await import("@/app/api/album/guest/sync/edge.server");

const EVENT = {
  id: "e0000000-0000-4000-8000-000000000001",
  qr_token: "qr-1",
  name: "Maya & Jay",
  visibility: "open",
};
/** What waits, as the plan's snapshot answers it (nothing, unless a test says). */
let waiting: { count: number; minutes: [number, number][] } = {
  count: 0,
  minutes: [],
};
const M1 = "00000000-0000-4000-8000-000000000001";
const HEAL = { name: "pr_guest_e1", value: "a".repeat(64), maxAge: 60 };

function post(body: unknown, headers: Record<string, string> = {}) {
  return POST(
    new Request("https://partyreel.com/api/album/guest/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
    }),
  );
}

function read(over: Record<string, unknown> = {}) {
  return {
    version: 9,
    albumMax: 5,
    attrVersion: 2,
    watermark: 0,
    approved: 1,
    hidden: null,
    pending: null,
    changes: [],
    ...over,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  resolveAlbumViewer.mockResolvedValue({
    kind: "viewer",
    event: EVENT,
    decision: { access: "full", gate: null },
    isDemo: false,
    heal: null,
  });
  readGuestAlbumVersions.mockResolvedValue({
    version: 9,
    albumMax: 5,
    attrVersion: 2,
  });
  waiting = { count: 0, minutes: [] };
  developIfDue.mockResolvedValue(undefined);
  planGuestAlbumSync.mockImplementation(
    async (_event: unknown, since: number | null) => ({
      ...(await planAlbumSync({
        scope: "album",
        since,
        read: planRead,
        page: planPage,
      })),
      waiting,
    }),
  );
  planRead.mockImplementation(async (after: number, limit: number) =>
    limit === 0
      ? read()
      : read({
          changes:
            after < 5
              ? [
                  {
                    mediaId: M1,
                    version: 5,
                    status: "approved",
                    type: "photo",
                    width: 4,
                    height: 3,
                    durationSeconds: null,
                    hasPreview: false,
                    reelEligible: true,
                    createdAt: 1790206284644108,
                    guestId: null,
                  },
                ]
              : [],
        }),
  );
  planPage.mockResolvedValue({
    entries: [[M1, 4, 3, 4, 1790206284644108]],
    next: null,
  });
  loadGalleryReel.mockResolvedValue(null);
  getGuestCount.mockResolvedValue(3);
  countApprovedMedia.mockResolvedValue(48);
  getApprovedPhotoTeaser.mockResolvedValue({
    rows: [
      {
        id: M1,
        type: "photo",
        original_key: `events/${EVENT.id}/photo/${M1}/original.jpg`,
        preview_key: null,
        width: 4,
        height: 3,
        duration_seconds: null,
        reel_eligible: true,
        created_at: "2026-09-23T23:31:24.644108+00:00",
      },
    ],
    total: 9,
  });
  readGuestAttribution.mockResolvedValue(
    new Map([
      [
        M1,
        {
          displayName: "Maya",
          email: "maya@example.com",
          isHost: false,
          isVerified: true,
        },
      ],
    ]),
  );
});

describe("a first load and the quiet poll", () => {
  it("answers the manifest at the version read before it, with the album's count", async () => {
    const res = await post({ qr_token: "qr-1" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({
      kind: "manifest",
      access: "full",
      v: 5,
      attr: 2,
      total: 1,
      guestCount: 3,
    });
    expect(body.entries).toHaveLength(1);
    expect(res.headers.get("etag")).toMatch(/^"a1-/);
    // Planned through the reads' own gate; the version was read (limit 0) BEFORE the page.
    expect(planGuestAlbumSync).toHaveBeenCalledWith(EVENT, null);
    expect(planRead.mock.invocationCallOrder[0]).toBeLessThan(
      planPage.mock.invocationCallOrder[0],
    );
  });

  it("★ 304 when nothing changed, having read one row and nothing else", async () => {
    const first = await post({ qr_token: "qr-1" });
    const etag = first.headers.get("etag")!;
    vi.clearAllMocks();
    readGuestAlbumVersions.mockResolvedValue({
      version: 9,
      albumMax: 5,
      attrVersion: 2,
    });
    loadGalleryReel.mockResolvedValue(null);
    const res = await post(
      { qr_token: "qr-1", since: 5 },
      { "If-None-Match": etag },
    );
    expect(res.status).toBe(304);
    expect(planGuestAlbumSync).not.toHaveBeenCalled();
    expect(getGuestCount).not.toHaveBeenCalled();
  });

  it("a first load (no version) never 304s, whatever validator it sends", async () => {
    const etag = (await post({ qr_token: "qr-1" })).headers.get("etag")!;
    const res = await post({ qr_token: "qr-1" }, { "If-None-Match": etag });
    expect(res.status).toBe(200);
  });

  it("a moved album_max or attribution answers 200 with the delta", async () => {
    const etag = (await post({ qr_token: "qr-1" })).headers.get("etag")!;
    readGuestAlbumVersions.mockResolvedValue({
      version: 9,
      albumMax: 6,
      attrVersion: 2,
    });
    const res = await post(
      { qr_token: "qr-1", since: 4 },
      { "If-None-Match": etag },
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      kind: "delta",
      v: 5,
      upsert: [[M1, 4, 3, 4, 1790206284644108]],
      remove: [],
    });
  });

  it("the live reel's facts move the validator by themselves", async () => {
    const etag = (await post({ qr_token: "qr-1" })).headers.get("etag")!;
    loadGalleryReel.mockResolvedValue({
      showReel: false,
      liveReelEnabled: true,
      styleId: null,
      clip: null,
    });
    const res = await post(
      { qr_token: "qr-1", since: 5 },
      { "If-None-Match": etag },
    );
    expect(res.status).toBe(200);
  });
});

describe("the locked answer and the teaser", () => {
  it("a private or unknown album answers locked, with no validator", async () => {
    resolveAlbumViewer.mockResolvedValue({ kind: "gone" });
    const res = await post({ qr_token: "qr-1" });
    expect(await res.json()).toEqual({
      ok: true,
      kind: "locked",
      access: "none",
      gate: null,
    });
    expect(res.headers.get("etag")).toBeNull();
    expect(readGuestAlbumVersions).not.toHaveBeenCalled();
  });

  it("a password album without its cookie gets its gate and nothing else", async () => {
    resolveAlbumViewer.mockResolvedValue({
      kind: "viewer",
      event: EVENT,
      decision: { access: "none", gate: "password" },
      isDemo: false,
      heal: null,
    });
    const res = await post({ qr_token: "qr-1" });
    expect(await res.json()).toMatchObject({
      kind: "locked",
      gate: "password",
    });
    expect(res.headers.get("etag")).toBeNull();
    expect(readGuestAlbumVersions).not.toHaveBeenCalled();
    expect(planGuestAlbumSync).not.toHaveBeenCalled();
  });

  it("the teaser is today's inline payload, links and names, never an address or a raw key", async () => {
    resolveAlbumViewer.mockResolvedValue({
      kind: "viewer",
      event: EVENT,
      decision: { access: "teaser", gate: "account" },
      isDemo: false,
      heal: null,
    });
    const res = await post({ qr_token: "qr-1" });
    const text = await res.clone().text();
    const body = JSON.parse(text);
    expect(body).toMatchObject({
      kind: "teaser",
      gate: "account",
      teaserTotal: 9,
      approvedTotal: 48,
      guestCount: 3,
    });
    expect(body.items[0]).toMatchObject({
      id: M1,
      uploaderName: "Maya",
      isVerified: true,
    });
    expect(text).not.toContain("maya@example.com");
    expect(text).not.toMatch(/"(original_key|preview_key)"/);
    expect(
      text.replace(/https:\/\/r2\.test\/events\/[^"]+/g, ""),
    ).not.toContain("events/");
    expect(planGuestAlbumSync).not.toHaveBeenCalled();
  });

  it("the teaser's validator never validates the full album, nor another gate", async () => {
    resolveAlbumViewer.mockResolvedValue({
      kind: "viewer",
      event: EVENT,
      decision: { access: "teaser", gate: "account" },
      isDemo: false,
      heal: null,
    });
    const teaser = (await post({ qr_token: "qr-1" })).headers.get("etag")!;
    resolveAlbumViewer.mockResolvedValue({
      kind: "viewer",
      event: EVENT,
      decision: { access: "teaser", gate: "upload" },
      isDemo: false,
      heal: null,
    });
    const other = await post(
      { qr_token: "qr-1", since: 5 },
      { "If-None-Match": teaser },
    );
    expect(other.status).toBe(200);
    resolveAlbumViewer.mockResolvedValue({
      kind: "viewer",
      event: EVENT,
      decision: { access: "full", gate: null },
      isDemo: false,
      heal: null,
    });
    const full = await post(
      { qr_token: "qr-1", since: 5 },
      { "If-None-Match": teaser },
    );
    expect(full.status).toBe(200);
    expect((await full.json()).kind).toBe("delta");
  });
});

describe("a refusal after the decision let the viewer in (build 10: the host's own password album)", () => {
  const LOCKED = {
    ok: true,
    kind: "locked",
    access: "none",
    gate: "password",
  };

  it("★ the plan refused at full answers LOCKED behind the password, never a 500, and is reported", async () => {
    planGuestAlbumSync.mockResolvedValue(null);
    const res = await post({ qr_token: "qr-1" });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(LOCKED);
    expect(res.headers.get("etag")).toBeNull();
    expect(reportAlbumRefused).toHaveBeenCalledWith(EVENT.id, "sync");
    expect(getGuestCount).not.toHaveBeenCalled();
  });

  it.each([
    ["full", null],
    ["teaser", "account"],
  ])(
    "the versions refused at %s answer locked behind the password, and are reported",
    async (access, gate) => {
      resolveAlbumViewer.mockResolvedValue({
        kind: "viewer",
        event: EVENT,
        decision: { access, gate },
        isDemo: false,
        heal: null,
      });
      readGuestAlbumVersions.mockResolvedValue(null);
      const res = await post({ qr_token: "qr-1", since: 5 });
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual(LOCKED);
      expect(reportAlbumRefused).toHaveBeenCalledWith(EVENT.id, "sync");
      expect(planGuestAlbumSync).not.toHaveBeenCalled();
      expect(getApprovedPhotoTeaser).not.toHaveBeenCalled();
    },
  );

  it("a refusal still writes a pending heal, and never a validator", async () => {
    resolveAlbumViewer.mockResolvedValue({
      kind: "viewer",
      event: EVENT,
      decision: { access: "full", gate: null },
      isDemo: false,
      heal: HEAL,
    });
    planGuestAlbumSync.mockResolvedValue(null);
    const res = await post({ qr_token: "qr-1", session_token: HEAL.value });
    expect(await res.json()).toEqual(LOCKED);
    expect(res.headers.get("set-cookie")).toContain(
      `pr_guest_e1=${HEAL.value}`,
    );
    expect(res.headers.get("etag")).toBeNull();
  });

  it("a read that FAILS is a failure, not a refusal: never answered as a locked album", async () => {
    planRead.mockRejectedValue(new Error("album: changes since"));
    await expect(post({ qr_token: "qr-1" })).rejects.toThrow(
      "album: changes since",
    );
    expect(reportAlbumRefused).not.toHaveBeenCalled();
  });
});

describe("the heal", () => {
  it("★ a pending heal writes the cookie and carries no validator, so it can never be answered 304", async () => {
    const etag = (await post({ qr_token: "qr-1" })).headers.get("etag")!;
    resolveAlbumViewer.mockResolvedValue({
      kind: "viewer",
      event: EVENT,
      decision: { access: "full", gate: null },
      isDemo: false,
      heal: HEAL,
    });
    const res = await post(
      { qr_token: "qr-1", since: 5, session_token: HEAL.value },
      { "If-None-Match": etag },
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("set-cookie")).toContain(
      `pr_guest_e1=${HEAL.value}`,
    );
    expect(res.headers.get("etag")).toBeNull();
  });
});

describe("malformed input", () => {
  it.each([
    [{}],
    [{ qr_token: "" }],
    [{ qr_token: "qr-1", since: -1 }],
    [{ qr_token: "qr-1", since: 1.5 }],
    [{ qr_token: "qr-1", since: "5" }],
  ])("refuses %j with a 400", async (body) => {
    const res = await post(body);
    expect(res.status).toBe(400);
    expect(resolveAlbumViewer).not.toHaveBeenCalled();
  });

  it("refuses a body that is not JSON", async () => {
    const res = await POST(
      new Request("https://partyreel.com/api/album/guest/sync", {
        method: "POST",
        body: "{nope",
      }),
    );
    expect(res.status).toBe(400);
  });

  it("a version above the server's answers a fresh manifest (a resync)", async () => {
    const res = await post({ qr_token: "qr-1", since: 999 });
    expect((await res.json()).kind).toBe("manifest");
  });
});

describe("the develop and what waits (20261002200000)", () => {
  const DEVELOPS = "2026-10-03T09:00:00.000Z";
  const viewer = (over: Record<string, unknown>, access = "full") =>
    resolveAlbumViewer.mockResolvedValue({
      kind: "viewer",
      event: { ...EVENT, ...over },
      decision: { access, gate: access === "full" ? null : "account" },
      isDemo: false,
      heal: null,
    });

  it("★ an album due a develop develops BEFORE its versions are read, so this very poll carries it", async () => {
    viewer({ develop_due: true });
    await post({ qr_token: "qr-1" });
    expect(developIfDue).toHaveBeenCalledTimes(1);
    expect(developIfDue.mock.calls[0][0]).toMatchObject({
      id: EVENT.id,
      develop_due: true,
    });
    expect(developIfDue.mock.invocationCallOrder[0]).toBeLessThan(
      readGuestAlbumVersions.mock.invocationCallOrder[0],
    );
  });

  it("★ at full access, what waits rides the answer with the develop time, as numbers and never an id", async () => {
    viewer({ develops_at: DEVELOPS, capture: "camera", roll_size: 24 });
    waiting = {
      count: 3,
      minutes: [
        [1_790_000_000_000, 2],
        [1_790_000_060_000, 1],
      ],
    };
    const body = await (await post({ qr_token: "qr-1" })).json();
    expect(body.waiting).toEqual({
      count: 3,
      minutes: [
        [1_790_000_000_000, 2],
        [1_790_000_060_000, 1],
      ],
      developsAt: DEVELOPS,
    });
    expect(JSON.stringify(body.waiting)).not.toMatch(
      /[0-9a-f]{8}-[0-9a-f]{4}-/,
    );
  });

  it("a held row waits with no develop time: the count rides, the time is none", async () => {
    viewer({ moderation_mode: "hold_for_approval" });
    waiting = { count: 1, minutes: [[1_790_000_000_000, 1]] };
    const body = await (await post({ qr_token: "qr-1" })).json();
    expect(body.waiting).toEqual({
      count: 1,
      minutes: [[1_790_000_000_000, 1]],
      developsAt: null,
    });
  });

  it("nothing waiting and no develop time: no field, and the validator byte for byte what it was", async () => {
    const plain = await post({ qr_token: "qr-1" });
    expect(await plain.json()).not.toHaveProperty("waiting");
    viewer({ capture: "camera", roll_size: 24 });
    const camera = await post({ qr_token: "qr-1" });
    expect(camera.headers.get("etag")).toBe(plain.headers.get("etag"));
  });

  it("★ the validator hashes the develop time: a host's new one reaches a parked page on its next poll", async () => {
    viewer({ develops_at: DEVELOPS });
    const etag = (await post({ qr_token: "qr-1" })).headers.get("etag")!;
    const quiet = await post(
      { qr_token: "qr-1", since: 5 },
      { "If-None-Match": etag },
    );
    expect(quiet.status).toBe(304);
    viewer({ develops_at: "2026-10-04T09:00:00.000Z" });
    const moved = await post(
      { qr_token: "qr-1", since: 5 },
      { "If-None-Match": etag },
    );
    expect(moved.status).toBe(200);
    expect((await moved.json()).waiting.developsAt).toBe(
      "2026-10-04T09:00:00.000Z",
    );
  });

  it("never on the teaser: what waits is a full album's alone", async () => {
    viewer({ develops_at: DEVELOPS }, "teaser");
    waiting = { count: 4, minutes: [[1_790_000_000_000, 4]] };
    const body = await (await post({ qr_token: "qr-1" })).json();
    expect(body.kind).toBe("teaser");
    expect(body).not.toHaveProperty("waiting");
  });
});

/**
 * ★ ONE CALL A BATCH (album-calm, PRICING lever 1c): a delta carries its new items' links, so a batch of photographs
 * arrives in the poll's one answer where it took two calls (the delta, then the links route for its ids). Minted as
 * the links route mints them (`album-wire-links.server.ts`, the one home for both): through the reads' own gate, three
 * stable presigns an item, a name with no address, in the bucket read before minting with the server's clock beside it.
 */
describe("★ a delta carries its new items' links (album-calm)", () => {
  const id = (n: number) =>
    `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
  const key = (n: number, v = "original") =>
    `events/${EVENT.id}/photo/${id(n)}/${v}.jpg`;
  /** One change a new photograph, created at `n` microseconds past a moment (a bigger n is newer). */
  const change = (n: number, status = "approved") => ({
    mediaId: id(n),
    version: 6,
    status,
    type: "photo",
    width: 4,
    height: 3,
    durationSeconds: null,
    hasPreview: n % 2 === 1,
    reelEligible: true,
    createdAt: 1_790_206_284_644_108 + n,
    guestId: null,
  });
  const changes = (list: ReturnType<typeof change>[]) =>
    planRead.mockImplementation(async (_after: number, limit: number) =>
      limit === 0 ? read() : read({ albumMax: 9, approved: 3, changes: list }),
    );
  /** The read returns what is approved, unsealed and this album's: anything else is simply absent. */
  const rows = (ns: number[], who = true) =>
    readGuestAlbumMedia.mockResolvedValue({
      rows: ns.map((n) => ({
        id: id(n),
        type: "photo",
        original_key: key(n),
        preview_key: n % 2 === 1 ? key(n, "preview") : null,
      })),
      identities: who
        ? new Map(
            ns.map((n) => [
              id(n),
              {
                displayName: `Guest ${n}`,
                email: `g${n}@example.com`,
                isHost: false,
                isVerified: true,
              },
            ]),
          )
        : null,
    });

  it("★ carries a tile, a view, a download and a name for each new photograph, dated by its bucket and the server's clock", async () => {
    changes([change(7), change(8)]);
    rows([7, 8]);
    const before = Date.now();
    const res = await post({ qr_token: "qr-1", since: 5 });
    const text = await res.clone().text();
    const body = JSON.parse(text);
    expect(body.kind).toBe("delta");
    expect(body.upsert.map((e: unknown[]) => e[0]).sort()).toEqual([
      id(7),
      id(8),
    ]);
    expect(Number.isInteger(body.links.b)).toBe(true);
    expect(body.links.now).toBeGreaterThanOrEqual(before);
    expect(body.links.b).toBe(Math.floor(body.links.now / 1_800_000));
    const byId = new Map(body.links.links.map((l: unknown[]) => [l[0], l]));
    // 7 has a preview: the tile is the preview, the view the original. 8 has none: the view rides as null.
    expect(byId.get(id(7))).toEqual([
      id(7),
      `https://r2.test/${key(7, "preview")}?sig`,
      `https://r2.test/${key(7)}?sig`,
      `https://r2.test/${key(7)}?sig&dl`,
      ["Guest 7", 2],
    ]);
    expect(byId.get(id(8))).toEqual([
      id(8),
      `https://r2.test/${key(8)}?sig`,
      null,
      `https://r2.test/${key(8)}?sig&dl`,
      ["Guest 8", 2],
    ]);
    // ★ Never an address, never a raw key outside its signed link.
    expect(text).not.toContain("@example.com");
    expect(text).not.toMatch(/"(original_key|preview_key)"/);
    expect(
      text.replace(/https:\/\/r2\.test\/events\/[^"]+/g, ""),
    ).not.toContain("events/");
  });

  it("★ only through the reads' own gate: a held, sealed or removed photograph carries no link", async () => {
    // 9 came back into the delta's upserts, but the gated read leaves it out (sealed for the develop, say).
    changes([change(7), change(9)]);
    rows([7]);
    const body = await (await post({ qr_token: "qr-1", since: 5 })).json();
    expect(readGuestAlbumMedia).toHaveBeenCalledTimes(1);
    const [event, ids, opts] = readGuestAlbumMedia.mock.calls[0];
    expect(event).toMatchObject({ id: EVENT.id });
    expect([...ids].sort()).toEqual([id(7), id(9)]);
    expect(opts).toEqual({ attribute: true });
    expect(body.links.links.map((l: unknown[]) => l[0])).toEqual([id(7)]);
  });

  it("★ the newest first, at most a screenful (ALBUM_DELTA_LINKS_MAX)", async () => {
    const { ALBUM_DELTA_LINKS_MAX } = await import("@/lib/events/album-wire");
    // In change order, oldest first, as the log hands them over.
    changes(Array.from({ length: 60 }, (_, i) => change(100 + i)));
    rows([]);
    await post({ qr_token: "qr-1", since: 5 });
    const ids = readGuestAlbumMedia.mock.calls[0][1] as string[];
    expect(ids).toHaveLength(ALBUM_DELTA_LINKS_MAX);
    expect(ids[0]).toBe(id(159));
    expect(ids).not.toContain(id(100));
  });

  it("the demo's carried links name nobody", async () => {
    resolveAlbumViewer.mockResolvedValue({
      kind: "viewer",
      event: EVENT,
      decision: { access: "full", gate: null },
      isDemo: true,
      heal: null,
    });
    changes([change(7)]);
    rows([7], false);
    const body = await (await post({ qr_token: "qr-1", since: 5 })).json();
    expect(readGuestAlbumMedia.mock.calls[0][2]).toEqual({ attribute: false });
    expect(body.links.links[0][4]).toBeNull();
  });

  it("a manifest, a delta with nothing new and a removal carry none, and read nothing for them", async () => {
    const first = await (await post({ qr_token: "qr-1" })).json();
    expect(first.kind).toBe("manifest");
    expect(first).not.toHaveProperty("links");
    changes([]);
    const quiet = await (await post({ qr_token: "qr-1", since: 5 })).json();
    expect(quiet.kind).toBe("delta");
    expect(quiet).not.toHaveProperty("links");
    changes([change(7, "removed")]);
    const gone = await (await post({ qr_token: "qr-1", since: 5 })).json();
    expect(gone.remove).toEqual([id(7)]);
    expect(gone).not.toHaveProperty("links");
    expect(readGuestAlbumMedia).not.toHaveBeenCalled();
  });

  it("a teaser carries none (its nine ride inline), and a lock nothing at all", async () => {
    resolveAlbumViewer.mockResolvedValue({
      kind: "viewer",
      event: EVENT,
      decision: { access: "teaser", gate: "upload" },
      isDemo: false,
      heal: null,
    });
    const teaser = await (await post({ qr_token: "qr-1", since: 5 })).json();
    expect(teaser.kind).toBe("teaser");
    expect(teaser).not.toHaveProperty("links");
    expect(readGuestAlbumMedia).not.toHaveBeenCalled();
  });

  it("a refused read carries none, and the delta still lands (the links route answers for itself)", async () => {
    changes([change(7)]);
    readGuestAlbumMedia.mockResolvedValue(null);
    const res = await post({ qr_token: "qr-1", since: 5 });
    const body = await res.json();
    expect(body.kind).toBe("delta");
    expect(body.upsert).toHaveLength(1);
    expect(body).not.toHaveProperty("links");
  });

  it("★ a read that FAILS is reported, never silent, and costs the delta nothing", async () => {
    changes([change(7)]);
    readGuestAlbumMedia.mockRejectedValue(new Error("album: guest links"));
    const res = await post({ qr_token: "qr-1", since: 5 });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.kind).toBe("delta");
    expect(body).not.toHaveProperty("links");
    expect(captureError).toHaveBeenCalledWith(
      "media",
      expect.any(Error),
      expect.objectContaining({ eventId: EVENT.id }),
    );
  });

  it("the validator does not move for the links (a quiet album still answers 304)", async () => {
    changes([change(7)]);
    rows([7]);
    const etag = (await post({ qr_token: "qr-1", since: 5 })).headers.get(
      "etag",
    )!;
    readGuestAlbumVersions.mockResolvedValue({
      version: 9,
      albumMax: 9,
      attrVersion: 2,
    });
    const quiet = await post(
      { qr_token: "qr-1", since: 9 },
      { "If-None-Match": etag },
    );
    expect(quiet.status).toBe(304);
  });
});

/**
 * ★ WHETHER THE ALBUM TAKES UPLOADS (guest-requests). A host who closes or reopens uploads moves no media row, so a quiet
 * album's poll answered 304 through either, and the album's camera, stopped by a closed refusal, asked the album again
 * by itself (a presign at 10 s, 20, 40, then each minute) to hear a reopen. A full answer carries the switch from the
 * request's own event read, and the validator hashes it while it is off, from the same read, so a close or a reopen
 * reaches an open page on its next poll, and the two can never disagree.
 */
describe("★ whether the album takes uploads (guest-requests)", () => {
  const viewer = (accepting: boolean, access = "full") =>
    resolveAlbumViewer.mockResolvedValue({
      kind: "viewer",
      event: { ...EVENT, accepting_uploads: accepting },
      decision: { access, gate: access === "full" ? null : "account" },
      isDemo: false,
      heal: null,
    });
  const poll = (etag: string) =>
    post({ qr_token: "qr-1", since: 5 }, { "If-None-Match": etag });

  it("★ a full answer carries the host's switch, a manifest's and a delta's alike", async () => {
    viewer(true);
    expect(await (await post({ qr_token: "qr-1" })).json()).toMatchObject({
      kind: "manifest",
      accepting: true,
    });
    viewer(false);
    expect(
      await (await post({ qr_token: "qr-1", since: 4 })).json(),
    ).toMatchObject({ kind: "delta", accepting: false });
  });

  it("★ a host closing uploads defeats a held validator, with no media row moving: the next poll is a 200 that says so", async () => {
    viewer(true);
    const etag = (await post({ qr_token: "qr-1" })).headers.get("etag")!;
    expect((await poll(etag)).status).toBe(304);
    viewer(false);
    const closed = await poll(etag);
    expect(closed.status).toBe(200);
    expect(await closed.json()).toMatchObject({
      kind: "delta",
      upsert: [],
      remove: [],
      accepting: false,
    });
  });

  it("★ and reopening them: a validator held while closed answers 200 once, then the album rests on 304 again", async () => {
    viewer(false);
    const closedEtag = (await post({ qr_token: "qr-1" })).headers.get("etag")!;
    // Closed and quiet: the poll rests (the camera waits for the album's word, and the album has nothing new to say).
    expect((await poll(closedEtag)).status).toBe(304);
    viewer(true);
    const reopened = await poll(closedEtag);
    expect(reopened.status).toBe(200);
    expect((await reopened.json()).accepting).toBe(true);
    expect((await poll(reopened.headers.get("etag")!)).status).toBe(304);
  });

  it("an album taking uploads keeps the validator it always had (nothing rolls at the deploy, and the page's seed matches it)", async () => {
    viewer(true);
    const open = (await post({ qr_token: "qr-1" })).headers.get("etag");
    resolveAlbumViewer.mockResolvedValue({
      kind: "viewer",
      event: EVENT,
      decision: { access: "full", gate: null },
      isDemo: false,
      heal: null,
    });
    const unsaid = (await post({ qr_token: "qr-1" })).headers.get("etag");
    expect(open).toBe(unsaid);
  });

  it("never on the teaser: a viewer still at the door has no camera to tell", async () => {
    viewer(false, "teaser");
    const body = await (await post({ qr_token: "qr-1" })).json();
    expect(body.kind).toBe("teaser");
    expect(body).not.toHaveProperty("accepting");
  });
});

describe("★ the CDN's key (X5): named only where everyone with the link sees the album whole", () => {
  const KEY = albumEdgeKey("qr-1");

  function viewer(
    event: Record<string, unknown>,
    decision: { access: string; gate: string | null } = {
      access: "full",
      gate: null,
    },
  ) {
    resolveAlbumViewer.mockResolvedValue({
      kind: "viewer",
      event,
      decision,
      isDemo: false,
      heal: null,
    });
  }

  it("rides every full answer of an open album, its 304 included, and is never the token", async () => {
    const first = await post({ qr_token: "qr-1" });
    expect(first.headers.get("x-album-edge")).toBe(KEY);
    expect(KEY).toMatch(/^[A-Za-z0-9_-]{22}$/);
    expect(KEY).not.toContain("qr-1");
    const quiet = await post(
      { qr_token: "qr-1", since: 5 },
      { "If-None-Match": first.headers.get("etag")! },
    );
    expect(quiet.status).toBe(304);
    expect(quiet.headers.get("x-album-edge")).toBe(KEY);
  });

  const yours: [string, Record<string, unknown>][] = [
    ["a password album, unlocked", { visibility: "password" }],
    [
      "a gated album, through its door",
      { visibility: "private", door: "approve" },
    ],
    ["the host on her Only me album", { visibility: "private" }],
    [
      "an email asked first, and hers confirmed",
      { require_verified_email: true },
    ],
    ["an upload asked first, and hers made", { require_upload_to_view: true }],
  ];
  for (const [name, over] of yours) {
    it(`never where the full album is this viewer's alone: ${name}`, async () => {
      viewer({ ...EVENT, ...over });
      const res = await post({ qr_token: "qr-1" });
      expect((await res.json()).kind).toBe("manifest");
      expect(res.headers.get("etag")).not.toBeNull();
      expect(res.headers.get("x-album-edge")).toBeNull();
    });
  }

  it("never on a teaser, a lock or a refusal", async () => {
    viewer(EVENT, { access: "teaser", gate: "account" });
    expect(
      (await post({ qr_token: "qr-1" })).headers.get("x-album-edge"),
    ).toBeNull();
    resolveAlbumViewer.mockResolvedValue({ kind: "gone" });
    expect(
      (await post({ qr_token: "qr-1" })).headers.get("x-album-edge"),
    ).toBeNull();
    viewer(EVENT);
    planGuestAlbumSync.mockResolvedValue(null);
    const refused = await post({ qr_token: "qr-1" });
    expect((await refused.json()).kind).toBe("locked");
    expect(refused.headers.get("x-album-edge")).toBeNull();
  });

  it("★ the CDN's version IS this route's validator, byte for byte: a quiet room's answer 304s here", async () => {
    const { GET } = await import("@/app/api/album/guest/sync/version/route");
    loadGalleryReel.mockResolvedValue({
      showReel: true,
      liveReelEnabled: true,
      styleId: "warm",
      clip: null,
    });
    viewer({ ...EVENT, accepting_uploads: false });
    getEventByQrTokenForAnyone.mockResolvedValue({
      ok: true,
      data: { ...EVENT, accepting_uploads: false },
    });
    const etag = (await post({ qr_token: "qr-1" })).headers.get("etag");
    const res = await GET(
      new Request(
        `https://partyreel.com/api/album/guest/sync/version?k=${KEY}&w=${edgeWindowOf(Date.now())}`,
        { headers: { "x-album-token": "qr-1" } },
      ),
    );
    const { v } = await res.json();
    expect(v).toBe(etag);
    const quiet = await post(
      { qr_token: "qr-1", since: 5 },
      { "If-None-Match": v },
    );
    expect(quiet.status).toBe(304);
  });
});
