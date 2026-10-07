/**
 * THE HUB'S GALLERY HOLDS THE DEVELOP (crumbs-73): the album's place is her guests' cover while a develop time is ahead
 * (`event-hub-head-cover.tsx`), and the very moment it comes (the clock, or Develop now: the page reads the database's
 * now afresh) the cover gives way to her rows with the develop's still sheet over them, in the same place, which plays
 * once it is seen. The rows stand in `EventGallery`'s box through it, and a hub that never develops draws them as it
 * always has. The director's own rules are `hub-develop.test.tsx`'s; pinned here is the wiring.
 */
import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  DEVELOP_TEMPO,
  developMarkKey,
} from "@/lib/disposable/contact-sheet-develop";
import {
  ENTRY_PREVIEW,
  ENTRY_REEL,
  type ManifestEntry,
} from "@/lib/events/album-wire";

const fx = vi.hoisted(() => ({ entries: [] as ManifestEntry[] }));

vi.mock("@/app/(app)/dashboard/actions", () => ({
  updateEventAction: vi.fn(async () => ({ ok: true as const })),
}));
vi.mock("@/app/(app)/dashboard/[eventId]/actions", () => ({
  setRowStepAction: vi.fn(),
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
        ensure: async () => {},
        subscribe: () => () => {},
        revision: () => 0,
      },
    },
    linkOf: (id: string) => ({
      tile: `https://r2.example/${id}.webp`,
      who: ["Ana", 0, null],
    }),
  };
  return {
    useHostAlbum: () => album,
    useHubEntries: () => fx.entries,
    useHubCounts: () => ({ album: fx.entries.length, pending: 0 }),
    useHubLive: () => false,
    HubViewProvider: ({ children }: { children: React.ReactNode }) => children,
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
const id = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

/** An IntersectionObserver the test drives (the develop's stage plays only once it is seen). */
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
  static see() {
    for (const io of FakeIO.all)
      io.cb(
        [
          {
            isIntersecting: true,
            intersectionRatio: 1,
            intersectionRect: { height: 300 },
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

type Develop = {
  develops_at: string | null;
  sealed_from: string | null;
  time_zone?: string | null;
};

function Hub({ develop }: { develop: Develop }) {
  return (
    <EventGallery
      eventId="event-1"
      videosAllowed
      initialStep={1}
      develop={develop}
    >
      <div data-testid="album-rows">the album rows</div>
    </EventGallery>
  );
}

const stage = (c: HTMLElement) =>
  c.querySelector("[data-hub-develop]")?.getAttribute("data-hub-develop") ??
  null;
const covered = (c: HTMLElement) =>
  c.querySelector("[data-host-cover='covered']") !== null;

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("IntersectionObserver", FakeIO);
  FakeIO.all.clear();
  vi.stubGlobal("ResizeObserver", FakeRO);
  // Saturday 7:42:00 am.
  vi.setSystemTime(new Date(2026, 9, 10, 7, 42, 0));
  localStorage.clear();
  fx.entries = [1, 2, 3].map(
    (n): ManifestEntry => [
      id(n),
      4,
      3,
      ENTRY_REEL | ENTRY_PREVIEW,
      Date.now() * 1000 - (10 - n) * MIN_US,
    ],
  );
});
afterEach(() => {
  document.documentElement.removeAttribute("data-develop");
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("★ the cover says the develop in one clock, or both named (crumbs-87)", () => {
  const clockOf = (c: HTMLElement) =>
    [...c.querySelectorAll("[data-wait-clock]")]
      .map((el) => el.textContent ?? "")
      .join(" ");
  const sayLine = (c: HTMLElement) =>
    c.querySelector("[data-host-cover-say]")?.textContent ?? "";
  const develop = (time_zone: string | null) => ({
    develops_at: new Date(2026, 9, 10, 9, 0).toISOString(),
    sealed_from: new Date(2026, 9, 9, 18, 0).toISOString(),
    time_zone,
  });

  it("★ a far party: the line above names the party's clock and its place, and so does the held card under it, with hers beside", () => {
    const { container } = render(
      <Hub develop={develop("Pacific/Kiritimati")} />,
    );
    expect(sayLine(container)).toContain("in Kiritimati");
    // The card used to read "All at once tomorrow at ..." in her own clock alone, unlabelled, right under that line.
    expect(clockOf(container)).toContain("in Kiritimati");
    expect(clockOf(container)).toMatch(/yours/);
  });

  it("a party in her own zone, or one with none stored, says her clock alone, as it always did", () => {
    for (const zone of [
      null,
      Intl.DateTimeFormat().resolvedOptions().timeZone,
    ]) {
      const { container, unmount } = render(<Hub develop={develop(zone)} />);
      expect(clockOf(container)).toContain("All at once");
      expect(clockOf(container)).not.toMatch(/yours| in [A-Z]/);
      expect(sayLine(container)).not.toMatch(/ in [A-Z]/);
      unmount();
    }
  });
});

describe("★ the cover gives way to her rows with the develop over them", () => {
  it("★ Develop now: the page reads the database's now, and her album's place is the still sheet over her rows, in the same box", async () => {
    const { container, rerender } = render(
      <Hub
        develop={{
          develops_at: new Date(2026, 9, 10, 9, 0).toISOString(),
          sealed_from: new Date(2026, 9, 9, 18, 0).toISOString(),
        }}
      />,
    );
    expect(covered(container)).toBe(true);
    expect(stage(container)).toBeNull();
    expect(document.documentElement.hasAttribute("data-develop")).toBe(false);

    act(() => {
      vi.setSystemTime(new Date(2026, 9, 10, 7, 42, 8));
    });
    rerender(
      <Hub
        develop={{
          develops_at: new Date(Date.now()).toISOString(),
          sealed_from: new Date(2026, 9, 9, 18, 0).toISOString(),
        }}
      />,
    );
    expect(covered(container)).toBe(false);
    expect(stage(container)).toBe("still");
    expect(document.documentElement.getAttribute("data-develop")).toBe("held");
    // Her rows stand in the develop's rows, inside the album's box; the sheet is a sibling of them, over their top.
    const rows = screen.getByTestId("album-rows");
    expect(rows.closest("[data-develop-rows]")).not.toBeNull();
    const album = rows.closest("[data-develop-album]");
    expect(album).not.toBeNull();
    expect(album?.contains(container.querySelector("[data-hub-develop]"))).toBe(
      true,
    );
    expect(album?.closest("[data-section-swap]")).not.toBeNull();
    // It waits to be seen; seen, and stood its lead, it plays (the mark is written as it ends, once per phone).
    act(() => FakeIO.see());
    for (let t = 0; t < DEVELOP_TEMPO.leadMs + 200; t += 50)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(50);
      });
    expect(stage(container)).toBe("play");
    expect(localStorage.getItem(developMarkKey("event-1"))).toBeNull();
  });

  it("an album that never develops draws her rows in the same box and nothing over them", () => {
    const { container } = render(
      <Hub develop={{ develops_at: null, sealed_from: null }} />,
    );
    expect(stage(container)).toBeNull();
    expect(document.documentElement.hasAttribute("data-develop")).toBe(false);
    expect(
      screen.getByTestId("album-rows").closest("[data-develop-rows]"),
    ).not.toBeNull();
  });
});
