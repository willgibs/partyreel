/**
 * THE GUESTS' VIEW IS A LOOK, NEVER A DOOR, AND NOTHING ON IT IS HERS (event-header r2, `rooms=over`).
 *
 * Her album as a let-in guest meets it, from the guest page's own pieces: pinned that the album and every control on
 * it are inert (nothing she presses there writes as a guest), that its live source is asked as a guest (never the
 * owner, nothing of hers, no ticket), that it mounts none of the guest page's hands (the door, the upload queue, the
 * keep, the claims, the tracker), that its one live control is the way back where it is a page of its own, and that
 * Only me is the shut door every guest meets. The guest page's pieces are stood in for: what each draws is its own
 * tests'; what is pinned is what the view hands them.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { act, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const live = vi.hoisted(() => ({
  provider: [] as unknown[],
  gallery: [] as unknown[],
  wait: [] as unknown[],
  /** What the cover was handed, each render. */
  cover: [] as Record<string, unknown>[],
  /** What the guests' live source says is waiting in the album (`GuestFullSync.waiting`), or null before it has a word. */
  waiting: null as { count: number } | null,
}));
vi.mock("@/components/guest/gallery-live", () => ({
  GalleryLiveProvider: (props: { children: ReactNode }) => {
    live.provider.push(props);
    return <div data-testid="live-source">{props.children}</div>;
  },
  useGalleryLive: () => (live.waiting ? { waiting: live.waiting } : null),
}));
vi.mock("@/components/guest/live-gallery", () => ({
  LiveGallery: (props: unknown) => {
    live.gallery.push(props);
    return <div data-testid="album" />;
  },
}));
vi.mock("@/components/guest/gallery-empty-state-wait", () => ({
  AlbumWaitSource: (props: { children: ReactNode }) => {
    live.wait.push(props);
    return <>{props.children}</>;
  },
  AlbumWait: () => <div data-testid="wait" />,
}));
vi.mock("@/components/guest/event-experience-head", () => ({
  AlbumCover: (props: {
    name: string;
    actions: ReactNode;
    eyebrow?: ReactNode;
  }) => {
    live.cover.push(props);
    const { name, actions, eyebrow } = props;
    return (
      <section data-testid="cover">
        {eyebrow ? <p data-testid="eyebrow">{eyebrow}</p> : null}
        <h1>{name}</h1>
        {actions}
      </section>
    );
  },
  CoverGround: () => null,
  createHeadBridge: () => ({
    get: () => null,
    subscribe: () => () => {},
    set: () => {},
  }),
}));
vi.mock("@/components/guest/guest-share", () => ({
  GuestShare: () => <button type="button">Invite</button>,
}));
vi.mock("@/components/guest/guest-action-dock", () => ({
  GuestActionDock: ({ onAdd }: { onAdd?: () => void }) => (
    <div data-testid="shutter" data-add={onAdd ? "yes" : "no"} />
  ),
}));
vi.mock("@/components/guest/report-dialog", () => ({
  ReportFoot: () => <footer>Report</footer>,
}));
vi.mock("@/components/guest/door/shut-door", () => ({
  ShutDoor: () => <h1>This album is closed</h1>,
}));
vi.mock("@/components/guest/door/album-light", () => ({
  AlbumLightSampler: () => null,
}));
vi.mock("@/components/guest/album-boundary", () => ({
  AlbumBoundary: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
vi.mock("@/components/guest/gallery-skeleton", () => ({
  GallerySkeleton: () => null,
}));
vi.mock("@/components/social/guest-list", () => ({
  GUEST_LIST_FACES_THRESHOLD: 12,
  GuestList: ({ items }: { items: unknown[] }) => (
    <ul data-testid="guests">{items.length}</ul>
  ),
}));
vi.mock("@/lib/guest/door-light", () => ({
  useDoorHues: () => ({ hues: [] }),
}));

// jsdom observes nothing: the shutter's and the album end's sentinels simply rest.
class Unobserved {
  observe() {}
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal("IntersectionObserver", Unobserved);

const { AsGuestView } = await import("./as-guest-view");

const EVENT = {
  id: "e1",
  qr_token: "a".repeat(32),
  name: "Maya & Jay",
  description: "Everything from the day.",
  event_date: "2026-10-03",
  host_display_name: "Maya",
  qr_style: "classic",
  accepting_uploads: true,
  show_reel: true,
  capture: "upload" as const,
  moderation_mode: "live" as "live" | "hold_for_approval",
  develops_at: null as string | null,
};

function view(over: Partial<Parameters<typeof AsGuestView>[0]> = {}) {
  return render(
    <AsGuestView
      event={EVENT}
      joinUrl="https://partyreel.test/e/abc"
      galleryPromise={new Promise(() => {})}
      stats={{ approvedTotal: 12, guestCount: 4 }}
      host={{ avatarUrl: null, seed: "s" }}
      guests={[{ kind: "unverified", id: "g1", displayName: "Theo" }] as never}
      shut={false}
      {...over}
    />,
  );
}

beforeEach(() => {
  live.provider.length = 0;
  live.gallery.length = 0;
  live.wait.length = 0;
  live.cover.length = 0;
  live.waiting = null;
});

describe("★ a look, never a door", () => {
  it("the album, its cover and every control on them are inert", () => {
    view();
    const album = document.querySelector("[data-guest-experience]");
    expect(album).toHaveAttribute("inert");
    for (const id of ["cover", "album", "shutter", "guests"]) {
      expect(album!.contains(screen.getByTestId(id)), id).toBe(true);
    }
    expect(
      album!.contains(screen.getByRole("button", { name: /add photos/i })),
    ).toBe(true);
  });

  it("★ its live source is asked as a guest: never the owner, nothing of hers, no ticket", () => {
    view();
    expect(live.provider).not.toHaveLength(0);
    expect(live.provider.at(-1)).toMatchObject({
      access: "full",
      isDemo: false,
      isOwner: false,
      isAuthed: false,
      canDeleteIds: [],
      sessionToken: null,
    });
    expect(live.gallery.at(-1)).toMatchObject({
      access: "full",
      isDemo: false,
    });
  });

  it("★ mounts none of the guest page's hands: no door, no upload queue, no keep, no claim, no tracker", () => {
    const src = readFileSync(
      join(process.cwd(), "src/components/app/share/as-guest-view.tsx"),
      "utf8",
    )
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "");
    for (const hand of [
      "EntryModal",
      "GuestUpload",
      "useUploadQueue",
      "UploadTracker",
      "useConfirmReturn",
      "ClaimAsk",
      "joinEvent",
      "GuestHeader",
      "LiveReel",
    ]) {
      expect(src, hand).not.toMatch(new RegExp(`\\b${hand}\\b`));
    }
  });
});

describe("its header", () => {
  it("framed over her hub, is a guest's with no account: inert, no way out of the frame", () => {
    view({ back: null });
    expect(
      screen.queryByRole("link", { name: /back to your hub/i }),
    ).toBeNull();
    const start = screen.getByRole("button", { name: /start for free/i });
    expect(start.closest("[inert]")).not.toBeNull();
  });

  it("as a page of its own, carries her one live control: the way back to her hub", () => {
    view({ back: "/dashboard/e1" });
    const back = screen.getByRole("link", { name: /back to your hub/i });
    expect(back).toHaveAttribute("href", "/dashboard/e1");
    expect(back.closest("[inert]")).toBeNull();
  });
});

describe("what a guest meets, as it stands", () => {
  it("uploads closed: no Add on the cover or the shutter, and the guest's own line", () => {
    view({ event: { ...EVENT, accepting_uploads: false } });
    expect(screen.queryByRole("button", { name: /add/i })).toBeNull();
    expect(screen.getByTestId("shutter")).toHaveAttribute("data-add", "no");
    expect(
      screen.getByText(/the host has closed uploads/i),
    ).toBeInTheDocument();
  });

  it("the album's camera says Take photos, as the guest page does", () => {
    view({ event: { ...EVENT, capture: "camera" } });
    expect(
      screen.getByRole("button", { name: /take photos/i }),
    ).toBeInTheDocument();
  });

  it("★ Only me is the shut door every guest meets, and no album at all", () => {
    view({ shut: true });
    expect(
      screen.getByRole("heading", { name: "This album is closed" }),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("album")).toBeNull();
    expect(live.provider).toHaveLength(0);
  });
});

/* THE COUNT NAMES WHAT THE ALBUM HOLDS, AS THE GUEST'S FIRST PAINT DOES (crumbs-74 on the guest page, crumbs-88 here): the
   cover's count is "12 photos" from the first byte, from the server's own count of the kinds (`stats.kinds`), and the live
   album's own words once it has told, both through the one function (`albumCountWords`, the cover's); this view never
   handed the cover either, so its count read "12 photos & videos" over twelve photographs. */
describe("★ the cover's count names its kinds, as the guest page's does", () => {
  const cover = () => live.cover.at(-1)!;
  const provider = () =>
    live.provider.at(-1) as { onCountWordsChange: (words: string) => void };

  it("hands the cover the server's own count of the kinds from the first render", () => {
    view({
      stats: {
        approvedTotal: 12,
        guestCount: 4,
        kinds: { photos: 12, videos: 0 },
      },
    });
    expect(cover()).toMatchObject({
      mediaCount: 12,
      mediaKinds: { photos: 12, videos: 0 },
    });
    // The live album has told nothing yet: the words are the kinds', not a told string.
    expect(cover().mediaWords).toBeUndefined();
  });

  it("names none where the server could not count them (the cover then says both nouns, as it always did)", () => {
    view({ stats: { approvedTotal: 12, guestCount: 4 } });
    expect(cover().mediaKinds).toBeNull();
    view({ stats: { approvedTotal: 12, guestCount: 4, kinds: null } });
    expect(cover().mediaKinds).toBeNull();
  });

  it("★ takes the live album's own words once it has told, so the first paint and the live source never disagree", () => {
    view({
      stats: {
        approvedTotal: 12,
        guestCount: 4,
        kinds: { photos: 12, videos: 0 },
      },
    });
    act(() => provider().onCountWordsChange("13 photos & videos"));
    expect(cover().mediaWords).toBe("13 photos & videos");
  });
});

/* WHAT WAITS, AS A GUEST MEETS IT (wait-wiring, the-wait r1's `wait=sheet` and `name=disposable`): a guest meets the
   contact sheet wherever photos wait and the cover's preset words on a disposable; her look is that page, so it mounts
   the guests' wait over the album (numbers only, off the guests' own live source; nothing of hers) and names the preset.
   Without it, a waiting album read here as the empty album, which no guest sees. */
describe("★ what waits, as a guest meets it", () => {
  type Source = { clock: unknown; hers: unknown; rule?: boolean };
  const source = () => live.wait.at(-1) as Source;
  const AHEAD = new Date(Date.now() + 6 * 3_600_000).toISOString();

  it("★ a disposable: the guests' sheet over the album, its clock the develop, and the cover names the preset", () => {
    view({
      event: { ...EVENT, capture: "camera", develops_at: AHEAD },
    });
    expect(screen.getByTestId("wait")).toBeInTheDocument();
    expect(source().clock).toEqual({ kind: "develop", developsAt: AHEAD });
    // Nothing of hers: no ticket, so no shots of her own to light.
    expect(source().hers).toBeNull();
    // Before anything waits, the album's rule is a guest's to read where she can add.
    expect(source().rule).toBe(true);
    expect(screen.getByTestId("eyebrow").textContent).toMatch(/^Disposable/);
  });

  it("a reviewed album waits as the host lets each in, with no word over its name", () => {
    view({ event: { ...EVENT, moderation_mode: "hold_for_approval" } });
    expect(source().clock).toEqual({ kind: "held", hostName: "Maya" });
    expect(screen.queryByTestId("eyebrow")).toBeNull();
  });

  it("a live album waits for nothing; uploads closed, no rule", () => {
    view({ event: { ...EVENT, accepting_uploads: false } });
    expect(source().clock).toBeNull();
    expect(source().rule).toBe(false);
  });
});

/* ★ THE COVER'S ADD SAYS WHAT A NEWCOMER'S DOES (red-team 46's NIT): "Take the first photo" stood over 102 developing
   shots here, where a real newcomer to the same album reads "Take photos". The guest page says "the first photo" only
   over an album nothing has been added to, visible or waiting (`waitingOnArrival`, `albumWaits`: the same fact the
   album's sync tells any guest at full access, `waiting.count`); this view reads that fact off the guests' own live
   source and says the same words (`addWords`, the one home of them). */
describe("★ the cover's Add says what a newcomer's does", () => {
  const AHEAD = new Date(Date.now() + 6 * 3_600_000).toISOString();
  const add = () => screen.getByRole("button", { name: /photo/i });
  const nothingVisible = { approvedTotal: 0, guestCount: 4 };

  it("★ over shots that are developing the camera says Take photos, never the first photo", () => {
    live.waiting = { count: 102 };
    view({
      event: { ...EVENT, capture: "camera", develops_at: AHEAD },
      stats: nothingVisible,
    });
    expect(add()).toHaveTextContent(/^Take photos$/);
    expect(screen.queryByText(/first photo/i)).toBeNull();
  });

  it("an album that takes uploads says Add photos over what waits for the host, as a newcomer reads it", () => {
    live.waiting = { count: 5 };
    view({
      event: { ...EVENT, moderation_mode: "hold_for_approval" },
      stats: nothingVisible,
    });
    expect(add()).toHaveTextContent(/^Add photos$/);
  });

  it("★ over an album nothing has been added to, visible or waiting, it is still the first photo", () => {
    live.waiting = { count: 0 };
    const camera = view({
      event: { ...EVENT, capture: "camera" },
      stats: nothingVisible,
    });
    expect(add()).toHaveTextContent(/^Take the first photo$/);
    camera.unmount();
    view({ stats: nothingVisible });
    expect(add()).toHaveTextContent(/^Add the first photo$/);
  });

  it("before the source has a word, the Add stands on the visible count alone, as every album's did", () => {
    live.waiting = null;
    view({ stats: nothingVisible });
    expect(add()).toHaveTextContent(/^Add the first photo$/);
  });

  it("anything visible is Add photos, whatever waits", () => {
    live.waiting = { count: 0 };
    view({
      event: { ...EVENT, capture: "camera" },
      stats: { approvedTotal: 3, guestCount: 4 },
    });
    expect(add()).toHaveTextContent(/^Take photos$/);
  });

  it("★ and it moves with the source: shots that begin to wait take the first photo off the Add", () => {
    live.waiting = { count: 0 };
    const { rerender } = view({ stats: nothingVisible });
    expect(add()).toHaveTextContent(/^Add the first photo$/);
    live.waiting = { count: 1 };
    rerender(
      <AsGuestView
        event={EVENT}
        joinUrl="https://partyreel.test/e/abc"
        galleryPromise={new Promise(() => {})}
        stats={nothingVisible}
        host={{ avatarUrl: null, seed: "s" }}
        guests={[]}
        shut={false}
      />,
    );
    expect(add()).toHaveTextContent(/^Add photos$/);
  });
});

/* ★ THE ORDER EVERY GUEST MEETS (event-zone; the ROADMAP's "as-guest-view.tsx hands LiveGallery no order"): the album is
   handed the guest page's own order over the server's word, the turn an instant, and turns with it while she looks;
   nothing here can choose one, so a choice writes nothing on her device. */
describe("★ the album in the order every guest meets", () => {
  const MORNING = Date.parse("2026-10-03T20:00:00Z");

  it("after the party's morning the album is handed the night in order", () => {
    view({
      albumOrder: { morningAfter: MORNING, own: "oldest", chosen: null },
    });
    const order = (live.gallery.at(-1) as { order?: { sort: string } }).order;
    expect(order?.sort).toBe("oldest");
  });

  it("before it, newest first; and with no word from the server, newest first as before", () => {
    view({
      albumOrder: {
        morningAfter: Date.now() + 86_400_000,
        own: "newest",
        chosen: null,
      },
    });
    expect(
      (live.gallery.at(-1) as { order?: { sort: string } }).order?.sort,
    ).toBe("newest");
    view();
    expect(
      (live.gallery.at(-1) as { order?: { sort: string } }).order?.sort,
    ).toBe("newest");
  });

  it("a choice from the inert album writes nothing: no guest's remembered order lands on her device", () => {
    // A guest's remembered order is a `Path=/e` cookie: read it from an album's own address, where it would show.
    window.history.replaceState(null, "", `/e/${EVENT.qr_token}`);
    try {
      document.cookie = "pr_album_sort=; Path=/e; Max-Age=0";
      view({
        albumOrder: { morningAfter: MORNING, own: "oldest", chosen: null },
      });
      const order = (
        live.gallery.at(-1) as { order: { choose: (s: string) => void } }
      ).order;
      order.choose("newest");
      expect(document.cookie).not.toContain("pr_album_sort");
      // The probe itself can see the cookie here: a guest's own choice would have shown.
      document.cookie = "pr_album_sort=probe; Path=/e";
      expect(document.cookie).toContain("pr_album_sort=probe");
    } finally {
      document.cookie = "pr_album_sort=; Path=/e; Max-Age=0";
      window.history.replaceState(null, "", "/");
    }
  });
});
