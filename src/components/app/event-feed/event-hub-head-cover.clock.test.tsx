/**
 * HER COVER LIFTS AT THE DEVELOP ITSELF (red-team 46's LOW): after the host's own Develop now (`develops_at` is the
 * database's now, and the page reads it afresh) her hub's cover stood up to half a minute more, saying "What your guests
 * see until it develops at 7:42 am", because the page decided "ahead or reached" against a clock read at its last step.
 * A host who sees nothing change may press Develop now again. The cover reads the wait's one clock (`useWaitClock`),
 * which now turns at the develop: on the render that brings the time, and on a develop ahead at its own moment.
 *
 * The hub's neighbours stand in as they do beside this (`event-gallery.test.tsx`): pinned here is when the album's place
 * stops being the cover, never its look.
 */
import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ENTRY_REEL,
  type ManifestEntry,
  WHO_HOST,
} from "@/lib/events/album-wire";

const fx = vi.hoisted(() => ({
  entries: [] as ManifestEntry[],
}));

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
    linkOf: () => ({
      tile: "https://r2.example/t.webp",
      who: [null, WHO_HOST, null],
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

const entry = (id: string, t: number): ManifestEntry => [
  id,
  4,
  3,
  ENTRY_REEL,
  t,
];

type Develop = { develops_at: string | null; sealed_from: string | null };

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
  vi.useFakeTimers();
  vi.stubGlobal("IntersectionObserver", InView);
  // Saturday 7:42:00 am, on the clock's own half minute: its next step is thirty seconds away.
  vi.setSystemTime(new Date(2026, 9, 10, 7, 42, 0));
  fx.entries = [entry("w1", Date.now() * 1000 - 60_000_000)];
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const sealedFrom = () => new Date(Date.now() - 3_600_000).toISOString();
const covered = (container: HTMLElement) =>
  container.querySelector("[data-host-cover='covered']") !== null;

describe("★ her cover lifts at the develop itself", () => {
  it("★ Develop now: the page reads the database's now, and the cover is gone on that very render, not at the clock's next step", () => {
    const { container, rerender } = render(
      <Hub
        develop={{
          develops_at: new Date(2026, 9, 10, 9, 0).toISOString(),
          sealed_from: sealedFrom(),
        }}
      />,
    );
    expect(covered(container)).toBe(true);
    expect(screen.queryByTestId("album-rows")).toBeNull();
    // Her press, the server's save and the page's afresh read take eight seconds here, as they did in the ledger.
    act(() => {
      vi.setSystemTime(new Date(2026, 9, 10, 7, 42, 8, 400));
    });
    rerender(
      <Hub
        develop={{
          develops_at: new Date(Date.now()).toISOString(),
          sealed_from: sealedFrom(),
        }}
      />,
    );
    expect(covered(container)).toBe(false);
    expect(screen.getByTestId("album-rows")).toBeInTheDocument();
    expect(container.textContent).not.toContain("until it develops");
  });

  it("★ a develop ahead lifts it at its own moment, the minute it was picked for, however long the page has been open", () => {
    // 7:42:00 to 9:00:00 in two moves, so the clock has stepped all the way there: the cover stands to the last
    // millisecond before the develop and is gone at it.
    const { container } = render(
      <Hub
        develop={{
          develops_at: new Date(2026, 9, 10, 7, 44, 0).toISOString(),
          sealed_from: sealedFrom(),
        }}
      />,
    );
    expect(covered(container)).toBe(true);
    act(() => {
      vi.advanceTimersByTime(2 * 60_000 - 1);
    });
    expect(covered(container)).toBe(true);
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(covered(container)).toBe(false);
    expect(screen.getByTestId("album-rows")).toBeInTheDocument();
  });

  it("a develop mounted midway between two steps still lifts it at its moment, not at the next step after it", () => {
    vi.setSystemTime(new Date(2026, 9, 10, 7, 43, 41));
    const { container } = render(
      <Hub
        develop={{
          develops_at: new Date(2026, 9, 10, 7, 44, 0).toISOString(),
          sealed_from: sealedFrom(),
        }}
      />,
    );
    expect(covered(container)).toBe(true);
    // A timer that began at 7:43:41 would step at 7:44:11, eleven seconds late.
    act(() => {
      vi.advanceTimersByTime(19_000);
    });
    expect(covered(container)).toBe(false);
  });
});
