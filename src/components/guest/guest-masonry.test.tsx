// @contract-for: src/components/guest/guest-masonry.tsx
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
 * THE ALBUM'S HEAD: what a guest's own device puts there, and what it refuses to
 * (the `guest-upload` board, ruled whole 2026-09-21).
 *
 * FUNCTION ONLY. The two tiles' own drawings are `stack-tile.test.tsx`'s, and
 * the grid under them is `masonry.test.tsx`'s. What is held here is the SEAM: a
 * queue snapshot goes in, and exactly one stack plus one waiting tile per held
 * file comes out, with nothing at all for a file that did not go.
 *
 * ★ EVERY RULE BELOW REPLACED A SHIPPED ONE, WHICH IS WHY EACH IS WORTH A PIN.
 * Twelve files used to draw twelve tiles (`batch=one`), a held upload drew
 * nothing at all and read as a failure (`held=tile`), and a refused file turned
 * a perfectly good photograph into a button saying Tap to retry (`failed=sheet`).
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
const waiting = () => document.querySelectorAll("[data-waiting-tile]");

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

describe("a held upload waits where the guest can see it", () => {
  it("draws one waiting tile per held file, beside a live stack", () => {
    render(
      album(
        <GuestMasonry
          items={items}
          pending={[
            pending("1", "uploading", 10),
            pending("2", "held"),
            pending("3", "held"),
          ]}
        />,
      ),
    );
    expect(stacks()).toHaveLength(1);
    expect(waiting()).toHaveLength(2);
    // A held file is NOT in the stack's count: its bytes are already in.
    expect(screen.queryByText(/to go/)).toBeNull();
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
