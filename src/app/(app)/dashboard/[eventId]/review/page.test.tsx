import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * REVIEW CREDITS ITS QUEUE AND READS NOTHING ELSE (crumbs-42, from crumbs-38). The room credits the uploads it
 * shows, the `pending` slice, and it read the WHOLE album's attribution to do it (`getUploaderIdentities`: every
 * media row's uploader, paged to the album's last item, with each address), so a host with three photographs to
 * judge in an album of three thousand paid for three thousand credits she never sees. It reads the credits of
 * exactly the ids it shows now (`readAlbumAttribution`, the album's windowed read, with the address the host's
 * look shows), after the queue it credits.
 */

vi.mock("server-only", () => ({}));

const EVENT = {
  id: "00000000-0000-4000-8000-000000000001",
  name: "Maya's 30th",
  qr_token: "a".repeat(32),
  moderation_mode: "hold_for_approval",
};
const PENDING = [
  { id: "00000000-0000-4000-8000-0000000000a1", status: "pending" },
  { id: "00000000-0000-4000-8000-0000000000a2", status: "pending" },
];
const CREDITS = new Map([
  [PENDING[0].id, { displayName: "Sam", isHost: false, isVerified: true }],
]);

vi.mock("@/lib/db/queries/events", () => ({ getEvent: async () => EVENT }));
vi.mock("@/lib/db/queries/media", () => ({
  listEventMedia: vi.fn(async () => PENDING),
}));
const reads = vi.hoisted(() => ({
  window: vi.fn(),
  whole: vi.fn(),
  items: vi.fn(),
}));
vi.mock("@/lib/db/queries/album-state", () => ({
  readAlbumAttribution: reads.window,
}));
vi.mock("@/lib/db/queries/guest-events-admin", () => ({
  getUploaderIdentities: reads.whole,
}));
vi.mock("@/lib/event/gallery-items", () => ({
  toHostGalleryItems: reads.items,
}));
vi.mock("@/lib/db/queries/likes", () => ({
  getEventLikeCounts: async () => new Map(),
}));
vi.mock("@/lib/supabase/request-auth", () => ({
  getRequestAuth: async () => ({ supabase: {}, user: { id: "host-1" } }),
}));
vi.mock("@/lib/event/host-album.server", () => ({
  planHubManifest: async () => ({}),
  seedFrom: () => ({}),
}));
vi.mock("@/lib/event/host-links.server", () => ({
  readHostLinksBody: async () => ({}),
}));
// What the room draws is its own tests'; this pin is the read behind it.
const part = vi.hoisted(() => () => null);
vi.mock("@/components/app/event-feed/review-room", () => ({
  ReviewRoom: part,
}));
vi.mock("@/components/app/event-blocks/credit-look", () => ({
  HostCreditLookProvider: part,
}));
vi.mock("@/components/shared/crumbs", () => ({ SetCrumbs: part }));

const { default: EventReviewPage } = await import("./page");

beforeEach(() => {
  reads.window.mockReset().mockResolvedValue(CREDITS);
  reads.whole.mockReset().mockResolvedValue(new Map());
  reads.items.mockReset().mockResolvedValue([]);
});

describe("the Review room's credits", () => {
  it("★ reads the credits of the uploads it shows, never the whole album's", async () => {
    render(
      await EventReviewPage({ params: Promise.resolve({ eventId: EVENT.id }) }),
    );
    expect(reads.whole).not.toHaveBeenCalled();
    expect(reads.window).toHaveBeenCalledTimes(1);
    expect(reads.window).toHaveBeenCalledWith(
      EVENT.id,
      PENDING.map((m) => m.id),
      // The host's look shows a confirmed sender's address: the host's read, never the guest's.
      { withEmail: true },
    );
  });

  it("hands those credits to the queue it draws", async () => {
    render(
      await EventReviewPage({ params: Promise.resolve({ eventId: EVENT.id }) }),
    );
    expect(reads.items).toHaveBeenCalledTimes(1);
    const [{ media, uploaderIdentities }] = reads.items.mock.calls[0];
    expect(media).toBe(PENDING);
    expect(uploaderIdentities).toBe(CREDITS);
  });
});

/**
 * THE PAGE DRAWS NO HEADING OF ITS OWN (crumbs-42, from crumbs-7): its "Review" stood over the room's own amber
 * "Review", so the room said its name twice. The room draws the page's one heading (`review-room.test.tsx`).
 */
describe("the Review page's heading", () => {
  it("★ is the room's alone: the page draws none over it", async () => {
    render(
      await EventReviewPage({ params: Promise.resolve({ eventId: EVENT.id }) }),
    );
    expect(screen.queryAllByRole("heading")).toHaveLength(0);
  });
});
