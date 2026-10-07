/**
 * EVERY DOOR OPENS ITS ROOM OVER THE HUB, ONE WAY (Will, event-header r2 `rooms=over`: "This feels phenomenally more
 * fluid, natural, and intuitive"). Driven through the real row: each room's door is a real link to the room's own
 * address on the hub (so a modified click is a tab of its own), an ordinary press opens the room in place, See it as
 * a guest is the fifth door at the row's end, and a room's code and what it will show are asked for on intent, so
 * the panel opens on the room rather than on a wait.
 *
 * And, since event-header r4's cards (as r6 drew them), how the row says what each door holds, how it folds into its pills
 * under the bar and back (the fold's plumbing: the browser's own animation and layout are stood in for), and that the
 * cover's light follows it under the cover.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const openSheet = vi.fn();
const openCode = vi.fn();
// The page's share island, as the row reads it: whether the head's code is still on screen decides the stuck chip.
const share = vi.hoisted(() => ({ headerCodeHidden: false }));
vi.mock("@/components/app/share/event-share-provider", () => ({
  useEventShare: () => ({
    openSheet,
    openCode,
    headerCodeHidden: share.headerCodeHidden,
    morphNameFor: () => undefined,
  }),
}));
const warmRoom = vi.hoisted(() => vi.fn());
vi.mock("@/components/app/share/room-chunks", () => ({ warmRoom }));
const prefetchGuestsRoom = vi.hoisted(() => vi.fn());
vi.mock("@/components/app/share/guests-panel", () => ({ prefetchGuestsRoom }));
// The hub's album: two uploads waiting in Review, one decided.
const ensure = vi.hoisted(() => vi.fn(async () => {}));
const album = vi.hoisted(() => ({
  store: {
    getSnapshot: () => ({
      status: "ready",
      entries: [
        ["m1", 4, 3, 16, 1],
        ["m2", 4, 3, 0, 2],
        ["m3", 4, 3, 16, 3],
      ],
    }),
    subscribe: () => () => {},
    links: { ensure, subscribe: () => () => {}, revision: () => 0 },
  },
  seedSnapshot: { entries: [] },
  linkOf: () => undefined,
}));
vi.mock("@/components/app/event-feed/host-album", () => ({
  useHostAlbum: () => album,
  useHubCounts: () => null,
  useHubEntries: () => null,
}));
vi.mock("@/app/(app)/dashboard/[eventId]/actions", () => ({}));

const { EventCardsRow } = await import("./event-cards-row");

const EVENT = "00000000-0000-4000-8000-0000000000e1";

function row() {
  return render(
    <EventCardsRow
      eventId={EVENT}
      cards={[
        { id: "guests", value: "6 guests" },
        { id: "review", value: "2 waiting", needs: true, count: 2 },
        { id: "settings", value: "Public" },
      ]}
      reel={{
        state: "off",
        have: 0,
        of: 2,
        stills: [],
        viewHref: "/e/probe?reel",
        moderated: true,
        pending: 2,
      }}
    />,
  );
}

const door = (name: RegExp) => screen.getByRole("link", { name });

// jsdom lays nothing out and observes nothing: the row's stick asks both, and here it simply rests.
class Unobserved {
  observe() {}
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal("IntersectionObserver", Unobserved);
vi.stubGlobal("ResizeObserver", Unobserved);

beforeEach(() => {
  openSheet.mockClear();
  openCode.mockClear();
  warmRoom.mockClear();
  prefetchGuestsRoom.mockClear();
  ensure.mockClear();
  share.headerCodeHidden = false;
});

describe("the doors into her rooms", () => {
  it.each([
    [/^Guests/, "guests"],
    [/^Review/, "review"],
    [/^Settings/, "settings"],
    [/^As a guest/, "as-guest"],
  ])(
    "★ %s is a real link to its room on the hub, and a press opens it there",
    (name, room) => {
      row();
      const link = door(name);
      expect(link).toHaveAttribute("href", `/dashboard/${EVENT}?room=${room}`);
      const press = new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        button: 0,
      });
      link.dispatchEvent(press);
      expect(press.defaultPrevented).toBe(true);
      expect(openSheet).toHaveBeenCalledWith(room);
    },
  );

  it("leaves a modified click to the browser: the room in a tab of its own", () => {
    row();
    fireEvent.click(door(/^Review/), { metaKey: true });
    fireEvent.click(door(/^Guests/), { ctrlKey: true });
    expect(openSheet).not.toHaveBeenCalled();
  });

  it("★ ends on See it as a guest, the payoff after Settings", () => {
    row();
    const group = screen.getByRole("group", { name: "This event" });
    const links = [...group.querySelectorAll("a, button")].map(
      (el) => el.textContent ?? "",
    );
    expect(links.at(-1)).toMatch(/^As a guest/);
    expect(links.at(-2)).toMatch(/^Settings/);
    expect(door(/^As a guest/)).toHaveTextContent("What they see");
  });
});

describe("a room's code and what it shows, asked for on intent", () => {
  it("warms a room's chunk as a pointer comes over its door, or a keyboard lands on it", () => {
    row();
    fireEvent.pointerEnter(door(/^Review/));
    fireEvent.focus(door(/^Guests/));
    fireEvent.pointerEnter(door(/^As a guest/));
    expect(warmRoom.mock.calls.map(([room]) => room)).toEqual([
      "review",
      "guests",
      "as-guest",
    ]);
  });

  it("asks for the Guests room's read as the press begins", () => {
    row();
    fireEvent.pointerDown(door(/^Guests/), { button: 0 });
    expect(prefetchGuestsRoom).toHaveBeenCalledWith(EVENT);
  });

  it("asks for the links of every upload waiting in Review as the press begins, and nothing else", () => {
    row();
    fireEvent.pointerDown(door(/^Review/), { button: 0 });
    expect(ensure).toHaveBeenCalledWith(["m1", "m3"]);
  });

  it("a press that is not the main button asks for nothing", () => {
    row();
    fireEvent.pointerDown(door(/^Guests/), { button: 2 });
    fireEvent.pointerDown(door(/^Review/), { button: 1 });
    expect(prefetchGuestsRoom).not.toHaveBeenCalled();
    expect(ensure).not.toHaveBeenCalled();
  });
});

/** The row with its own faces: what each door holds. */
function faces(
  cards: React.ComponentProps<typeof EventCardsRow>["cards"],
  reel: Partial<React.ComponentProps<typeof EventCardsRow>["reel"]> = {},
) {
  return render(
    <EventCardsRow
      eventId={EVENT}
      cards={cards}
      reel={{
        state: "live",
        have: 2,
        of: 2,
        viewHref: "/e/probe?reel",
        moderated: true,
        pending: 0,
        ...reel,
      }}
    />,
  );
}

const piece = (el: HTMLElement, name: string) =>
  el.querySelector<HTMLElement>(`[data-fold="${name}"]`);

describe("what each door says", () => {
  it("★ names every door with its room and its line, so each is one thing to a reader in either form of the row", () => {
    faces([
      { id: "guests", value: "2 waiting", needs: true, count: 2 },
      { id: "review", value: "All caught up" },
      { id: "settings", value: "Private · You let in" },
    ]);
    for (const name of [
      "Highlight reel: Live for guests",
      "Guests: 2 waiting",
      "Review: All caught up",
      "Settings: Private · You let in",
      "As a guest: What they see",
    ])
      expect(screen.getByRole("link", { name })).toBeInTheDocument();
  });

  it("rides each count that needs her on its glyph, in the status, and keeps the word on the line", () => {
    faces([
      { id: "guests", value: "2 waiting", needs: true, count: 2 },
      { id: "review", value: "8 waiting", needs: true, count: 8 },
      { id: "settings", value: "Public" },
    ]);
    const review = door(/^Review/);
    expect(piece(review, "badge")).toHaveTextContent("8");
    expect(piece(review, "badge")).toHaveAttribute("data-badge", "needs");
    expect(piece(review, "text")).toHaveTextContent("waiting");
    expect(piece(door(/^Guests/), "badge")).toHaveTextContent("2");
    // The doors with nothing that needs her keep their glyphs bare.
    expect(piece(door(/^Settings/), "badge")).toBeNull();
    expect(piece(door(/^Highlight reel/), "badge")).toBeNull();
  });

  // ★ THE CARRIED CALL G4 (event-header r4, taken again at r6): Settings' count is plain and never the status, and paused
  // uploads read Paused.
  it("★ says Settings' steps left in the ink and a quiet badge, never the status, and paused uploads as Paused", () => {
    const { unmount } = faces([
      { id: "guests", value: "0 guests" },
      { id: "review", value: "Off" },
      { id: "settings", value: "2 left", strong: true, left: 2 },
    ]);
    const settings = door(/^Settings/);
    expect(settings).toHaveAccessibleName("Settings: 2 left");
    expect(piece(settings, "badge")).toHaveAttribute("data-badge", "quiet");
    expect(settings.querySelector('[data-badge="needs"]')).toBeNull();
    unmount();

    faces([
      { id: "guests", value: "0 guests" },
      { id: "review", value: "Off" },
      { id: "settings", value: "Paused", paused: true },
    ]);
    expect(door(/^Settings/)).toHaveAccessibleName("Settings: Paused");
    expect(
      piece(door(/^Settings/), "badge")?.querySelector("svg"),
    ).not.toBeNull();
  });

  // ★ crumbs-81: the hub's Guests card read "0 guests" while a sealed roll waited.
  it("★ says a sealed roll's shots are developing on the Guests card, as the Guests room does", () => {
    faces([
      { id: "guests", value: "6 shots developing" },
      { id: "review", value: "Off" },
      { id: "settings", value: "Public" },
    ]);
    expect(door(/^Guests/)).toHaveAccessibleName("Guests: 6 shots developing");
    expect(piece(door(/^Guests/), "text")).toHaveTextContent(
      "6 shots developing",
    );
  });

  it("is five doors in a group, the guest's view last, whatever the faces", () => {
    faces([
      { id: "review", value: "Off" },
      { id: "settings", value: "Public" },
      { id: "guests", value: "0 guests" },
    ]);
    const names = [
      ...screen
        .getByRole("group", { name: "This event" })
        .querySelectorAll<HTMLElement>("[data-hub-door]"),
    ].map((el) => el.dataset.hubDoor);
    // The reel, Guests, Review, Settings, then the guest's view: the row's own order, however the cards were handed in.
    expect(names).toEqual(["reel", "guests", "review", "settings", "as-guest"]);
  });
});

/**
 * THE COVER'S LIGHT FOLLOWS THE ROW (event-header r6, the Seam made Afterglow's): born at the photograph's edge below the
 * cards and falling into the page, so it stands after the footprint in the page's flow, never inside the sticky footprint
 * (where the fold could flash it) and never under a row with no cover above it.
 */
describe("the cover's light", () => {
  it("★ stands after the footprint, outside it, wherever the row is drawn under a cover", () => {
    const { container } = render(
      <EventCardsRow
        eventId={EVENT}
        cards={[
          { id: "guests", value: "6 guests" },
          { id: "review", value: "Off" },
          { id: "settings", value: "Public" },
        ]}
        reel={{
          state: "off",
          have: 0,
          of: 2,
          viewHref: "/e/probe?reel",
          moderated: false,
          pending: 0,
        }}
        head={{ name: "Maya & Jay", stills: [] }}
      />,
    );
    const footprint = container.querySelector("[data-hub-row]")!;
    const light = container.querySelector("[data-hub-light]")!;
    expect(light).not.toBeNull();
    expect(footprint.contains(light)).toBe(false);
    expect(footprint.nextElementSibling).toBe(light);
    // Decoration: a reader never meets it.
    expect(light).toHaveAttribute("aria-hidden", "true");
  });

  it("draws no light under a row with no cover above it", () => {
    const { container } = row();
    expect(container.querySelector("[data-hub-light]")).toBeNull();
  });
});

/**
 * THE STUCK BAND AND ITS FOLD. The browser lays nothing out and animates nothing here, so the row's own observer is
 * driven by hand (fired as a real one would be, on the footprint's crossing of the bar), the animation API is a recorder, and
 * every piece the fold carries is given a box: what is held is the plumbing that no screenshot shows, that the band's
 * `data-stuck` and the pieces move together, and that a fold can be reversed.
 */
describe("the band under the bar, and the fold into it", () => {
  type Sight = {
    cb: IntersectionObserverCallback;
    target: Element | null;
  };
  let sights: Sight[] = [];
  let animate: ReturnType<typeof vi.fn>;
  let flights: { cancel: ReturnType<typeof vi.fn> }[] = [];
  let reduced = false;

  beforeEach(() => {
    sights = [];
    flights = [];
    reduced = false;
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        sight: Sight;
        constructor(cb: IntersectionObserverCallback) {
          this.sight = { cb, target: null };
          sights.push(this.sight);
        }
        observe(el: Element) {
          this.sight.target = el;
        }
        unobserve() {}
        disconnect() {}
        takeRecords() {
          return [];
        }
      },
    );
    // jsdom has no animation API and no media queries: a recorder and a switch for the reader's motion preference.
    animate = vi.fn(() => {
      const flight = { cancel: vi.fn() };
      flights.push(flight);
      return flight;
    });
    Element.prototype.animate = animate as unknown as Element["animate"];
    vi.stubGlobal(
      "matchMedia",
      (query: string) =>
        ({
          matches: query.includes("no-preference") ? !reduced : false,
          media: query,
          addEventListener: () => {},
          removeEventListener: () => {},
        }) as unknown as MediaQueryList,
    );
    // Every piece the fold carries has a box, in both forms (an unboxed piece is hidden in its form and simply goes).
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(
      function (this: Element) {
        const box = this.hasAttribute("data-fold") ? 24 : 0;
        return {
          x: 0,
          y: 0,
          left: 0,
          top: 0,
          width: box,
          height: box,
          right: box,
          bottom: box,
          toJSON: () => ({}),
        };
      },
    );
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    // @ts-expect-error the recorder was ours: put jsdom's own (absent) animate back
    delete Element.prototype.animate;
  });

  const mount = () =>
    render(
      <EventCardsRow
        eventId={EVENT}
        cards={[
          { id: "guests", value: "2 waiting", needs: true, count: 2 },
          { id: "review", value: "8 waiting", needs: true, count: 8 },
          { id: "settings", value: "Public" },
        ]}
        reel={{
          state: "live",
          have: 2,
          of: 2,
          viewHref: "/e/probe?reel",
          moderated: true,
          pending: 8,
        }}
        head={{
          name: "Maya & Jay",
          stills: [{ id: "a", tile: "/still-a.jpg" }],
        }}
      />,
    );
  const band = () =>
    screen
      .getByRole("group", { name: "This event" })
      .closest<HTMLElement>(".hub-band")!;
  /** The row's own observer reports the footprint's crossing of the bar (ratio under 1: stuck). */
  const report = async (ratio: number) => {
    const sight = sights.find((s) => s.target?.contains(band()))!;
    await act(async () =>
      sight.cb(
        [
          { intersectionRatio: ratio },
        ] as unknown as IntersectionObserverEntry[],
        {} as IntersectionObserver,
      ),
    );
  };

  it("★ folds as the row reaches the bar: its pieces fly, and the band is in its pill form for them to land in", async () => {
    mount();
    await report(1);
    expect(band()).not.toHaveAttribute("data-stuck");
    expect(animate).not.toHaveBeenCalled();
    await report(0.4);
    expect(band()).toHaveAttribute("data-stuck");
    expect(animate).toHaveBeenCalled();
    // Every door's own surface travels, five in all.
    const skins = animate.mock.contexts.filter(
      (el: Element) => (el as HTMLElement).dataset?.fold === "skin",
    );
    expect(skins).toHaveLength(5);
    // And the fold ends in the one form: nothing is left running once the pieces have landed.
    expect(
      animate.mock.calls.every(([, options]) => options.fill === "backwards"),
    ).toBe(true);
  });

  it("unfolds the same way back", async () => {
    mount();
    await report(1);
    await report(0.4);
    animate.mockClear();
    await report(1);
    expect(band()).not.toHaveAttribute("data-stuck");
    expect(
      animate.mock.contexts.filter(
        (el: Element) => (el as HTMLElement).dataset?.fold === "skin",
      ),
    ).toHaveLength(5);
  });

  it("★ is interruptible: a fold reversed mid-flight cancels the flights it has up and folds from where the pieces are", async () => {
    mount();
    await report(1);
    await report(0.4);
    const running = [...flights];
    expect(running.length).toBeGreaterThan(0);
    await report(1);
    for (const flight of running) expect(flight.cancel).toHaveBeenCalled();
    expect(band()).not.toHaveAttribute("data-stuck");
  });

  // ★ RESHAPED ON PURPOSE (event-header r6's carried `reduced-fold`, Will's to overrule: "It dissolves: the new form develops
  // in place over 150ms and nothing travels"): this pinned the flip at once, with no animation at all. The scar stands:
  // nothing travels for a reader who asked for less motion; only an opacity runs, on what stands on the band.
  it("★ dissolves for a reader who asked for less motion: what stands on the band develops in place, and nothing travels", async () => {
    reduced = true;
    mount();
    await report(1);
    await report(0.4);
    expect(band()).toHaveAttribute("data-stuck");
    expect(animate).toHaveBeenCalled();
    for (const [frames, options] of animate.mock.calls) {
      // An opacity alone, never a transform or a box: the new form develops where it stands.
      for (const frame of frames as Keyframe[])
        expect(Object.keys(frame).sort()).toEqual(["opacity"]);
      expect(options.duration).toBeLessThanOrEqual(150);
    }
    // The band's ground is there at once, as in the moving fold.
    expect(
      animate.mock.contexts.some(
        (el: Element) => (el as HTMLElement).dataset?.fold === "veil",
      ),
    ).toBe(false);
    animate.mockClear();
    await report(1);
    expect(band()).not.toHaveAttribute("data-stuck");
    for (const [frames] of animate.mock.calls)
      for (const frame of frames as Keyframe[])
        expect(Object.keys(frame).sort()).toEqual(["opacity"]);
  });

  it("★ folds Review first, then its neighbours, the row's ends last", async () => {
    mount();
    await report(1);
    await report(0.4);
    const delayOf = (room: string) => {
      const at = animate.mock.contexts.findIndex(
        (el: Element) =>
          (el as HTMLElement).dataset?.fold === "skin" &&
          el.closest("[data-hub-door]")?.getAttribute("data-hub-door") === room,
      );
      return animate.mock.calls[at][1].delay ?? 0;
    };
    expect(delayOf("review")).toBe(0);
    expect(delayOf("guests")).toBeGreaterThan(0);
    expect(delayOf("guests")).toBe(delayOf("settings"));
    expect(delayOf("reel")).toBeGreaterThan(delayOf("guests"));
    expect(delayOf("reel")).toBe(delayOf("as-guest"));
  });

  // A reload restored below the bar, or a deep link into the album, is a page that was never at rest to fold from.
  it("★ is stuck at once, not folded, when its first report finds the page already below the bar", async () => {
    mount();
    await report(0.2);
    expect(band()).toHaveAttribute("data-stuck");
    expect(animate).not.toHaveBeenCalled();
    // The next crossing is a real one, and folds.
    await report(1);
    expect(animate).toHaveBeenCalled();
  });

  it("stands the face, the doors and the code each in its own place on the band once stuck, the face first and the code last", async () => {
    share.headerCodeHidden = true;
    mount();
    await report(1);
    await report(0.4);
    const order = [...band().children].map(
      (el) =>
        (el as HTMLElement).dataset.fold ??
        (el.getAttribute("role") === "group" ? "doors" : el.className),
    );
    // r6's `band-ends`: the cover's face at the left end, the doors between, the code at the right end.
    expect(order).toEqual(["veil", "lead", "doors", "code"]);
  });

  it("leads with the head it came from only once stuck: the cover's first photograph and its name", async () => {
    mount();
    await report(1);
    expect(band().querySelector("[data-band-lead]")).toBeNull();
    await report(0.4);
    const lead = band().querySelector("[data-band-lead]")!;
    expect(lead.querySelector("img")).toHaveAttribute("src", "/still-a.jpg");
    expect(lead).toHaveTextContent("Maya & Jay");
  });

  it("closes on the code's chip only once stuck with the head's code off screen, and the chip opens the code", async () => {
    share.headerCodeHidden = true;
    mount();
    await report(1);
    expect(screen.queryByRole("button", { name: /show the code/i })).toBeNull();
    await report(0.4);
    const chip = screen.getByRole("button", {
      name: "Show the code for this event",
    });
    fireEvent.click(chip);
    expect(openCode).toHaveBeenCalledTimes(1);
  });

  it("draws no chip while the head's own code is on screen, however stuck", async () => {
    share.headerCodeHidden = false;
    mount();
    await report(1);
    await report(0.4);
    expect(screen.queryByRole("button", { name: /show the code/i })).toBeNull();
  });

  it("never remounts a door as it folds: the same elements stand in both forms", async () => {
    mount();
    await report(1);
    const before = [...band().querySelectorAll("[data-hub-door]")];
    await report(0.4);
    await report(1);
    const after = [...band().querySelectorAll("[data-hub-door]")];
    expect(after).toHaveLength(5);
    after.forEach((el, i) => expect(el).toBe(before[i]));
  });
});
