/**
 * REVIEW OVER THE HUB READS ITS QUEUE OFF THE HUB'S OWN ALBUM (event-header r2, `rooms=over`).
 *
 * The room stands in a panel over the hub, inside the hub's album store, so its queue is the uploads that store holds
 * waiting, their tiles minted by the hub's own links route with each one's credit; no page read stands behind it.
 * Driven through the real store over a fake transport, as the room's live tests drive it: the queue opens whole and
 * newest first, its shimmer standing while the links are minted; the panel titles the room, so the room's own row
 * carries the count in words and its actions, never a second "Review"; a queue none of whose links came back says so,
 * with Try again, never "all caught up"; and the room keeps the hub's live signal.
 */
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TooltipProvider } from "@/components/ui/tooltip";
import type { HubAlbumSeed } from "@/lib/event/hub-album";
import {
  ENTRY_PENDING,
  type HostSyncBody,
  type ManifestEntry,
} from "@/lib/events/album-wire";

import { HostAlbumProvider } from "./host-album";
import { ReviewRoomFromHub } from "./review-room";

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
let refuse = false;
let hold: Promise<void> | null = null;
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
      if (hold) await hold;
      if (refuse) throw new Error("links route down");
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
          ["Priya", 0, "priya@example.com"],
        ]),
        missing: [],
        likes: {},
      };
    },
  }),
}));

const entry = (
  id: string,
  flags = ENTRY_PENDING,
  t = 1_758_800_000_000_000,
): ManifestEntry => [id, 400, 500, flags, t];

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
      counts: {
        album: entries.filter((e) => !(e[3] & ENTRY_PENDING)).length,
        pending: entries.filter((e) => e[3] & ENTRY_PENDING).length,
      },
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

function hub(entries: ManifestEntry[]) {
  return render(
    <TooltipProvider>
      <HostAlbumProvider seed={seedOf(entries)} qrToken="qr">
        <ReviewRoomFromHub eventId="ev-1" moderationOn />
      </HostAlbumProvider>
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
  refuse = false;
  hold = null;
});

describe("★ the queue is the hub's own album's", () => {
  it("opens on every upload waiting, newest first, their tiles minted by the hub's links route", async () => {
    let release: () => void = () => {};
    hold = new Promise<void>((r) => (release = r));
    hub([
      entry("new", ENTRY_PENDING, 3),
      entry("decided", 0, 2),
      entry("old", ENTRY_PENDING, 1),
    ]);
    // The shimmer stands while the links are minted: the panel is up at once, never empty.
    expect(document.querySelector("[data-room-reading='grid']")).not.toBeNull();
    await act(async () => release());
    await waitFor(() => expect(tileIds()).toEqual(["new", "old"]));
    expect(asked.flat().sort()).toEqual(["new", "old"]);
  });

  it("★ is titled by its panel: no second Review over it, the count in words beside its actions", async () => {
    hub([entry("a"), entry("b")]);
    await waitFor(() => expect(tileIds()).toEqual(["a", "b"]));
    expect(screen.queryByRole("heading", { name: "Review" })).toBeNull();
    expect(screen.getByText("2 waiting")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /approve all/i }),
    ).toBeInTheDocument();
  });

  it("a caught-up hub opens on the caught-up room, untitled too", async () => {
    hub([entry("done", 0)]);
    expect(await screen.findByText("You're all caught up")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Review" })).toBeNull();
  });

  it("★ a queue none of whose links came back says so, and Try again reads it again", async () => {
    refuse = true;
    hub([entry("a"), entry("b")]);
    expect(
      await screen.findByText(/couldn.t load what.s waiting/i),
    ).toBeInTheDocument();
    expect(screen.queryByText("You're all caught up")).toBeNull();
    refuse = false;
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(tileIds()).toEqual(["a", "b"]));
  });

  it("keeps the hub's live signal: an upload landing after it opened waits behind the line", async () => {
    polls.push(() => ({
      kind: "delta",
      v: 2,
      attr: 0,
      upsert: [entry("late", ENTRY_PENDING, 9)],
      remove: [],
      ok: true,
      counts: { album: 0, pending: 2 },
    }));
    hub([entry("first")]);
    await waitFor(() => expect(tileIds()).toEqual(["first"]));
    expect(await screen.findByRole("button", { name: /1 new/i })).toBeTruthy();
    expect(tileIds()).toEqual(["first"]);
  });
});

describe("★ the room's keys in its own panel (`review-keys.ts`)", () => {
  /** The room as the hub stands it: inside its panel, a dialog that names the room. */
  function inPanel(entries: ManifestEntry[]) {
    return render(
      <TooltipProvider>
        <HostAlbumProvider seed={seedOf(entries)} qrToken="qr">
          <div role="dialog" data-room-panel="review" tabIndex={-1}>
            <ReviewRoomFromHub eventId="ev-1" moderationOn />
          </div>
        </HostAlbumProvider>
      </TooltipProvider>,
    );
  }
  const focusedTile = () =>
    (document.activeElement?.closest("[data-tile-id]") as HTMLElement | null)
      ?.dataset.tileId ?? null;

  /**
   * An arrow from the panel itself, pressed until the room answers it. The room's keys are a `document` listener its
   * mount attaches after paint, and it mounts once its queue is read, outside `render`'s act: a press the instant its
   * tiles show can find nobody listening yet, and a loaded machine is the one that puts a tick between the two. What
   * the room answers is each test's pin; this waits only for an answer.
   */
  async function arrowFromPanel(panel: HTMLElement) {
    panel.focus();
    await waitFor(() => {
      fireEvent.keyDown(panel, { key: "ArrowRight" });
      expect(focusedTile()).not.toBeNull();
    });
  }

  it("reads its panel as its page: an arrow from the panel itself puts the cursor on the first tile", async () => {
    inPanel([entry("a", ENTRY_PENDING, 2), entry("b", ENTRY_PENDING, 1)]);
    await waitFor(() => expect(tileIds()).toEqual(["a", "b"]));
    const panel = screen.getByRole("dialog");
    await arrowFromPanel(panel);
    expect(focusedTile()).toBe("a");
    fireEvent.keyDown(document.activeElement!, { key: "ArrowRight" });
    expect(focusedTile()).toBe("b");
  });

  it("still leaves every key to a confirm standing over its panel", async () => {
    inPanel([entry("a"), entry("b")]);
    await waitFor(() => expect(tileIds()).toEqual(["a", "b"]));
    const panel = screen.getByRole("dialog");
    // The room hears an arrow first, so the silence below is the confirm's doing, never a room not yet listening.
    await arrowFromPanel(panel);
    const confirm = document.createElement("div");
    confirm.setAttribute("role", "alertdialog");
    document.body.appendChild(confirm);
    try {
      panel.focus();
      fireEvent.keyDown(panel, { key: "ArrowRight" });
      expect(focusedTile()).toBeNull();
    } finally {
      confirm.remove();
    }
  });
});
