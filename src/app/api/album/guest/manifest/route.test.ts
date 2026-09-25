import { beforeEach, describe, expect, it, vi } from "vitest";

/** The rest of a long manifest: a cursor in, the next page out, and nothing for a viewer not let in. */
vi.mock("server-only", () => ({}));

const resolveAlbumViewer = vi.fn();
vi.mock("@/lib/events/album-viewer.server", () => ({
  resolveAlbumViewer: (...a: unknown[]) => resolveAlbumViewer(...a),
}));
const readGuestManifestPage = vi.fn();
vi.mock("@/lib/db/queries/album-guest", () => ({
  readGuestManifestPage: (...a: unknown[]) => readGuestManifestPage(...a),
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
    expect(body).toMatchObject({ access: "none", entries: [] });
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
