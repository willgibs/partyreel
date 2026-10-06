import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * ★ THE FIRST BYTE IS THE DOOR, DECIDED BY THE PAGE (door-reveal; Will's live walk of 2026-10-02: "entered the
 * address, full guest album was visible before gate appeared over it (big bug)"; his rule: "the album is never
 * visible before any door/gate that should be encountered first").
 *
 * The page decides on the server, from what the request carries, what its first byte draws for the door
 * (`doorArrival`): the welcome's flag is a cookie now (`pr_welcome_<qr>`), so a newcomer at a Public album is
 * handed the welcome's door and a returning guest who owes nothing her album at once; a gate its door; a sheet
 * step that comes first the door's scrim. And the header stands on paper over a door that is the page, never
 * white over a paper door. The shut door is this page's own early return, drawn here, its light from the page's
 * place on the wheel. What the shell then draws from the arrival is pinned beside it
 * (`event-experience.first-paint.test.tsx`).
 */
vi.mock("server-only", () => ({}));
const jar = vi.hoisted(() => ({ cookies: new Map<string, string>() }));
/** What the request carries beside its agent: Vercel's guess at the READER's zone, which the album's turn never reads. */
const reader = vi.hoisted(() => ({ headers: {} as Record<string, string> }));
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "user-agent": "test", ...reader.headers }),
  cookies: async () => ({
    get: (name: string) =>
      jar.cookies.has(name) ? { value: jar.cookies.get(name)! } : undefined,
  }),
}));
vi.mock("next/server", () => ({ after: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn(), replace: vi.fn() }),
}));

const EVENT = vi.hoisted(() => ({
  id: "11111111-2222-4333-8444-555555555555",
  qr_token: "0123456789abcdef0123456789abcdef",
  name: "Maya & Jay",
  description: "The barn, then the lake.",
  event_date: "2026-09-12" as string | null,
  custom_slug: null,
  visibility: "open" as string,
  accepting_uploads: true,
  require_upload_to_view: false,
  host_display_name: "Maya Okafor",
  moderation_mode: "live",
  develops_at: null as string | null,
  doorPass: null,
}));
const door = vi.hoisted(() => ({
  decision: { kind: "through", admitted: false } as Record<string, unknown>,
}));
vi.mock("@/lib/events/closed-door.server", () => ({
  pageDoor: async () => ({ event: EVENT, decision: door.decision }),
}));
/** The party's own zone as `events.time_zone` holds it (event-zone), read once a render on the service role. */
const party = vi.hoisted(() => ({ zone: null as string | null }));
const zoneRead = vi.hoisted(() =>
  vi.fn(async (_eventId: string) => party.zone),
);
vi.mock("@/lib/event/zone.server", () => ({ readPartyZone: zoneRead }));
vi.mock("@/lib/demo", () => ({
  isDemoToken: () => false,
  DEMO_EVENT_URL: null,
}));

const seen = vi.hoisted(() => ({
  experience: null as Record<string, unknown> | null,
  header: null as Record<string, unknown> | null,
}));
vi.mock("@/components/guest/event-experience", () => ({
  EventExperience: (props: Record<string, unknown>) => {
    seen.experience = props;
    return null;
  },
}));
vi.mock("@/components/guest/guest-header", () => ({
  GuestHeader: (props: Record<string, unknown>) => {
    seen.header = props;
    return null;
  },
}));
const stub = () => null;
vi.mock("@/components/shared/claim-ask", () => ({ ClaimAsk: stub }));
vi.mock("@/components/social/guest-list", () => ({
  GuestList: stub,
  GUEST_LIST_FACES_THRESHOLD: 8,
}));
vi.mock("@/components/shared/album-window-plan", () => ({
  ALBUM_WIDTH_COOKIE: "pr_album_w",
  parseAlbumWidth: () => null,
}));
vi.mock("@/lib/analytics/bots", () => ({ isLikelyBot: () => true }));
vi.mock("@/lib/db/mutations/analytics", () => ({ recordLinkHit: vi.fn() }));
vi.mock("@/lib/db/mutations/guest-media", () => ({
  listAccountMediaIds: async () => [],
  listOwnerMediaIds: async () => [],
}));
const galleryStats = vi.hoisted(() => ({ approvedTotal: 12 }));
vi.mock("@/lib/db/queries/guest-events-admin", () => ({
  getGalleryStats: async () => ({
    approvedTotal: galleryStats.approvedTotal,
    guestCount: 3,
  }),
  getHostAvatarSeed: async () => ({ avatarUrl: null, seed: "seed-1" }),
  getOpenAlbumItemForCard: stub,
}));
vi.mock("@/lib/db/queries/profile", () => ({
  getProfileMenu: async () => ({ displayName: "Lena" }),
}));
vi.mock("@/lib/db/queries/social", () => ({
  getEventGuestList: async () => [],
  getHostCard: async () => null,
  getMyFollowing: async () => [],
  isFollowing: async () => false,
}));
vi.mock("@/lib/social/cards", () => ({
  splitGuestList: stub,
  withAvatarUrls: stub,
}));
const owner = vi.hoisted(() => ({ is: false }));
vi.mock("@/lib/events/gallery-access-owner.server", () => ({
  isRequestOwner: async () => owner.is,
}));
const viewer = vi.hoisted(() => ({
  decision: { access: "full", gate: null } as {
    access: string;
    gate: string | null;
  },
}));
vi.mock("@/lib/events/gallery-access.server", () => ({
  resolveViewerDecision: async () => ({ ...viewer.decision, albumFull: false }),
  streamGallerySeed: () => Promise.resolve({ kind: "locked" }),
}));
vi.mock("@/lib/events/unlock-cookie", () => ({
  isUnlocked: async () => false,
}));
vi.mock("@/lib/guest/event-card", () => ({
  EVENT_CARD_ALT: "",
  EVENT_CARD_SIZE: {},
  eventCardPath: stub,
  privateEventCardPath: stub,
}));
const ticket = vi.hoisted(() => ({ value: null as string | null }));
vi.mock("@/lib/guest/session-cookie", () => ({
  readGuestSessionCookie: async () => ticket.value,
}));
const waitingAsk = vi.hoisted(() => vi.fn(async (_eventId: string) => false));
vi.mock("@/lib/disposable/waiting.server", () => ({
  albumWaits: waitingAsk,
}));
vi.mock("@/lib/media/share-save", () => ({
  PHOTO_PARAM: "photo",
  readPhotoParam: stub,
}));
vi.mock("@/lib/r2/presign", () => ({ presignDownload: stub }));
vi.mock("@/lib/shared/tile-size-cookie", () => ({
  resolveRowStep: () => 1,
  TILE_SIZE_COOKIE: "pr_tile_size",
}));
vi.mock("@/lib/site-url", () => ({
  getSiteUrl: async () => "https://partyreel.test",
}));
const auth = vi.hoisted(() => ({
  user: null as { id: string; email_confirmed_at: string | null } | null,
}));
vi.mock("@/lib/supabase/request-auth", () => ({
  getRequestAuth: async () => ({ user: auth.user }),
}));
vi.mock("@/lib/welcome", () => ({ needsDisplayName: () => false }));

const { default: GuestEventPage } = await import("./page");

const WELCOME = `pr_welcome_${EVENT.qr_token}`;

async function meet(
  decision: Record<string, unknown>,
  opts: { visibility?: string; access?: string; gate?: string | null } = {},
) {
  door.decision = decision;
  EVENT.visibility = opts.visibility ?? "open";
  viewer.decision = {
    access: opts.access ?? "full",
    gate: opts.gate ?? null,
  };
  seen.experience = null;
  seen.header = null;
  const page = await GuestEventPage({
    params: Promise.resolve({ token: EVENT.qr_token }),
  });
  const { container } = render(<>{page}</>);
  return { container, experience: handedDoor(), header: handedHeader() };
}

/** What the page last handed the album's door and the header (read through a function: set while it renders). */
const handedDoor = (): Record<string, unknown> | null => seen.experience;
const handedHeader = (): Record<string, unknown> | null => seen.header;

beforeEach(() => {
  vi.clearAllMocks();
  jar.cookies.clear();
  reader.headers = {};
  party.zone = null;
  EVENT.event_date = "2026-09-12";
  ticket.value = null;
  auth.user = null;
  owner.is = false;
  EVENT.develops_at = null;
  galleryStats.approvedTotal = 12;
  waitingAsk.mockResolvedValue(false);
});
afterEach(cleanup);

describe("★ the page decides what its first byte draws for the door", () => {
  it("a newcomer at a Public album is handed the welcome's door, under a paper header", async () => {
    const { experience, header } = await meet({
      kind: "through",
      admitted: false,
    });
    expect(experience?.arrival).toEqual({ face: "welcome", scrim: false });
    expect(experience?.welcomeSeen).toBe(false);
    expect(header?.over).toBe(false);
    const phase = experience?.doorPhase as number;
    expect(phase).toBeGreaterThanOrEqual(0);
    expect(phase).toBeLessThan(1);
  });

  it("★ a returning guest who owes nothing gets her album at once, the header on its cover", async () => {
    jar.cookies.set(WELCOME, "1");
    ticket.value = "a".repeat(64);
    const { experience, header } = await meet({
      kind: "through",
      admitted: false,
    });
    expect(experience?.arrival).toEqual({ face: null, scrim: false });
    expect(experience?.welcomeSeen).toBe(true);
    expect(header?.over).toBe(true);
  });

  it("past the welcome with a name still owed: the door's scrim over the album", async () => {
    jar.cookies.set(WELCOME, "1");
    const { experience } = await meet({ kind: "through", admitted: false });
    expect(experience?.arrival).toEqual({ face: null, scrim: true });
  });

  it("★ the email step an album asks first, past the welcome: the scrim; before it, the welcome", async () => {
    const first = await meet(
      { kind: "through", admitted: false },
      { access: "teaser", gate: "account" },
    );
    expect(first.experience?.arrival).toEqual({
      face: "welcome",
      scrim: false,
    });
    cleanup();
    jar.cookies.set(WELCOME, "1");
    const past = await meet(
      { kind: "through", admitted: false },
      { access: "teaser", gate: "account" },
    );
    expect(past.experience?.arrival).toEqual({ face: null, scrim: true });
  });

  it("every gate's door stands from the first byte, under a paper header", async () => {
    for (const [decision, gate, face] of [
      [{ kind: "through", admitted: false }, "password", "welcome"],
      [{ kind: "newcomer", gate: "approve" }, "account", "welcome"],
      [{ kind: "waiting" }, "waiting", "welcome"],
    ] as const) {
      const { experience, header } = await meet(decision, {
        visibility: decision.kind === "through" ? "password" : "private",
        access: "none",
        gate,
      });
      expect(experience?.arrival, gate).toEqual({ face, scrim: false });
      expect(header?.over, gate).toBe(false);
      cleanup();
    }
    jar.cookies.set(WELCOME, "1");
    for (const [decision, gate, face] of [
      [{ kind: "through", admitted: false }, "password", "rest"],
      [{ kind: "newcomer", gate: "approve" }, "account", "rest"],
      [{ kind: "waiting" }, "waiting", "waiting"],
    ] as const) {
      const { experience } = await meet(decision, {
        visibility: decision.kind === "through" ? "password" : "private",
        access: "none",
        gate,
      });
      expect(experience?.arrival, gate).toEqual({ face, scrim: false });
      cleanup();
    }
  });

  it("the album's owner meets no door at all", async () => {
    auth.user = { id: "host-1", email_confirmed_at: "2026-09-01" };
    owner.is = true;
    const { experience, header } = await meet({
      kind: "through",
      admitted: true,
    });
    expect(experience?.arrival).toEqual({ face: null, scrim: false });
    expect(header?.over).toBe(true);
  });

  it("★ the shut door is the page's own first byte, its light turning from the page's place on the wheel", async () => {
    const { container, experience } = await meet(
      { kind: "shut", previous: false },
      { visibility: "private" },
    );
    expect(experience).toBeNull();
    const way = container.querySelector<HTMLElement>('[data-door-way="shut"]');
    expect(way).not.toBeNull();
    const phase = Number(way?.style.getPropertyValue("--door-phase"));
    expect(phase).toBeGreaterThanOrEqual(0);
    expect(phase).toBeLessThan(1);
  });
});

/* ★ RED-TEAM 43'S MEDIUM, THE PAGE'S HALF: an album with a develop time ahead keeps what she adds out of the album as
   surely as one that waits for the host, so the page reads it as waiting (her tracker, the keep's words) and asks
   whether anything waits on an empty album (the-wait's wiring: everyone's, hers among it). Its time stays off every
   gate (beside the date, `page.redaction.test.tsx`). */
describe("★ an album with a develop time ahead: what she adds waits", () => {
  it("hands down that it waits, and for the develop, and asks whether anything waits on an empty album", async () => {
    const ahead = new Date(Date.now() + 86_400_000).toISOString();
    EVENT.develops_at = ahead;
    galleryStats.approvedTotal = 0;
    ticket.value = "a".repeat(64);
    waitingAsk.mockResolvedValue(true);
    const { experience } = await meet({ kind: "through", admitted: false });
    expect(experience?.uploadsWait).toEqual({ waits: true, developsAt: ahead });
    expect(waitingAsk).toHaveBeenCalledTimes(1);
    expect(experience?.waitingOnArrival).toBe(true);
  });

  it("a develop time reached has developed: nothing waits, and nothing is asked", async () => {
    EVENT.develops_at = new Date(Date.now() - 60_000).toISOString();
    galleryStats.approvedTotal = 0;
    ticket.value = "a".repeat(64);
    const { experience } = await meet({ kind: "through", admitted: false });
    expect(experience?.uploadsWait).toEqual({ waits: false, developsAt: null });
    expect(waitingAsk).not.toHaveBeenCalled();
  });
});

/* ★ ONE MOMENT FOR EVERY GUEST (event-zone; Will, 2026-10-05: "It feels unfair to unlock the album at different times for
   certain guests based on geographical location"). The album turns at 9 am the morning after in the PARTY's zone, read
   once by the page's server and handed to the browser as that instant: a reader's zone (Vercel's header, the old
   input) moves nothing, and no zone reaches the browser. Red on the old page, which read the turn in the reader's zone
   and handed the browser that zone. */
describe("★ one moment for every guest: the album turns in the party's own zone", () => {
  // A Saturday party in Auckland, on 12 September 2026: 9 am NZST (UTC+12) on Sunday the 13th.
  const AUCKLAND_MORNING = Date.parse("2026-09-12T21:00:00Z");

  it("★ a party in Auckland, read from Los Angeles and from London: one instant, 9 am the morning after in Auckland", async () => {
    party.zone = "Pacific/Auckland";
    const handed: unknown[] = [];
    for (const zone of ["America/Los_Angeles", "Europe/London", null]) {
      reader.headers = zone ? { "x-vercel-ip-timezone": zone } : {};
      const { experience } = await meet({ kind: "through", admitted: false });
      handed.push(experience?.albumOrder);
      cleanup();
    }
    expect(handed).toEqual([
      { morningAfter: AUCKLAND_MORNING, own: "oldest", chosen: null },
      { morningAfter: AUCKLAND_MORNING, own: "oldest", chosen: null },
      { morningAfter: AUCKLAND_MORNING, own: "oldest", chosen: null },
    ]);
    expect(zoneRead).toHaveBeenCalledWith(EVENT.id);
  });

  it("★ the browser is handed the instant, never a zone: neither the party's nor the reader's rides the page", async () => {
    party.zone = "Pacific/Auckland";
    reader.headers = { "x-vercel-ip-timezone": "America/Los_Angeles" };
    const { experience } = await meet({ kind: "through", admitted: false });
    const handed = JSON.stringify(experience);
    expect(handed).not.toContain("Pacific/Auckland");
    expect(handed).not.toContain("America/Los_Angeles");
    expect(Object.keys(experience?.albumOrder as object).sort()).toEqual([
      "chosen",
      "morningAfter",
      "own",
    ]);
  });

  it("a row with no zone, or one the runtime cannot read, turns in the one fallback (UTC), still one moment", async () => {
    for (const zone of [null, "Mars/Olympus"]) {
      party.zone = zone;
      reader.headers = { "x-vercel-ip-timezone": "Asia/Tokyo" };
      const { experience } = await meet({ kind: "through", admitted: false });
      expect(
        (experience?.albumOrder as { morningAfter: number }).morningAfter,
        String(zone),
      ).toBe(Date.parse("2026-09-13T09:00:00Z"));
      cleanup();
    }
  });

  it("an undated album asks no zone and never turns; behind a gate the order knows no days", async () => {
    EVENT.event_date = null;
    const undated = await meet({ kind: "through", admitted: false });
    expect(zoneRead).not.toHaveBeenCalled();
    expect(undated.experience?.albumOrder).toEqual({
      morningAfter: null,
      own: "newest",
      chosen: null,
    });
    cleanup();
    EVENT.event_date = "2026-09-12";
    party.zone = "Pacific/Auckland";
    const gated = await meet(
      { kind: "through", admitted: false },
      { visibility: "password", access: "none", gate: "password" },
    );
    expect(gated.experience?.albumOrder).toEqual({
      morningAfter: null,
      own: "newest",
      chosen: null,
    });
  });
});
