/**
 * THE HUB DEVELOPS TOO (crumbs-73; the-wait r2's carried `hub`): her first open after the develop plays the guests'
 * `DevelopSheet` in her album's place, once per phone by the guests' mark. Pinned here: when it plays and when it never
 * does (never twice; a develop her own guest page played; the one that came while she was looking; reduced motion;
 * `?reel`; an album with nothing to develop), that it waits to be seen and a scroll never takes it from her, what ends it,
 * and that the rows under it are never remounted. The album's store and its neighbours stand in: pinned is the director.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { setReducedMotion } from "../../../../vitest.setup";
import {
  DEVELOP_TEMPO,
  developLength,
  developMarkKey,
} from "@/lib/disposable/contact-sheet-develop";
import {
  ENTRY_HIDDEN,
  ENTRY_PENDING,
  ENTRY_PREVIEW,
  ENTRY_REEL,
  type ManifestEntry,
  WHO_HOST,
} from "@/lib/events/album-wire";

const fx = vi.hoisted(() => ({
  entries: [] as ManifestEntry[],
  links: new Map<string, { tile: string; who: [string | null, number, null] }>(),
  ensure: vi.fn(async (_ids: string[]) => {}),
}));

// The cover's own neighbours (this file's `useHerShots` lives beside it): not under test.
vi.mock("@/app/(app)/dashboard/actions", () => ({
  updateEventAction: vi.fn(async () => ({ ok: true as const })),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock("@/components/app/event-feed/host-album", () => {
  const album = {
    eventId: "event-1",
    store: {
      links: {
        ensure: (ids: string[]) => fx.ensure(ids),
        subscribe: () => () => {},
        revision: () => 0,
      },
    },
    linkOf: (id: string) => fx.links.get(id),
  };
  return {
    useHostAlbum: () => album,
    useHubEntries: () => fx.entries,
  };
});

const { HubDevelop } = await import("./hub-develop");

const MIN_US = 60_000_000;
/** Saturday 10:00 am; the develop was at 9: reached. */
const NOW = new Date(2026, 9, 10, 10, 0, 0);
const DEVELOP = new Date(2026, 9, 10, 9, 0, 0).toISOString();
const DEVELOP_MS = Date.parse(DEVELOP);
const AHEAD = new Date(2026, 9, 10, 12, 0, 0).toISOString();
const T0 = DEVELOP_MS * 1000 - 600 * MIN_US;
const FLAGS = ENTRY_REEL | ENTRY_PREVIEW;
/** Album ids are uuids (a tile that grows is found by one). */
const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const entry = (n: number, minutes: number, flags = FLAGS): ManifestEntry => [
  id(n),
  4,
  3,
  flags,
  T0 + minutes * MIN_US,
];

/** An IntersectionObserver the test drives: the stage is in view only when it says so. */
class FakeIO {
  static all = new Set<FakeIO>();
  constructor(private cb: IntersectionObserverCallback) {
    FakeIO.all.add(this);
  }
  observe() {}
  unobserve() {}
  takeRecords() {
    return [];
  }
  disconnect() {
    FakeIO.all.delete(this);
  }
  static see(shown: boolean) {
    for (const io of FakeIO.all)
      io.cb(
        [
          {
            isIntersecting: shown,
            intersectionRatio: shown ? 1 : 0,
            intersectionRect: { height: shown ? 300 : 0 },
          } as IntersectionObserverEntry,
        ],
        io as unknown as IntersectionObserver,
      );
  }
}
class FakeRO {
  observe() {}
  unobserve() {}
  disconnect() {}
}

const markKey = developMarkKey("event-1");
const root = () => document.documentElement;
const stage = (c: HTMLElement) =>
  c.querySelector("[data-hub-develop]")?.getAttribute("data-hub-develop") ??
  null;

/** The hub's album section, as `EventGallery` draws it: a header with a press in it, and the rows in the develop's box. */
function Hub({
  develops_at = DEVELOP,
  rowMounts,
}: {
  develops_at?: string | null;
  rowMounts?: { mounted: number; unmounted: number };
}) {
  return (
    <div>
      <button type="button">A card above the album</button>
      <section aria-label="Album">
        <button type="button">Add photos</button>
        <HubDevelop
          eventId="event-1"
          develop={{ develops_at, sealed_from: null }}
        >
          <Rows rowMounts={rowMounts} />
        </HubDevelop>
      </section>
    </div>
  );
}

function Rows({
  rowMounts,
}: {
  rowMounts?: { mounted: number; unmounted: number };
}) {
  const tracked = rowMounts;
  // The rows' own life, counted: a develop that starts or ends must never remount them.
  return (
    <div
      data-testid="rows"
      ref={(el) => {
        if (!tracked || !el) return;
        tracked.mounted += 1;
        return () => {
          tracked.unmounted += 1;
        };
      }}
    >
      {fx.entries
        .filter((e) => (e[3] & (ENTRY_HIDDEN | ENTRY_PENDING)) === 0)
        .map((e) => (
          <div key={e[0]} data-media-tile="" data-media-id={e[0]} />
        ))}
    </div>
  );
}

/** Time passing in frames' steps, each flushed by its own act: React batches inside one, so a develop that waits on its
 *  own state (a lead stood, then a frame) would otherwise be read before it had begun. */
async function advance(ms: number) {
  for (let left = ms; left > 0; left -= 50)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(Math.min(50, left));
    });
}

/** The sheet seen, stood its lead, and let go: the develop is playing. */
async function playIt() {
  act(() => FakeIO.see(true));
  await advance(DEVELOP_TEMPO.leadMs + 100);
}

beforeEach(() => {
  vi.useFakeTimers({ now: NOW });
  vi.stubGlobal("IntersectionObserver", FakeIO);
  vi.stubGlobal("ResizeObserver", FakeRO);
  localStorage.clear();
  FakeIO.all.clear();
  fx.entries = [entry(5, 50), entry(4, 40), entry(3, 30), entry(2, 20), entry(1, 10)];
  fx.links = new Map(
    fx.entries.map((e) => [
      e[0],
      { tile: `https://r2.example/${e[0]}.webp`, who: ["Ana", 0, null] },
    ]),
  );
  // Hers: her own photograph, which the cover lit all night.
  fx.links.set(id(2), {
    tile: `https://r2.example/${id(2)}.webp`,
    who: [null, WHO_HOST, null],
  });
  fx.ensure.mockClear();
});
afterEach(() => {
  vi.restoreAllMocks();
  setReducedMotion(false);
  window.history.replaceState({}, "", "/");
  root().removeAttribute("data-develop");
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("★ her first open after the develop plays it, in place", () => {
  it("★ the still sheet stands over her held album, develops once it is seen, then the mark is written and the album let go", async () => {
    const { container } = render(<Hub />);
    // Held from the first decision: the album's rows under the still sheet, which is the roll's five squares.
    expect(root().getAttribute("data-develop")).toBe("held");
    expect(stage(container)).toBe("still");
    expect(container.querySelectorAll("[data-develop-sq]")).toHaveLength(5);
    expect(screen.getByTestId("rows")).toBeInTheDocument();

    await playIt();
    expect(stage(container)).toBe("play");
    expect(root().getAttribute("data-develop")).toBe("play");
    expect(root().getAttribute("data-develop-motion")).toBe("full");
    // The first screen's tiles grow out of their squares (a tile is found by its id).
    expect(container.querySelectorAll("[data-develop-grow]")).toHaveLength(5);
    expect(localStorage.getItem(markKey)).toBeNull();

    await advance(developLength("full", 5) + 50);
    expect(stage(container)).toBeNull();
    expect(root().hasAttribute("data-develop")).toBe(false);
    expect(localStorage.getItem(markKey)).toBe(String(DEVELOP_MS));
    expect(screen.getByTestId("rows")).toBeInTheDocument();
  });

  it("★ her own are lit, as the cover lit them: the squares of the photographs she took", async () => {
    const { container } = render(<Hub />);
    const lit = [...container.querySelectorAll("[data-develop-sq][data-hers]")];
    expect(lit.map((el) => el.getAttribute("data-develop-sq"))).toEqual([id(2)]);
  });

  it("★ the album's rows are never remounted as the develop holds, plays and ends", async () => {
    const rowMounts = { mounted: 0, unmounted: 0 };
    const { container } = render(<Hub rowMounts={rowMounts} />);
    await playIt();
    await advance(developLength("full", 5) + 50);
    expect(stage(container)).toBeNull();
    expect(rowMounts).toEqual({ mounted: 1, unmounted: 0 });
  });

  it("★ loads only what she can see: the pictures of the squares in the first screen, never one below the fold", async () => {
    // jsdom has no layout: the three oldest (their squares and their tiles) are in the first screen, the rest a screen below it.
    const rect = (top: number) =>
      ({
        x: 0,
        y: top,
        width: 100,
        height: 100,
        top,
        left: 0,
        bottom: top + 100,
        right: 100,
        toJSON: () => ({}),
      }) as DOMRect;
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(
      function (this: Element) {
        const photo =
          this.getAttribute("data-develop-sq") ??
          this.getAttribute("data-media-id");
        return rect(photo && Number(photo.slice(-12)) > 3 ? 2000 : 0);
      },
    );
    const { container } = render(<Hub />);
    expect(container.querySelectorAll("[data-develop-sq] img")).toHaveLength(0);
    act(() => FakeIO.see(true));
    await advance(100);
    const drawn = [...container.querySelectorAll("[data-develop-sq]")]
      .filter((sq) => sq.querySelector("img"))
      .map((sq) => sq.getAttribute("data-develop-sq"));
    expect(drawn).toEqual([id(1), id(2), id(3)]);
  });
});

describe("★ it waits to be seen, and a scroll is never an end", () => {
  it("★ the sheet below the fold stands still, held, however long the page is open", async () => {
    const { container } = render(<Hub />);
    await advance(10_000);
    expect(stage(container)).toBe("still");
    expect(root().getAttribute("data-develop")).toBe("held");
    expect(localStorage.getItem(markKey)).toBeNull();
  });

  it("★ she scrolls to it: it plays (a scroll, a wheel and a touch move are no end of it)", async () => {
    const { container } = render(<Hub />);
    fireEvent.scroll(window);
    fireEvent.wheel(window);
    fireEvent.touchMove(document.body);
    expect(stage(container)).toBe("still");
    await playIt();
    fireEvent.scroll(window);
    fireEvent.wheel(window);
    expect(stage(container)).toBe("play");
  });

  it("a sheet that scrolls away before it has stood its lead is not played unseen", async () => {
    const { container } = render(<Hub />);
    act(() => FakeIO.see(true));
    await advance(DEVELOP_TEMPO.leadMs - 200);
    act(() => FakeIO.see(false));
    await advance(5_000);
    expect(stage(container)).toBe("still");
    // Seen again, it stands its lead anew.
    act(() => FakeIO.see(true));
    await advance(DEVELOP_TEMPO.leadMs - 200);
    expect(stage(container)).toBe("still");
    await advance(300);
    expect(stage(container)).toBe("play");
  });

  it("a page put away mid-play stands the sheet still again, and plays it from the start when she is back", async () => {
    const { container } = render(<Hub />);
    await playIt();
    expect(stage(container)).toBe("play");
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "hidden",
    });
    act(() => void document.dispatchEvent(new Event("visibilitychange")));
    expect(stage(container)).toBe("still");
    expect(localStorage.getItem(markKey)).toBeNull();
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "visible",
    });
    act(() => void document.dispatchEvent(new Event("visibilitychange")));
    await advance(DEVELOP_TEMPO.leadMs + 100);
    expect(stage(container)).toBe("play");
  });
});

describe("★ what ends it, on its last frame, at once", () => {
  it("★ a press in her album while it waits ends it, spent; a press on a card above it does not", async () => {
    const { container } = render(<Hub />);
    fireEvent.pointerDown(screen.getByText("A card above the album"));
    fireEvent.pointerDown(document.body);
    expect(stage(container)).toBe("still");
    fireEvent.pointerDown(screen.getByText("Add photos"));
    expect(stage(container)).toBeNull();
    expect(root().hasAttribute("data-develop")).toBe(false);
    expect(localStorage.getItem(markKey)).toBe(String(DEVELOP_MS));
  });

  it("★ any press or key while it plays ends it, wherever it lands", async () => {
    const { container } = render(<Hub />);
    await playIt();
    fireEvent.keyDown(document.body, { key: "a" });
    expect(stage(container)).toBeNull();
    expect(localStorage.getItem(markKey)).toBe(String(DEVELOP_MS));

    localStorage.clear();
    const again = render(<Hub />);
    await playIt();
    expect(stage(again.container)).toBe("play");
    fireEvent.pointerDown(screen.getAllByText("A card above the album")[1]);
    expect(stage(again.container)).toBeNull();
  });

  it("a window that changes size mid-play ends it (its tiles were measured where they stood)", async () => {
    const { container } = render(<Hub />);
    await playIt();
    fireEvent(window, new Event("resize"));
    expect(stage(container)).toBeNull();
  });
});

describe("★ never twice, and once per phone", () => {
  it("★ the next open, the mark written, is plain: no hold, no sheet, the album at once", () => {
    localStorage.setItem(markKey, String(DEVELOP_MS));
    const { container } = render(<Hub />);
    expect(stage(container)).toBeNull();
    expect(root().hasAttribute("data-develop")).toBe(false);
    expect(screen.getByTestId("rows")).toBeInTheDocument();
  });

  it("★ a develop her own guest page played on this phone is spent here too (the guests' mark, one key)", () => {
    // The guests' page writes the very key (`gallery-empty-state-wait.tsx`), the develop time it saw.
    localStorage.setItem(markKey, String(DEVELOP_MS + 60_000));
    const { container } = render(<Hub />);
    expect(stage(container)).toBeNull();
  });

  it("a develop she moves later plays again, and develops only the photographs after the one this phone saw", () => {
    localStorage.setItem(markKey, String((T0 + 25 * MIN_US) / 1000));
    const { container } = render(<Hub />);
    expect(stage(container)).toBe("still");
    // Three of the five came after the earlier develop.
    expect(
      container
        .querySelector("[data-develop-sheet]")
        ?.getAttribute("data-develop-sheet"),
    ).toBe("3");
  });

  it("★ a host who opened the hub through the wait meets the develop on her next open after it, and never twice", async () => {
    // The wait: her album's develop time is still ahead, so nothing is owed or written.
    const waiting = render(<Hub develops_at={AHEAD} />);
    expect(stage(waiting.container)).toBeNull();
    expect(root().hasAttribute("data-develop")).toBe(false);
    expect(localStorage.getItem(markKey)).toBeNull();
    waiting.unmount();

    // Her next open, after it developed.
    vi.setSystemTime(new Date(2026, 9, 10, 13, 0, 0));
    const next = render(<Hub develops_at={AHEAD} />);
    expect(stage(next.container)).toBe("still");
    await playIt();
    await advance(developLength("full", 5) + 50);
    expect(stage(next.container)).toBeNull();
    expect(localStorage.getItem(markKey)).toBe(String(Date.parse(AHEAD)));
    next.unmount();

    // And the open after that is plain.
    const third = render(<Hub develops_at={AHEAD} />);
    expect(stage(third.container)).toBeNull();
  });

  it("a develop that comes while she is looking early is not played over her rows, and is owed her next open", async () => {
    const { container, rerender } = render(<Hub develops_at={AHEAD} />);
    vi.setSystemTime(new Date(2026, 9, 10, 12, 30, 0));
    await advance(31_000);
    rerender(<Hub develops_at={AHEAD} />);
    expect(stage(container)).toBeNull();
    expect(root().hasAttribute("data-develop")).toBe(false);
    expect(localStorage.getItem(markKey)).toBeNull();
  });
});

describe("★ reduced motion lands developed at once", () => {
  it("no sheet and no hold: her album as it stands, and the mark written so it is not owed", async () => {
    setReducedMotion(true);
    const { container } = render(<Hub />);
    await advance(50);
    expect(stage(container)).toBeNull();
    expect(root().hasAttribute("data-develop")).toBe(false);
    expect(screen.getByTestId("rows")).toBeInTheDocument();
    expect(localStorage.getItem(markKey)).toBe(String(DEVELOP_MS));
  });
});

describe("what it never plays", () => {
  it("★ `?reel` is what she came for: spent unplayed, the mark written", async () => {
    window.history.replaceState({}, "", "/dashboard/event-1?reel");
    const { container } = render(<Hub />);
    await advance(50);
    expect(stage(container)).toBeNull();
    expect(root().hasAttribute("data-develop")).toBe(false);
    expect(localStorage.getItem(markKey)).toBe(String(DEVELOP_MS));
  });

  it("an album with nothing to develop (every photograph hidden or held) opens plainly and owes nothing", async () => {
    fx.entries = [
      entry(2, 20, FLAGS | ENTRY_PENDING),
      entry(1, 10, FLAGS | ENTRY_HIDDEN),
    ];
    const { container } = render(<Hub />);
    await advance(50);
    expect(stage(container)).toBeNull();
    expect(root().hasAttribute("data-develop")).toBe(false);
    expect(localStorage.getItem(markKey)).toBeNull();
  });

  it("an album with no develop time has nothing here at all: its rows in a box that holds nothing", () => {
    const { container } = render(<Hub develops_at={null} />);
    expect(stage(container)).toBeNull();
    expect(root().hasAttribute("data-develop")).toBe(false);
    expect(container.querySelector("[data-develop-rows]")).not.toBeNull();
  });
});

describe("★ the gate holds the album from the first byte", () => {
  const HubServer = ({ develops_at }: { develops_at: string | null }) => (
    <HubDevelop
      eventId="event-1"
      develop={{ develops_at, sealed_from: null }}
    >
      <div>rows</div>
    </HubDevelop>
  );

  it("★ the server's render of an owed develop carries the gate script, ahead of the rows, keyed by this phone's mark", () => {
    const html = renderToString(<HubServer develops_at={DEVELOP} />);
    const script = html.indexOf("<script>");
    expect(script).toBeGreaterThan(-1);
    expect(html).toContain(markKey);
    expect(html).toContain('"held"');
    expect(html.indexOf("data-develop-rows")).toBeGreaterThan(script);
  });

  it("no gate where nothing is owed: a develop time still ahead, none set, or nothing in the roll", () => {
    expect(renderToString(<HubServer develops_at={AHEAD} />)).not.toContain(
      "<script",
    );
    expect(renderToString(<HubServer develops_at={null} />)).not.toContain(
      "<script",
    );
    fx.entries = [entry(1, 10, FLAGS | ENTRY_HIDDEN)];
    expect(renderToString(<HubServer develops_at={DEVELOP} />)).not.toContain(
      "<script",
    );
  });
});
