import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The rest of a long manifest: a cursor in, the next page out, and nothing for a viewer not let in.
 * A page the reads' own gate refuses says locked, never an empty `full` page (which the client
 * would adopt as the album's end).
 */
vi.mock("server-only", () => ({}));

const resolveAlbumViewer = vi.fn();
vi.mock("@/lib/events/album-viewer.server", () => ({
  resolveAlbumViewer: (...a: unknown[]) => resolveAlbumViewer(...a),
}));
const readGuestManifestPage = vi.fn();
vi.mock("@/lib/db/queries/album-guest", () => ({
  ALBUM_REFUSED: { access: "none", gate: "password" },
  readGuestManifestPage: (...a: unknown[]) => readGuestManifestPage(...a),
}));
const reportAlbumRefused = vi.fn();
vi.mock("@/lib/events/gallery-access.server", () => ({
  reportAlbumRefused: (...a: unknown[]) => reportAlbumRefused(...a),
}));

const { POST } = await import("@/app/api/album/guest/manifest/route");

const EVENT = {
  id: "e0000000-0000-4000-8000-000000000001",
  qr_token: "qr-1",
  name: "E",
  visibility: "open",
};
const M = "00000000-0000-4000-8000-000000000001";
const AFTER = [1790206284644108, M];

function post(body: unknown) {
  return POST(
    new Request("https://partyreel.com/api/album/guest/manifest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
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
  readGuestManifestPage.mockResolvedValue({
    entries: [[M, 1, 1, 0, 1]],
    next: null,
  });
});

describe("a manifest page", () => {
  it("reads the page after the cursor", async () => {
    const body = await (await post({ qr_token: "qr-1", after: AFTER })).json();
    expect(body).toEqual({
      ok: true,
      access: "full",
      gate: null,
      entries: [[M, 1, 1, 0, 1]],
      next: null,
    });
    expect(readGuestManifestPage).toHaveBeenCalledWith(EVENT, AFTER, 3000);
  });

  it("a viewer who lost full access mid-read gets an empty page and the gate", async () => {
    resolveAlbumViewer.mockResolvedValue({
      kind: "viewer",
      event: EVENT,
      decision: { access: "teaser", gate: "upload" },
      isDemo: false,
      heal: null,
    });
    const body = await (await post({ qr_token: "qr-1", after: AFTER })).json();
    expect(body).toEqual({
      ok: true,
      access: "teaser",
      gate: "upload",
      entries: [],
      next: null,
    });
    expect(readGuestManifestPage).not.toHaveBeenCalled();
  });

  it("a private or unknown album gets nothing", async () => {
    resolveAlbumViewer.mockResolvedValue({ kind: "gone" });
    const body = await (await post({ qr_token: "qr-1", after: AFTER })).json();
    expect(body).toEqual({
      ok: true,
      access: "none",
      gate: null,
      entries: [],
      next: null,
    });
    expect(readGuestManifestPage).not.toHaveBeenCalled();
  });

  it("★ a page the reads' gate refuses at full says LOCKED, never an empty `full` page, and is reported", async () => {
    readGuestManifestPage.mockResolvedValue(null);
    const res = await post({ qr_token: "qr-1", after: AFTER });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      ok: true,
      access: "none",
      gate: "password",
      entries: [],
      next: null,
    });
    expect(reportAlbumRefused).toHaveBeenCalledWith(EVENT.id, "manifest");
  });

  it("a viewer the decision refused is never reported: that is the door working", async () => {
    resolveAlbumViewer.mockResolvedValue({
      kind: "viewer",
      event: EVENT,
      decision: { access: "none", gate: "password" },
      isDemo: false,
      heal: null,
    });
    const body = await (await post({ qr_token: "qr-1", after: AFTER })).json();
    expect(body).toMatchObject({ access: "none", gate: "password" });
    expect(readGuestManifestPage).not.toHaveBeenCalled();
    expect(reportAlbumRefused).not.toHaveBeenCalled();
  });

  it.each([
    [{ qr_token: "qr-1" }],
    [{ qr_token: "qr-1", after: [1.5, M] }],
    [{ qr_token: "qr-1", after: [1, "x"] }],
    [{ qr_token: "qr-1", after: { t: 1, id: M } }],
    [{ after: AFTER }],
  ])("refuses %j", async (body) => {
    expect((await post(body)).status).toBe(400);
  });
});
