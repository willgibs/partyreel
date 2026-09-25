import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * THE GUEST'S POLL: one row when nothing changed, the teaser inline, the paged album at full access,
 * and today's route rules (no validator on a locked answer, none while a heal is pending, never
 * across access levels or gates).
 */
vi.mock("server-only", () => ({}));

const resolveAlbumViewer = vi.fn();
vi.mock("@/lib/events/album-viewer.server", () => ({
  resolveAlbumViewer: (...a: unknown[]) => resolveAlbumViewer(...a),
}));
const readGuestAlbumVersions = vi.fn();
const readGuestAlbum = vi.fn();
const readGuestManifestPage = vi.fn();
const readGuestAttribution = vi.fn();
vi.mock("@/lib/db/queries/album-guest", () => ({
  readGuestAlbumVersions: (...a: unknown[]) => readGuestAlbumVersions(...a),
  readGuestAlbum: (...a: unknown[]) => readGuestAlbum(...a),
  readGuestManifestPage: (...a: unknown[]) => readGuestManifestPage(...a),
  readGuestAttribution: (...a: unknown[]) => readGuestAttribution(...a),
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
vi.mock("@/lib/events/gallery-access.server", () => ({
  loadGalleryReel: (...a: unknown[]) => loadGalleryReel(...a),
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

const { POST } = await import("@/app/api/album/guest/sync/route");

const EVENT = {
  id: "e0000000-0000-4000-8000-000000000001",
  qr_token: "qr-1",
  name: "Maya & Jay",
  visibility: "open",
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
  readGuestAlbum.mockImplementation(async (_e, after: number, limit: number) =>
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
  readGuestManifestPage.mockResolvedValue({
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
    // The version was read (limit 0) BEFORE the page.
    expect(readGuestAlbum.mock.invocationCallOrder[0]).toBeLessThan(
      readGuestManifestPage.mock.invocationCallOrder[0],
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
    expect(readGuestAlbum).not.toHaveBeenCalled();
    expect(readGuestManifestPage).not.toHaveBeenCalled();
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
    expect(readGuestAlbum).not.toHaveBeenCalled();
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
    expect(readGuestManifestPage).not.toHaveBeenCalled();
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
