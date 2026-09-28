import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";

import type { GridMedia } from "@/components/app/media-grid";
import {
  GuestMasonry,
  type PendingTile,
} from "@/components/guest/guest-masonry";
import { LikesProvider } from "@/components/likes/likes-provider";

/**
 * THE ALBUM'S HEAD: what a guest's own device puts there, and what it refuses to.
 *
 * FUNCTION ONLY. The stack's own drawing is `stack-tile.test.tsx`'s, and the
 * grid under it is `masonry.test.tsx`'s. What is held here is the SEAM: the
 * files in flight go in, and exactly one stack comes out.
 *
 * ★ EACH RULE BELOW STANDS AGAINST A FAILURE, WHICH IS WHY EACH IS WORTH A PIN:
 * twelve files drawing twelve tiles, and a stack whose bar sits at zero while
 * another file's bytes are going.
 *
 * ★ RESHAPED (voice-wiring). A pin here drew one waiting tile per held file
 * beside a live stack, against "a held upload drawing nothing at all and
 * reading as a failure". Will's `held=uploads` (voice-guest r2) answered that
 * the other way: a held photograph shows only in her uploads, the badge beside
 * Add counting it, so the head no longer has a held state to draw, and the
 * rule that a held upload hands it nothing is `live-gallery.test.tsx`'s.
 */
const items: GridMedia[] = [
  { id: "a", type: "photo", url: "/a.jpg", width: 800, height: 1200 },
];

/** The album's own like context, exactly as the live gallery wraps it. */
const album = (children: ReactNode) => (
  <LikesProvider mediaIds={items.map((m) => m.id)}>{children}</LikesProvider>
);

const pending = (
  queueId: string,
  status: PendingTile["status"],
  progress = 0,
): PendingTile => ({
  queueId,
  url: `blob:${queueId}`,
  file: new File([new Uint8Array([1])], `${queueId}.jpg`, {
    type: "image/jpeg",
  }),
  kind: "photo",
  status,
  progress,
});

const stacks = () => document.querySelectorAll("[data-upload-stack]");

describe("a pick in flight is ONE object at the album's head", () => {
  it("collapses a batch into a single stack that counts what is left", () => {
    render(
      album(
        <GuestMasonry
          items={items}
          pending={[
            pending("1", "uploading", 30),
            pending("2", "queued"),
            pending("3", "queued"),
          ]}
        />,
      ),
    );
    expect(stacks()).toHaveLength(1);
    expect(screen.getByText("3 to go")).toBeInTheDocument();
  });

  it("leads with the file actually in the air, not the first of the batch", () => {
    // The queue runs one at a time, so the stack's photograph and its progress
    // must be the one that is moving — otherwise the bar sits at zero while
    // bytes are visibly going somewhere.
    const { container } = render(
      album(
        <GuestMasonry
          items={items}
          pending={[
            pending("1", "queued"),
            pending("2", "uploading", 77),
            pending("3", "queued"),
          ]}
        />,
      ),
    );
    const bar = container.querySelector(
      "[data-pending-progress]",
    ) as HTMLElement;
    expect(bar.style.width).toBe("77%");
  });

  it("draws no stack when nothing is flying", () => {
    render(album(<GuestMasonry items={items} pending={[]} />));
    expect(stacks()).toHaveLength(0);
  });
});

describe("the arrival marks and the album's own tiles pass straight through", () => {
  it("hands both sets to the one grid", () => {
    const { container } = render(
      album(
        <GuestMasonry
          items={items}
          arrivedIds={new Set(["a"])}
          landedIds={new Set(["a"])}
        />,
      ),
    );
    const tile = container.querySelector("[data-media-tile][data-arrived]")!;
    expect(tile.hasAttribute("data-landed")).toBe(true);
  });
});
