/**
 * THE HIGHLIGHT REEL'S CARD COUNTS TO TWO, THEN OPENS THE VIEW (`reel-host`, Will 2026-09-25:
 * `progress=card`, `home=view`).
 *
 * Pinned by what each face DOES, never how it looks: before two a press opens guidance (what is
 * left, Add photos, and on a moderated event the approval rule), never an empty reel; from two
 * the card is a link into the view the guests watch; switched off it opens Settings, where the
 * switch lives. Copy is precedent, not contract, except the count, which is the point.
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
import { ReelCard, useLiveReel, type ReelCardData } from "./reel-card";

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

// The live card's one server read, and the album store's live channel.
const refreshHubReelAction = vi.fn();
vi.mock("@/app/(app)/dashboard/[eventId]/actions", () => ({
  refreshHubReelAction: (...a: unknown[]) => refreshHubReelAction(...a),
}));
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

// jsdom has no IntersectionObserver; the living card's clock asks one whether it is on screen.
class NoopObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

beforeEach(() => {
  openAdd.mockReset();
  openSheet.mockReset();
  warmHub.mockReset();
  vi.stubGlobal("IntersectionObserver", NoopObserver);
});

const base: ReelCardData = {
  state: "counting",
  have: 0,
  of: 2,
  stills: [],
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

describe("before two, the card is guidance", () => {
  it("says how far off the reel is, at none and at one", () => {
    const { unmount } = render(
      <ReelCard eventId="e1" reel={base} stuck={false} />,
    );
    expect(screen.getByRole("button")).toHaveTextContent("Starts at 2 photos");
    expect(document.querySelector("[data-reel-pips='0/2']")).not.toBeNull();
    unmount();

    render(
      <ReelCard
        eventId="e1"
        reel={{ ...base, have: 1, stills: ["preview-1"] }}
        stuck={false}
      />,
    );
    expect(screen.getByRole("button")).toHaveTextContent("1 more photo");
    // The one photo it has sits under the card's overlay.
    expect(document.querySelector("img")?.getAttribute("src")).toBe(
      "preview-1",
    );
    expect(document.querySelector("[data-reel-pips='1/2']")).not.toBeNull();
  });

  it("opens guidance with Add photos, which opens the album's upload panel", async () => {
    render(<ReelCard eventId="e1" reel={{ ...base, have: 1 }} stuck={false} />);
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
    render(<ReelCard eventId="e1" reel={{ ...base, have: 1 }} stuck={false} />);
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
    render(<ReelCard eventId="e1" reel={{ ...base, have: 1 }} stuck={false} />);
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
      <ReelCard
        eventId="e1"
        reel={{ ...base, moderated: true, pending: 3 }}
        stuck={false}
      />,
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
      <ReelCard
        eventId="e1"
        reel={{ ...base, moderated: true, pending: 0 }}
        stuck={false}
      />,
    );
    await openGuidance();
    expect(screen.queryByRole("link", { name: /in review/i })).toBeNull();
  });
});

describe("from two, the card is the door to the view", () => {
  it("links into the view the guests watch, over the reel's own stills", () => {
    render(
      <ReelCard
        eventId="e1"
        reel={{
          ...base,
          state: "live",
          have: 2,
          stills: ["s1", "s2", "s3", "s4"],
        }}
        stuck={false}
      />,
    );
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/e/token123?reel");
    expect(link).toHaveTextContent("Highlight reel");
    expect(document.querySelector("[data-living='4']")).not.toBeNull();
  });

  it("condenses to a plain pill when stuck to the bar, the living stills set aside", () => {
    render(
      <ReelCard
        eventId="e1"
        reel={{ ...base, state: "live", have: 2, stills: ["s1", "s2"] }}
        stuck
      />,
    );
    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "/e/token123?reel",
    );
    expect(document.querySelector("[data-living]")).toBeNull();
  });
});

/**
 * ★ THE PRESS WARMS THE VIEW (crumbs-52): the card is a soft navigation, and the view's chunk, which the album asks
 * for only once it has mounted, is what the reel's black waits on after the page commits. A plain press asks for it
 * at once, so it lands inside the album's server render; the card stays a real link into the album.
 */
describe("the live card's press", () => {
  const liveCard = (
    <ReelCard
      eventId="e1"
      reel={{ ...base, state: "live", have: 2, stills: ["s1", "s2"] }}
      stuck={false}
    />
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
      reel={{
        ...base,
        state: "live",
        have: 2,
        stills: ["s1", "s2"],
        developsAt,
      }}
      stuck={false}
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
      expect(screen.getByRole("link")).toHaveTextContent(
        "Guests get it later",
      );
      act(() => {
        vi.advanceTimersByTime(89_000);
      });
      expect(screen.getByRole("link")).toHaveTextContent(
        "Guests get it later",
      );
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

/**
 * ★ HER REEL IS HERS FROM THE FIRST PHOTOGRAPH (Will's Q5, 2026-10-04). The reel's take is planned on the host's own
 * scope, which sees every photograph she has (she is exempt from the seal), and the card draws it: while the develop is
 * ahead the live card dissolves through her photographs and the counting card shows the one it has. ★ RESHAPED ON
 * PURPOSE: this pinned the opposite (crumbs-59, red-team 47's NIT: "the hub's Highlight reel card dissolves through the
 * SEALED shots while the album below is covered and the head is bare, the one picture of what waits that needs no
 * Look"), when the card was to wear her guests' view with the head, its band and the album's cover. The scar is kept
 * where it still holds: those three still stand on what her guests can see, and only this card is hers.
 */
describe("the card on an album that develops later is hers", () => {
  const ahead = (ms: number) => new Date(Date.now() + ms).toISOString();

  it("★ draws her photographs on the live card while a develop time is ahead", () => {
    render(
      <ReelCard
        eventId="e1"
        reel={{
          ...base,
          state: "live",
          have: 2,
          stills: ["s1", "s2", "s3"],
          developsAt: ahead(3_600_000),
        }}
        stuck={false}
      />,
    );
    expect(document.querySelector("[data-living='3']")).not.toBeNull();
    expect(screen.getByRole("link")).toHaveTextContent(
      "Guests get it later",
    );
  });

  it("shows the one photograph on the counting card too, and counts to two as ever", () => {
    render(
      <ReelCard
        eventId="e1"
        reel={{
          ...base,
          have: 1,
          stills: ["her-1"],
          developsAt: ahead(3_600_000),
        }}
        stuck={false}
      />,
    );
    expect(document.querySelector("img")?.getAttribute("src")).toBe("her-1");
    expect(screen.getByRole("button")).toHaveTextContent("1 more photo");
    expect(document.querySelector("[data-reel-pips='1/2']")).not.toBeNull();
  });

  it("keeps her stills through the develop: they never come or go with the time", () => {
    vi.useFakeTimers();
    try {
      render(
        <ReelCard
          eventId="e1"
          reel={{
            ...base,
            state: "live",
            have: 2,
            stills: ["s1", "s2"],
            developsAt: ahead(90_000),
          }}
          stuck={false}
        />,
      );
      expect(document.querySelector("[data-living='2']")).not.toBeNull();
      act(() => {
        vi.advanceTimersByTime(91_000);
      });
      expect(document.querySelector("[data-living='2']")).not.toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it("draws its stills with no develop time, or one already reached, as it always has", () => {
    const live = (developsAt?: string | null): ReelCardData => ({
      ...base,
      state: "live",
      have: 2,
      stills: ["s1", "s2"],
      developsAt,
    });
    for (const developsAt of [null, undefined, ahead(-60_000)]) {
      const { unmount } = render(
        <ReelCard eventId="e1" reel={live(developsAt)} stuck={false} />,
      );
      expect(document.querySelector("[data-living='2']")).not.toBeNull();
      unmount();
    }
    render(
      <ReelCard
        eventId="e1"
        reel={{ ...base, have: 1, stills: ["s1"], developsAt: ahead(-60_000) }}
        stuck={false}
      />,
    );
    expect(document.querySelector("img")?.getAttribute("src")).toBe("s1");
  });
});

describe("switched off, the card opens Settings", () => {
  it("carries the real Settings URL and opens the sheet on a plain click", () => {
    render(
      <ReelCard eventId="e1" reel={{ ...base, state: "off" }} stuck={false} />,
    );
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/dashboard/e1?room=settings");
    expect(link).toHaveTextContent("Off");
    fireEvent.click(link, { button: 0 });
    expect(openSheet).toHaveBeenCalledWith("settings");
  });

  it("lets a modified click be a real navigation", () => {
    render(
      <ReelCard eventId="e1" reel={{ ...base, state: "off" }} stuck={false} />,
    );
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
 * The second playable photograph arrives as a delta on the album's store, the card flips to live on
 * it with the pips full and no stills that belong to the state it left, and asks once for the reel's
 * own take, which then dissolves behind it.
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
  const served: ReelCardData = {
    ...base,
    state: "counting",
    have: 1,
    stills: ["still-1"],
    stillIds: [id(1)],
  };

  function Probe({ face = served }: { face?: ReelCardData }) {
    const reel = useLiveReel("e1", face);
    return (
      <span data-testid="card">
        {reel.state}:{reel.have}:{reel.stills.join(",")}
      </span>
    );
  }

  it("flips to live on the second photograph's delta, then wears the reel's own take", async () => {
    polls.length = 0;
    // The page's catch-up poll brings the second photograph.
    polls.push(() => ({
      kind: "delta",
      v: 2,
      attr: 0,
      upsert: [entry(2)],
      remove: [],
      ok: true,
      counts: { album: 2, pending: 0 },
    }));
    let answer: (v: unknown) => void = () => {};
    refreshHubReelAction.mockReturnValue(
      new Promise((resolve) => {
        answer = resolve;
      }),
    );

    render(
      <HostAlbumProvider seed={seed} qrToken="qr">
        <Probe />
      </HostAlbumProvider>,
    );
    expect(screen.getByTestId("card")).toHaveTextContent("counting:1:still-1");

    await waitFor(() =>
      expect(screen.getByTestId("card")).toHaveTextContent("live:2:"),
    );
    expect(screen.getByTestId("card").textContent).toBe("live:2:");
    expect(refreshHubReelAction).toHaveBeenCalledTimes(1);
    expect(refreshHubReelAction).toHaveBeenCalledWith("e1");

    await act(async () => {
      answer({
        ok: true,
        reel: {
          state: "live",
          have: 2,
          stills: ["take-2", "take-1"],
          stillIds: [id(2), id(1)],
        },
      });
    });
    expect(screen.getByTestId("card").textContent).toBe("live:2:take-2,take-1");
    expect(refreshHubReelAction).toHaveBeenCalledTimes(1);
  });

  // ★ THE PAGE'S FACE WINS WHEN IT CHANGES. Settings' switch saves and re-renders the page, which
  // hands the card a new face: a card that went live on the album's own count must then say Off (it
  // kept "live" until a reload, the scar), and switched back on it wears the take the page just read.
  it("says Off the moment the page's face does, and wears the page's take when switched back on", async () => {
    refreshHubReelAction.mockReset();
    polls.length = 0;
    polls.push(() => ({
      kind: "delta",
      v: 2,
      attr: 0,
      upsert: [entry(2)],
      remove: [],
      ok: true,
      counts: { album: 2, pending: 0 },
    }));
    refreshHubReelAction.mockResolvedValue({
      ok: true,
      reel: {
        state: "live",
        have: 2,
        stills: ["take-2", "take-1"],
        stillIds: [id(2), id(1)],
      },
    });

    const { rerender } = render(
      <HostAlbumProvider seed={seed} qrToken="qr">
        <Probe />
      </HostAlbumProvider>,
    );
    await waitFor(() =>
      expect(screen.getByTestId("card").textContent).toBe(
        "live:2:take-2,take-1",
      ),
    );

    // Switched off in Settings: the page renders again with the switch's word.
    rerender(
      <HostAlbumProvider seed={seed} qrToken="qr">
        <Probe face={{ ...base, state: "off", have: 2, stillIds: [] }} />
      </HostAlbumProvider>,
    );
    expect(screen.getByTestId("card").textContent).toBe("off:2:");

    // Switched back on: the page's own take, adopted as it is, with nothing asked again.
    rerender(
      <HostAlbumProvider seed={seed} qrToken="qr">
        <Probe
          face={{
            ...base,
            state: "live",
            have: 2,
            stills: ["page-2", "page-1"],
            stillIds: [id(2), id(1)],
          }}
        />
      </HostAlbumProvider>,
    );
    expect(screen.getByTestId("card").textContent).toBe("live:2:page-2,page-1");
    expect(refreshHubReelAction).toHaveBeenCalledTimes(1);
  });
});
