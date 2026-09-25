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
import { beforeEach, describe, expect, it, vi } from "vitest";

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
    expect(review).toHaveAttribute("href", "/dashboard/e1/review");
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
