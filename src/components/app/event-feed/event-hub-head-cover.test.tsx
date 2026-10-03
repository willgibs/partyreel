/**
 * HER HEAD UNDER THE COVER (the-wait r1, Will's `cover=guests`; red-team 46's MEDIUM): while her album develops, her
 * hub's head wears what her guests can see, never what waits. After the switch that puts held photographs in the roll
 * (approved and sealed with the develop, but created before the period began) it wore six of them, the opposite of what
 * her guests see; the head holds her manifest to the same test her cover's count does (`waitsOf`), the rows the page
 * read as the roll's among the develop facts.
 */
import { render, renderHook, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { HeadStill } from "@/components/guest/event-experience-head";
import {
  ENTRY_PREVIEW,
  ENTRY_REEL,
  type ManifestEntry,
} from "@/lib/events/album-wire";

const fx = vi.hoisted(() => ({
  entries: [] as ManifestEntry[],
  tiles: new Map<string, string>(),
}));

vi.mock("@/components/app/event-feed/host-album", () => {
  const album = {
    eventId: "event-1",
    store: {
      links: {
        ensure: async () => {},
        subscribe: () => () => {},
        revision: () => 0,
      },
    },
    linkOf: (id: string) =>
      fx.tiles.has(id) ? { tile: fx.tiles.get(id) } : undefined,
  };
  return {
    useHostAlbum: () => album,
    useHubEntries: () => fx.entries,
    useHubCounts: () => null,
  };
});
// The head's own neighbours are not under test: only its stills' hook is.
vi.mock("@/components/app/share/event-code-door", () => ({
  EventCodeDoor: () => null,
}));
vi.mock("@/components/app/share/event-link-row", () => ({
  EventLinkRow: () => null,
}));
// The head is its ground and its children, nothing more here: what it PUBLISHES is what the band beside it reads.
vi.mock("@/components/guest/event-experience-head", () => ({
  EventHead: ({
    ground,
    children,
  }: {
    ground: React.ReactNode;
    children: React.ReactNode;
  }) => (
    <div>
      {ground}
      {children}
    </div>
  ),
  HeadStills: () => null,
}));
vi.mock("./event-gallery-live", () => ({ EventLive: () => null }));

const { HubCover, useHubCoverStills } = await import("./event-hub-head");

const MIN_US = 60_000_000;
const NOW = Date.now();
const T0 = NOW * 1000 - 120 * MIN_US;
const SEALED_FROM = new Date(T0 / 1000 + 60_000).toISOString();
const AHEAD = new Date(NOW + 10 * 3_600_000).toISOString();
const FLAGS = ENTRY_REEL | ENTRY_PREVIEW;
const entry = (id: string, t: number): ManifestEntry => [id, 4, 3, FLAGS, t];
const still = (id: string): HeadStill => ({
  id,
  tile: `https://r2.example/${id}.webp`,
});

beforeEach(() => {
  // Newest first, as the manifest is: one added since the period began, two held photographs the switch put in the
  // roll (created BEFORE it) and one her guests saw already.
  fx.entries = [
    entry("new", T0 + 10 * MIN_US),
    entry("joined-b", T0 - 10 * MIN_US),
    entry("joined-a", T0 - 20 * MIN_US),
    entry("seen", T0 - 30 * MIN_US),
  ];
  fx.tiles = new Map(
    fx.entries.map((e) => [e[0], `https://r2.example/${e[0]}.webp`]),
  );
});

const ids = (stills: HeadStill[]) => stills.map((s) => s.id);

describe("★ her head wears what her guests can see while the album develops", () => {
  it("★ never a held photograph the switch put in the roll, nor one added since the period began", () => {
    const { result } = renderHook(() =>
      useHubCoverStills([still("joined-b"), still("seen"), still("new")], {
        develops_at: AHEAD,
        sealed_from: SEALED_FROM,
        joined: ["joined-a", "joined-b"],
      }),
    );
    expect(ids(result.current)).toEqual(["seen"]);
  });

  it("★ fills from the album's newest a guest can see when the served ones are all waiting", () => {
    const { result } = renderHook(() =>
      useHubCoverStills([still("joined-b"), still("new")], {
        develops_at: AHEAD,
        sealed_from: SEALED_FROM,
        joined: ["joined-a", "joined-b"],
      }),
    );
    expect(ids(result.current)).toEqual(["seen"]);
  });

  it("without the roll it reads by the period alone, as it did: the photographs from before it are seen", () => {
    const { result } = renderHook(() =>
      useHubCoverStills([still("joined-b"), still("seen"), still("new")], {
        develops_at: AHEAD,
        sealed_from: SEALED_FROM,
      }),
    );
    expect(ids(result.current)).toEqual(["joined-b", "seen"]);
  });

  it("an album with no develop time ahead wears its newest as the page served them", () => {
    const { result } = renderHook(() =>
      useHubCoverStills([still("new"), still("joined-b")], {
        develops_at: null,
        sealed_from: null,
      }),
    );
    expect(ids(result.current)).toEqual(["new", "joined-b"]);
  });
});

describe("★ the band beside her head reads the roll the head publishes", () => {
  // The sticky band's face is the cover's own (`event-cards-row.tsx` calls `useHubCoverStills(served)` with no facts of
  // its own): the head hands it the develop facts once mounted, and a roll it left out would dress the band in the
  // photographs her guests cannot see.
  function Band({ served }: { served: HeadStill[] }) {
    const stills = useHubCoverStills(served);
    return <ul data-testid="band">{ids(stills).join(",")}</ul>;
  }

  it("★ the band wears what her guests see, never a held photograph the switch put in the roll", () => {
    render(
      <>
        <HubCover
          name="The party"
          date={null}
          counts={{ album: 4, guests: 1, views: 0 }}
          prettyUrl="partyreel.com/e/x"
          eventLink="https://partyreel.com/e/x"
          code={{
            qrStyle: "classic",
            door: {} as never,
            acceptingUploads: true,
            waiting: 0,
          }}
          stills={[still("joined-b"), still("seen")]}
          develop={{
            develops_at: AHEAD,
            sealed_from: SEALED_FROM,
            joined: ["joined-a", "joined-b"],
          }}
        />
        <Band served={[still("joined-b"), still("seen"), still("new")]} />
      </>,
    );
    expect(screen.getByTestId("band").textContent).toBe("seen");
  });
});
