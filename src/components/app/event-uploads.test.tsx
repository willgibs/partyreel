import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { EMPTY_ALBUM, EventUploads } from "@/components/app/event-uploads";
import type { HubAlbumSeed } from "@/lib/event/hub-album";
import {
  ENTRY_PENDING,
  ENTRY_REEL,
  type ManifestEntry,
} from "@/lib/events/album-wire";

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
const add = vi.hoisted(() => ({
  value: null as { openAdd: () => void } | null,
}));
vi.mock("@/components/app/host-add-provider", () => ({
  useHostAdd: () => add.value,
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

/**
 * WHAT THE ALBUM'S PLACE HOLDS BEFORE THE FIRST PHOTOGRAPH (moved here from the retired launch list's
 * test, event-ready 2026-10-02, when the empty place became the album's own again): its empty state,
 * which gives the place back to the album at the first photograph, live; and never while photographs wait
 * in Review, since an event whose uploads are all held is a full one whose host has not looked yet. Not a
 * word is pinned.
 */
describe("the album's place before the first photograph", () => {
  const held = (n: number): ManifestEntry => [
    uuid(n),
    400,
    300,
    ENTRY_PENDING,
    1_758_800_000_000_000 - n,
  ];
  /** The page's seed for an album holding these entries (held ones count toward Review). */
  const seeded = (entries: ManifestEntry[]): HubAlbumSeed => {
    const base = seed(entries);
    return {
      ...base,
      sync: {
        ...base.sync,
        counts: {
          album: entries.filter((e) => !(e[3] & ENTRY_PENDING)).length,
          pending: entries.filter((e) => e[3] & ENTRY_PENDING).length,
        },
      },
    };
  };
  const place = (entries: ManifestEntry[]) =>
    render(
      <HostAlbumProvider seed={seeded(entries)} qrToken="qr">
        <EventUploads eventId={EVENT_ID} />
      </HostAlbumProvider>,
    );
  const empty = () => document.querySelector("[data-album-empty]");

  it("is the album's own empty state", () => {
    place([]);
    expect(empty()).not.toBeNull();
    expect(screen.queryByTestId("album-grid")).toBeNull();
  });

  // ★ RESHAPED ON PURPOSE (create-wizard r5's carried `album`, Will's pick for an empty album): it said "No photos yet"
  // and a line about guests; the empty album is now the house's invitation, its one door her own uploader.
  it("★ says the album starts with her, Add the first photos its one door: her own uploader", () => {
    const openAdd = vi.fn();
    add.value = { openAdd };
    place([]);
    expect(empty()?.textContent).toContain(EMPTY_ALBUM.title);
    fireEvent.click(screen.getByRole("button", { name: EMPTY_ALBUM.act }));
    expect(openAdd).toHaveBeenCalledTimes(1);
    add.value = null;
  });

  it("draws no door where there is no uploader to open (the Library)", () => {
    place([]);
    expect(screen.queryByRole("button", { name: EMPTY_ALBUM.act })).toBeNull();
  });

  it("gives the place back to the album at the first one", () => {
    place([entry(1)]);
    expect(screen.getByTestId("album-grid")).toBeInTheDocument();
    expect(empty()).toBeNull();
  });

  it("is never drawn while photographs wait in Review", () => {
    place([held(1), held(2)]);
    expect(empty()).toBeNull();
    expect(screen.queryByTestId("album-grid")).toBeNull();
  });
});
