// @contract-for: src/components/app/event-feed/launch-list.tsx
// @contract-for: src/components/app/event-uploads.tsx
// @contract-for: src/components/app/host-media-grid.tsx

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { EventUploads } from "@/components/app/event-uploads";
import { newItemIds } from "@/components/app/host-media-grid";
import type { GridMedia } from "@/components/app/media-grid";

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
 *     and the one thing that stops a launch list becoming furniture.
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
  approveAllPendingAction: vi.fn(),
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
  LikesProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const EVENT_ID = "evt_1";
const list = (eventDate: string | null, description: string | null) =>
  launchItems({ eventId: EVENT_ID, eventDate, description });

describe("the launch list", () => {
  it("names everything the event is still missing", () => {
    expect(list(null, null).map((i) => i.id)).toEqual(["date", "note", "print"]);
  });

  it("drops an item the host has already done", () => {
    expect(list("2026-10-11", null).map((i) => i.id)).toEqual(["note", "print"]);
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
      expect(item.href.startsWith(`/dashboard/${EVENT_ID}`), item.id).toBe(true);
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
  const item = (id: string): GridMedia =>
    ({ id, type: "photo", url: `https://r2/${id}`, status: "approved" }) as GridMedia;

  it("shows the launch list before the first photograph", () => {
    render(
      <EventUploads
        eventId={EVENT_ID}
        items={[]}
        pendingCount={0}
        launchList={<div data-testid="launch" />}
      />,
    );
    expect(screen.getByTestId("launch")).toBeInTheDocument();
    expect(screen.queryByTestId("album-grid")).not.toBeInTheDocument();
  });

  it("gives the room back to the album at the first one", () => {
    render(
      <EventUploads
        eventId={EVENT_ID}
        items={[item("a")]}
        pendingCount={0}
        launchList={<div data-testid="launch" />}
      />,
    );
    expect(screen.getByTestId("album-grid")).toBeInTheDocument();
    expect(screen.queryByTestId("launch")).not.toBeInTheDocument();
  });

  it("never asks a host to print table cards while photographs wait in Review", () => {
    // An event whose uploads are all held is not an empty event; it is a full
    // one whose host has not looked yet.
    render(
      <EventUploads
        eventId={EVENT_ID}
        items={[]}
        pendingCount={3}
        launchList={<div data-testid="launch" />}
      />,
    );
    expect(screen.queryByTestId("launch")).not.toBeInTheDocument();
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
