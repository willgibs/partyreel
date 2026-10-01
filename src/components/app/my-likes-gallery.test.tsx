/**
 * HER LIKES' UNLIKE HOLDS THE SAME WAY (crumbs-45: build 36's red-team's first-page Delete, "My likes checked for
 * the same shape"). An unlike never revalidates (a browser RLS delete), but a Delete in her Uploads revalidates the
 * whole page, this feed's first page with it, and that page can land late or keep its old self. Pinned: an unlike
 * leaves the first page and a loaded one alike, through the feed's own `drop`, and stays out whatever first page
 * comes back; and the last like undone is the empty state, unless a page still waits, where the Show more stands.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import type { GridMedia } from "@/components/app/media-grid";
import type { FeedCursor } from "@/lib/db/queries/my-uploads";

import { MyLikesGallery } from "./my-likes-gallery";

/** The provider's one call back: an unlike the database confirmed. */
let unliked: ((id: string) => void) | undefined;
vi.mock("@/components/likes/likes-provider", () => ({
  LikesProvider: ({
    children,
    onRemoved,
  }: {
    children: ReactNode;
    onRemoved?: (id: string) => void;
  }) => {
    unliked = onRemoved;
    return children;
  },
}));
vi.mock("@/components/shared/masonry", () => ({
  MasonryColumns: ({ items }: { items: GridMedia[] }) => (
    <ul>
      {items.map((m) => (
        <li key={m.id} data-id={m.id}>
          {m.id}
        </li>
      ))}
    </ul>
  ),
}));

const item = (id: string): GridMedia => ({ id, type: "photo", url: `u-${id}` });
const cursor = (id: string): FeedCursor => ({
  at: "2026-10-01T20:29:06.138116+00:00",
  id,
});
const shown = () =>
  [...document.querySelectorAll("li[data-id]")].map((li) =>
    li.getAttribute("data-id"),
  );

describe("an unlike in her Likes", () => {
  it("★ leaves the first page and stays out whatever first page comes back", () => {
    const { rerender } = render(
      <MyLikesGallery items={[item("a"), item("b"), item("c")]} />,
    );
    act(() => unliked?.("b"));
    expect(shown()).toEqual(["a", "c"]);
    // A revalidation from her Uploads re-renders this feed with a first page that still holds it (the old one).
    rerender(<MyLikesGallery items={[item("a"), item("b"), item("c")]} />);
    expect(shown()).toEqual(["a", "c"]);
  });

  it("leaves a page she loaded the same way", async () => {
    const readMore = vi.fn(async () => ({
      ok: true as const,
      items: [item("d"), item("e")],
      next: null,
    }));
    render(
      <MyLikesGallery
        items={[item("a")]}
        next={cursor("a")}
        readMore={readMore}
      />,
    );
    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: "Show more of your likes" }),
      );
    });
    act(() => unliked?.("d"));
    expect(shown()).toEqual(["a", "e"]);
  });

  it("the last like undone is the empty state, unless a page still waits after it", () => {
    const { unmount } = render(<MyLikesGallery items={[item("a")]} />);
    act(() => unliked?.("a"));
    expect(screen.getByText("No likes yet")).toBeInTheDocument();
    unmount();

    render(
      <MyLikesGallery
        items={[item("a")]}
        next={cursor("a")}
        readMore={vi.fn()}
      />,
    );
    act(() => unliked?.("a"));
    expect(screen.queryByText("No likes yet")).toBeNull();
    expect(
      screen.getByRole("button", { name: "Show more of your likes" }),
    ).toBeInTheDocument();
  });
});
