import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { resetDoorLightForTests } from "@/lib/guest/door-light";

import { AlbumLightSampler } from "./album-light";
import { resetDoorViewForTests, useDoorView } from "./album-view";
import { DoorLamp } from "./lit";

/**
 * THE LAMP'S SOURCE (`identity-door` r2: "coloured from the album's three newest photos through
 * sampled-palette"). Pinned: it samples the newest items' PREVIEWS within a bounded lookback (never
 * an original, never a placeholder with no link), only while a lamp is lit, and hands every lamp the
 * hues; the lookback is widened past a colourless run at the album's head (`crumbs-3`, build 11's
 * red-team), never unbounded.
 */
const { live, sampled } = vi.hoisted(() => ({
  live: {
    current: {
      items: [] as {
        id: string;
        type: "photo" | "video";
        url: string;
        previewUrl?: string | null;
      }[],
    },
  },
  sampled: {
    calls: [] as (readonly string[] | null)[],
    answer: null as string[] | null,
  },
}));
vi.mock("@/components/guest/gallery-live", () => ({
  useGalleryLive: () => live.current,
}));
vi.mock("@/lib/shared/sampled-palette", () => ({
  useSampledPalette: (src: readonly string[] | null) => {
    sampled.calls.push(src);
    return src ? sampled.answer : null;
  },
}));

beforeEach(() => {
  sampled.calls.length = 0;
  sampled.answer = null;
  live.current.items = [
    { id: "a", type: "photo", url: "", previewUrl: null },
    {
      id: "b",
      type: "photo",
      url: "https://r2/b.jpg",
      previewUrl: "https://r2/b.webp",
    },
    {
      id: "c",
      type: "video",
      url: "https://r2/c.mp4",
      previewUrl: "https://r2/c-poster.webp",
    },
    { id: "d", type: "video", url: "https://r2/d.mp4", previewUrl: null },
    { id: "e", type: "photo", url: "https://r2/e.jpg", previewUrl: null },
    {
      id: "f",
      type: "photo",
      url: "https://r2/f.jpg",
      previewUrl: "https://r2/f.webp",
    },
  ];
});

afterEach(() => {
  resetDoorLightForTests();
});

beforeEach(() => {
  resetDoorLightForTests();
});

describe("AlbumLightSampler", () => {
  it("samples nothing while no lamp is lit", () => {
    render(<AlbumLightSampler />);
    expect(sampled.calls.every((src) => src === null)).toBe(true);
  });

  it("samples the newest previews once a lamp is lit, never an original, a placeholder or a video with no poster", () => {
    render(
      <>
        <AlbumLightSampler />
        <DoorLamp edge="free" />
      </>,
    );
    expect(sampled.calls.at(-1)).toEqual([
      "https://r2/b.webp",
      "https://r2/c-poster.webp",
      "https://r2/f.webp",
    ]);
  });

  it("looks past a colourless run to a dozen newest previews, not only the newest three", () => {
    // build 11's red-team: an album whose three newest items are grey clip posters must still
    // reach whatever ordinary, colourful photographs sit just behind them.
    live.current.items = Array.from({ length: 14 }, (_, i) => ({
      id: `p${i}`,
      type: "photo" as const,
      url: `https://r2/p${i}.jpg`,
      previewUrl: `https://r2/p${i}.webp`,
    }));
    render(
      <>
        <AlbumLightSampler />
        <DoorLamp edge="free" />
      </>,
    );
    // Bounded at a dozen (his to overrule), and reaching well past the old newest-three.
    expect(sampled.calls.at(-1)).toEqual(
      Array.from({ length: 12 }, (_, i) => `https://r2/p${i}.webp`),
    );
  });

  it("hands every lamp the album's hues when the sample lands", () => {
    sampled.answer = [
      "oklch(0.72 0.15 12)",
      "oklch(0.72 0.15 200)",
      "oklch(0.72 0.15 300)",
      "oklch(0.72 0.15 40)",
      "oklch(0.72 0.15 90)",
    ];
    const { container } = render(
      <>
        <AlbumLightSampler />
        <DoorLamp edge="free" />
      </>,
    );
    const lamp = container.querySelector("[data-door-lamp]");
    expect(lamp).toHaveAttribute("data-door-hues", "12,200,300");
    expect(lamp).toHaveAttribute("data-door-sampled");
  });
});

describe("what the open door shows", () => {
  afterEach(() => resetDoorViewForTests());

  it("★ publishes the album's newest previews for the doorway's opening, never an item with none", () => {
    render(<AlbumLightSampler />);
    expect(viewNow()).toEqual([
      "https://r2/b.webp",
      "https://r2/c-poster.webp",
      "https://r2/f.webp",
    ]);
  });

  it("★ takes them away when the album's page goes, so another door never shows this album", () => {
    const view = render(<AlbumLightSampler />);
    expect(viewNow().length).toBeGreaterThan(0);
    view.unmount();
    expect(viewNow()).toEqual([]);
  });
});

/** What the doorway's opening would show now (the store, read as the doorway reads it). */
function viewNow(): readonly string[] {
  let seen: readonly string[] = [];
  function Probe() {
    seen = useDoorView();
    return null;
  }
  const probe = render(<Probe />);
  probe.unmount();
  return seen;
}
