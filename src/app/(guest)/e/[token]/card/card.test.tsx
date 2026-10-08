/**
 * THE EVENT'S CARD SAYS ONE THING TO EVERYONE, AND A CLOSED DOOR NEVER NAMES IT (build 17's red-team).
 *
 * The card is public for an hour, and Vercel's edge serves the copy it cached first to whoever asks
 * next. Drawn per viewer, one blocked fetch left an open album unfurling nameless for an hour, and
 * before one, the blocked viewer got the named card while her page said private. Two halves pin the
 * fix, each where it lives:
 *   - THE ROUTE answers from its address alone: the event's own card follows the event's own
 *     visibility (read as nobody in particular, `getEventCardName`), `?private` is the generic card
 *     whatever the event, and nothing about the request (its cookies, its session, its ticket) is
 *     ever read, so two viewers get the same bytes and the same headers;
 *   - THE PAGE'S METADATA names the event's own card only where the door is open, and the private
 *     album's card behind every closed door, a block and a private album alike, in the same bytes;
 *     a gated album (the doors, 20260929120000) names its name, as a password album does, over the
 *     private album's card, since the card route reads a gated album as private.
 *
 * ★ AND AN OPEN ALBUM'S LINK SAYS WHAT THE ALBUM IS RIGHT NOW (crumbs-87, the gap audit): it always unfurled as "Add
 * photos to <name>" and "Add yours.", even after the host closed uploads. The state rides the card's address (`?add`),
 * so the route stays one answer per address and the edge's hour never outlives a host's change; the page's title and
 * line follow `accepting_uploads` in the same breath (`card/words.ts`).
 */
import { renderToStaticMarkup } from "react-dom/server";
import type { ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { GuestEvent } from "@/lib/db/queries/guest-events";
import type { DoorDecision } from "@/lib/event/door/decide";

/** The card's title as the markup carries it (`CardTitle`'s `data-card-title`: the letters themselves are one tile each). */
const titled = (name: string) => `data-card-title="${name}"`;

type PageDoor = {
  decision: DoorDecision;
  standing: Record<string, unknown>;
  event: GuestEvent;
};

const { getEventCardName, getEventByQrToken, pageDoor, requestIdentity } =
  vi.hoisted(() => ({
    getEventCardName: vi.fn<(token: string) => Promise<string | null>>(),
    getEventByQrToken: vi.fn(),
    pageDoor: vi.fn<(token: string) => Promise<PageDoor | null>>(),
    // Anything that reads who is asking. The card must never call it.
    requestIdentity: vi.fn(() => {
      throw new Error("the card read the request's identity");
    }),
  }));

vi.mock("server-only", () => ({}));
// Whether anything waits in an album empty to the eye: the page's one read for it (crumbs-43, the wait's wiring), stood in for here.
vi.mock("@/lib/disposable/waiting.server", () => ({
  albumWaits: async () => false,
}));

/** The drawing, captured: the element tree and the response options it was handed. */
vi.mock("next/og", () => ({
  ImageResponse: class {
    constructor(
      element: ReactElement,
      init: { headers?: Record<string, string> },
    ) {
      return new Response(renderToStaticMarkup(element), {
        headers: init.headers,
      });
    }
  },
}));

vi.mock("next/headers", () => ({
  cookies: requestIdentity,
  headers: requestIdentity,
  draftMode: requestIdentity,
}));

vi.mock("@/lib/db/queries/event-card", () => ({ getEventCardName }));

// The page's own reads, stubbed: generateMetadata is asked, never the page it renders.
vi.mock("@/lib/db/queries/guest-events", () => ({ getEventByQrToken }));
vi.mock("@/lib/events/closed-door.server", () => ({ pageDoor }));
vi.mock("@/lib/event/zone.server", () => ({ readPartyZone: async () => null }));
vi.mock("@/lib/db/queries/guest-events-admin", () => ({
  getGalleryStats: vi.fn(),
  getHostAvatarSeed: vi.fn(),
  getOpenAlbumItemForCard: vi.fn(async () => null),
}));
vi.mock("@/lib/r2/presign", () => ({
  presignDownload: vi.fn(async () => "https://r2.test/one-photo.webp"),
}));
vi.mock("@/components/guest/event-experience", () => ({
  EventExperience: () => null,
}));
vi.mock("@/components/guest/guest-header", () => ({ GuestHeader: () => null }));
vi.mock("@/components/shared/not-found-screen", () => ({
  NotFoundScreen: () => null,
}));
vi.mock("@/components/guest/door/shut-door", () => ({ ShutDoor: () => null }));
vi.mock("@/components/social/guest-list", () => ({
  GuestList: () => null,
  GUEST_LIST_FACES_THRESHOLD: 12,
}));
vi.mock("@/components/shared/album-window-plan", () => ({
  ALBUM_WIDTH_COOKIE: "pr_album_w",
  parseAlbumWidth: () => null,
}));
vi.mock("@/lib/db/mutations/analytics", () => ({ recordLinkHit: vi.fn() }));
vi.mock("@/lib/db/mutations/guest-media", () => ({
  listAccountMediaIds: vi.fn(),
}));
vi.mock("@/lib/db/queries/profile", () => ({ getProfileMenu: vi.fn() }));
vi.mock("@/lib/db/queries/social", () => ({
  getEventGuestList: vi.fn(),
  getHostCard: vi.fn(),
  getMyFollowing: vi.fn(),
}));
vi.mock("@/lib/social/cards", () => ({
  splitGuestList: vi.fn(),
  withAvatarUrls: vi.fn(),
}));
vi.mock("@/lib/events/gallery-access-owner.server", () => ({
  isRequestOwner: vi.fn(),
}));
vi.mock("@/lib/events/gallery-access.server", () => ({
  resolveViewerDecision: vi.fn(),
  streamGallerySeed: vi.fn(),
}));
vi.mock("@/lib/events/unlock-cookie", () => ({ isUnlocked: vi.fn() }));
vi.mock("@/lib/guest/session-cookie", () => ({
  readGuestSessionCookie: vi.fn(),
}));
vi.mock("@/lib/site-url", () => ({ getSiteUrl: vi.fn() }));
vi.mock("@/lib/supabase/request-auth", () => ({ getRequestAuth: vi.fn() }));
vi.mock("@/lib/welcome", () => ({ needsDisplayName: vi.fn() }));
vi.mock("@/lib/demo", () => ({ isDemoToken: () => false }));

const { GET } = await import("./route");
const { generateMetadata } = await import("../page");
const { getOpenAlbumItemForCard } =
  await import("@/lib/db/queries/guest-events-admin");

const QR = "0123456789abcdef0123456789abcdef";
const NAME = "Maya's 30th";

async function card(url: string, token = QR) {
  const res = await GET(new Request(url), {
    params: Promise.resolve({ token }),
  });
  return {
    cacheControl: res.headers.get("cache-control"),
    body: await res.text(),
  };
}

function guestEvent(over: Partial<GuestEvent> = {}): GuestEvent {
  return {
    id: "11111111-2222-4333-8444-555555555555",
    qr_token: QR,
    name: NAME,
    description: null,
    moderation_mode: "live",
    visibility: "open",
    has_password: false,
    accepting_uploads: true,
    require_verified_email: true,
    require_upload_to_view: false,
    event_date: null,
    qr_style: "classic",
    host_display_name: null,
    custom_slug: null,
    show_reel: true,
    reel_style_id: null,
    reel_hold_sec: null,
    accepts_video: true,
    ...over,
  };
}

/** A door the link opens: through, as a stranger. */
function openDoor(event: GuestEvent): PageDoor {
  return {
    decision: { kind: "through", admitted: false },
    standing: {},
    event,
  };
}

/** The shut door, over whatever the album's own read returned. */
function shutDoor(event: GuestEvent, previous = false): PageDoor {
  return { decision: { kind: "shut", previous }, standing: {}, event };
}

async function metadataFor(token: string, searchParams = {}) {
  return generateMetadata({
    params: Promise.resolve({ token }),
    searchParams: Promise.resolve(searchParams),
  });
}

/** Every image a page's metadata names, Open Graph and Twitter alike. */
function imageUrls(meta: Awaited<ReturnType<typeof generateMetadata>>) {
  const list = (value: unknown): unknown[] =>
    Array.isArray(value) ? value : value ? [value] : [];
  return [
    ...list(meta.openGraph?.images),
    ...list(
      meta.twitter && "images" in meta.twitter ? meta.twitter.images : [],
    ),
  ].map((image) =>
    typeof image === "string" || image instanceof URL
      ? String(image)
      : String((image as { url: string | URL }).url),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("the card route: one answer per address", () => {
  it("names an open or password event, public for an hour", async () => {
    getEventCardName.mockResolvedValue(NAME);
    const { cacheControl, body } = await card(
      `https://partyreel.test/e/${QR}/card`,
    );
    expect(body).toContain(titled("Maya&#x27;s 30th"));
    expect(cacheControl).toBe("public, max-age=3600");
    expect(getEventCardName).toHaveBeenCalledWith(QR);
  });

  it("draws the generic card for a private or unknown event", async () => {
    getEventCardName.mockResolvedValue(null);
    const { body } = await card(`https://partyreel.test/e/${QR}/card`);
    expect(body).toContain(titled("A Partyreel event"));
    expect(body).not.toContain("Maya");
  });

  it("?private is the private album's card whatever the event, and never reads it", async () => {
    getEventCardName.mockResolvedValue(NAME);
    const { cacheControl, body } = await card(
      `https://partyreel.test/e/${QR}/card?private`,
    );
    expect(body).toContain(titled("A Partyreel event"));
    expect(body).not.toContain("Maya");
    expect(cacheControl).toBe("public, max-age=3600");
    expect(getEventCardName).not.toHaveBeenCalled();
  });

  it("★ the plain address says what is true of every album, and ?add is the invitation (crumbs-87)", async () => {
    getEventCardName.mockResolvedValue(NAME);
    const plain = await card(`https://partyreel.test/e/${QR}/card`);
    const adding = await card(`https://partyreel.test/e/${QR}/card?add`);
    expect(plain.body).toContain("See the photos &amp; videos on Partyreel");
    expect(plain.body).not.toContain("Add your photos");
    expect(adding.body).toContain("Add your photos &amp; videos on Partyreel");
    expect(adding.body).not.toContain("See the photos");
    // The same album, the same name, the same hour at the edge: only the foot is the flag's.
    expect(adding.body).toContain(titled("Maya&#x27;s 30th"));
    expect(adding.cacheControl).toBe(plain.cacheControl);
  });

  it("★ the flag is honoured only where a name is: a private, unknown or ?private card never invites", async () => {
    getEventCardName.mockResolvedValue(null);
    const unnamed = await card(`https://partyreel.test/e/${QR}/card?add`);
    expect(unnamed.body).toContain(titled("A Partyreel event"));
    expect(unnamed.body).not.toContain("Add your photos");

    getEventCardName.mockResolvedValue(NAME);
    getEventCardName.mockClear();
    const privateAdd = await card(
      `https://partyreel.test/e/${QR}/card?private&add`,
    );
    expect(privateAdd.body).toContain(titled("A Partyreel event"));
    expect(privateAdd.body).not.toContain("Add your photos");
    expect(privateAdd.body).not.toContain("Maya");
    expect(getEventCardName).not.toHaveBeenCalled();
  });

  it("★ two viewers get the same bytes and headers, and nothing reads who is asking", async () => {
    getEventCardName.mockResolvedValue(NAME);
    const first = await card(`https://partyreel.test/e/${QR}/card`);
    // Whatever the second viewer carries (a block, a ticket, a session) never reaches the card: a
    // door that answered here would throw from the stubbed identity readers above.
    pageDoor.mockResolvedValue(shutDoor(guestEvent()));
    const second = await card(`https://partyreel.test/e/${QR}/card`);
    expect(second).toEqual(first);
    expect(requestIdentity).not.toHaveBeenCalled();
    expect(pageDoor).not.toHaveBeenCalled();
    expect(getEventByQrToken).not.toHaveBeenCalled();
  });
});

describe("the page's metadata: which card each viewer's page names", () => {
  it("an open album that takes photos names the event's own card, the inviting one", async () => {
    // Reshaped by crumbs-87. This read the bare `/card` for every open album, and its reason expired: the card's foot
    // now follows whether the album takes photos, by its address (`?add`). What this keeps: an open door names the
    // event's own card, never the private album's, by the canonical token.
    pageDoor.mockResolvedValue(openDoor(guestEvent()));
    const meta = await metadataFor(QR);
    expect(imageUrls(meta)).toEqual([`/e/${QR}/card?add`, `/e/${QR}/card?add`]);
  });

  it("★ an open album whose host closed uploads is the album to look through, in its title, its line and its card", async () => {
    pageDoor.mockResolvedValue(
      openDoor(guestEvent({ accepting_uploads: false })),
    );
    const meta = await metadataFor(QR);
    expect(meta.title).toBe(`Photos from ${NAME}`);
    expect(meta.description).toBe(
      "Photos and videos from the day. Take a look.",
    );
    // The plain card: no flag, so no invitation at the edge's hour of the old one.
    expect(imageUrls(meta)).toEqual([`/e/${QR}/card`, `/e/${QR}/card`]);
    // Nothing of it asks for what the page refuses, Open Graph and Twitter alike.
    expect(JSON.stringify(meta)).not.toMatch(/Add (yours|photos)/);
    expect(meta.openGraph?.title).toBe(meta.title);
  });

  it("an album that takes photos invites in its title and its line", async () => {
    pageDoor.mockResolvedValue(openDoor(guestEvent()));
    const meta = await metadataFor(QR);
    expect(meta.title).toBe(`Add photos to ${NAME}`);
    expect(meta.description).toBe("Photos and videos from the day. Add yours.");
  });

  it("a link to one photograph follows the album's state in its line, and keeps its own title and picture", async () => {
    // One photograph for each of the two asks below, never left behind for a test that names none.
    const item = {
      type: "photo" as const,
      originalKey: "events/e/o.jpg",
      previewKey: "events/e/p.webp",
      width: 800,
      height: 600,
    };
    vi.mocked(getOpenAlbumItemForCard)
      .mockResolvedValueOnce(item)
      .mockResolvedValueOnce(item);
    const photoId = "7d9c5d6e-2f4a-4b3c-8e1f-0a1b2c3d4e5f";
    // A photograph unfurls only where the link alone opens the whole album: no email step in front of an unfurler.
    pageDoor.mockResolvedValue(
      openDoor(guestEvent({ require_verified_email: false })),
    );
    const adding = await metadataFor(QR, { photo: photoId });
    expect(adding.title).toBe(`A photo from ${NAME}`);
    expect(adding.description).toBe(
      "Photos and videos from the day. Add yours.",
    );
    expect(imageUrls(adding)).toEqual([
      "https://r2.test/one-photo.webp",
      "https://r2.test/one-photo.webp",
    ]);

    pageDoor.mockResolvedValue(
      openDoor(
        guestEvent({ accepting_uploads: false, require_verified_email: false }),
      ),
    );
    const closed = await metadataFor(QR, { photo: photoId });
    expect(closed.title).toBe(`A photo from ${NAME}`);
    expect(closed.description).toBe(
      "Photos and videos from the day. Take a look.",
    );
    expect(JSON.stringify(closed)).not.toContain("Add yours");
  });

  /* ★ THE SIZE OF WHAT IT SERVES (crumbs-90, red-team 57b's NIT): the card declared the original's measures over the
     640-edge preview it serves, a shape and a size the unfurler never got. And an original no unfurler draws (a HEIC
     with no preview: the uploading browser could not decode it) is no picture, so the event's card stands. */
  describe("★ a photograph's card declares the size it serves", () => {
    const photoId = "7d9c5d6e-2f4a-4b3c-8e1f-0a1b2c3d4e5f";
    const ogImage = (meta: Awaited<ReturnType<typeof generateMetadata>>) => {
      const images = meta.openGraph?.images;
      return (Array.isArray(images) ? images[0] : images) as {
        url: string;
        width?: number;
        height?: number;
      };
    };
    const cardOf = async (item: {
      type: "photo" | "video";
      originalKey: string;
      previewKey: string | null;
      width: number | null;
      height: number | null;
    }) => {
      vi.mocked(getOpenAlbumItemForCard).mockResolvedValueOnce(item);
      pageDoor.mockResolvedValue(
        openDoor(guestEvent({ require_verified_email: false })),
      );
      return metadataFor(QR, { photo: photoId });
    };

    it.each([
      ["a phone's portrait photograph", "photo", 3024, 4032, 480, 640],
      ["a landscape one", "photo", 4032, 3024, 640, 480],
      ["a video's poster", "video", 1920, 1080, 640, 360],
    ] as const)(
      "%s: its preview's size, never the original's",
      async (_label, type, w, h, pw, ph) => {
        const meta = await cardOf({
          type,
          originalKey: "events/e/o.jpg",
          previewKey: "events/e/p.webp",
          width: w,
          height: h,
        });
        expect(ogImage(meta)).toMatchObject({ width: pw, height: ph });
      },
    );

    it("a photograph served as its original (no preview: already small) declares the original's own", async () => {
      const meta = await cardOf({
        type: "photo",
        originalKey: "events/e/o.png",
        previewKey: null,
        width: 600,
        height: 400,
      });
      expect(ogImage(meta)).toMatchObject({ width: 600, height: 400 });
    });

    it("declares no size where the upload measured none", async () => {
      const meta = await cardOf({
        type: "photo",
        originalKey: "events/e/o.jpg",
        previewKey: "events/e/p.webp",
        width: null,
        height: null,
      });
      expect(ogImage(meta)).not.toHaveProperty("width");
      expect(ogImage(meta)).not.toHaveProperty("height");
    });

    it.each(["events/e/o.heic", "events/e/o.HEIF", "events/e/o.avif"])(
      "★ an original no unfurler draws (%s, no preview) keeps the event's own card",
      async (originalKey) => {
        const meta = await cardOf({
          type: "photo",
          originalKey,
          previewKey: null,
          width: null,
          height: null,
        });
        expect(meta.title).not.toBe(`A photo from ${NAME}`);
        expect(imageUrls(meta)[0]).not.toContain("r2.test");
      },
    );
  });

  it("a password album's door names the event's own card too (its name is link-shared), never the inviting one", async () => {
    pageDoor.mockResolvedValue(
      openDoor(guestEvent({ visibility: "password", has_password: true })),
    );
    expect(imageUrls(await metadataFor(QR))).toEqual([
      `/e/${QR}/card`,
      `/e/${QR}/card`,
    ]);
  });

  it("★ a viewer the door shuts out is named the private album's card, never the event's", async () => {
    // A blocked ticket: the event reads open, the door is shut to this browser.
    pageDoor.mockResolvedValue(shutDoor(guestEvent()));
    const meta = await metadataFor(QR);
    expect(imageUrls(meta)).toEqual([
      `/e/${QR}/card?private`,
      `/e/${QR}/card?private`,
    ]);
    expect(meta.title).toBe("Private event");
    expect(JSON.stringify(meta)).not.toContain("Maya");
  });

  it("★ a block, a private album and a guest who was in name the same card in the same bytes", async () => {
    // The blocked ticket, on an open album.
    pageDoor.mockResolvedValue(shutDoor(guestEvent()));
    const blockedTicket = await metadataFor(QR);
    // A blocked account: the database reads the event as private (and nameless) to her.
    pageDoor.mockResolvedValue(
      shutDoor(guestEvent({ visibility: "private", name: "" })),
    );
    const blockedAccount = await metadataFor(QR);
    // Someone who was in, after the host made it Only me: the page adds its line, the tab does not.
    pageDoor.mockResolvedValue(
      shutDoor(guestEvent({ visibility: "private", name: "" }), true),
    );
    const previousGuest = await metadataFor(QR);
    // A private album, to anyone.
    pageDoor.mockResolvedValue(shutDoor(guestEvent({ visibility: "private" })));
    const privateAlbum = await metadataFor(QR);
    expect(blockedTicket).toEqual(privateAlbum);
    expect(blockedAccount).toEqual(privateAlbum);
    expect(previousGuest).toEqual(privateAlbum);
  });

  it("★ a gated album names its name, as a password album does, over the private album's card", async () => {
    // A newcomer at a door the host answers: the door re-read the name the anon read redacted.
    pageDoor.mockResolvedValue({
      decision: { kind: "newcomer", gate: "approve" },
      standing: {},
      event: guestEvent({ visibility: "private", door: "approve" }),
    });
    const meta = await metadataFor(QR);
    expect(meta.title).toBe(NAME);
    expect(imageUrls(meta)).toEqual([
      `/e/${QR}/card?private`,
      `/e/${QR}/card?private`,
    ]);
    // No invitation to add photos: the door stands first.
    expect(JSON.stringify(meta)).not.toContain("Add yours");
  });

  it("a closed door keeps the address the visitor arrived on (a slug is never swapped for the token)", async () => {
    pageDoor.mockResolvedValue(
      shutDoor(
        guestEvent({ visibility: "private", custom_slug: "mayas-30th" }),
      ),
    );
    const meta = await metadataFor("mayas-30th");
    expect(imageUrls(meta)).toEqual([
      "/e/mayas-30th/card?private",
      "/e/mayas-30th/card?private",
    ]);
    expect(JSON.stringify(meta)).not.toContain(QR);
  });

  it("an unknown link names no card of its own, titled as the 404 it is", async () => {
    // Reshaped by stale-link. It read "Join event" over the private album's card, which only a hydrated page ever
    // showed: the 404's own head, all an unfurler reads, already said "Event not found" over the site's card. The
    // page now draws its not-found itself and heads it with the not-found's metadata, before and after hydration.
    // What this keeps: an unknown link never names an event's card, since it has no event to name.
    pageDoor.mockResolvedValue(null);
    const meta = await metadataFor("nothing-here");
    expect(meta.title).toBe("Event not found");
    expect(imageUrls(meta)).toEqual([]);
  });
});
