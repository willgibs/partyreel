import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { restoreEventAction } from "@/app/(app)/dashboard/[eventId]/actions";

import { RestoreEventButton } from "./restore-event-button";

/**
 * A RESTORED EVENT SAYS WHAT STAYED IN DELETED (crumbs-42). `restore_event` brings an event back whole, and what was
 * removed on its own stays in its album's Deleted: the RPC counts it as her Deleted lists it (`media_still_removed`,
 * never a guest's own withdrawal, an operator's removal or a row she asked to delete permanently; 20260929140000).
 * The count reached the button's action and stopped there, so a host who restored an event with twelve photos still
 * removed was told "Event restored." and nothing of the twelve, which would read as twelve photographs lost.
 */

vi.mock("@/app/(app)/dashboard/[eventId]/actions", () => ({
  restoreEventAction: vi.fn(),
}));
// The plans sheet reads the server; only a refusal opens it.
vi.mock("@/components/app/pricing/pricing-sheet", () => ({
  PricingSheet: () => null,
}));

const restore = vi.mocked(restoreEventAction);

/** Press Restore with the action answering `answer`, and read the toast it raised. */
async function restoreWith(answer: {
  mediaStillRemoved: number;
  customSlugReleased: boolean;
}) {
  restore.mockResolvedValue({ ok: true, ...answer });
  render(<RestoreEventButton eventId="event-1" tier="free" />);
  fireEvent.click(screen.getByRole("button", { name: "Restore" }));
  await waitFor(() => expect(toast.success).toHaveBeenCalledTimes(1));
  const [title, options] = vi.mocked(toast.success).mock.calls[0];
  return {
    title,
    description: (options as { description?: string } | undefined)?.description,
  };
}

beforeEach(() => {
  restore.mockReset();
  vi.mocked(toast.success).mockReset();
  vi.mocked(toast.error).mockReset();
});

describe("a restored event's toast", () => {
  it("★ says how many stay in the album's Deleted", async () => {
    const { title, description } = await restoreWith({
      mediaStillRemoved: 12,
      customSlugReleased: false,
    });
    expect(title).toBe("Event restored.");
    expect(description).toBe(
      "12 photos and videos are still in its album's Deleted.",
    );
  });

  it("names a lone item as either kind, since its kind is not counted", async () => {
    const { description } = await restoreWith({
      mediaStillRemoved: 1,
      customSlugReleased: false,
    });
    expect(description).toBe(
      "1 photo or video is still in its album's Deleted.",
    );
  });

  it("groups a big count the way every count is printed", async () => {
    const { description } = await restoreWith({
      mediaStillRemoved: 1204,
      customSlugReleased: false,
    });
    expect(description).toBe(
      "1,204 photos and videos are still in its album's Deleted.",
    );
  });

  it("says nothing of Deleted when nothing stayed there", async () => {
    const { title, description } = await restoreWith({
      mediaStillRemoved: 0,
      customSlugReleased: false,
    });
    expect(title).toBe("Event restored.");
    expect(description).toBeUndefined();
  });

  it("says both when its custom link moved too, the link first", async () => {
    const { description } = await restoreWith({
      mediaStillRemoved: 3,
      customSlugReleased: true,
    });
    expect(description).toBe(
      "Its custom link went to another event while it was deleted, so it came back on its permanent link instead. 3 photos and videos are still in its album's Deleted.",
    );
  });
});
