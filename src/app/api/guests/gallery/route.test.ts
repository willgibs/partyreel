import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * THE POLL, AND THE THREE THINGS BESIDE THE ROWS: the decision it answers carries a GATE, a
 * browser may heal its server-side identity through it, and a pending heal can never carry a
 * validator the browser might present back (Vercel's EDGE, not the function, converts a 200 into
 * a 304 whenever If-None-Match matches that 200's own ETag, and strips Set-Cookie doing it), so
 * this answers 200 with NO ETag at all while a heal is pending, until the cookie is confirmed
 * written.
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
const getGuestCount = vi.fn();
vi.mock("@/lib/db/queries/guest-events-admin", () => ({
  getGuestCount: (...a: unknown[]) => getGuestCount(...a),
}));
const resolveViewerDecision = vi.fn();
const loadGalleryReel = vi.fn();
const galleryEtagFor = vi.fn((..._a: unknown[]) => '"g3-stub"');
vi.mock("@/lib/events/gallery-access.server", () => ({
  resolveViewerDecision: (...a: unknown[]) => resolveViewerDecision(...a),
  loadGalleryReel: (...a: unknown[]) => loadGalleryReel(...a),
  isEventOwner: vi.fn().mockResolvedValue(false),
  loadGalleryRowsForAccess: vi.fn().mockResolvedValue({
    rows: [],
    identities: undefined,
    teaserTotal: 9,
    approvedTotal: 48,
  }),
  galleryEtagFor: (...a: unknown[]) => galleryEtagFor(...a),
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
  getGuestCount.mockResolvedValue(4);
  loadGalleryReel.mockResolvedValue(null);
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

  it("★ A PENDING HEAL CARRIES NO ETAG: the response the browser must receive answers 200 with the cookie and nothing for Vercel's edge to match", async () => {
    const res = await post({ qr_token: QR, session_token: TOKEN });
    expect(res.status).toBe(200);
    expect(res.headers.get("set-cookie")).toContain(`pr_guest_evt-1=${TOKEN}`);
    expect(res.headers.get("etag")).toBeNull();
  });

  it("a pending heal with a matching validator still answers 200, never 304, because there is no ETag on it to match", async () => {
    const res = await post(
      { qr_token: QR, session_token: TOKEN },
      { "If-None-Match": '"g3-stub"' },
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("set-cookie")).toContain(`pr_guest_evt-1=${TOKEN}`);
    expect(res.headers.get("etag")).toBeNull();
    expect(await res.json()).toMatchObject({ ok: true, access: "teaser" });
  });

  it("a settled cookie with a matching validator answers 304 with the ETag", async () => {
    cookieJar.set("pr_guest_evt-1", TOKEN);
    const res = await post(
      { qr_token: QR, session_token: TOKEN },
      { "If-None-Match": '"g3-stub"' },
    );
    expect(res.status).toBe(304);
    expect(res.headers.get("set-cookie")).toBeNull();
    expect(res.headers.get("etag")).toBe('"g3-stub"');
  });

  it("a settled cookie with a stale validator answers 200 with the ETag and no cookie", async () => {
    cookieJar.set("pr_guest_evt-1", TOKEN);
    const res = await post({ qr_token: QR }, { "If-None-Match": '"stale"' });
    expect(res.status).toBe(200);
    expect(res.headers.get("set-cookie")).toBeNull();
    expect(res.headers.get("etag")).toBe('"g3-stub"');
  });

  it("a matching validator with NO session token at all (the ordinary steady-state poll) still 304s", async () => {
    const res = await post({ qr_token: QR }, { "If-None-Match": '"g3-stub"' });
    expect(res.status).toBe(304);
    expect(res.headers.get("set-cookie")).toBeNull();
  });
});

describe("the guest count (the header's 'from M guests')", () => {
  it("rides a 200, read from the server's one count", async () => {
    const res = await post({ qr_token: QR });
    expect(await res.json()).toMatchObject({ ok: true, guestCount: 4 });
    expect(getGuestCount).toHaveBeenCalledTimes(1);
  });

  it("costs the steady poll nothing: a 304 never reads it", async () => {
    const res = await post({ qr_token: QR }, { "If-None-Match": '"g3-stub"' });
    expect(res.status).toBe(304);
    expect(getGuestCount).not.toHaveBeenCalled();
  });

  it("never reaches a locked page", async () => {
    resolveViewerDecision.mockResolvedValue({
      access: "none",
      gate: "password",
    });
    const res = await post({ qr_token: QR });
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.access).toBe("none");
    expect(body).not.toHaveProperty("guestCount");
    expect(getGuestCount).not.toHaveBeenCalled();
  });

  it("never reaches a private or missing event", async () => {
    getEventByQrToken.mockResolvedValue({ ok: false });
    const body = (await (await post({ qr_token: QR })).json()) as Record<
      string,
      unknown
    >;
    expect(body).not.toHaveProperty("guestCount");
    expect(getGuestCount).not.toHaveBeenCalled();
  });
});

describe("the album's size (the header's 'N photos & videos')", () => {
  it("rides every 200 as the loader's head count, beside the photo-only teaser total", async () => {
    const res = await post({ qr_token: QR });
    expect(await res.json()).toMatchObject({
      ok: true,
      teaserTotal: 9,
      approvedTotal: 48,
    });
  });

  it("is null on a private or missing event, where nothing is counted", async () => {
    getEventByQrToken.mockResolvedValue({ ok: false });
    const body = (await (await post({ qr_token: QR })).json()) as Record<
      string,
      unknown
    >;
    expect(body.approvedTotal).toBeNull();
  });
});

describe("the live reel's facts", () => {
  const REEL = {
    showReel: true,
    liveReelEnabled: true,
    styleId: "warm",
    cut: { videoAllowed: true, watermark: false, maxSeconds: 60 },
  };

  it("ride every 200, read for the viewer's own access level", async () => {
    resolveViewerDecision.mockResolvedValue({ access: "full", gate: null });
    loadGalleryReel.mockResolvedValue(REEL);
    const res = await post({ qr_token: QR });
    expect(await res.json()).toMatchObject({ ok: true, reel: REEL });
    expect(loadGalleryReel).toHaveBeenCalledWith(
      expect.objectContaining({ id: "evt-1" }),
      "full",
    );
  });

  it("are hashed into the validator, so a host's switch never 304s past an open album", async () => {
    resolveViewerDecision.mockResolvedValue({ access: "full", gate: null });
    loadGalleryReel.mockResolvedValue(REEL);
    await post({ qr_token: QR });
    expect(galleryEtagFor).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      REEL,
    );
  });

  it("are null on a private or missing event", async () => {
    getEventByQrToken.mockResolvedValue({ ok: false });
    const body = (await (await post({ qr_token: QR })).json()) as Record<
      string,
      unknown
    >;
    expect(body.reel).toBeNull();
    expect(loadGalleryReel).not.toHaveBeenCalled();
  });
});

describe("the request shape", () => {
  it("refuses a body with no qr_token", async () => {
    const res = await post({});
    expect(res.status).toBe(400);
  });
});
