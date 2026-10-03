import { describe, expect, it, vi } from "vitest";

/**
 * THE REVIEW ROUTE IS A DOOR NOW (event-header r2, `rooms=over`): Review stands over the hub on the hub's own
 * address, so `/dashboard/<id>/review` (in histories, in a mail's button, in the sign-in's return) redirects there,
 * as `/settings` always has, and reads nothing on the way.
 *
 * ★ ITS CREDITS' SCAR LIVES WHERE THE QUEUE IS READ NOW (crumbs-42, from crumbs-38: the room read the WHOLE album's
 * attribution to credit the few it showed). The room seeds its queue from the hub's own album, whose links are minted
 * by id with each upload's credit (`review-room.tsx`, `review-live.ts`), so it credits exactly what it shows; this
 * route reads no credit, no queue and no album at all.
 */

vi.mock("server-only", () => ({}));
const redirect = vi.hoisted(() =>
  vi.fn((to: string) => {
    throw Object.assign(new Error("NEXT_REDIRECT"), { to });
  }),
);
vi.mock("next/navigation", () => ({ redirect }));
const reads = vi.hoisted(() => ({ event: vi.fn(), media: vi.fn() }));
vi.mock("@/lib/db/queries/events", () => ({ getEvent: reads.event }));
vi.mock("@/lib/db/queries/media", () => ({ listEventMedia: reads.media }));

const { default: EventReviewRedirect } = await import("./page");

describe("the Review route", () => {
  it("★ opens Review over the hub, reading nothing on the way", async () => {
    await expect(
      EventReviewRedirect({ params: Promise.resolve({ eventId: "e1" }) }),
    ).rejects.toMatchObject({ to: "/dashboard/e1?room=review" });
    expect(reads.event).not.toHaveBeenCalled();
    expect(reads.media).not.toHaveBeenCalled();
  });
});
