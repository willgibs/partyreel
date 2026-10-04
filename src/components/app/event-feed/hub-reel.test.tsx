import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ENTRY_HIDDEN,
  ENTRY_PENDING,
  ENTRY_PREVIEW,
  ENTRY_REEL,
  ENTRY_VIDEO,
  type ManifestEntry,
} from "@/lib/events/album-wire";
import type { ReelViewProps } from "@/components/guest/reel/live-reel-view";

import { HubReel, type HubReelProps } from "./hub-reel";

/**
 * HER REEL ON HER OWN PAGE (Will's Q5, 2026-10-04: "the live reel is the host's to play from her own event page as soon
 * as she opens it, even while the album develops; guests don't have it until the develop"), pinned by what it DOES: the
 * guests' own view mounts over the hub on `?reel`, fed her scope (the hub's manifest, sealed shots included), with the
 * host's links by id, no screen link and no creator, and a `?reel` that cannot play is dropped quietly. The view itself
 * is `live-reel-view.test.tsx`'s; here it is a stand-in that keeps the props it was handed.
 */

const seen = vi.hoisted(() => ({ props: [] as unknown[] }));
// The view's chunk, held behind a gate: the first tests stand in the wait before it lands, every other test releases it.
const chunk = vi.hoisted(() => {
  let release!: () => void;
  const landed = new Promise<void>((resolve) => (release = resolve));
  return { landed, release };
});
vi.mock("./hub-reel-view", () => ({
  loadHubReelView: async () => {
    await chunk.landed;
    return {
      LiveReelView: (props: unknown) => {
        seen.props.push(props);
        return <div data-testid="reel-view" />;
      },
    };
  },
  warmHubReelView: () => {},
}));

const store = vi.hoisted(() => ({
  entries: null as readonly unknown[] | null,
  links: {
    get: vi.fn(),
    ensure: vi.fn(async () => {}),
    forget: vi.fn(),
  },
}));
vi.mock("./host-album", () => ({
  useHostAlbum: () => ({ store: { links: store.links } }),
  useHubEntries: () => store.entries,
}));

const setReelDefaults = vi.hoisted(() => vi.fn());
vi.mock("@/lib/reel/defaults-action", () => ({
  setReelDefaults: (...a: unknown[]) => setReelDefaults(...a),
}));

const T = 1_790_000_000_000_000;
/** A manifest entry: id, width, height, flags, created_at in microseconds. */
const entry = (id: string, flags = ENTRY_REEL, i = 0): ManifestEntry => [
  id,
  400,
  300,
  flags,
  T - i * 1_000_000,
];
const photo = (id: string, i = 0) => entry(id, ENTRY_REEL, i);

const props = (over: Partial<HubReelProps> = {}): HubReelProps => ({
  eventId: "event-1",
  eventName: "Maya & Jay",
  joinUrl: "https://partyreel.com/e/token",
  displayAddress: "partyreel.com/e/maya-and-jay",
  qrStyle: "classic",
  qrToken: "token",
  reelOn: true,
  look: { styleId: "mono", holdSec: 5 },
  ...over,
});

const lastView = () =>
  seen.props[seen.props.length - 1] as ReelViewProps | undefined;
const open = (search = "?reel") =>
  act(() => window.history.replaceState(null, "", `/${search}`));
const settle = () => act(async () => {});

beforeEach(() => {
  seen.props = [];
  store.entries = [photo("a", 0), photo("b", 1), photo("c", 2)];
  store.links.get.mockReset();
  store.links.ensure.mockClear();
  store.links.forget.mockClear();
  setReelDefaults.mockReset();
  window.history.replaceState(null, "", "/");
});
afterEach(() => {
  window.history.replaceState(null, "", "/");
});

/**
 * ★ THE WAIT BEFORE THE VIEW'S CHUNK LANDS: first in the file, since a chunk that has landed stays landed for the rest of
 * it (the lazy component is the module's), and the only tests that hold it back.
 */
describe("the press before the view's chunk has landed", () => {
  it("★ answers at once with the reel's own black and a way out", async () => {
    open();
    render(<HubReel {...props()} />);
    expect(document.querySelector("[data-hub-reel-curtain]")).not.toBeNull();
    expect(screen.queryByTestId("reel-view")).toBeNull();
    // The way out, with the chunk still on its way: she is never stuck on a black she cannot leave.
    act(() => screen.getByRole("button", { name: "Close the reel" }).click());
    await waitFor(() => expect(window.location.search).toBe(""));
    expect(document.querySelector("[data-hub-reel-curtain]")).toBeNull();
  });

  it("hands the black over to the view when the chunk lands", async () => {
    open();
    render(<HubReel {...props()} />);
    expect(document.querySelector("[data-hub-reel-curtain]")).not.toBeNull();
    chunk.release();
    expect(await screen.findByTestId("reel-view")).toBeInTheDocument();
    expect(document.querySelector("[data-hub-reel-curtain]")).toBeNull();
  });
});

describe("her reel on her own hub", () => {
  beforeEach(() => chunk.release());

  it("draws nothing until the address asks for it", async () => {
    const { container } = render(<HubReel {...props()} />);
    await settle();
    expect(container).toBeEmptyDOMElement();
    expect(seen.props).toHaveLength(0);
  });

  it("★ mounts the guests' view over the hub on `?reel`, in the owner's hand, with no screen link and no creator", async () => {
    open();
    render(<HubReel {...props()} />);
    expect(await screen.findByTestId("reel-view")).toBeInTheDocument();
    const view = lastView()!;
    expect(view).toMatchObject({
      mode: "hand",
      idle: false,
      eventId: "event-1",
      eventName: "Maya & Jay",
      joinUrl: "https://partyreel.com/e/token",
      displayAddress: "partyreel.com/e/maya-and-jay",
      qrStyle: "classic",
      isDemo: false,
      isOwner: true,
      // A screen that is not hers cannot open her hub: it plays the reel cast from her own device.
      screenLink: false,
      // A clip is made from the guests' view.
      creator: null,
      addClipToAlbum: null,
    });
    expect(view.onAddYours).toBeUndefined();
  });

  it("plays her own scope: the manifest's items, no urls, hidden and held ones left out", async () => {
    store.entries = [
      photo("a", 0),
      entry("hidden", ENTRY_REEL | ENTRY_HIDDEN, 1),
      entry("held", ENTRY_REEL | ENTRY_PENDING, 2),
      photo("b", 3),
      // A video with a poster plays; a clip someone added (not reel-eligible) does not count.
      entry("clip", ENTRY_VIDEO | ENTRY_PREVIEW, 4),
    ];
    open();
    render(<HubReel {...props()} />);
    await screen.findByTestId("reel-view");
    const ids = lastView()!.playable.map((i) => i.id);
    expect(ids).toEqual(["a", "b", "clip"]);
    for (const item of lastView()!.playable) expect(item.url).toBe("");
    // The guests' own flags: what a clip someone added is, and a video's poster, are the items' words.
    const clip = lastView()!.playable.find((i) => i.id === "clip")!;
    expect(clip).toMatchObject({
      type: "video",
      reelEligible: false,
      drawable: true,
    });
  });

  it("★ hands the view the hub's own links by id, so her scope's photographs draw", async () => {
    store.links.get.mockImplementation((id: string) =>
      id === "a" ? { tile: "tile-a", view: "view-a" } : undefined,
    );
    open();
    render(<HubReel {...props()} />);
    await screen.findByTestId("reel-view");
    const { standIn } = lastView()!;
    expect(standIn!.clips.get("a")).toEqual({ tile: "tile-a", view: "view-a" });
    expect(standIn!.clips.get("zz")).toBeUndefined();
    await standIn!.clips.ensure(["b", "c"]);
    expect(store.links.ensure).toHaveBeenCalledWith(["b", "c"]);
  });

  it("starts the view on the host's own defaults, kept per event on this device", async () => {
    open();
    render(
      <HubReel {...props({ look: { styleId: "editorial", holdSec: 2 } })} />,
    );
    await screen.findByTestId("reel-view");
    const { standIn } = lastView()!;
    expect(standIn!.qrToken).toBe("token");
    expect(standIn!.reel).toMatchObject({
      showReel: true,
      liveReelEnabled: true,
      styleId: "editorial",
      holdSec: 2,
      // No plan is read, so no creator is offered.
      clip: null,
    });
  });

  it("asks a failed still's link again by id: the link goes and is minted afresh", async () => {
    open();
    render(<HubReel {...props()} />);
    await screen.findByTestId("reel-view");
    lastView()!.standIn!.reportPossibleExpiry(["b"]);
    expect(store.links.forget).toHaveBeenCalledWith(["b"]);
    expect(store.links.ensure).toHaveBeenCalledWith(["b"]);
  });

  it("sets the look and hold for everyone through the one write, and says whether it took", async () => {
    setReelDefaults.mockResolvedValueOnce({ ok: true });
    setReelDefaults.mockResolvedValueOnce({ ok: false });
    open();
    render(<HubReel {...props()} />);
    await screen.findByTestId("reel-view");
    const set = lastView()!.onSetForEveryone!;
    await expect(set({ styleId: "mono", holdSec: 5 })).resolves.toBe(true);
    expect(setReelDefaults).toHaveBeenCalledWith({
      eventId: "event-1",
      styleId: "mono",
      holdSec: 5,
    });
    await expect(set({ styleId: "mono", holdSec: 5 })).resolves.toBe(false);
  });

  it("is the same view for `?reel=screen`: the hub has no screen posture", async () => {
    open("?reel=screen");
    render(<HubReel {...props()} />);
    await screen.findByTestId("reel-view");
    expect(lastView()!.mode).toBe("hand");
  });

  it("closes onto the hub's own address: only the reel segment is touched", async () => {
    open("?room=settings&reel");
    render(<HubReel {...props()} />);
    await screen.findByTestId("reel-view");
    act(() => lastView()!.onClose());
    await waitFor(() => expect(window.location.search).toBe("?room=settings"));
    expect(screen.queryByTestId("reel-view")).toBeNull();
  });
});

describe("a `?reel` that cannot play", () => {
  beforeEach(() => chunk.release());

  it("★ is dropped quietly below the minimum of two photographs that can play", async () => {
    store.entries = [photo("a"), entry("held", ENTRY_REEL | ENTRY_PENDING, 1)];
    open();
    render(<HubReel {...props()} />);
    await waitFor(() => expect(window.location.search).toBe(""));
    expect(seen.props).toHaveLength(0);
  });

  it("is dropped with the host's switch or the platform lever off", async () => {
    open();
    render(<HubReel {...props({ reelOn: false })} />);
    await waitFor(() => expect(window.location.search).toBe(""));
    expect(seen.props).toHaveLength(0);
  });

  it("returns a host whose hidden photographs bring the playing reel under two to her hub", async () => {
    open();
    const { rerender } = render(<HubReel {...props()} />);
    await screen.findByTestId("reel-view");
    store.entries = [photo("a"), entry("b", ENTRY_REEL | ENTRY_HIDDEN, 1)];
    rerender(<HubReel {...props()} />);
    await waitFor(() => expect(window.location.search).toBe(""));
    expect(screen.queryByTestId("reel-view")).toBeNull();
  });

  it("waits for the album's entries rather than dropping an address it cannot judge yet", async () => {
    store.entries = null;
    open();
    render(<HubReel {...props()} />);
    await settle();
    expect(window.location.search).toBe("?reel");
  });
});
