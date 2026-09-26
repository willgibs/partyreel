import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * THE HOST'S HIDDEN MOMENTS: two public endpoints, so what is pinned is who gets an answer. A
 * malformed id is refused before anything is read or written; no session, or anyone but the owner,
 * gets `{ ok: false }` and no hint why; the owner gets her hidden photographs (never a clip, never a
 * video with nothing to draw), each with a presigned preview; Show is the one status write, to
 * approved, on the user's own client.
 */

const h = vi.hoisted(() => ({
  user: null as null | { id: string },
  owner: false,
  rows: [] as Record<string, unknown>[],
  setStatus: vi.fn(),
  read: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: h.user } }) },
  }),
}));
vi.mock("@/lib/events/gallery-access.server", () => ({
  isEventOwner: async () => h.owner,
}));
vi.mock("@/lib/db/queries/media", () => ({
  readEventMedia: (...args: unknown[]) => {
    h.read(...args);
    return h.rows;
  },
}));
vi.mock("@/lib/db/mutations/media", () => ({
  setMediaStatus: (...args: unknown[]) => h.setStatus(...args),
}));
vi.mock("@/lib/r2/presign", () => ({
  presignDownload: async ({ key }: { key: string }) =>
    `https://r2.test/${key}?sig`,
}));
vi.mock("@/lib/observability/sentry", () => ({ captureError: vi.fn() }));

const { listClipHiddenAction, showClipMomentAction } =
  await import("./clip-hidden-action");

const EVENT = "11111111-1111-4111-8111-111111111111";
const MEDIA = "22222222-2222-4222-8222-222222222222";

function row(over: Record<string, unknown>) {
  return {
    id: MEDIA,
    type: "photo",
    status: "hidden",
    original_key: `events/${EVENT}/o.jpg`,
    preview_key: `events/${EVENT}/p.webp`,
    width: 3000,
    height: 2000,
    duration_seconds: null,
    created_at: "2026-06-14T21:00:00.000000+00:00",
    guest_id: "g1",
    reel_eligible: true,
    ...over,
  };
}

beforeEach(() => {
  h.user = { id: "host-1" };
  h.owner = true;
  h.rows = [];
  h.setStatus.mockReset();
  h.read.mockReset();
});

describe("listClipHiddenAction", () => {
  it("refuses a malformed id before any session or row is read", async () => {
    for (const bad of ["", "not-a-uuid", 42, null, { id: EVENT }]) {
      expect(await listClipHiddenAction(bad)).toEqual({ ok: false });
    }
    expect(h.read).not.toHaveBeenCalled();
  });

  it("answers nobody without a session, and nobody but the owner", async () => {
    h.user = null;
    expect(await listClipHiddenAction(EVENT)).toEqual({ ok: false });
    h.user = { id: "someone-else" };
    h.owner = false;
    expect(await listClipHiddenAction(EVENT)).toEqual({ ok: false });
    expect(h.read).not.toHaveBeenCalled();
  });

  it("hands the owner her hidden photographs with a presigned preview, and nothing else", async () => {
    h.rows = [
      row({ id: "a", status: "approved" }),
      row({ id: "b" }),
      row({ id: "c", reel_eligible: false }),
      row({ id: "d", type: "video", preview_key: null }),
      row({ id: "e", type: "video", guest_id: null }),
    ];
    const result = await listClipHiddenAction(EVENT);
    // The hidden slice alone (album-host-wiring): a creator opened over a big album reads its
    // handful of hidden items, never the whole album. The filter below still stands behind it.
    expect(h.read).toHaveBeenCalledWith(expect.anything(), EVENT, "hidden");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.items.map((m) => m.id)).toEqual(["b", "e"]);
    for (const m of result.items) {
      expect(m.status).toBe("hidden");
      // A presign, never a raw key.
      expect(m.previewUrl).toMatch(/^https:\/\/r2\.test\/.+\?sig$/);
    }
    expect(result.items[1].isHost).toBe(true);
  });
});

describe("showClipMomentAction", () => {
  it("refuses malformed ids before any write", async () => {
    expect((await showClipMomentAction("x", MEDIA)).ok).toBe(false);
    expect((await showClipMomentAction(EVENT, "x")).ok).toBe(false);
    expect(h.setStatus).not.toHaveBeenCalled();
  });

  it("is the album's own Show: one write, to approved", async () => {
    h.setStatus.mockResolvedValue({ ok: true, data: { id: MEDIA } });
    expect(await showClipMomentAction(EVENT, MEDIA)).toEqual({ ok: true });
    expect(h.setStatus).toHaveBeenCalledWith(EVENT, MEDIA, "approved");
  });

  it("passes a refusal's words through", async () => {
    h.setStatus.mockResolvedValue({
      ok: false,
      code: "unknown",
      message: "That item is no longer available.",
    });
    expect(await showClipMomentAction(EVENT, MEDIA)).toEqual({
      ok: false,
      message: "That item is no longer available.",
    });
  });
});
