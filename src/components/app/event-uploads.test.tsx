import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { EventUploads } from "@/components/app/event-uploads";
import type { HubAlbumSeed } from "@/lib/event/hub-album";
import { ENTRY_REEL, type ManifestEntry } from "@/lib/events/album-wire";

import { HostAlbumProvider } from "./event-feed/host-album";

/**
 * THE HUB HANDS ITS ALBUM THE WAY TO ASK FOR A HELD ARRIVAL'S LINK (crumbs-25).
 *
 * A delta brings the manifest's tuple with no link, and only a window asks for links, so an arrival the
 * host's grid holds at the door (`use-arrival-gate.ts`) has no window over it to ask: the gate asks
 * itself, through `HubRows.onNeedLinks`, and that has to reach the album store's link store. Left
 * unwired the arrival waits out its two seconds for a link nobody sent for, and lands as it always did.
 * The grid is a spy here: what is pinned is what the hub HANDS it.
 */

const grid = vi.hoisted(() => ({ props: vi.fn() }));
vi.mock("@/components/app/host-media-grid", () => ({
  HostMediaGrid: (props: unknown) => {
    grid.props(props);
    return <div data-testid="album-grid" />;
  },
}));
vi.mock("@/app/(app)/dashboard/[eventId]/actions", () => ({
  removeMediaAction: vi.fn(),
  removeMediaBulkAction: vi.fn(),
  setMediaStatusAction: vi.fn(),
  setMediaStatusBulkAction: vi.fn(),
}));
vi.mock("@/components/likes/likes-provider", () => ({
  LikesProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  useLikes: () => null,
}));
vi.mock("@/lib/guest/use-gallery-doorbell", () => ({
  useGalleryDoorbell: () => ({ live: false }),
}));
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

// The store's transport: the link route is the spy, answering every id as not in this album.
const transport = vi.hoisted(() => ({ links: vi.fn() }));
vi.mock("@/lib/album/transport", () => ({
  hostAlbumTransport: () => ({
    sync: async () => ({ status: 304 }),
    manifest: async () => {
      throw new Error("no manifest pages here");
    },
    links: transport.links,
  }),
}));

const EVENT_ID = "evt_1";
const uuid = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const entry = (n: number): ManifestEntry => [
  uuid(n),
  400,
  300,
  ENTRY_REEL,
  1_758_800_000_000_000 - n,
];
const seed = (entries: ManifestEntry[]): HubAlbumSeed => ({
  eventId: EVENT_ID,
  sync: {
    kind: "manifest",
    v: 1,
    attr: 0,
    entries,
    next: null,
    ok: true,
    counts: { album: entries.length, pending: 0 },
  },
  etag: '"a1-test"',
  links: {
    ok: true,
    access: "full",
    gate: null,
    b: 0,
    now: 0,
    links: [],
    missing: [],
    likes: {},
  },
});

type Rows = {
  onWindowChange: (ids: readonly string[]) => void;
  onNeedLinks?: (ids: readonly string[]) => void;
};
const rowsHanded = () =>
  (grid.props.mock.calls.at(-1)![0] as { rows: Rows }).rows;

beforeEach(() => {
  grid.props.mockClear();
  transport.links.mockReset();
  transport.links.mockImplementation(async (ids: string[]) => ({
    ok: true,
    access: "full",
    gate: null,
    b: 0,
    now: 0,
    links: [],
    missing: ids,
    likes: {},
  }));
});

describe("the hub's album", () => {
  it("★ hands the grid a way to ask for a held arrival's link, which reaches the album's link store", async () => {
    render(
      <HostAlbumProvider seed={seed([entry(1), entry(2)])} qrToken="qr">
        <EventUploads eventId={EVENT_ID} />
      </HostAlbumProvider>,
    );
    const rows = rowsHanded();
    expect(rows.onNeedLinks).toBeTypeOf("function");

    // The arrival (an id the seed's links do not hold): its link is sent for, by id, with no window.
    rows.onNeedLinks!([uuid(9)]);
    await vi.waitFor(() => expect(transport.links).toHaveBeenCalledTimes(1));
    expect(transport.links).toHaveBeenCalledWith([uuid(9)]);
  });

  it("gives the same stable function on every render, so the gate's effect does not re-run for nothing", () => {
    const view = render(
      <HostAlbumProvider seed={seed([entry(1)])} qrToken="qr">
        <EventUploads eventId={EVENT_ID} />
      </HostAlbumProvider>,
    );
    const first = rowsHanded().onNeedLinks;
    view.rerender(
      <HostAlbumProvider seed={seed([entry(1)])} qrToken="qr">
        <EventUploads eventId={EVENT_ID} />
      </HostAlbumProvider>,
    );
    expect(rowsHanded().onNeedLinks).toBe(first);
  });
});
