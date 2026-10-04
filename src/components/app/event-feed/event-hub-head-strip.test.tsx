import { act, render } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ENTRY_PENDING, type ManifestEntry } from "@/lib/events/album-wire";

import { HubFactsStrip } from "./event-hub-head-strip";

/**
 * THE FACTS STRIP ON THE HUB'S COVER (`event-header` r3, Will's `facts=strip`), pinned by what it SAYS and when:
 * one mark a photograph read off the page's album store, three widths of it in the DOM for the container query to
 * choose between, the album's own number at its end, lit only while photographs are landing and never before the
 * reader has a clock. The marks' arithmetic is `event-hub-head-strip-marks.test.ts`'s.
 */

const store = vi.hoisted(() => ({
  album: null as object | null,
  entries: null as readonly unknown[] | null,
  counts: null as { album: number; pending: number } | null,
}));
vi.mock("./host-album", () => ({
  useHostAlbum: () => store.album,
  useHubEntries: () => store.entries,
  useHubCounts: () => store.counts,
}));

const NOW = Date.UTC(2026, 9, 4, 20, 0, 0);
const MIN = 60_000;

/** An album's entries, newest first, each landed `agoMin[i]` minutes before NOW. */
function album(agoMin: number[], flags: number[] = []): ManifestEntry[] {
  return agoMin
    .map(
      (ago, i): ManifestEntry => [
        `m${i}`,
        100,
        100,
        flags[i] ?? 0,
        (NOW - ago * MIN) * 1000,
      ],
    )
    .sort((a, b) => b[4] - a[4]);
}

function useAlbum(entries: ManifestEntry[], counts = entries.length) {
  store.album = {};
  store.entries = entries;
  store.counts = { album: counts, pending: 0 };
}

const root = (c: HTMLElement) => c.querySelector("[data-hub-strip]")!;
const tier = (c: HTMLElement, id: string) =>
  c.querySelector(`[data-hub-strip-tier="${id}"]`)!;

beforeEach(() => {
  vi.useFakeTimers({ now: NOW });
  store.album = null;
  store.entries = null;
  store.counts = null;
});
afterEach(() => {
  vi.useRealTimers();
});

describe("the marks", () => {
  it("★ draws a mark a photograph, at three widths for the strip's own box to choose between", () => {
    // 214 photographs over an evening: more than any tier's slots.
    useAlbum(album(Array.from({ length: 214 }, (_, i) => 600 - i * 2.5)));
    const { container } = render(<HubFactsStrip served={214} />);
    expect(tier(container, "hand").children).toHaveLength(52);
    expect(tier(container, "mid").children).toHaveLength(104);
    expect(tier(container, "desk").children).toHaveLength(160);
    // The container query picks one (Tailwind's 36rem and 56rem): a hand until 36rem, a tablet's to 56rem, then a desk's.
    expect(tier(container, "hand").className).toContain("@xl:hidden");
    expect(tier(container, "mid").className).toMatch(
      /hidden.*@xl:flex.*@4xl:hidden/,
    );
    expect(tier(container, "desk").className).toMatch(/hidden.*@4xl:flex/);
    // The strip is the container the tiers answer to.
    expect(root(container).className).toContain("@container");
  });

  it("is one mark a photograph for a small album, the quiet points before its first photograph waiting", () => {
    useAlbum(album([300, 200, 100]));
    const { container } = render(<HubFactsStrip served={3} />);
    const hand = [...tier(container, "hand").children];
    expect(hand).toHaveLength(19);
    expect(hand.filter((m) => m.hasAttribute("data-waiting"))).toHaveLength(16);
    expect(hand.filter((m) => !m.hasAttribute("data-waiting"))).toHaveLength(3);
  });

  it("is only decoration to a reader: the marks are hidden from them and one sentence says the album", () => {
    useAlbum(album([300, 200, 100]));
    const { container } = render(<HubFactsStrip served={3} />);
    for (const id of ["hand", "mid", "desk"]) {
      expect(tier(container, id).getAttribute("aria-hidden")).toBe("true");
    }
    expect(container.querySelector(".sr-only")?.textContent).toBe(
      "3 photos & videos",
    );
    // What is drawn at its end says the same, so it is hidden from a reader too: the sentence is read once.
    expect(
      container
        .querySelector("[data-hub-strip-count]")!
        .closest("[aria-hidden]"),
    ).not.toBeNull();
  });

  it("★ counts what the hub's album holds, never what waits in Review", () => {
    useAlbum(album([40, 30, 20, 10], [ENTRY_PENDING, 0, 0, ENTRY_PENDING]), 2);
    const { container } = render(<HubFactsStrip served={2} />);
    const filled = [...tier(container, "hand").children].filter(
      (m) => !m.hasAttribute("data-waiting"),
    );
    expect(filled).toHaveLength(2);
  });
});

describe("the number at its end", () => {
  it("is the album's count the store holds, which moves as the album does", () => {
    useAlbum(album([30, 20, 10]), 3);
    const { container, rerender } = render(<HubFactsStrip served={9} />);
    expect(container.querySelector("[data-hub-strip-count]")?.textContent).toBe(
      "3",
    );
    useAlbum(album([30, 20, 10, 1]), 4);
    rerender(<HubFactsStrip served={9} />);
    expect(container.querySelector("[data-hub-strip-count]")?.textContent).toBe(
      "4",
    );
    expect(
      tier(container, "hand").querySelectorAll("[data-waiting]"),
    ).toHaveLength(15);
  });

  it("groups a long album's count as the product always does", () => {
    useAlbum(album(Array.from({ length: 1249 }, (_, i) => i)), 1249);
    const { container } = render(<HubFactsStrip served={1249} />);
    expect(container.querySelector("[data-hub-strip-count]")?.textContent).toBe(
      "1,249",
    );
  });

  it("says no photos yet, over a line of quiet points, for an empty album", () => {
    useAlbum([], 0);
    const { container } = render(<HubFactsStrip served={0} />);
    expect(container.textContent).toContain("No photos yet");
    expect(container.querySelector("[data-hub-strip-count]")).toBeNull();
    const desk = [...tier(container, "desk").children];
    expect(desk).toHaveLength(54);
    expect(desk.every((m) => m.hasAttribute("data-waiting"))).toBe(true);
  });
});

describe("lit", () => {
  it("★ is photographs landing now: the newest within a quarter of an hour lights the end and its recent marks", () => {
    useAlbum(album([600, 300, 120, 14, 5, 2]));
    const { container } = render(<HubFactsStrip served={6} />);
    expect(root(container).hasAttribute("data-landing")).toBe(true);
    expect(
      container.querySelector(".hub-strip-end")?.hasAttribute("data-landing"),
    ).toBe(true);
    const lit = [...tier(container, "hand").children].filter((m) =>
      m.hasAttribute("data-new"),
    );
    // The three within a quarter of an hour of the newest, and only those.
    expect(lit).toHaveLength(3);
    expect(container.querySelector(".sr-only")?.textContent).toContain(
      "landing now",
    );
  });

  it("★ never wears the design's bright edge: `data-lit` is that material hook, and would ring the whole strip", () => {
    // Found in a real browser (a hairline box round the strip), where a state named `data-lit` read as the edge's own.
    useAlbum(album([600, 300, 120, 14, 5, 2]));
    const { container } = render(<HubFactsStrip served={6} />);
    expect(root(container).hasAttribute("data-landing")).toBe(true);
    expect(container.querySelector("[data-lit]")).toBeNull();
  });

  it("is never lit for an album that has gone quiet", () => {
    useAlbum(album([600, 300, 120, 16]));
    const { container } = render(<HubFactsStrip served={4} />);
    expect(root(container).hasAttribute("data-landing")).toBe(false);
    expect(container.querySelector("[data-new]")).toBeNull();
    expect(container.querySelector(".sr-only")?.textContent).not.toContain(
      "landing now",
    );
  });

  it("★ puts its light out at the quarter hour on its own, with nothing refreshed", () => {
    useAlbum(album([60, 30, 10]));
    const { container } = render(<HubFactsStrip served={3} />);
    expect(root(container).hasAttribute("data-landing")).toBe(true);
    // Five minutes on it is still landing, the newest being ten minutes old; at the quarter hour it is not.
    act(() => {
      vi.advanceTimersByTime(4 * MIN);
    });
    expect(root(container).hasAttribute("data-landing")).toBe(true);
    act(() => {
      vi.advanceTimersByTime(2 * MIN);
    });
    expect(root(container).hasAttribute("data-landing")).toBe(false);
    expect(container.querySelector("[data-new]")).toBeNull();
  });

  it("lights again when a new photograph lands, and keeps one timer for the moment it turns", () => {
    useAlbum(album([300, 200]));
    const { container, rerender } = render(<HubFactsStrip served={2} />);
    expect(root(container).hasAttribute("data-landing")).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
    useAlbum(album([300, 200, 0]));
    rerender(<HubFactsStrip served={3} />);
    expect(root(container).hasAttribute("data-landing")).toBe(true);
    expect(vi.getTimerCount()).toBe(1);
  });

  it("runs no clock at all for a quiet album", () => {
    useAlbum(album([900, 800, 700]));
    render(<HubFactsStrip served={3} />);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("★ is not lit in the server's paint or the hydrating render, which have no clock of hers", () => {
    useAlbum(album([60, 30, 2]));
    const html = renderToString(<HubFactsStrip served={3} />);
    expect(html).not.toContain("data-landing");
    expect(html).not.toContain("data-new");
    // The album's marks and number are all there in the first byte.
    expect(html).toContain('data-hub-strip-tier="desk"');
    expect(html).toContain("data-hub-strip-count");
  });
});

describe("a head with no album store", () => {
  it("draws the count it was handed over a flat quiet line, never a shape it does not know", () => {
    const { container } = render(<HubFactsStrip served={214} />);
    expect(container.querySelector("[data-hub-strip-count]")?.textContent).toBe(
      "214",
    );
    const heights = new Set(
      [...tier(container, "desk").children].map(
        (m) => (m as HTMLElement).style.height,
      ),
    );
    expect(heights.size).toBe(1);
    expect([...tier(container, "desk").children]).toHaveLength(160);
    expect(root(container).hasAttribute("data-landing")).toBe(false);
  });

  it("draws the arrivals it was handed (the Library's specimen), and lights what is landing", () => {
    const nowMin = NOW / MIN;
    const arrivals = [
      nowMin - 400,
      nowMin - 200,
      nowMin - 90,
      nowMin - 3,
      nowMin - 1,
    ];
    const { container } = render(
      <HubFactsStrip served={5} arrivals={arrivals} />,
    );
    const heights = new Set(
      [...tier(container, "hand").children]
        .filter((m) => !m.hasAttribute("data-waiting"))
        .map((m) => (m as HTMLElement).style.height),
    );
    expect(heights.size).toBeGreaterThan(0);
    expect(root(container).hasAttribute("data-landing")).toBe(true);
  });
});
