/**
 * HER SAVE (take-home r1, `guest=select`, `save=light`): Select, then Save. The summary of her selection says both
 * sizes (phone size into Photos, the originals into Files), and `save` answers the links her phone's share sheets
 * are filled from, at phone size. Both read only what she can see, narrowed by her ids, never widened. The REAL
 * route runs; the door, the album's access read, Yours and R2's presigner are the stood-in edges, and the admin
 * client answers from the fake PostgREST.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

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
vi.mock("@/lib/guest/session-cookie", () => ({
  readGuestSessionCookie: vi.fn().mockResolvedValue(null),
}));
vi.mock("@/lib/demo", () => ({ isDemoToken: () => false }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: null } }) },
  }),
}));
const ownMediaIds = vi.fn();
vi.mock("@/lib/export/yours.server", () => ({
  ownMediaIds: (...a: unknown[]) => ownMediaIds(...a),
}));
vi.mock("@/lib/db/queries/guest-events-admin", () => ({
  readOwnSealedMedia: vi.fn().mockResolvedValue([]),
}));
vi.mock("@/lib/observability/sentry", () => ({
  captureWarning: () => {},
  captureError: () => {},
}));
vi.mock("@/lib/env", () => ({
  assertExportEnv: () => ({
    EXPORT_SIGNING_SECRET: "test-secret",
    EXPORT_WORKER_URL: "https://export.example",
  }),
}));
vi.mock("@/lib/r2/presign", () => ({
  presignDownload: async (p: { key: string; downloadFilename?: string }) =>
    `https://r2.example/${p.key}?name=${p.downloadFilename ?? ""}`,
}));
let fake: FakePostgrest;
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => asSupabase(fake),
}));
const ticketBlocked = vi.fn();
vi.mock("@/lib/events/closed-door.server", async () =>
  (await import("@/lib/events/testing/door-double")).doorDouble({
    blocked: (event, tickets) => ticketBlocked(event, tickets),
    callerOptions: () => {},
  }),
);

const { POST } = await import("@/app/api/export/guest/route");

const QR = "d02631f1bfb3455188d224e41bf9510f";
const E = "0c1d2e3f-4a5b-4c6d-8e7f-9a0b1c2d3e4f";
const MB = 1024 * 1024;
const uid = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const at = (n: number) =>
  `2026-09-12T20:${String(n).padStart(2, "0")}:00.000000+00:00`;

/**
 * Six photographs she can see (four with their copy, two from before it), one clip, and a hidden photograph the
 * gallery never hands her (its row exists in the table, so only the access read keeps it out).
 */
function seed() {
  const kinds: ("photo" | "video")[] = [
    "photo",
    "photo",
    "photo",
    "photo",
    "photo",
    "photo",
    "video",
  ];
  const rows = kinds.map((type, i) => ({
    id: uid(i + 1),
    type,
    original_key: `events/${E}/${type}/${uid(i + 1)}/original.${type === "photo" ? "jpg" : "mp4"}`,
    preview_key: null,
    width: 4032,
    height: 3024,
    duration_seconds: null,
    created_at: at(i + 1),
  }));
  const media: FakeRow[] = [
    ...rows.map((r, i) => ({
      id: r.id,
      file_size_bytes: r.type === "video" ? 22 * MB : Math.round(2.9 * MB),
      phone_key:
        r.type === "photo" && i < 4
          ? `events/${E}/photo/${r.id}/phone.jpg`
          : null,
      phone_bytes: r.type === "photo" && i < 4 ? Math.round(0.55 * MB) : null,
    })),
    // Hidden from guests: in the table, never in her gallery.
    {
      id: uid(99),
      file_size_bytes: Math.round(2.9 * MB),
      phone_key: `events/${E}/photo/${uid(99)}/phone.jpg`,
      phone_bytes: Math.round(0.55 * MB),
    },
  ];
  fake = createFakePostgrest({ tables: { media } });
  loadGalleryRowsForAccess.mockResolvedValue({
    rows,
    identities: undefined,
    teaserTotal: null,
    approvedTotal: rows.length,
  });
  return rows;
}

async function post(body: Record<string, unknown>) {
  const res = await POST(
    new Request("https://partyreel.com/api/export/guest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ qr_token: QR, ...body }),
    }),
  );
  return { status: res.status, body: await res.json() };
}

beforeEach(() => {
  vi.clearAllMocks();
  ownMediaIds.mockResolvedValue(new Set());
  ticketBlocked.mockResolvedValue(false);
  getEventByQrToken.mockResolvedValue({
    ok: true,
    data: { id: "evt-1", visibility: "open", qr_token: QR, name: "Maya & Jay" },
  });
  resolveViewerDecision.mockResolvedValue({ access: "full", gate: null });
});

describe("her selection's two sizes (Select, then Save)", () => {
  it("says her picks at phone size beside their originals", async () => {
    seed();
    const { status, body } = await post({
      step: "summary",
      ids: [uid(1), uid(2), uid(5), uid(7)],
    });
    expect(status).toBe(200);
    expect(body.selection.shown.photo).toEqual({
      count: 3,
      bytes: 3 * Math.round(2.9 * MB),
      phone: 2 * Math.round(0.55 * MB) + Math.round(2.9 * MB),
    });
    expect(body.selection.shown.video).toEqual({
      count: 1,
      bytes: 22 * MB,
      phone: 22 * MB,
    });
    // The album's own summary is still the whole of it.
    expect(body.summary.shown.photo.count).toBe(6);
  });

  it("never sizes what she cannot see, whatever ids she sends", async () => {
    seed();
    const { body } = await post({ step: "summary", ids: [uid(1), uid(99)] });
    expect(body.selection.shown.photo.count).toBe(1);
  });

  it("answers no selection when none was asked", async () => {
    seed();
    const { body } = await post({ step: "summary" });
    expect(body).not.toHaveProperty("selection");
  });
});

describe("her Save's links", () => {
  it("answers her picks at phone size, oldest first, the clip as taken", async () => {
    seed();
    const { status, body } = await post({
      step: "save",
      size: "phone",
      ids: [uid(7), uid(5), uid(1)],
    });
    expect(status).toBe(200);
    expect(body.more).toBe(false);
    expect(body.items.map((i: { id: string }) => i.id)).toEqual([
      uid(1),
      uid(5),
      uid(7),
    ]);
    expect(body.items[0]).toEqual({
      id: uid(1),
      type: "photo",
      url: `https://r2.example/events/${E}/photo/${uid(1)}/phone.jpg?name=maya-jay-00000000.jpg`,
      name: "maya-jay-00000000.jpg",
      bytes: Math.round(0.55 * MB),
    });
    // Before the copy existed: the original serves.
    expect(body.items[1].url).toContain(`${uid(5)}/original.jpg`);
    expect(body.items[2]).toMatchObject({ type: "video", bytes: 22 * MB });
    expect(body.items[2].url).toContain(`${uid(7)}/original.mp4`);
  });

  it("never mints a link for what she cannot see", async () => {
    seed();
    const { body } = await post({
      step: "save",
      size: "phone",
      ids: [uid(99), uid(2)],
    });
    expect(body.items.map((i: { id: string }) => i.id)).toEqual([uid(2)]);
  });

  it("All takes the whole album she sees", async () => {
    seed();
    const { body } = await post({ step: "save", size: "phone" });
    expect(body.items).toHaveLength(7);
  });

  it("a shut door saves nothing", async () => {
    seed();
    resolveViewerDecision.mockResolvedValue({ access: "none", gate: null });
    const { status } = await post({
      step: "save",
      size: "phone",
      ids: [uid(1)],
    });
    expect(status).toBe(403);
  });
});
