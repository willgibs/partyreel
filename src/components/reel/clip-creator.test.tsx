/**
 * THE CLIP CREATOR, PINNED AS BEHAVIOUR (reel-cut rounds 1 and 2, as Will amended them).
 *
 * - The bench: the head names the event, "Your clip" and the clip's line; Looks opens first (the
 *   call his to overrule); the tabs hold one view at a time; a look picked on the wall is worn.
 * - Moments: the reel's picks by default, a tap takes one out or adds it, the fills start over,
 *   Only mine exists only with something of theirs; the host's hidden photographs read "Hidden ·
 *   Show", and Show brings one into the album and the clip.
 * - The mark: a free event's clip says so under it; the guest's line names which events mark, the
 *   host's offers the way past it.
 * - The export's minute: the frame stacks and counts moments; Cancel goes back with the picks kept;
 *   a clip that does not finish lands on Retry, reported once.
 * - The finish: Share leads only when the sheet takes the very file, and a dismissed sheet raises
 *   nothing; Save follows the platform (iOS: Save to Photos, then Download file); Add to event waits
 *   behind a confirm, a guest's through the seam and the host's through her own route; every action
 *   keeps her on the finish with its done state.
 * - Escape is one step back. In a hand the views focus and the finish is its own screen.
 *
 * The engine's canvas is stubbed (the canvas is the engine's own, pinned there), and so are the
 * encoder, the uploads and the host's two actions: the creator's own state is what is pinned.
 */
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ReelCreatorProps } from "@/components/guest/reel/creator-seam";
import type { ClipFacts, GalleryItem } from "@/lib/events/gallery-reel";

import { setViewportWidth } from "../../../vitest.setup";

const h = vi.hoisted(() => ({
  encode: vi.fn(),
  share: vi.fn(),
  save: vi.fn(),
  addAsHost: vi.fn(),
  listHidden: vi.fn(),
  showMoment: vi.fn(),
  warn: vi.fn(),
}));

vi.mock("./clip-canvas", () => ({
  ClipCanvas: (p: {
    props: { styleId: string; clips: unknown[] };
    playing?: boolean;
    label: string;
  }) => (
    <div
      role="img"
      aria-label={p.label}
      data-testid="clip-canvas"
      data-style={p.props.styleId}
      data-clips={p.props.clips.length}
      data-playing={String(Boolean(p.playing))}
    />
  ),
}));
vi.mock("@/lib/reel/clip-encode", () => ({
  CLIP_STILL_FRAME: 45,
  preloadClipEncoder: () => {},
  encodeClip: (...args: unknown[]) => h.encode(...args),
}));
vi.mock("@/lib/reel/clip-add", () => ({
  addClipAsHost: (...args: unknown[]) => h.addAsHost(...args),
}));
vi.mock("@/lib/reel/clip-hidden-action", () => ({
  listClipHiddenAction: (...args: unknown[]) => h.listHidden(...args),
  showClipMomentAction: (...args: unknown[]) => h.showMoment(...args),
}));
vi.mock("@/lib/reel/client-save", () => ({
  saveBlobLocally: (...args: unknown[]) => h.save(...args),
}));
vi.mock("@/lib/observability/sentry", () => ({
  captureWarning: (...args: unknown[]) => h.warn(...args),
}));
vi.mock("@/lib/media/share-save", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/media/share-save")>()),
  shareFile: (...args: unknown[]) => h.share(...args),
}));
vi.mock("@/components/app/pricing/pricing-sheet", () => ({
  PricingSheet: () => <div data-testid="pricing-sheet" />,
}));

const { ClipCreator } = await import("./clip-creator");

const FACTS: ClipFacts = {
  videoAllowed: true,
  watermark: false,
  maxSeconds: 60,
};

function item(i: number, over: Partial<GalleryItem> = {}): GalleryItem {
  return {
    id: `m${i}`,
    type: "photo",
    url: `https://r2.test/o/${i}.jpg`,
    previewUrl: `https://r2.test/p/${i}.webp`,
    status: "approved",
    width: i % 2 ? 3000 : 2000,
    height: i % 2 ? 2000 : 3000,
    uploaderKey: `g${i % 4}`,
    isHost: i % 5 === 0,
    createdAt: new Date(Date.UTC(2026, 5, 14, 22, 0, 30 - i)).toISOString(),
    ...over,
  };
}

const ITEMS = Array.from({ length: 24 }, (_, i) => item(i));

function renderCreator(props: Partial<ReelCreatorProps> = {}) {
  const all: ReelCreatorProps = {
    items: ITEMS,
    styleId: "classic",
    eventId: "11111111-1111-4111-8111-111111111111",
    eventName: "Maya & Jay",
    facts: FACTS,
    addClipToAlbum: vi.fn(),
    isOwner: false,
    moderated: false,
    ownIds: new Set(),
    onClose: vi.fn(),
    ...props,
  };
  const utils = render(<ClipCreator {...all} />);
  return { ...utils, props: all };
}

const meta = () =>
  document.querySelector("[data-clip-meta]")?.textContent ?? "";
const momentsIn = () => Number(meta().match(/(\d+) moments?/)?.[1] ?? 0);
const hero = () => screen.getByRole("img", { name: /^Your clip,/ });

/** A pending encode the test settles by hand. */
function deferredEncode() {
  let resolve!: (v: unknown) => void;
  let reject!: (e: unknown) => void;
  let signal!: AbortSignal;
  let onProgress!: (p: number) => void;
  h.encode.mockImplementation(
    (
      _props: unknown,
      opts: { signal: AbortSignal; onProgress: (p: number) => void },
    ) => {
      signal = opts.signal;
      onProgress = opts.onProgress;
      return new Promise((res, rej) => {
        resolve = res;
        reject = rej;
        opts.signal.addEventListener("abort", () =>
          rej(new DOMException("aborted", "AbortError")),
        );
      });
    },
  );
  return {
    resolve: (v: unknown) => resolve(v),
    reject: (e: unknown) => reject(e),
    progress: (p: number) => onProgress(p),
    get signal() {
      return signal;
    },
  };
}

const CLIP_FILE = new File(
  [new Uint8Array(2 * 1024 * 1024)],
  "maya-jay-clip.mp4",
  {
    type: "video/mp4",
  },
);
const POSTER = new Blob(["poster"], { type: "image/webp" });

async function makeIt() {
  const run = deferredEncode();
  fireEvent.click(screen.getByRole("button", { name: /Make it/ }));
  await act(async () => {
    run.resolve({ file: CLIP_FILE, poster: POSTER, seconds: 28 });
  });
  return run;
}

function stubSheet(takes: boolean) {
  Object.defineProperty(navigator, "canShare", {
    configurable: true,
    value: vi.fn(() => takes),
  });
  Object.defineProperty(navigator, "share", {
    configurable: true,
    value: vi.fn(async () => {}),
  });
}

const DESK_UA = navigator.userAgent;

beforeEach(() => {
  h.encode.mockReset();
  h.share.mockReset();
  h.save.mockReset();
  h.addAsHost.mockReset();
  h.listHidden.mockReset();
  h.listHidden.mockResolvedValue({ ok: true, items: [] });
  h.showMoment.mockReset();
  h.warn.mockReset();
  vi.mocked(toast).mockClear();
  vi.mocked(toast.error).mockClear();
  stubSheet(true);
});

afterEach(() => {
  Object.defineProperty(navigator, "userAgent", {
    configurable: true,
    value: DESK_UA,
  });
});

describe("the bench", () => {
  it("names the event, the clip and its line, and opens on Looks", () => {
    renderCreator();
    const head = document.querySelector("[data-clip-head]") as HTMLElement;
    expect(head).toHaveTextContent("Maya & Jay");
    expect(head).toHaveTextContent("Your clip");
    expect(meta()).toMatch(/^\d:\d\d · Cinematic · \d+ moments$/);
    expect(screen.getByRole("tab", { name: "Looks" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    // The wall of every look, the one it wears checked.
    const wall = screen.getByRole("radiogroup", { name: "Look" });
    expect(within(wall).getAllByRole("radio")).toHaveLength(14);
    expect(
      within(wall)
        .getAllByRole("radio")
        .filter((r) => r.getAttribute("aria-checked") === "true"),
    ).toHaveLength(1);
    // The clip plays while she chooses.
    expect(hero()).toHaveAttribute("data-playing", "true");
  });

  it("wears the look picked on the wall", () => {
    renderCreator();
    const noir = document.querySelector(
      '[data-clip-look="mono"]',
    ) as HTMLElement;
    fireEvent.click(noir);
    expect(noir).toHaveAttribute("aria-checked", "true");
    expect(hero()).toHaveAttribute("data-style", "mono");
    expect(meta()).not.toMatch(/Cinematic/);
  });

  it("holds one view at a time: Moments replaces Looks", () => {
    renderCreator();
    fireEvent.mouseDown(screen.getByRole("tab", { name: "Moments" }));
    expect(screen.queryByRole("radiogroup", { name: "Look" })).toBeNull();
    expect(screen.getByRole("list", { name: "The album" })).toBeInTheDocument();
  });

  it("pauses and plays the clip from the room's own control", () => {
    renderCreator();
    fireEvent.click(screen.getByRole("button", { name: "Pause the clip" }));
    expect(hero()).toHaveAttribute("data-playing", "false");
  });
});

describe("the moments", () => {
  function openMoments() {
    fireEvent.mouseDown(screen.getByRole("tab", { name: "Moments" }));
  }

  it("starts from the reel's picks, and a tap takes one out or adds it", () => {
    renderCreator();
    openMoments();
    const start = momentsIn();
    expect(start).toBeGreaterThan(1);
    expect(
      screen.getByRole("button", { name: "The reel's picks" }),
    ).toHaveAttribute("aria-pressed", "true");
    const inClip = screen.getAllByRole("button", { name: /^Moment 1 of/ })[0];
    fireEvent.click(inClip);
    expect(momentsIn()).toBe(start - 1);
    // An edit by hand is no fill any more.
    expect(
      screen.getByRole("button", { name: "The reel's picks" }),
    ).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(
      screen.getAllByRole("button", { name: /Add it to your clip/ })[0],
    );
    expect(momentsIn()).toBe(start);
  });

  it("offers Only mine only with something of theirs, and fills with exactly that", () => {
    const { unmount } = renderCreator();
    openMoments();
    expect(screen.getByRole("button", { name: "Only mine" })).toBeDisabled();
    unmount();
    renderCreator({ ownIds: new Set(["m3", "m7"]) });
    openMoments();
    fireEvent.click(screen.getByRole("button", { name: "Only mine" }));
    expect(momentsIn()).toBe(2);
    expect(
      screen
        .getAllByRole("button", { pressed: true })
        .filter((b) => b.hasAttribute("data-clip-moment")),
    ).toHaveLength(2);
  });

  it("never offers a clip already in the album, or anything held or hidden, to a guest", () => {
    renderCreator({
      items: [
        ...ITEMS.slice(0, 4),
        item(90, { reelEligible: false }),
        item(91, { status: "pending" }),
        item(92, { status: "hidden" }),
      ],
    });
    openMoments();
    expect(document.querySelectorAll("[data-clip-moment]")).toHaveLength(4);
    expect(h.listHidden).not.toHaveBeenCalled();
  });

  it("shows the host her hidden photographs as Hidden · Show, and Show brings one in", async () => {
    h.listHidden.mockResolvedValue({
      ok: true,
      items: [item(50, { status: "hidden" })],
    });
    h.showMoment.mockResolvedValue({ ok: true });
    renderCreator({ isOwner: true });
    await act(async () => {});
    openMoments();
    const hidden = document.querySelector(
      '[data-clip-moment="hidden"]',
    ) as HTMLElement;
    expect(hidden).toHaveTextContent("Hidden");
    const before = momentsIn();
    await act(async () => {
      fireEvent.click(within(hidden).getByRole("button", { name: /^Show/ }));
    });
    expect(h.showMoment).toHaveBeenCalledWith(
      "11111111-1111-4111-8111-111111111111",
      "m50",
    );
    expect(document.querySelector('[data-clip-moment="hidden"]')).toBeNull();
    expect(momentsIn()).toBe(before + 1);
  });

  it("puts a refused Show back as it was, and says why", async () => {
    h.listHidden.mockResolvedValue({
      ok: true,
      items: [item(50, { status: "hidden" })],
    });
    h.showMoment.mockResolvedValue({
      ok: false,
      message: "That item is no longer available.",
    });
    renderCreator({ isOwner: true });
    await act(async () => {});
    openMoments();
    const before = momentsIn();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /^Show/ }));
    });
    expect(
      document.querySelector('[data-clip-moment="hidden"]'),
    ).not.toBeNull();
    expect(momentsIn()).toBe(before);
    expect(toast.error).toHaveBeenCalledWith(
      "That item is no longer available.",
    );
  });
});

describe("the mark", () => {
  it("says a guest's free event marks its clips, with no control to press", () => {
    renderCreator({ facts: { ...FACTS, watermark: true, maxSeconds: 30 } });
    const line = document.querySelector("[data-clip-mark]") as HTMLElement;
    expect(line).toHaveTextContent(
      "Free events mark their clips. Pro events don't",
    );
    expect(within(line).queryByRole("button")).toBeNull();
  });

  it("offers the host the way past it", async () => {
    renderCreator({
      isOwner: true,
      facts: { ...FACTS, watermark: true, maxSeconds: 30 },
    });
    await act(async () => {});
    fireEvent.click(screen.getByRole("button", { name: "Remove it with Pro" }));
    expect(await screen.findByTestId("pricing-sheet")).toBeInTheDocument();
  });

  it("is absent on a paid event", () => {
    renderCreator();
    expect(document.querySelector("[data-clip-mark]")).toBeNull();
  });
});

describe("the export's minute", () => {
  it("stacks and counts moments, the bench held still", () => {
    renderCreator();
    const total = momentsIn();
    const run = deferredEncode();
    fireEvent.click(screen.getByRole("button", { name: /Make it/ }));
    expect(screen.getByRole("status")).toHaveTextContent(
      `${total} of ${total} moments left`,
    );
    expect(
      screen.getByText("Drawing your clip on this device. Keep this tab open."),
    ).toBeInTheDocument();
    act(() => run.progress(0.5));
    expect(screen.getByRole("status")).toHaveTextContent(
      `${total - Math.floor(total / 2)} of ${total} moments left`,
    );
    expect(document.querySelector("[data-clip-foot]")).toHaveAttribute("inert");
  });

  it("Cancel goes back to the bench with the picks kept", async () => {
    renderCreator();
    const before = meta();
    const run = deferredEncode();
    fireEvent.click(screen.getByRole("button", { name: /Make it/ }));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    });
    expect(run.signal.aborted).toBe(true);
    expect(document.querySelector("[data-clip-creator]")).toHaveAttribute(
      "data-clip-creator",
      "bench",
    );
    expect(meta()).toBe(before);
    expect(h.warn).not.toHaveBeenCalled();
  });

  it("a clip that does not finish lands on Retry, reported once, the picks kept", async () => {
    renderCreator();
    const run = deferredEncode();
    fireEvent.click(screen.getByRole("button", { name: /Make it/ }));
    await act(async () => {
      run.reject(new Error("GPU context lost"));
    });
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Your clip didn’t finish",
    );
    expect(h.warn).toHaveBeenCalledTimes(1);
    expect(h.warn.mock.calls[0][1]).toBe("clip: encode failed");
    const firstProps = h.encode.mock.calls[0][0];
    deferredEncode();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(h.encode).toHaveBeenCalledTimes(2);
    expect(h.encode.mock.calls[1][0]).toEqual(firstProps);
  });
});

describe("the finish", () => {
  it("leads with Share when the sheet takes the very file, and stays put after each action", async () => {
    renderCreator();
    await makeIt();
    expect(navigator.canShare).toHaveBeenCalledWith({ files: [CLIP_FILE] });
    h.share.mockResolvedValue({ kind: "shared" });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Share" }));
    });
    expect(h.share).toHaveBeenCalledWith(CLIP_FILE, navigator);
    expect(screen.getByRole("button", { name: "Shared" })).toBeInTheDocument();
    // Save at a desk is the download, from memory.
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Save" }));
    });
    expect(h.save).toHaveBeenCalledWith(CLIP_FILE, "maya-jay-clip.mp4");
    expect(screen.getByRole("button", { name: "Saved" })).toBeInTheDocument();
    // Still the finish: the file keeps playing and both done states stand.
    expect(
      document.querySelector('[data-clip-hero="finished"]'),
    ).not.toBeNull();
    expect(screen.getByRole("button", { name: "Shared" })).toBeInTheDocument();
  });

  it("raises nothing when the sheet is dismissed", async () => {
    renderCreator();
    await makeIt();
    h.share.mockResolvedValue({ kind: "cancelled" });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Share" }));
    });
    expect(toast).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Share" })).toBeInTheDocument();
  });

  it("lets Save lead where the sheet would refuse the file", async () => {
    stubSheet(false);
    renderCreator();
    await makeIt();
    expect(screen.queryByRole("button", { name: "Share" })).toBeNull();
    expect(screen.getByRole("button", { name: "Save" })).toHaveAttribute(
      "data-clip-door",
      "save",
    );
  });

  it("on iOS, Save offers Save to Photos first, then Download file", async () => {
    Object.defineProperty(navigator, "userAgent", {
      configurable: true,
      value:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
    });
    renderCreator();
    await makeIt();
    fireEvent.pointerDown(screen.getByRole("button", { name: "Save" }), {
      button: 0,
      ctrlKey: false,
    });
    const items = screen.getAllByRole("menuitem").map((m) => m.textContent);
    expect(items).toEqual(["Save to Photos", "Download file"]);
    h.share.mockResolvedValue({ kind: "shared" });
    await act(async () => {
      fireEvent.click(screen.getByRole("menuitem", { name: "Save to Photos" }));
    });
    expect(h.share).toHaveBeenCalledWith(CLIP_FILE, navigator);
    expect(h.save).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /Saved/ })).toBeInTheDocument();
  });

  it("adds a guest's clip through the seam, behind a confirm that says the host reviews it", async () => {
    const add = vi.fn();
    renderCreator({ addClipToAlbum: add, moderated: true });
    await makeIt();
    fireEvent.click(screen.getByRole("button", { name: "Add to event" }));
    const dialog = screen.getByRole("dialog", {
      name: "Add your clip to Maya & Jay?",
    });
    expect(dialog).toHaveTextContent(
      "The host reviews it before it shows in the album",
    );
    expect(dialog).toHaveTextContent("The live reel won't play it.");
    expect(add).not.toHaveBeenCalled();
    await act(async () => {
      fireEvent.click(
        within(dialog).getByRole("button", { name: "Add to event" }),
      );
    });
    expect(add).toHaveBeenCalledWith(CLIP_FILE, POSTER);
    expect(screen.getByRole("button", { name: "Added" })).toBeDisabled();
  });

  it("adds the host's clip through her own route, and says what it costs her", async () => {
    h.addAsHost.mockResolvedValue({
      ok: true,
      status: "approved",
      mediaId: "x",
      kind: "video",
    });
    const add = vi.fn();
    renderCreator({ isOwner: true, addClipToAlbum: add });
    await act(async () => {});
    await makeIt();
    fireEvent.click(screen.getByRole("button", { name: "Add to event" }));
    const dialog = screen.getByRole("dialog", {
      name: "Add your clip to Maya & Jay?",
    });
    expect(dialog).toHaveTextContent(
      "approved and uses about 2 MB of your storage",
    );
    await act(async () => {
      fireEvent.click(
        within(dialog).getByRole("button", { name: "Add to event" }),
      );
    });
    expect(h.addAsHost).toHaveBeenCalledWith(
      expect.objectContaining({
        eventId: "11111111-1111-4111-8111-111111111111",
        file: CLIP_FILE,
        poster: POSTER,
      }),
    );
    expect(add).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Added" })).toBeInTheDocument();
  });

  it("offers Add to event only where the plan takes video and this viewer may add", async () => {
    const cases: [Partial<ReelCreatorProps>, boolean][] = [
      [{ facts: { ...FACTS, videoAllowed: false } }, false],
      [{ addClipToAlbum: null }, false],
      [{ addClipToAlbum: null, isOwner: true }, true],
      [{}, true],
    ];
    for (const [props, offered] of cases) {
      const { unmount } = renderCreator(props);
      await act(async () => {});
      await makeIt();
      expect(
        Boolean(screen.queryByRole("button", { name: "Add to event" })),
      ).toBe(offered);
      unmount();
    }
  });

  it("goes back to editing with the picks kept, and Make another starts a fresh take", async () => {
    renderCreator();
    const before = meta();
    const picked = () =>
      [...document.querySelectorAll("[data-clip-order-tile] img")].map((img) =>
        img.getAttribute("src"),
      );
    const first = picked();
    await makeIt();
    fireEvent.click(
      screen.getByRole("button", { name: "Back to editing, your picks kept" }),
    );
    expect(meta()).toBe(before);
    expect(picked()).toEqual(first);
    await makeIt();
    fireEvent.click(screen.getByRole("button", { name: "Make another" }));
    expect(document.querySelector("[data-clip-creator]")).toHaveAttribute(
      "data-clip-creator",
      "bench",
    );
    expect(picked()).not.toEqual(first);
  });
});

describe("the way back", () => {
  it("Escape is one step back: the finish to the bench, the bench to the reel", async () => {
    const { props } = renderCreator();
    await makeIt();
    fireEvent.keyDown(document.activeElement ?? document.body, {
      key: "Escape",
    });
    expect(document.querySelector("[data-clip-creator]")).toHaveAttribute(
      "data-clip-creator",
      "bench",
    );
    expect(props.onClose).not.toHaveBeenCalled();
    fireEvent.keyDown(document.activeElement ?? document.body, {
      key: "Escape",
    });
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("Back to the reel leaves from the bench", () => {
    const { props } = renderCreator();
    fireEvent.click(screen.getByRole("button", { name: "Back to the reel" }));
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });
});

describe("in a hand", () => {
  beforeEach(() => setViewportWidth(375));

  it("focuses one view at a time, the order living with the moments", () => {
    renderCreator();
    expect(document.querySelector("[data-clip-order]")).toBeNull();
    fireEvent.mouseDown(screen.getByRole("tab", { name: "Moments" }));
    expect(document.querySelector("[data-clip-order]")).not.toBeNull();
    expect(screen.queryByRole("radiogroup", { name: "Look" })).toBeNull();
  });

  it("makes the finish its own screen, the doors under the file", async () => {
    renderCreator();
    await makeIt();
    const screenEl = document.querySelector(
      '[data-clip-finish="screen"]',
    ) as HTMLElement;
    expect(screenEl).not.toBeNull();
    expect(
      within(screenEl).getByRole("button", { name: "Share" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Looks" })).toBeNull();
  });
});
