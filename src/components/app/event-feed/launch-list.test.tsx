import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { EventUploads } from "@/components/app/event-uploads";
import { newItemIds } from "@/components/app/host-media-grid";
import type { HubAlbumSeed } from "@/lib/event/hub-album";
import {
  ENTRY_PENDING,
  ENTRY_REEL,
  type ManifestEntry,
} from "@/lib/events/album-wire";

import { HostAlbumProvider } from "./host-album";
import { LaunchList, launchItems } from "./launch-list";

/**
 * WHAT AN EMPTY EVENT SAYS, AND WHAT MARKS THE FIRST PHOTOGRAPH (Will,
 * `empty=list` and `first=live`, 2026-09-21).
 *
 * Three functions, all of them quiet when they break:
 *
 *  1. THE LIST IS WHAT IS LEFT, derived from the event's own nulls. A list that
 *     stopped reading them would show a host "Set the date" on an event whose
 *     date she set in the wizard — which reads as a nagging product rather than
 *     as a bug.
 *  2. THE ALBUM TAKES THE ROOM BACK at the first photograph. His own sentence,
 *     and the one thing that stops a launch list becoming furniture. The album
 *     is the page's store now (the paged album), so the room reads its entries.
 *  3. AN ARRIVAL IS AN ID THAT WAS NOT THERE BEFORE. The diff runs on ids and
 *     never on presigned urls, which roll about every half hour — a url-keyed
 *     diff would light the whole album twice an hour and look like a feature.
 *
 * Not a word, a class or a count of items is pinned.
 */

// The grid's moderation verbs are Server Functions whose module reaches
// `server-only` through lib/db/mutations; Vite cannot resolve that outside
// Next's own build, and this contract is about the pure diff beside them.
vi.mock("@/app/(app)/dashboard/[eventId]/actions", () => ({
  removeMediaAction: vi.fn(),
  removeMediaBulkAction: vi.fn(),
  setMediaStatusAction: vi.fn(),
  setMediaStatusBulkAction: vi.fn(),
}));

// The grid itself is a client island over the lightbox, the likes provider and
// the masonry; what this file asks EventUploads is which BRANCH it takes.
vi.mock("@/components/app/host-media-grid", async () => {
  const actual = await vi.importActual<
    typeof import("@/components/app/host-media-grid")
  >("@/components/app/host-media-grid");
  return {
    ...actual,
    HostMediaGrid: () => <div data-testid="album-grid" />,
  };
});
vi.mock("@/components/likes/likes-provider", () => ({
  LikesProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  useLikes: () => null,
}));
// The album store's live channel (a Realtime socket, the routes) is out of scope: the store adopts
// the seed with no request, and a poll that fails keeps the album it has.
vi.mock("@/lib/guest/use-gallery-doorbell", () => ({
  useGalleryDoorbell: () => ({ live: false }),
}));
vi.mock("@/lib/album/transport", () => ({
  hostAlbumTransport: () => ({
    sync: async () => ({ status: 304 }),
    manifest: async () => {
      throw new Error("no manifest pages here");
    },
    links: async () => {
      throw new Error("no links here");
    },
  }),
}));
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

const EVENT_ID = "evt_1";
const list = (eventDate: string | null, description: string | null) =>
  launchItems({ eventId: EVENT_ID, eventDate, description });

describe("the launch list", () => {
  it("names everything the event is still missing", () => {
    expect(list(null, null).map((i) => i.id)).toEqual([
      "date",
      "note",
      "print",
    ]);
  });

  it("drops an item the host has already done", () => {
    expect(list("2026-10-11", null).map((i) => i.id)).toEqual([
      "note",
      "print",
    ]);
    expect(list(null, "Bring your dancing shoes").map((i) => i.id)).toEqual([
      "date",
      "print",
    ]);
  });

  it("always ends on paper, because that one is never 'done' in the data", () => {
    // The other two are fields; this one is an act the app cannot observe, so it
    // stays offered rather than silently ticking itself off.
    for (const items of [
      list(null, null),
      list("2026-10-11", "A note"),
      list("2026-10-11", null),
    ]) {
      expect(items.at(-1)!.id).toBe("print");
    }
  });

  it("gives every item a real destination", () => {
    for (const item of list(null, null)) {
      expect(item.href.startsWith(`/dashboard/${EVENT_ID}`), item.id).toBe(
        true,
      );
    }
    // The two field rows land on the settings sheet, which the hub resolves
    // server-side from ?room=; the paper row opens the print route.
    expect(list(null, null)[0].href).toContain("?room=settings");
    expect(list("2026-10-11", "A note")[0].href).toContain("/print");
  });

  it("opens paper in a new tab and nothing else", () => {
    // The album has to survive the print dialog; a settings sheet in a second
    // tab would just be a second copy of the event.
    const items = list(null, null);
    expect(items.filter((i) => i.external).map((i) => i.id)).toEqual(["print"]);
  });

  it("offers the code as a fourth door only when the list has room", () => {
    // The code is already in the page header and on the dashboard card, so a
    // fourth door to it earns its place only once the setup is finished.
    const { rerender, container } = render(
      <LaunchList eventId={EVENT_ID} eventDate={null} description={null} />,
    );
    expect(
      container.querySelector(`a[href="/dashboard/${EVENT_ID}?room=share"]`),
    ).toBeNull();
    rerender(
      <LaunchList
        eventId={EVENT_ID}
        eventDate="2026-10-11"
        description="A note"
      />,
    );
    expect(
      container.querySelector(`a[href="/dashboard/${EVENT_ID}?room=share"]`),
    ).not.toBeNull();
  });
});

describe("what the album's room holds", () => {
  const uuid = (n: number) =>
    `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
  /** An entry of the host's manifest: approved unless flagged held. */
  const entry = (n: number, flags = ENTRY_REEL): ManifestEntry => [
    uuid(n),
    400,
    300,
    flags,
    1_758_800_000_000_000 - n,
  ];
  /** The page's seed for an album holding these entries (held ones count toward Review). */
  const seed = (entries: ManifestEntry[]): HubAlbumSeed => ({
    eventId: EVENT_ID,
    sync: {
      kind: "manifest",
      v: 1,
      attr: 0,
      entries,
      next: null,
      ok: true,
      counts: {
        album: entries.filter((e) => !(e[3] & ENTRY_PENDING)).length,
        pending: entries.filter((e) => e[3] & ENTRY_PENDING).length,
      },
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
  const room = (entries: ManifestEntry[]) =>
    render(
      <HostAlbumProvider seed={seed(entries)} qrToken="qr">
        <EventUploads
          eventId={EVENT_ID}
          launchList={<div data-testid="launch" />}
        />
      </HostAlbumProvider>,
    );

  it("shows the launch list before the first photograph", () => {
    room([]);
    expect(screen.getByTestId("launch")).toBeInTheDocument();
    expect(screen.queryByTestId("album-grid")).not.toBeInTheDocument();
  });

  it("gives the room back to the album at the first one", () => {
    room([entry(1)]);
    expect(screen.getByTestId("album-grid")).toBeInTheDocument();
    expect(screen.queryByTestId("launch")).not.toBeInTheDocument();
  });

  it("never asks a host to print table cards while photographs wait in Review", () => {
    // An event whose uploads are all held is not an empty event; it is a full
    // one whose host has not looked yet. Held items ride the host's manifest
    // (one manifest for the hub and Review) and stay out of the album.
    room([entry(1, ENTRY_PENDING), entry(2, ENTRY_PENDING)]);
    expect(screen.queryByTestId("launch")).not.toBeInTheDocument();
    expect(screen.queryByTestId("album-grid")).not.toBeInTheDocument();
  });
});

describe("the arrival diff", () => {
  it("is what is new, and nothing else", () => {
    expect(newItemIds(["a", "b"], ["c", "a", "b"])).toEqual(new Set(["c"]));
    expect(newItemIds(["a", "b"], ["a", "b"])).toEqual(new Set());
  });

  it("marks nothing when items only leave", () => {
    expect(newItemIds(["a", "b", "c"], ["a"])).toEqual(new Set());
  });

  it("catches a batch, not just the newest", () => {
    // Ten at once after a shut laptop wakes up is the same event as one.
    expect(newItemIds(["a"], ["e", "d", "c", "b", "a"])).toEqual(
      new Set(["e", "d", "c", "b"]),
    );
  });

  it("reads ids, never the presigned url that rolls every half hour", () => {
    // Same ids, entirely new signatures: nothing arrived.
    expect(newItemIds(["a", "b"], ["a", "b"])).toEqual(new Set());
  });
});
