import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { HubAlbumSeed } from "@/lib/event/hub-album";
import { ENTRY_REEL, type ManifestEntry } from "@/lib/events/album-wire";
import {
  CHECKLIST_OFF_COOKIE,
  CHECKLIST_OFF_SECONDS,
  type ReadyFacts,
} from "@/lib/events/readiness";

import { EventChecklist } from "./checklist";
import { HostAlbumProvider } from "./host-album";

/**
 * THE CHECKLIST AT THE HEAD OF THE HUB (Will, event-ready `list=head`, 2026-10-02; create-wizard r5's `arrival=done`,
 * 2026-10-07): one line from her first visit, Ready for guests with the next thing worth doing and its door beside
 * it, the list behind Show, gone once everything is done.
 *
 * What fails silently, and so is pinned: a made event greeted as unfinished (r5's scar: "2 of 3"); the line leaving
 * with the first photo (the launch list's scar: it left done or not, with the code never opened); a tick that waits
 * for a reload when the album already knows (the first photos read the album's live counts); a line that vanishes
 * under the host's eyes the moment she finishes it; a line that nags after the party; and a door that leads nowhere.
 * Not a word or a class is pinned but where the word is the fact: the rows are found by their ids and their state.
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

const toggle = () =>
  list()!.querySelector<HTMLButtonElement>("button[aria-expanded]")!;

/** Opens the list behind the line, as a press of Show does. */
async function openList() {
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: /show$/i }));
  });
}

describe("where it stands, and when", () => {
  // ★ RESHAPED ON PURPOSE (create-wizard r5's `arrival=done`): this drew the whole list while the album was empty,
  // what a guest needs first, and a made event met her as "2 of 3". A new event is ready (a guest who scanned could
  // get in and add), so it is one line from her first visit, its share the thing worth doing next.
  it("★ meets a new event as ready, on one line, the share beside it", () => {
    checklist(FRESH);
    expect(list()).not.toBeNull();
    expect(folded()).toBe(true);
    expect(list()!.hasAttribute("data-ready")).toBe(true);
    expect(list()!.dataset.checklistNext).toBe("code");
    expect(list()!.textContent).toContain("Ready for guests");
    expect(list()!.textContent).toContain("Your code is all they need.");
    // The share is the line's one door: Invite opens the code card.
    fireEvent.click(screen.getByRole("button", { name: /invite/i }));
    expect(share.openCode).toHaveBeenCalledTimes(1);
    expect(itemIds()).toEqual([]);
  });

  it("★ says what a guest still needs first, in its own words and its own door, while anything is", () => {
    checklist({ ...FRESH, door: "private" });
    expect(folded()).toBe(true);
    expect(list()!.hasAttribute("data-ready")).toBe(false);
    expect(list()!.dataset.checklistNext).toBe("door");
    expect(list()!.textContent).toContain("Before guests arrive");
    expect(screen.getByRole("link", { name: "Choose" })).toHaveAttribute(
      "href",
      `/dashboard/${EVENT_ID}?room=settings&setting=door`,
    );
  });

  it("names the next thing worth doing once the code has been opened", () => {
    checklist({ ...FRESH, opened: 2 });
    expect(list()!.dataset.checklistNext).toBe("photos");
    expect(list()!.textContent).toContain(
      "A few photos of yours invite theirs.",
    );
  });

  it("★ stays past the first photo while anything is left", () => {
    // The launch list's scar: the first photograph hid it, with the code never opened.
    checklist({ ...FRESH, approved: 3, playable: 3, eventDate: "2026-10-10" });
    expect(list()).not.toBeNull();
    expect(folded()).toBe(true);
    expect(list()!.dataset.checklistNext).toBe("code");
  });

  it("unfolds on Show and folds back, focus following the control", async () => {
    checklist(FRESH);
    await openList();
    expect(folded()).toBe(false);
    const fold = screen.getByRole("button", { name: /fold/i });
    expect(document.activeElement).toBe(fold);
    await act(async () => {
      fireEvent.click(fold);
    });
    expect(folded()).toBe(true);
    expect(document.activeElement).toBe(toggle());
  });

  it("★ leads the list with what is worth doing once she is ready, what a guest needs under it, ticked", async () => {
    checklist(FRESH);
    await openList();
    expect(itemIds()).toEqual(["code", "photos", "welcome", "door", "adds"]);
    expect(item("door")!.hasAttribute("data-done")).toBe(true);
    expect(item("adds")!.hasAttribute("data-done")).toBe(true);
    expect(item("code")!.hasAttribute("data-done")).toBe(false);
  });

  it("leads with what a guest needs while anything is", async () => {
    checklist({ ...FRESH, acceptingUploads: false });
    await openList();
    expect(itemIds()).toEqual(["door", "adds", "code", "photos", "welcome"]);
    expect(item("adds")!.hasAttribute("data-done")).toBe(false);
  });

  it("is not drawn once everything is done", () => {
    checklist(DONE);
    expect(list()).toBeNull();
  });

  it("★ is not drawn from the day after the event's date, done or not", () => {
    // Getting ready is moot once the party has happened: an album paused after the party is finished, not unready.
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
    expect(list()!.textContent).toContain("Everything is set.");
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

/**
 * ★ SHE MAY DISMISS IT, AND IT STAYS GONE FOR THAT EVENT (Will at the desk's calls, 2026-10-07). What fails silently: a
 * dismissal that comes back on the next visit (the page never told), one that leaks to her other events, and a line
 * that flashes before a script reads her choice (the page is told by the cookie, so the line is never drawn).
 */
describe("dismissed, it stays gone for that event", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("★ puts the line away for good, remembered on this event's own pages alone", () => {
    const written: string[] = [];
    vi.spyOn(document, "cookie", "set").mockImplementation((v: string) => {
      written.push(v);
    });
    const { container } = render(
      <div>
        <EventChecklist
          eventId={EVENT_ID}
          facts={FRESH}
          over={false}
          plan={PLAN}
        />
        <section>
          <button type="button">The album</button>
        </section>
      </div>,
    );
    expect(list()).not.toBeNull();
    fireEvent.click(
      screen.getByRole("button", { name: "Dismiss the checklist" }),
    );
    expect(list()).toBeNull();
    expect(written).toEqual([
      `${CHECKLIST_OFF_COOKIE}=1; Path=/dashboard/${EVENT_ID}; Max-Age=${CHECKLIST_OFF_SECONDS}; SameSite=Lax`,
    ]);
    // Her focus goes on to what follows the line, never to the page's top.
    expect(document.activeElement).toBe(
      within(container).getByRole("button", { name: "The album" }),
    );
  });

  it("★ is never drawn once the page says she dismissed it, whatever is left", () => {
    render(
      <EventChecklist
        eventId={EVENT_ID}
        facts={{ ...FRESH, door: "private" }}
        over={false}
        plan={PLAN}
        dismissed
      />,
    );
    expect(list()).toBeNull();
  });

  it("dismisses the line, never the list a press of Show opened", async () => {
    checklist(FRESH);
    await openList();
    expect(
      screen.queryByRole("button", { name: "Dismiss the checklist" }),
    ).toBeNull();
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
    await openList();
    expect(item("photos")!.hasAttribute("data-done")).toBe(true);
  });
});

describe("every row's door is a real destination", () => {
  it("★ opens Settings on the page that finishes it, over the album, and stays a real link", async () => {
    checklist({ ...FRESH, door: "private", acceptingUploads: false });
    await openList();
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

  it("leaves a modified click to the browser, as the Settings card does", async () => {
    checklist({ ...FRESH, door: "private" });
    await openList();
    // The browser's own new tab is what the click is left to; jsdom has none to open.
    const noTab = (e: Event) => e.preventDefault();
    document.addEventListener("click", noTab);
    fireEvent.click(item("door")!.querySelector("a")!, { metaKey: true });
    document.removeEventListener("click", noTab);
    expect(share.openSheet).not.toHaveBeenCalled();
  });

  it("opens the code card from Invite, and the print sheet in a tab of its own", async () => {
    checklist(FRESH);
    await openList();
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

  it("opens the album's own uploader for the first photos", async () => {
    checklist(FRESH);
    await openList();
    fireEvent.click(item("photos")!.querySelector("button")!);
    expect(add.openAdd).toHaveBeenCalledTimes(1);
  });

  it("offers the plans once the shelf runs short", async () => {
    checklist({ ...FRESH, opened: 1, storagePct: 92 });
    // Room running short is the next thing worth doing, its plans the line's own door.
    expect(list()!.dataset.checklistNext).toBe("room");
    await openList();
    expect(
      item("room")!.querySelector("[data-testid='plans'] button"),
    ).not.toBeNull();
  });
});
