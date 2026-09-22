import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * THE POLL, AND THE THREE THINGS THE DOOR ROUND ADDED TO IT (Will, 2026-09-21, "the door as three
 * steps"): the decision it answers carries a GATE, a browser may heal its server-side identity
 * through it, and the 304 it almost always returns has to be able to carry that heal.
 */
vi.mock("server-only", () => ({}));

const cookieJar = new Map<string, string>();
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      cookieJar.has(name) ? { name, value: cookieJar.get(name) } : undefined,
  }),
}));

const getEventByQrToken = vi.fn();
vi.mock("@/lib/db/queries/guest-events", () => ({
  getEventByQrToken: (...a: unknown[]) => getEventByQrToken(...a),
}));
const resolveViewerDecision = vi.fn();
vi.mock("@/lib/events/gallery-access.server", () => ({
  resolveViewerDecision: (...a: unknown[]) => resolveViewerDecision(...a),
  isEventOwner: vi.fn().mockResolvedValue(false),
  loadGalleryRowsForAccess: vi
    .fn()
    .mockResolvedValue({ rows: [], identities: undefined, teaserTotal: 9 }),
  galleryEtagFor: vi.fn(() => '"g3-stub"'),
  presignGalleryRows: vi.fn().mockResolvedValue([]),
}));
vi.mock("@/lib/events/unlock-cookie", () => ({
  isUnlocked: vi.fn().mockResolvedValue(true),
}));
// `isDemoToken` reaches the public env through lib/constants/site; the demo's own short-circuit
// is not what this file is about.
vi.mock("@/lib/demo", () => ({ isDemoToken: () => false }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: null } }) },
  }),
}));

const { POST } = await import("@/app/api/guests/gallery/route");

const QR = "qr-token-1234";
const TOKEN = "a".repeat(64);

function post(body: unknown, headers: Record<string, string> = {}) {
  return POST(
    new Request("https://partyreel.com/api/guests/gallery", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
    }),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  cookieJar.clear();
  getEventByQrToken.mockResolvedValue({
    ok: true,
    data: { id: "evt-1", visibility: "open", qr_token: QR },
  });
  resolveViewerDecision.mockResolvedValue({ access: "teaser", gate: "upload" });
});

describe("the decision it answers", () => {
  it("carries the GATE beside the level, which is what the door's machine reads", async () => {
    const res = await post({ qr_token: QR });
    const body = (await res.json()) as { access: string; gate: string | null };
    expect(body).toMatchObject({ access: "teaser", gate: "upload" });
  });

  it("a dead or private event answers empty, with no gate and no ETag to validate against", async () => {
    getEventByQrToken.mockResolvedValue({ ok: false });
    const res = await post({ qr_token: QR });
    expect(await res.json()).toMatchObject({ access: "none", gate: null });
    expect(res.headers.get("etag")).toBeNull();
  });
});

describe("the identity, and the heal", () => {
  it("resolves with the BODY's token when one is sent, and writes it as the cookie", async () => {
    const res = await post({ qr_token: QR, session_token: TOKEN });
    expect(resolveViewerDecision).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ sessionToken: TOKEN }),
    );
    expect(res.headers.get("set-cookie")).toContain(`pr_guest_evt-1=${TOKEN}`);
  });

  it("falls back to the cookie when the body sends none, and writes nothing", async () => {
    cookieJar.set("pr_guest_evt-1", TOKEN);
    const res = await post({ qr_token: QR });
    expect(resolveViewerDecision).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ sessionToken: TOKEN }),
    );
    expect(res.headers.get("set-cookie")).toBeNull();
  });

  it("writes nothing when the request already carries the same token", async () => {
    cookieJar.set("pr_guest_evt-1", TOKEN);
    const res = await post({ qr_token: QR, session_token: TOKEN });
    expect(res.headers.get("set-cookie")).toBeNull();
  });

  it("refuses to write anything that is not a 64-hex token", async () => {
    const res = await post({ qr_token: QR, session_token: "not-a-token" });
    expect(res.headers.get("set-cookie")).toBeNull();
    expect(resolveViewerDecision).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ sessionToken: null }),
    );
  });

  it("★ THE 304 CARRIES THE HEAL TOO: it is the response the steady-state poll almost always gets", async () => {
    const res = await post(
      { qr_token: QR, session_token: TOKEN },
      { "If-None-Match": '"g3-stub"' },
    );
    expect(res.status).toBe(304);
    expect(res.headers.get("set-cookie")).toContain(`pr_guest_evt-1=${TOKEN}`);
    expect(res.headers.get("etag")).toBe('"g3-stub"');
  });
});

describe("the request shape", () => {
  it("refuses a body with no qr_token", async () => {
    const res = await post({});
    expect(res.status).toBe(400);
  });
});
