import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { HubAlbumSeed } from "@/lib/event/hub-album";
import { ENTRY_REEL, type ManifestEntry } from "@/lib/events/album-wire";
import type { ReadyFacts } from "@/lib/events/readiness";

import { EventChecklist } from "./checklist";
import { HostAlbumProvider } from "./host-album";

/**
 * THE CHECKLIST AT THE HEAD OF THE HUB (Will, event-ready `list=head`, 2026-10-02): the whole list while
 * the album is empty, one line once it has photos, gone once everything is done.
 *
 * What fails silently, and so is pinned: the list leaving with the first photo (the launch list's scar: it
 * left done or not, with the code never opened); a tick that waits for a reload when the album already
 * knows (the first photos read the album's live counts); a list that vanishes under the host's eyes the
 * moment she finishes it; a list that nags after the party; and a door that leads nowhere. Not a word or a
 * class is pinned: the rows are found by their ids and their state.
 */

const share = vi.hoisted(() => ({
  openSheet: vi.fn(),
  openSettingsPage: vi.fn(),
  openCode: vi.fn(),
}));
vi.mock("@/components/app/share/event-share-provider", () => ({
  useEventShare: () => share,
}));
const add = vi.hoisted(() => ({ openAdd: vi.fn() }));
vi.mock("@/components/app/host-add-provider", () => ({
  useHostAdd: () => add,
}));
// The plan sheet reads the server; the room row only has to offer it.
vi.mock("@/components/app/pricing/pricing-sheet", () => ({
  PricingSheet: ({ children }: { children: React.ReactNode }) => (
    <span data-testid="plans">{children}</span>
  ),
}));
// The album store's writes are Server Functions whose module reaches `server-only`; this is about its counts.
vi.mock("@/app/(app)/dashboard/[eventId]/actions", () => ({
  removeMediaAction: vi.fn(),
  removeMediaBulkAction: vi.fn(),
  setMediaStatusAction: vi.fn(),
  setMediaStatusBulkAction: vi.fn(),
}));
// The album store's live channel is out of scope: the store adopts the seed with no request.
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

const EVENT_ID = "11111111-2222-4333-8444-555555555555";
const PLAN = { tier: "free" as const, hasBilling: false };

/** A new event an hour after Create: nothing in it, the code never opened. */
const FRESH: ReadyFacts = {
  door: "open",
  hasPassword: false,
  guestsIn: 0,
  invited: 0,
  acceptingUploads: true,
  approved: 0,
  playable: 0,
  showReel: true,
  liveReelEnabled: true,
  eventDate: null,
  description: null,
  opened: 0,
  storagePct: 4,
};

/** Everything done: the code opened, the reel playing, the date and a note written. */
const DONE: ReadyFacts = {
  ...FRESH,
  opened: 5,
  approved: 12,
  playable: 12,
  eventDate: "2026-10-10",
  description: "Bring everything",
};

const list = () => document.querySelector<HTMLElement>("[data-checklist]");
const folded = () => list()?.hasAttribute("data-checklist-folded") ?? false;
const item = (id: string) =>
  document.querySelector<HTMLElement>(`[data-checklist-item='${id}']`);
const itemIds = () =>
  [...document.querySelectorAll<HTMLElement>("[data-checklist-item]")].map(
    (el) => el.dataset.checklistItem,
  );

function checklist(facts: ReadyFacts, over = false) {
  return render(
    <EventChecklist eventId={EVENT_ID} facts={facts} over={over} plan={PLAN} />,
  );
}

beforeEach(() => vi.clearAllMocks());

describe("where it stands, and when", () => {
  it("draws the whole list while the album is empty, what a guest needs first", () => {
    checklist(FRESH);
    expect(list()).not.toBeNull();
    expect(folded()).toBe(false);
    expect(itemIds()).toEqual(["door", "adds", "code", "photos", "welcome"]);
    expect(item("door")!.hasAttribute("data-done")).toBe(true);
    expect(item("code")!.hasAttribute("data-done")).toBe(false);
    expect(list()!.hasAttribute("data-ready")).toBe(false);
  });

  it("★ stays past the first photo, folded to one line, while anything is left", () => {
    // The launch list's scar: the first photograph hid it, with the code never opened.
    checklist({ ...FRESH, approved: 3, playable: 3, eventDate: "2026-10-10" });
    expect(list()).not.toBeNull();
    expect(folded()).toBe(true);
    expect(itemIds()).toEqual([]);
  });

  it("unfolds on Show and folds back, focus following the control", async () => {
    checklist({ ...FRESH, approved: 3, playable: 3 });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /show/i }));
    });
    expect(folded()).toBe(false);
    const fold = screen.getByRole("button", { name: /fold/i });
    expect(document.activeElement).toBe(fold);
    await act(async () => {
      fireEvent.click(fold);
    });
    expect(folded()).toBe(true);
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: /show/i }),
    );
  });

  it("is not drawn once everything is done", () => {
    checklist(DONE);
    expect(list()).toBeNull();
  });

  it("★ is not drawn from the day after the event's date, done or not", () => {
    // Before guests arrive is moot once they have: an album paused after the party is finished, not unready.
    checklist({ ...FRESH, acceptingUploads: false }, true);
    expect(list()).toBeNull();
  });

  it("★ never leaves under her eyes: finished while she looks, it stays ticked for the visit", () => {
    const view = checklist(FRESH);
    view.rerender(
      <EventChecklist
        eventId={EVENT_ID}
        facts={DONE}
        over={false}
        plan={PLAN}
      />,
    );
    expect(list()).not.toBeNull();
    expect(list()!.hasAttribute("data-ready")).toBe(true);
    // The next visit no longer draws it.
    view.unmount();
    checklist(DONE);
    expect(list()).toBeNull();
  });

  it("comes back when something a guest needs comes undone", () => {
    const view = checklist(DONE);
    expect(list()).toBeNull();
    view.rerender(
      <EventChecklist
        eventId={EVENT_ID}
        facts={{ ...DONE, door: "private" }}
        over={false}
        plan={PLAN}
      />,
    );
    expect(list()).not.toBeNull();
    expect(list()!.hasAttribute("data-ready")).toBe(false);
  });
});

describe("the album's live counts", () => {
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

  it("★ ticks the first photos from the album the hub holds, over what the server read", async () => {
    // The server read an empty album; two photos that can play are in the store now.
    render(
      <HostAlbumProvider seed={seed([entry(1), entry(2)])} qrToken="qr">
        <EventChecklist
          eventId={EVENT_ID}
          facts={FRESH}
          over={false}
          plan={PLAN}
        />
      </HostAlbumProvider>,
    );
    expect(folded()).toBe(true);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /show/i }));
    });
    expect(item("photos")!.hasAttribute("data-done")).toBe(true);
  });
});

describe("every row's door is a real destination", () => {
  it("★ opens Settings on the page that finishes it, over the album, and stays a real link", () => {
    checklist({ ...FRESH, door: "private", acceptingUploads: false });
    const door = item("door")!.querySelector("a")!;
    expect(door.getAttribute("href")).toBe(
      `/dashboard/${EVENT_ID}?room=settings&setting=door`,
    );
    fireEvent.click(door);
    expect(share.openSheet).toHaveBeenCalledWith("settings");
    expect(share.openSettingsPage).toHaveBeenCalledWith("door");

    vi.clearAllMocks();
    fireEvent.click(item("adds")!.querySelector("a")!);
    expect(share.openSettingsPage).toHaveBeenCalledWith("adds");

    vi.clearAllMocks();
    fireEvent.click(item("welcome")!.querySelector("a")!);
    expect(share.openSettingsPage).toHaveBeenCalledWith("event");
  });

  it("leaves a modified click to the browser, as the Settings card does", () => {
    checklist({ ...FRESH, door: "private" });
    // The browser's own new tab is what the click is left to; jsdom has none to open.
    const noTab = (e: Event) => e.preventDefault();
    document.addEventListener("click", noTab);
    fireEvent.click(item("door")!.querySelector("a")!, { metaKey: true });
    document.removeEventListener("click", noTab);
    expect(share.openSheet).not.toHaveBeenCalled();
  });

  it("opens the code card from Invite, and the print sheet in a tab of its own", () => {
    checklist(FRESH);
    const code = item("code")!;
    fireEvent.click(
      [...code.querySelectorAll("button")].find((b) =>
        /invite/i.test(b.textContent ?? ""),
      )!,
    );
    expect(share.openCode).toHaveBeenCalledTimes(1);
    const print = code.querySelector("a")!;
    expect(print.getAttribute("href")).toBe(`/dashboard/${EVENT_ID}/print`);
    expect(print.getAttribute("target")).toBe("_blank");
  });

  it("opens the album's own uploader for the first photos", () => {
    checklist(FRESH);
    fireEvent.click(item("photos")!.querySelector("button")!);
    expect(add.openAdd).toHaveBeenCalledTimes(1);
  });

  it("offers the plans once the shelf runs short", () => {
    checklist({ ...FRESH, opened: 1, storagePct: 92 });
    expect(
      item("room")!.querySelector("[data-testid='plans'] button"),
    ).not.toBeNull();
  });
});
