import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * ★ WHAT EACH KIND OF DOOR SHOWS OF THE ALBUM (Will, 2026-10-02, on `locked-door` r2's doorway: "Only
 * what's shown today", the board's doorway naming the host on its shut door overruled; no RPC change).
 *
 * The page is where it is decided, because props serialize into the RSC payload whether or not a screen
 * draws them: whatever the page hands the door is in the HTML. So these pin what the page HANDS each
 * door, and what each door's page then says, for every kind of door a request can meet:
 *   - a Public album she is through: its name, its host and its date (the control);
 *   - the door's own steps where the host lets each guest in or a list keeps (the email step, the ask,
 *     the held door): the album's name and its host, who lets her in, and never its date;
 *   - a password album before the password: its name, never its host;
 *   - the shut door (Only me, a closed gate, a decline, a block, someone who was in): nothing of the
 *     album at all, and the unlisted reader the same message, her own foot naming the host she asks.
 *
 * The door's decision is the real mapping (`doorGalleryDecision`); the event is handed to the page as the
 * door's own re-read gives it to a request standing at a gated door (`closed-door.server.ts`), with the
 * album's name AND its host, and the page passes on only what each door showed.
 */
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "user-agent": "test" }),
  cookies: async () => ({ get: () => undefined }),
}));
vi.mock("next/server", () => ({ after: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn(), replace: vi.fn() }),
}));

const NAME = "Maya & Jay";
const HOST = "Maya Okafor";
const EVENT = vi.hoisted(() => ({
  id: "11111111-2222-4333-8444-555555555555",
  qr_token: "0123456789abcdef0123456789abcdef",
  name: "Maya & Jay",
  description: "The barn, then the lake.",
  event_date: "2026-09-12",
  custom_slug: "maya-and-jay",
  visibility: "open" as string,
  accepting_uploads: true,
  host_display_name: "Maya Okafor",
  moderation_mode: "live",
  doorPass: null,
}));
const door = vi.hoisted(() => ({
  decision: { kind: "through", admitted: true } as Record<string, unknown>,
}));
vi.mock("@/lib/events/closed-door.server", () => ({
  pageDoor: async () => ({ event: EVENT, decision: door.decision }),
}));
vi.mock("@/lib/demo", () => ({
  isDemoToken: () => false,
  DEMO_EVENT_URL: null,
}));

const seen = vi.hoisted(() => ({
  experience: null as Record<string, unknown> | null,
}));
vi.mock("@/components/guest/event-experience", () => ({
  EventExperience: (props: Record<string, unknown>) => {
    seen.experience = props;
    return null;
  },
}));
const stub = () => null;
vi.mock("@/components/guest/guest-header", () => ({ GuestHeader: stub }));
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
vi.mock("@/lib/db/queries/guest-events-admin", () => ({
  getGalleryStats: async () => ({ approvedTotal: 12, guestCount: 3 }),
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
vi.mock("@/lib/events/gallery-access-owner.server", () => ({
  isRequestOwner: async () => false,
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
vi.mock("@/lib/guest/session-cookie", () => ({
  readGuestSessionCookie: async () => null,
}));
vi.mock("@/lib/guest/waiting-on-arrival.server", () => ({
  hasWaitingUploads: async () => false,
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

/** What the page last handed the album's door (read through a function: the page sets it while it renders). */
const handedProps = (): Record<string, unknown> | null => seen.experience;

/** What the page draws for one door: its text, and what it handed the album's door. */
async function meet(
  decision: Record<string, unknown>,
  opts: { visibility?: string } = {},
) {
  door.decision = decision;
  EVENT.visibility = opts.visibility ?? "private";
  seen.experience = null;
  const page = await GuestEventPage({
    params: Promise.resolve({ token: EVENT.qr_token }),
  });
  const { container } = render(<>{page}</>);
  const props = handedProps();
  const handed = props?.event as
    | {
        name: string;
        host_display_name: string | null;
        event_date: string | null;
      }
    | undefined;
  return {
    text: container.textContent ?? "",
    html: container.innerHTML,
    handed,
    props,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  auth.user = null;
  viewer.decision = { access: "full", gate: null };
});
afterEach(cleanup);

describe("what each kind of door shows of the album", () => {
  it("a Public album she is through names its host and its date (the control)", async () => {
    const { handed } = await meet(
      { kind: "through", admitted: false },
      { visibility: "open" },
    );
    expect(handed?.name).toBe(NAME);
    expect(handed?.host_display_name).toBe(HOST);
    expect(handed?.event_date).toBe("2026-09-12");
  });

  it("★ a password album before the password: its name, never its host", async () => {
    viewer.decision = { access: "none", gate: "password" };
    const { handed, props } = await meet(
      { kind: "through", admitted: false },
      { visibility: "password" },
    );
    expect(props?.access).toBe("none");
    expect(handed?.name).toBe(NAME);
    expect(handed?.host_display_name).toBeNull();
    expect(handed?.event_date).toBeNull();
    expect(props?.hostSeed).toBeNull();
  });

  it("★ every door's own step where the host answers (the email step, the ask, the held door): the album and who lets her in, never its date", async () => {
    for (const decision of [
      { kind: "newcomer", gate: "approve" },
      { kind: "newcomer", gate: "invite" },
      { kind: "ask", gate: "approve" },
      { kind: "waiting" },
    ]) {
      const { handed, props } = await meet(decision);
      expect(props?.access, decision.kind).toBe("none");
      expect(handed?.name, JSON.stringify(decision)).toBe(NAME);
      expect(handed?.host_display_name, JSON.stringify(decision)).toBe(HOST);
      expect(handed?.event_date, JSON.stringify(decision)).toBeNull();
      cleanup();
    }
  });

  it("★ the shut door names nothing, whoever reads it and whatever shut it", async () => {
    for (const decision of [
      { kind: "shut", previous: false },
      { kind: "shut", previous: true },
    ]) {
      for (const user of [
        null,
        { id: "u1", email_confirmed_at: "2026-09-01" },
      ]) {
        auth.user = user;
        const { text, html, props } = await meet(decision);
        expect(props, "the album's door is never drawn").toBeNull();
        expect(html).toContain('data-door-way="shut"');
        expect(text).not.toContain(NAME);
        expect(text).not.toContain(HOST);
        expect(text).not.toContain("Maya");
        cleanup();
      }
    }
  });

  it("★ the unlisted reader reads the shut door's one message, naming nothing; her own foot asks the host by name", async () => {
    auth.user = { id: "u1", email_confirmed_at: "2026-09-01" };
    const { text, html, props } = await meet({ kind: "ask", gate: "invite" });
    expect(props).toBeNull();
    expect(html).toContain('data-door-way="shut"');
    expect(text).not.toContain(NAME);
    expect(text).toContain(`Ask ${HOST} to let me in`);
    // The message itself names nobody: the host is named only on the button she presses.
    const message = document.querySelector("h1")?.parentElement?.textContent;
    expect(message).not.toContain("Maya");
  });
});
