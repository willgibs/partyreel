/**
 * THE HOST'S COVER ON HER HUB (the-wait r1, Will's `cover=guests`): until her album develops, its place is the very
 * contact sheet her guests meet, counted from her own manifest and capped while the count climbs, her own lit; Look
 * lifts it for the visit into her album as it is, Cover it puts it back, and Develop now asks first. An album with no
 * develop time ahead is simply her album.
 *
 * The hub's neighbours stand in (the album's store, the add and selection islands, the bin, the downloads): pinned here
 * is what the album's place draws, never its look.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { use } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AlbumNewsContext } from "@/components/shared/album-window-news";
import {
  ENTRY_HIDDEN,
  ENTRY_PENDING,
  ENTRY_REEL,
  type ManifestEntry,
  WHO_HOST,
} from "@/lib/events/album-wire";

const fx = vi.hoisted(() => ({
  entries: [] as ManifestEntry[],
  links: new Map<
    string,
    { tile: string; who: [string | null, number, null] }
  >(),
  ensure: vi.fn(async (_ids: string[]) => {}),
  update: vi.fn(async (_id: string, _patch: unknown) => ({
    ok: true as const,
  })),
  refresh: vi.fn(),
  /** The order the hub last handed its album's rows (`HubView.sort`). */
  sort: null as string | null,
}));

vi.mock("@/app/(app)/dashboard/actions", () => ({
  updateEventAction: (id: string, patch: unknown) => fx.update(id, patch),
}));
vi.mock("@/app/(app)/dashboard/[eventId]/actions", () => ({
  setRowStepAction: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: fx.refresh }),
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
    useHubCounts: () => ({ album: fx.entries.length, pending: 0 }),
    useHubLive: () => false,
    HubViewProvider: ({
      value,
      children,
    }: {
      value: { sort: string };
      children: React.ReactNode;
    }) => {
      fx.sort = value.sort;
      return children;
    },
  };
});
vi.mock("@/components/app/host-add-provider", () => ({
  useHostAdd: () => null,
}));
vi.mock("@/components/app/host-selection-provider", () => ({
  useHostSelection: () => null,
}));
vi.mock("@/components/app/host-upload", () => ({ HostUpload: () => null }));
vi.mock("@/components/app/recently-deleted-grid", () => ({
  HubBin: () => null,
  useHubBin: () => ({ status: "idle", entries: [], open: vi.fn() }),
}));
vi.mock("@/components/app/export/download-all-button", () => ({
  GalleryDownloadAllButton: () => <button type="button">Download all</button>,
}));
vi.mock("./gallery-actions", () => ({
  GalleryBulkBar: () => null,
  GallerySelectButton: () => <button type="button">Select</button>,
}));

const { EventGallery } = await import("./event-gallery");

const MIN_US = 60_000_000;
const NOW = Date.now();
const T0 = NOW * 1000 - 120 * MIN_US;
const SEALED_FROM = new Date(T0 / 1000 + 60_000).toISOString();
const AHEAD = new Date(NOW + 10 * 3_600_000).toISOString();
const entry = (id: string, t: number): ManifestEntry => [
  id,
  4,
  3,
  ENTRY_REEL,
  t,
];

function mount(
  develop: {
    develops_at: string | null;
    sealed_from: string | null;
    joined?: readonly string[];
  } | null,
) {
  return render(
    <EventGallery
      eventId="event-1"
      videosAllowed
      initialStep={1}
      develop={develop}
    >
      <div data-testid="album-rows">the album rows</div>
    </EventGallery>,
  );
}

// The lifted line's own sentinel watches through an IntersectionObserver jsdom lacks: in view, always, here.
class InView {
  observe() {}
  disconnect() {}
  unobserve() {}
  takeRecords() {
    return [];
  }
}

beforeEach(() => {
  vi.stubGlobal("IntersectionObserver", InView);
  fx.entries = [
    entry("w3", T0 + 30 * MIN_US),
    entry("w2", T0 + 20 * MIN_US),
    entry("w1", T0 + 10 * MIN_US),
    entry("seen", T0),
  ];
  fx.links = new Map([
    ["w2", { tile: "https://r2.example/w2.webp", who: [null, WHO_HOST, null] }],
    ["w3", { tile: "https://r2.example/w3.webp", who: ["Ana", 0, null] }],
  ]);
  fx.ensure.mockClear();
  fx.update.mockClear();
  fx.refresh.mockClear();
});

describe("★ before the develop, her album's place is what her guests see", () => {
  it("draws her guests' sheet from her manifest: what waits counted, her own lit, never her album's rows", () => {
    const { container } = mount({
      develops_at: AHEAD,
      sealed_from: SEALED_FROM,
    });
    expect(screen.queryByTestId("album-rows")).toBeNull();
    expect(
      container.querySelector("[data-host-cover='covered']"),
    ).not.toBeNull();
    // Three wait (added since the develop's period began); the one before it is what her guests already see.
    expect(container.querySelector("[data-wait-count]")).toHaveAttribute(
      "data-wait-count",
      "3",
    );
    // Her own, by its link's mark, lit with its picture; a guest's never pictured.
    const lit = container.querySelectorAll(".wait-cell[data-hers] img");
    expect(lit).toHaveLength(1);
    expect(lit[0]).toHaveAttribute("src", "https://r2.example/w2.webp");
    expect(container.innerHTML).not.toContain("w3.webp");
    // The links of the newest that wait are asked for once, to learn which are hers.
    expect(fx.ensure).toHaveBeenCalledWith(["w3", "w2", "w1"]);
    // Nothing to select or download under the cover: Look first.
    expect(screen.queryByRole("button", { name: "Select" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Download all" })).toBeNull();
  });

  it("★ a switched album: the held photographs that joined the roll are developing under her cover, as her guests read them (red-team 46's MEDIUM)", () => {
    // `old1` and `old2` were held when she went from approving each to a develop time: created BEFORE the period the
    // switch stamped, approved and sealed by it. By the period alone every one read as seen, "0 developing".
    fx.entries = [
      entry("w1", T0 + 10 * MIN_US),
      entry("old2", T0 - 10 * MIN_US),
      entry("old1", T0 - 20 * MIN_US),
      entry("seen", T0 - 30 * MIN_US),
    ];
    const { container } = mount({
      develops_at: AHEAD,
      sealed_from: SEALED_FROM,
      joined: ["old1", "old2"],
    });
    expect(container.querySelector("[data-wait-count]")).toHaveAttribute(
      "data-wait-count",
      "3",
    );
    // What waits is asked about, newest first, to learn which are hers; the one her guests saw is not.
    expect(fx.ensure).toHaveBeenCalledWith(["w1", "old2", "old1"]);
  });

  it("★ Look lifts it into her album as it is, for the visit, and Cover it puts it back", () => {
    const { container } = mount({
      develops_at: AHEAD,
      sealed_from: SEALED_FROM,
    });
    fireEvent.click(screen.getByRole("button", { name: "Look" }));
    expect(screen.getByTestId("album-rows")).toBeInTheDocument();
    expect(
      container.querySelector("[data-host-cover='lifted']"),
    ).not.toBeNull();
    expect(container.querySelector("[data-host-looked]")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Select" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Cover it/ }));
    expect(screen.queryByTestId("album-rows")).toBeNull();
    expect(
      container.querySelector("[data-host-cover='covered']"),
    ).not.toBeNull();
  });

  it("★ the grid is capped and the count climbs past it", () => {
    fx.entries = Array.from({ length: 1000 }, (_, i) =>
      entry(`m${i}`, T0 + 30 * MIN_US - i),
    );
    const { container } = mount({
      develops_at: AHEAD,
      sealed_from: SEALED_FROM,
    });
    expect(container.querySelector("[data-wait-count]")).toHaveAttribute(
      "data-wait-count",
      "1000",
    );
    const drawn = container.querySelectorAll(".wait-cell").length;
    expect(drawn).toBeLessThanOrEqual(12 * 8);
    expect(
      Number(
        container
          .querySelector("[data-wait-folded]")
          ?.getAttribute("data-wait-folded"),
      ),
    ).toBe(1000 - drawn);
  });

  it("Develop now asks first, then develops in the database's own clock and reads the page afresh", async () => {
    mount({ develops_at: AHEAD, sealed_from: SEALED_FROM });
    fireEvent.click(screen.getByRole("button", { name: "Develop now" }));
    expect(fx.update).not.toHaveBeenCalled();
    expect(
      screen.getByText(/^Every photo added so far shows now, to every guest\./),
    ).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Develop now" }));
    });
    expect(fx.update).toHaveBeenCalledWith("event-1", {
      develops_at: expect.any(String),
    });
    expect(fx.refresh).toHaveBeenCalledTimes(1);
  });
});

describe("an album with no develop time ahead is her album", () => {
  it("no develop time: the rows, no cover", () => {
    const { container } = mount({ develops_at: null, sealed_from: null });
    expect(screen.getByTestId("album-rows")).toBeInTheDocument();
    expect(container.querySelector("[data-host-cover]")).toBeNull();
  });

  it("a develop already reached: the rows, no cover", () => {
    const { container } = mount({
      develops_at: new Date(NOW - 60_000).toISOString(),
      sealed_from: SEALED_FROM,
    });
    expect(screen.getByTestId("album-rows")).toBeInTheDocument();
    expect(container.querySelector("[data-host-cover]")).toBeNull();
  });

  it("off the page's facts (no develop handed down): the rows", () => {
    mount(null);
    expect(screen.getByTestId("album-rows")).toBeInTheDocument();
  });
});

/**
 * ★ THE ROWS IT FRAMES ARE TOLD WHAT ARRIVED (album-order): the hub's arrivals reach the album's rows as their news
 * (`AlbumNews`), so a guest's photograph landing out of the host's sight wears the rows' pill. Never the seed; a new id
 * once; a held one (in Review) is no news until it joins the album; a hide is never news.
 */
describe("the album's news", () => {
  function News() {
    const news = use(AlbumNewsContext);
    return <p data-testid="news">{news ? news.arrivals.join(",") : "none"}</p>;
  }
  const mountNews = () =>
    render(
      <EventGallery eventId="event-1" videosAllowed initialStep={1}>
        <News />
      </EventGallery>,
    );

  it("names what joined her album since it opened, once, and nothing it opened with", () => {
    const view = mountNews();
    expect(screen.getByTestId("news").textContent).toBe("");
    // A guest's upload lands, and one waits in Review (held: not her album's yet).
    fx.entries = [
      entry("new1", T0 + 40 * MIN_US),
      ["held", 4, 3, ENTRY_REEL | ENTRY_PENDING, T0 + 35 * MIN_US],
      ...fx.entries,
    ];
    view.rerender(
      <EventGallery eventId="event-1" videosAllowed initialStep={1}>
        <News />
      </EventGallery>,
    );
    expect(screen.getByTestId("news").textContent).toBe("new1");
    // Review lets it in, and she hides another: the approval is news, the hide is not.
    fx.entries = fx.entries.map(
      (e): ManifestEntry =>
        e[0] === "held"
          ? entry("held", T0 + 35 * MIN_US)
          : e[0] === "w1"
            ? [e[0], e[1], e[2], ENTRY_REEL | ENTRY_HIDDEN, e[4]]
            : e,
    );
    view.rerender(
      <EventGallery eventId="event-1" videosAllowed initialStep={1}>
        <News />
      </EventGallery>,
    );
    expect(screen.getByTestId("news").textContent).toBe("new1,held");
  });
});

/**
 * ★ HER SORT OPENS ON HER GUESTS' ORDER (album-order's `albumOwnSort`, AY1): her album opens as her guests meet it, newest
 * first while it takes uploads and the night in order once she closes adding or it develops, so a hub and a guest's
 * phone never show one album two ways; her own Sort is a departure for the visit, forgotten when she chooses the album's
 * own again.
 */
describe("★ her Sort opens on her guests' order", () => {
  const gallery = (
    acceptingUploads: boolean | undefined,
    developsAt: string | null = null,
  ) => (
    <EventGallery
      eventId="event-1"
      videosAllowed
      initialStep={1}
      develop={{ develops_at: developsAt, sealed_from: null }}
      acceptingUploads={acceptingUploads}
    >
      <div data-testid="album-rows">the album rows</div>
    </EventGallery>
  );
  const pick = (label: string) => {
    // Radix's dropdown trigger opens on pointerdown, not click (`view-menu.test.tsx`'s own `openMenu`).
    fireEvent.pointerDown(screen.getByRole("button", { name: "View" }), {
      ctrlKey: false,
      button: 0,
    });
    fireEvent.click(screen.getByRole("menuitemradio", { name: label }));
  };

  it("newest first while it takes uploads, and where the page says nothing of it", () => {
    const view = render(gallery(true));
    expect(fx.sort).toBe("newest");
    view.unmount();
    render(gallery(undefined));
    expect(fx.sort).toBe("newest");
  });

  it("★ the night in order once she has closed adding, whatever its date", () => {
    render(gallery(false));
    expect(fx.sort).toBe("oldest");
  });

  it("★ the night in order once its develop has come, open or not", () => {
    render(gallery(true, new Date(NOW - 60_000).toISOString()));
    expect(fx.sort).toBe("oldest");
  });

  it("★ her Sort departs for the visit; choosing the album's own again lets her close turn it", () => {
    const view = render(gallery(true));
    pick("Oldest first");
    expect(fx.sort).toBe("oldest");
    pick("Newest first");
    expect(fx.sort).toBe("newest");
    // She closes adding while she looks (the page renders again with the row): her album turns, as her guests' do.
    view.rerender(gallery(false));
    expect(fx.sort).toBe("oldest");
  });

  it("a departure she chose stands across her close and a reopen", () => {
    const view = render(gallery(false));
    pick("Newest first");
    expect(fx.sort).toBe("newest");
    view.rerender(gallery(true));
    expect(fx.sort).toBe("newest");
    view.rerender(gallery(false));
    expect(fx.sort).toBe("newest");
  });
});
