/**
 * THE HIGHLIGHT REEL'S CARD COUNTS TO TWO, THEN OPENS THE VIEW (`reel-host`, Will 2026-09-25:
 * `progress=card`, `home=view`).
 *
 * Pinned by what each face DOES, never how it looks: before two a press opens guidance (what is
 * left, Add photos, and on a moderated event the approval rule), never an empty reel; from two
 * the card is a link into the view the guests watch; switched off it opens Settings, where the
 * switch lives. Copy is precedent, not contract, except the count, which is the point.
 *
 * ★ RESHAPED ON PURPOSE (event-header r4's cards over the seam, Will's pick): the card is a plain card among the doors, so
 * the living stills behind the live card, the one photograph under the counting card's overlay, the pips and the pill's
 * `sr-only` line are gone with the picture they belonged to, and with them the card's ask of the server for the reel's own
 * take as the album moved (nothing on the card draws it). What those pins guarded and still holds: the card never says
 * "live for guests" over an album whose guests see nothing yet (and her own reel plays over her hub meanwhile), the pill
 * keeps its words for a reader (now the door's accessible name, which carries its line in both forms), and Settings' switch
 * wins over whatever the album's count says.
 */
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { HubAlbumSeed } from "@/lib/event/hub-album";
import {
  ENTRY_REEL,
  type HostSyncBody,
  type ManifestEntry,
} from "@/lib/events/album-wire";

import { HostAlbumProvider } from "./host-album";
import {
  ReelCard,
  reelCardFace,
  useLiveReel,
  type ReelCardData,
} from "./reel-card";

const openAdd = vi.fn();
const openSheet = vi.fn();

vi.mock("@/components/app/host-add-provider", () => ({
  useHostAdd: () => ({ openAdd }),
}));
vi.mock("@/components/app/share/event-share-provider", () => ({
  useEventShare: () => ({ openSheet }),
}));

// The reel view's chunk, counted as it loads: the live card's press warms it (a module loads once).
const viewLoads = vi.hoisted(() => ({ count: 0 }));
vi.mock("@/components/guest/reel/live-reel-view", () => {
  viewLoads.count += 1;
  return { LiveReelView: () => null };
});

// The hub's own view chunk (the reel she plays over her hub before the develop): the card only asks for it on intent.
const warmHub = vi.hoisted(() => vi.fn());
vi.mock("./hub-reel-view", () => ({ warmHubReelView: () => warmHub() }));

// The hub's server actions, which the album's store (not the card) holds: none of them is asked here.
vi.mock("@/app/(app)/dashboard/[eventId]/actions", () => ({}));

// The album store's live channel.
vi.mock("@/lib/guest/use-gallery-doorbell", () => ({
  useGalleryDoorbell: () => ({ live: false }),
}));
const polls: (() => HostSyncBody | null)[] = [];
vi.mock("@/lib/album/transport", () => ({
  hostAlbumTransport: () => ({
    sync: async () => {
      const next = polls.shift()?.() ?? null;
      return next
        ? { status: 200, etag: '"a1-next"', body: next }
        : { status: 304 };
    },
    manifest: async () => {
      throw new Error("no pages");
    },
    links: async () => {
      throw new Error("no links");
    },
  }),
}));

beforeEach(() => {
  openAdd.mockReset();
  openSheet.mockReset();
  warmHub.mockReset();
});

const base: ReelCardData = {
  state: "counting",
  have: 0,
  of: 2,
  viewHref: "/e/token123?reel",
  moderated: false,
  pending: 0,
};

async function openGuidance() {
  const trigger = screen.getByRole("button", { name: /highlight reel/i });
  fireEvent.pointerDown(trigger, { ctrlKey: false, button: 0 });
  fireEvent.click(trigger);
  await waitFor(() =>
    expect(document.querySelector("[data-reel-guidance]")).not.toBeNull(),
  );
  return document.querySelector("[data-reel-guidance]") as HTMLElement;
}

describe("the card's words, one pure function of the reel's state", () => {
  it("counts to two, then says it is live, and says Off when it is off", () => {
    expect(reelCardFace("counting", 0, 2, false)).toBe("Starts at 2 photos");
    expect(reelCardFace("counting", 1, 2, false)).toBe("1 more photo");
    expect(reelCardFace("live", 2, 2, false)).toBe("Live for guests");
    expect(reelCardFace("off", 2, 2, false)).toBe("Off");
  });

  it("★ never says it is live for guests while the develop is ahead: guests get it later", () => {
    // Red-team 43's NIT: on a sealed album every guest's reel is empty until the develop.
    expect(reelCardFace("live", 2, 2, true)).toBe("Guests get it later");
    // And a counting or switched-off card has nothing to add about the develop.
    expect(reelCardFace("counting", 1, 2, true)).toBe("1 more photo");
    expect(reelCardFace("off", 2, 2, true)).toBe("Off");
  });
});

describe("a door among the doors", () => {
  it("★ names itself with its line in every face, so a reader hears the reel once, in either form of the row", () => {
    // The pill once hid its line from a reader (red-team 53's LOW): the name, not a piece inside, carries it now.
    const { unmount } = render(
      <ReelCard eventId="e1" reel={{ ...base, state: "live", have: 2 }} />,
    );
    expect(
      screen.getByRole("link", { name: "Highlight reel: Live for guests" }),
    ).toBeInTheDocument();
    unmount();
    const { unmount: second } = render(
      <ReelCard eventId="e1" reel={{ ...base, state: "off" }} />,
    );
    expect(
      screen.getByRole("link", { name: "Highlight reel: Off" }),
    ).toBeInTheDocument();
    second();
    render(<ReelCard eventId="e1" reel={{ ...base, have: 1 }} />);
    expect(
      screen.getByRole("button", { name: "Highlight reel: 1 more photo" }),
    ).toBeInTheDocument();
  });

  it("wears the row's door hooks, and its violet glyph is its one mark of its own", () => {
    render(
      <ReelCard eventId="e1" reel={{ ...base, state: "live", have: 2 }} />,
    );
    const door = screen.getByRole("link");
    expect(door).toHaveAttribute("data-hub-door", "reel");
    expect(door).toHaveClass("hub-door");
    expect(door.querySelector(".hub-door-reel")).not.toBeNull();
    // Both forms' pieces are in the one element: the fold carries them (`event-cards-row-fold.ts`).
    for (const piece of ["skin", "disc", "glyph", "title", "text", "word"]) {
      expect(
        door.querySelector(`[data-fold="${piece}"]`),
        piece,
      ).not.toBeNull();
    }
  });

  it("draws no picture: the reel's stills, where a fixture still hands them, are read by nobody", () => {
    render(
      <ReelCard
        eventId="e1"
        reel={{
          ...base,
          state: "live",
          have: 2,
          stills: ["s1", "s2"],
          stillIds: ["a", "b"],
        }}
      />,
    );
    expect(document.querySelector("img")).toBeNull();
    expect(document.querySelector("[data-living]")).toBeNull();
  });
});

describe("before two, the card is guidance", () => {
  it("says how far off the reel is, at none and at one", () => {
    const { unmount } = render(<ReelCard eventId="e1" reel={base} />);
    expect(screen.getByRole("button")).toHaveTextContent("Starts at 2 photos");
    unmount();

    render(<ReelCard eventId="e1" reel={{ ...base, have: 1 }} />);
    expect(screen.getByRole("button")).toHaveTextContent("1 more photo");
  });

  it("opens guidance with Add photos, which opens the album's upload panel", async () => {
    render(<ReelCard eventId="e1" reel={{ ...base, have: 1 }} />);
    const guidance = await openGuidance();
    expect(guidance).toHaveTextContent(
      "1 more photo starts your highlight reel",
    );
    // Not a moderated event: nothing about approval.
    expect(guidance).not.toHaveTextContent(/approve/i);
    fireEvent.click(screen.getByRole("button", { name: /add photos/i }));
    expect(openAdd).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(document.querySelector("[data-reel-guidance]")).toBeNull(),
    );
  });

  // ★ crumbs-45, build 36's red-team: the guidance handed focus back with a plain focus() at the end of its exit,
  // which scrolled the card into view and cut the smooth scroll toward the panel short (the dropzone stopped 9 to
  // 21 px under a 375x667 fold). Focus still goes home; only never by a focus that moves the page.
  it("★ Add photos takes focus home to the card without moving the page, so the scroll to the panel lands", async () => {
    render(<ReelCard eventId="e1" reel={{ ...base, have: 1 }} />);
    await openGuidance();
    const card = screen.getByRole("button", { name: /highlight reel/i });
    const focus = vi.spyOn(card, "focus");
    fireEvent.click(screen.getByRole("button", { name: /add photos/i }));
    await waitFor(() =>
      expect(document.querySelector("[data-reel-guidance]")).toBeNull(),
    );
    expect(document.activeElement).toBe(card);
    expect(focus).toHaveBeenCalled();
    for (const [options] of focus.mock.calls)
      expect(options).toEqual({ preventScroll: true });
  });

  it("any other close hands focus back to the card as it always did", async () => {
    render(<ReelCard eventId="e1" reel={{ ...base, have: 1 }} />);
    // Add photos once, so a close that follows can never inherit its unscrolled return.
    await openGuidance();
    fireEvent.click(screen.getByRole("button", { name: /add photos/i }));
    await waitFor(() =>
      expect(document.querySelector("[data-reel-guidance]")).toBeNull(),
    );
    const guidance = await openGuidance();
    const card = screen.getByRole("button", { name: /highlight reel/i });
    const focus = vi.spyOn(card, "focus");
    fireEvent.keyDown(guidance, { key: "Escape" });
    await waitFor(() =>
      expect(document.querySelector("[data-reel-guidance]")).toBeNull(),
    );
    expect(document.activeElement).toBe(card);
    expect(focus.mock.calls.some(([options]) => options === undefined)).toBe(
      true,
    );
  });

  it("on a moderated event, says guests' photos count once approved, and points at the queue", async () => {
    render(
      <ReelCard eventId="e1" reel={{ ...base, moderated: true, pending: 3 }} />,
    );
    const guidance = await openGuidance();
    expect(guidance).toHaveTextContent(/count once you approve them/i);
    const review = screen.getByRole("link", { name: /3 waiting in review/i });
    // Review stands over the hub (event-header r2, `rooms=over`): the link is its real address, and a press opens it
    // in place.
    expect(review).toHaveAttribute("href", "/dashboard/e1?room=review");
    fireEvent.click(review);
    expect(openSheet).toHaveBeenCalledWith("review");
  });

  it("points at no queue that is not there", async () => {
    render(
      <ReelCard eventId="e1" reel={{ ...base, moderated: true, pending: 0 }} />,
    );
    await openGuidance();
    expect(screen.queryByRole("link", { name: /in review/i })).toBeNull();
  });
});

describe("from two, the card is the door to the view", () => {
  it("links into the view the guests watch", () => {
    render(
      <ReelCard eventId="e1" reel={{ ...base, state: "live", have: 2 }} />,
    );
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/e/token123?reel");
    expect(link).toHaveTextContent("Highlight reel");
  });
});

/**
 * ★ THE PRESS WARMS THE VIEW (crumbs-52): the card is a soft navigation, and the view's chunk, which the album asks
 * for only once it has mounted, is what the reel's black waits on after the page commits. A plain press asks for it
 * at once, so it lands inside the album's server render; the card stays a real link into the album.
 */
describe("the live card's press", () => {
  const liveCard = (
    <ReelCard eventId="e1" reel={{ ...base, state: "live", have: 2 }} />
  );
  // jsdom has no navigation: the browser's own is what a click on a link leaves standing.
  const stopNavigation = (e: Event) => e.preventDefault();
  beforeEach(() => document.addEventListener("click", stopNavigation));
  afterEach(() => document.removeEventListener("click", stopNavigation));
  const settle = () =>
    act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });

  // First, since a chunk that has loaded stays loaded for the rest of the file.
  it("a modified click opens a tab that loads its own: nothing is warmed here", async () => {
    render(liveCard);
    fireEvent.click(screen.getByRole("link"), { button: 0, metaKey: true });
    fireEvent.click(screen.getByRole("link"), { button: 0, shiftKey: true });
    fireEvent.click(screen.getByRole("link"), { button: 1 });
    await settle();
    expect(viewLoads.count).toBe(0);
  });

  it("★ a plain press asks for the reel view's chunk, and the card stays a link into the album", async () => {
    render(liveCard);
    const link = screen.getByRole("link");
    fireEvent.click(link, { button: 0 });
    await waitFor(() => expect(viewLoads.count).toBe(1));
    expect(link).toHaveAttribute("href", "/e/token123?reel");
  });
});

/**
 * ★ WHAT IS TRUE UNTIL THE DEVELOP (crumbs-52; red-team 43's NIT: "the Highlight reel card reads 'Live for guests' on a
 * sealed album whose guests see no photograph"). On an album whose develop time is ahead every guest's reel is empty
 * until it, so the live card never says it is live for guests then: it says guests get it later, and says
 * "Live for guests" again the moment the time is reached, with no reload. ★ RESHAPED ON PURPOSE (Will's Q5, 2026-10-04:
 * "the live reel is the host's to play from her own event page as soon as she opens it, even while the album develops;
 * guests don't have it until the develop"): this pinned "Live at the develop" over a card that opened the guests' view;
 * the scar is kept (the words stay true of the guests), and what changed is that the reel is hers now, so a press plays
 * it over her hub, because the guests' view (hers included) has none to open until the develop. The page hands the time
 * (`developsAt`); an album with none, or one reached, reads and opens as it always has.
 */
describe("the live card on an album that develops later", () => {
  const liveCard = (developsAt?: string | null) => (
    <ReelCard
      eventId="e1"
      reel={{ ...base, state: "live", have: 2, developsAt }}
    />
  );
  const ahead = (ms: number) => new Date(Date.now() + ms).toISOString();
  // jsdom has no navigation: the browser's own is what a click on a link leaves standing.
  const stopNavigation = (e: Event) => e.preventDefault();
  beforeEach(() => document.addEventListener("click", stopNavigation));
  afterEach(() => {
    document.removeEventListener("click", stopNavigation);
    window.history.replaceState(null, "", "/");
  });

  it("★ says guests get it later, never that it is live for them, and plays her own reel on her own page", () => {
    render(liveCard(ahead(3_600_000)));
    const link = screen.getByRole("link");
    expect(link).toHaveTextContent("Guests get it later");
    expect(link).not.toHaveTextContent("Live for guests");
    expect(link).not.toHaveTextContent("Live at the develop");
    // Her hub's own address, which opens on the reel: the guests' view has no reel to open yet.
    expect(link).toHaveAttribute("href", "/dashboard/e1?reel");
    expect(link).toHaveAttribute("data-reel-plays", "hub");
  });

  // ★ RED-TEAM 53's LOW (crumbs-65): "at 375 the Reel card hides 'Guests get it later'". The one state that hid it was the
  // pill the row condenses to when it sticks to the bar, where the line was `display: none` for everyone, a reader
  // included. The door's name carries its line in every form of the row now, so a reader of the pill hears it whole.
  it.each([
    [
      "live, before the develop",
      () => ({
        state: "live" as const,
        have: 2,
        developsAt: ahead(3_600_000),
      }),
      "Highlight reel: Guests get it later",
    ],
    [
      "live, with no develop ahead",
      () => ({ state: "live" as const, have: 2 }),
      "Highlight reel: Live for guests",
    ],
    ["switched off", () => ({ state: "off" as const }), "Highlight reel: Off"],
    [
      "counting",
      () => ({ state: "counting" as const, have: 1 }),
      "Highlight reel: 1 more photo",
    ],
  ])(
    "★ the %s door's name says its line, whichever form the row is in",
    (_name, over, name) => {
      render(<ReelCard eventId="e1" reel={{ ...base, ...over() }} />);
      expect(screen.getByLabelText(name)).toBeInTheDocument();
    },
  );

  it("says what it always has, and opens the guests' view, with no develop time or one reached", () => {
    const { unmount } = render(liveCard(null));
    expect(screen.getByRole("link")).toHaveTextContent("Live for guests");
    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "/e/token123?reel",
    );
    unmount();
    const { unmount: second } = render(liveCard(undefined));
    expect(screen.getByRole("link")).toHaveTextContent("Live for guests");
    second();
    render(liveCard(ahead(-60_000)));
    expect(screen.getByRole("link")).toHaveTextContent("Live for guests");
    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "/e/token123?reel",
    );
  });

  it("★ turns to live for guests, and to the guests' view, the moment the develop time comes, with the hub left open", () => {
    vi.useFakeTimers();
    try {
      render(liveCard(ahead(90_000)));
      expect(screen.getByRole("link")).toHaveTextContent("Guests get it later");
      act(() => {
        vi.advanceTimersByTime(89_000);
      });
      expect(screen.getByRole("link")).toHaveTextContent("Guests get it later");
      expect(screen.getByRole("link")).toHaveAttribute(
        "href",
        "/dashboard/e1?reel",
      );
      act(() => {
        vi.advanceTimersByTime(2_000);
      });
      expect(screen.getByRole("link")).toHaveTextContent("Live for guests");
      expect(screen.getByRole("link")).toHaveAttribute(
        "href",
        "/e/token123?reel",
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it("★ a plain press asks for `?reel` on her own hub (the reel plays over it), never for the guests' page", () => {
    render(liveCard(ahead(3_600_000)));
    expect(window.location.search).toBe("");
    fireEvent.click(screen.getByRole("link"), { button: 0 });
    expect(window.location.search).toBe("?reel");
    expect(window.location.pathname).toBe("/");
    // The view's chunk was asked for with the press.
    expect(warmHub).toHaveBeenCalled();
  });

  it("a modified click stays the honest navigation: the hub in a tab of its own, opening on the reel", () => {
    render(liveCard(ahead(3_600_000)));
    for (const mods of [
      { metaKey: true },
      { ctrlKey: true },
      { shiftKey: true },
    ]) {
      fireEvent.click(screen.getByRole("link"), { button: 0, ...mods });
    }
    fireEvent.click(screen.getByRole("link"), { button: 1 });
    expect(window.location.search).toBe("");
    expect(warmHub).not.toHaveBeenCalled();
  });

  it("asks for the view's chunk as a pointer comes over it or a key lands on it, so the press opens at once", () => {
    render(liveCard(ahead(3_600_000)));
    fireEvent.pointerEnter(screen.getByRole("link"));
    expect(warmHub).toHaveBeenCalledTimes(1);
    fireEvent.focus(screen.getByRole("link"));
    expect(warmHub).toHaveBeenCalledTimes(2);
  });

  it("asks for nothing of the hub's when the develop is behind it: the guests' view is what a press opens", () => {
    render(liveCard(null));
    fireEvent.pointerEnter(screen.getByRole("link"));
    fireEvent.click(screen.getByRole("link"), { button: 0 });
    expect(warmHub).not.toHaveBeenCalled();
    expect(window.location.search).toBe("");
  });
});

describe("switched off, the card opens Settings", () => {
  it("carries the real Settings URL and opens the sheet on a plain click", () => {
    render(<ReelCard eventId="e1" reel={{ ...base, state: "off" }} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/dashboard/e1?room=settings");
    expect(link).toHaveTextContent("Off");
    fireEvent.click(link, { button: 0 });
    expect(openSheet).toHaveBeenCalledWith("settings");
  });

  it("lets a modified click be a real navigation", () => {
    render(<ReelCard eventId="e1" reel={{ ...base, state: "off" }} />);
    // The browser's own navigation is what a modified click leaves standing; jsdom has none.
    const stopNavigation = (e: Event) => e.preventDefault();
    document.addEventListener("click", stopNavigation);
    fireEvent.click(screen.getByRole("link"), { button: 0, metaKey: true });
    document.removeEventListener("click", stopNavigation);
    expect(openSheet).not.toHaveBeenCalled();
  });
});

/**
 * THE CARD FOLLOWS THE ALBUM (album-host-wiring: the hub is never refreshed to show an arrival).
 * The second playable photograph arrives as a delta on the album's store and the card flips to live on it, with the
 * count full; and Settings' switch, which re-renders the page with a new face, wins over what the album says.
 */
describe("the live card", () => {
  const id = (n: number) =>
    `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
  const entry = (n: number): ManifestEntry => [
    id(n),
    400,
    300,
    ENTRY_REEL,
    1_758_800_000_000_000 + n,
  ];
  const seed: HubAlbumSeed = {
    eventId: "e1",
    sync: {
      kind: "manifest",
      v: 1,
      attr: 0,
      entries: [entry(1)],
      next: null,
      ok: true,
      counts: { album: 1, pending: 0 },
    },
    etag: '"a1-seed"',
    links: {
      ok: true,
      access: "full",
      gate: null,
      b: 0,
      now: 0,
      links: [],
      missing: [],
      likes: {},
    },
  };
  const served: ReelCardData = { ...base, state: "counting", have: 1 };

  function Probe({ face = served }: { face?: ReelCardData }) {
    const reel = useLiveReel(face);
    return (
      <span data-testid="card">
        {reel.state}:{reel.have}
      </span>
    );
  }

  const delta = (n: number): HostSyncBody => ({
    kind: "delta",
    v: 2,
    attr: 0,
    upsert: [entry(n)],
    remove: [],
    ok: true,
    counts: { album: 2, pending: 0 },
  });

  it("flips to live on the second photograph's delta, with nothing asked of the server", async () => {
    polls.length = 0;
    // The page's catch-up poll brings the second photograph.
    polls.push(() => delta(2));
    render(
      <HostAlbumProvider seed={seed} qrToken="qr">
        <Probe />
      </HostAlbumProvider>,
    );
    expect(screen.getByTestId("card")).toHaveTextContent("counting:1");
    await waitFor(() =>
      expect(screen.getByTestId("card")).toHaveTextContent("live:2"),
    );
  });

  // ★ THE PAGE'S FACE WINS WHEN IT CHANGES. Settings' switch saves and re-renders the page, which hands the card a new
  // face: a card that went live on the album's own count must then say Off (it kept "live" until a reload, the scar), and
  // switched back on it says what the album says. The card holds no face of its own to go stale.
  it("says Off the moment the page's face does, and what the album says when switched back on", async () => {
    polls.length = 0;
    polls.push(() => delta(2));

    const { rerender } = render(
      <HostAlbumProvider seed={seed} qrToken="qr">
        <Probe />
      </HostAlbumProvider>,
    );
    await waitFor(() =>
      expect(screen.getByTestId("card")).toHaveTextContent("live:2"),
    );

    // Switched off in Settings: the page renders again with the switch's word.
    rerender(
      <HostAlbumProvider seed={seed} qrToken="qr">
        <Probe face={{ ...base, state: "off", have: 2 }} />
      </HostAlbumProvider>,
    );
    expect(screen.getByTestId("card")).toHaveTextContent("off:2");

    // Switched back on: the album's own count again.
    rerender(
      <HostAlbumProvider seed={seed} qrToken="qr">
        <Probe face={{ ...base, state: "live", have: 2 }} />
      </HostAlbumProvider>,
    );
    expect(screen.getByTestId("card")).toHaveTextContent("live:2");
  });

  it("is the page's own face where there is no album store to read", () => {
    render(<Probe face={{ ...base, state: "live", have: 2 }} />);
    expect(screen.getByTestId("card")).toHaveTextContent("live:2");
  });
});
