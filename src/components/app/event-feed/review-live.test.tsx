/**
 * THE REVIEW ROOM HEARS THE HUB'S SIGNAL (host-curation `arrivals=prompt`, curation-wiring).
 *
 * The room mounts the hub's own album store from the page's seed, so the host's version poll (the
 * one that brings a held upload to the hub's Review card) brings it to the room: a waiting upload
 * the room has not shown lands behind the line, never in the grid, and a tap folds it in with the
 * tile the host's links route minted; an upload the album holds decided now leaves the grid.
 * Driven through the real store over a fake transport, as the hub's own tests drive it.
 */
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { type GridMedia } from "@/components/app/media-grid";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { HubAlbumSeed } from "@/lib/event/hub-album";
import {
  ENTRY_PENDING,
  type HostSyncBody,
  type ManifestEntry,
} from "@/lib/events/album-wire";

import { ReviewRoom } from "./review-room";
import type { ReviewWrites } from "./use-review-triage";

vi.mock("@/app/(app)/dashboard/actions", () => ({
  updateEventAction: vi.fn(async () => ({ ok: true })),
}));
vi.mock("@/app/(app)/dashboard/[eventId]/actions", () => ({}));
vi.mock("@/lib/shared/read-css-ms", () => ({ readCssMs: () => 0 }));
vi.mock("@/lib/guest/use-gallery-doorbell", () => ({
  useGalleryDoorbell: () => ({ live: false }),
}));
const polls: (() => HostSyncBody | null)[] = [];
const asked: string[][] = [];
vi.mock("@/lib/album/transport", () => ({
  hostAlbumTransport: () => ({
    sync: async () => {
      const next = polls.shift()?.() ?? null;
      return next
        ? { status: 200, etag: '"a-next"', body: next }
        : { status: 304 };
    },
    manifest: async () => {
      throw new Error("no pages");
    },
    links: async (ids: string[]) => {
      asked.push(ids);
      return {
        ok: true,
        access: "full",
        gate: null,
        b: 0,
        now: 0,
        links: ids.map((id) => [
          id,
          `tile:${id}`,
          `view:${id}`,
          `download:${id}`,
          ["Priya", 0, null],
        ]),
        missing: [],
        likes: {},
      };
    },
  }),
}));

const entry = (id: string, flags = ENTRY_PENDING): ManifestEntry => [
  id,
  400,
  500,
  flags,
  1_758_800_000_000_000,
];

const shown = (id: string): GridMedia => ({
  id,
  type: "photo",
  url: `signed:${id}`,
  status: "pending",
});

function seedOf(entries: ManifestEntry[]): HubAlbumSeed {
  return {
    eventId: "ev-1",
    sync: {
      kind: "manifest",
      v: 1,
      attr: 0,
      entries,
      next: null,
      ok: true,
      counts: { album: 0, pending: entries.length },
    },
    etag: '"a-seed"',
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
  };
}

const writes = {
  approve: vi.fn(async () => ({ ok: true })),
  reject: vi.fn(async () => ({ ok: true })),
  undo: vi.fn(async () => ({ ok: true })),
} as unknown as ReviewWrites;

function room(entries: ManifestEntry[], items: GridMedia[]) {
  return render(
    <TooltipProvider>
      <ReviewRoom
        eventId="ev-1"
        moderationOn
        pendingItems={items}
        writes={writes}
        album={{ seed: seedOf(entries), qrToken: "qr" }}
      />
    </TooltipProvider>,
  );
}

const tileIds = () =>
  [...document.querySelectorAll<HTMLElement>("[data-tile-id]")].map(
    (t) => t.dataset.tileId,
  );

beforeEach(() => {
  polls.length = 0;
  asked.length = 0;
});

describe("the room's live queue", () => {
  it("holds an upload that arrives mid-review behind the line, and folds it in with its minted tile", async () => {
    // The mount's catch-up poll brings a new waiting upload.
    polls.push(() => ({
      kind: "delta",
      v: 2,
      attr: 0,
      upsert: [entry("new-1")],
      remove: [],
      ok: true,
      counts: { album: 0, pending: 2 },
    }));
    room([entry("m1")], [shown("m1")]);
    const line = await screen.findByRole("button", { name: /1 new/i });
    expect(tileIds()).toEqual(["m1"]);

    await act(async () => {
      fireEvent.click(line);
    });
    await waitFor(() => expect(tileIds()).toEqual(["new-1", "m1"]));
    expect(asked).toEqual([["new-1"]]);
    // No preview flag on its entry, so the tile draws the original the route minted.
    const img = document.querySelector('[data-tile-id="new-1"] img');
    expect(img?.getAttribute("src")).toBe("view:new-1");
    expect(screen.queryByRole("button", { name: /new/i })).toBeNull();
  });

  it("drops an upload the album holds decided now (approved in another tab)", async () => {
    polls.push(() => ({
      kind: "delta",
      v: 2,
      attr: 0,
      upsert: [entry("m2", 0)],
      remove: [],
      ok: true,
      counts: { album: 1, pending: 1 },
    }));
    room([entry("m1"), entry("m2")], [shown("m1"), shown("m2")]);
    await waitFor(() => expect(tileIds()).toEqual(["m1"]));
    expect(screen.queryByRole("button", { name: /new/i })).toBeNull();
  });
});

/**
 * ★ ROADMAP's review-room line, through the real store (build 15's red-team): an upload the room
 * decided that returns to pending from elsewhere (a second room tab's Undo, a direct write) was
 * never counted again, because the room held it as shown for ever. Once the album has read the
 * room's verdict back, the album speaks for it, and the line counts its return.
 */
describe("an upload the room decided, back from elsewhere", () => {
  it("★ is counted behind the line once the album read the verdict back, and folds in", async () => {
    room([entry("m1"), entry("m2")], [shown("m1"), shown("m2")]);
    // Let the mount's own catch-ups (both 304) settle before the room writes anything.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    // The verdict's catch-up reads it back: m1 approved.
    polls.push(() => ({
      kind: "delta",
      v: 2,
      attr: 0,
      upsert: [entry("m1", 0)],
      remove: [],
      ok: true,
      counts: { album: 1, pending: 1 },
    }));
    const m1 = document.querySelector<HTMLElement>(
      '[data-tile-id="m1"] [data-tile-button]',
    )!;
    m1.focus();
    await act(async () => {
      fireEvent.keyDown(m1, { key: "Enter" });
    });
    await waitFor(() => expect(tileIds()).toEqual(["m2"]));
    expect(screen.queryByRole("button", { name: /new/i })).toBeNull();

    // A second room tab's Undo returns m1 to the queue; the tab's return asks the album again.
    polls.push(() => ({
      kind: "delta",
      v: 3,
      attr: 0,
      upsert: [entry("m1")],
      remove: [],
      ok: true,
      counts: { album: 0, pending: 2 },
    }));
    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    const line = await screen.findByRole("button", { name: /1 new/i });
    expect(tileIds()).toEqual(["m2"]);
    await act(async () => {
      fireEvent.click(line);
    });
    await waitFor(() => expect(tileIds()).toEqual(["m1", "m2"]));
  });
});
