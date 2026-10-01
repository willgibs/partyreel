/**
 * HER UPLOADS' DELETE HOLDS (crumbs-45; build 36's red-team: on her own page a Delete on a FIRST-page item left at
 * once, answered 200 with its revalidated page, and came back 20 ms later to stay until a reload). That answer's
 * page can land late or not at all: the viewer's close writes the address in the same tick, just before the action,
 * and Next commits that write over the answer, so the page renders its old first page again. Pinned through the
 * gallery's own wiring, with no revalidated page handed back: a confirmed delete leaves at once and stays gone; a
 * refusal and a round trip that never answers bring it back and say so, the section standing; and the viewer is
 * told every item is hers, so her own event's upload is credited "You".
 */
import { act, render } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { GridMedia } from "@/components/app/media-grid";

import { MyUploadsGallery } from "./my-uploads-gallery";

const removeMyUploadAction = vi.fn();
vi.mock("@/app/(app)/dashboard/actions", () => ({
  removeMyUploadAction: (...a: unknown[]) => removeMyUploadAction(...a),
}));
const toastError = vi.fn();
vi.mock("sonner", () => ({
  toast: { error: (...a: unknown[]) => toastError(...a) },
}));
vi.mock("@/components/likes/likes-provider", () => ({
  LikesProvider: ({ children }: { children: ReactNode }) => children,
}));

/** The grid as the gallery hands it: what it shows, and the viewer's two answers (Delete, and whose each item is). */
type GridProps = {
  items: GridMedia[];
  onDeleteItem?: (id: string) => void;
  canDelete?: (item: GridMedia) => boolean;
};
let grid: GridProps;
vi.mock("@/components/shared/masonry", () => ({
  MasonryColumns: (props: GridProps) => {
    grid = props;
    return (
      <ul>
        {props.items.map((m) => (
          <li key={m.id} data-id={m.id}>
            {m.id}
          </li>
        ))}
      </ul>
    );
  },
}));

const item = (id: string, extra: Partial<GridMedia> = {}): GridMedia => ({
  id,
  type: "photo",
  url: `u-${id}`,
  ...extra,
});

const shown = () =>
  [...document.querySelectorAll("li[data-id]")].map((li) =>
    li.getAttribute("data-id"),
  );

beforeEach(() => {
  removeMyUploadAction.mockReset();
  toastError.mockReset();
});

describe("a delete in her Uploads", () => {
  it("★ leaves the first page at once and stays gone, with no revalidated page handed back", async () => {
    let answer: (result: unknown) => void = () => {};
    removeMyUploadAction.mockImplementation(
      () =>
        new Promise((resolve) => {
          answer = resolve;
        }),
    );
    const { rerender } = render(
      <MyUploadsGallery items={[item("a"), item("b"), item("c")]} />,
    );
    await act(async () => {
      grid.onDeleteItem?.("b");
    });
    expect(removeMyUploadAction).toHaveBeenCalledWith("b");
    expect(shown()).toEqual(["a", "c"]);
    // The answer lands (200, revalidated), and its page does not: the tile used to come back here.
    await act(async () => {
      answer({ ok: true });
    });
    expect(shown()).toEqual(["a", "c"]);
    // The page renders its old first page again (the address write's commit): still gone.
    rerender(<MyUploadsGallery items={[item("a"), item("b"), item("c")]} />);
    expect(shown()).toEqual(["a", "c"]);
    expect(toastError).not.toHaveBeenCalled();
  });

  it("a refusal brings it back and says why", async () => {
    removeMyUploadAction.mockResolvedValue({
      ok: false,
      code: "unknown",
      message: "Something went wrong. Please try again.",
    });
    render(<MyUploadsGallery items={[item("a"), item("b")]} />);
    await act(async () => {
      grid.onDeleteItem?.("b");
    });
    expect(shown()).toEqual(["a", "b"]);
    expect(toastError).toHaveBeenCalledWith("Couldn't remove that upload.", {
      description: "Something went wrong. Please try again.",
    });
  });

  it("★ a round trip that never answers brings it back and says so, and the section stands", async () => {
    removeMyUploadAction.mockRejectedValue(new TypeError("Failed to fetch"));
    render(<MyUploadsGallery items={[item("a"), item("b")]} />);
    await act(async () => {
      grid.onDeleteItem?.("b");
    });
    expect(shown()).toEqual(["a", "b"]);
    expect(toastError).toHaveBeenCalledWith("Couldn't remove that upload.", {
      description: "Check your connection and try again.",
    });
  });
});

describe("whose they are", () => {
  it("★ tells the viewer every item is hers, so her own event's upload is credited You", () => {
    render(
      <MyUploadsGallery
        items={[
          item("a"),
          item("h", { isHost: true, uploaderName: "Will Gibson" }),
        ]}
      />,
    );
    expect(grid.canDelete).toBeTypeOf("function");
    expect(grid.items.map((m) => grid.canDelete?.(m))).toEqual([true, true]);
  });
});
