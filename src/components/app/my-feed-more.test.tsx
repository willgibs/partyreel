/**
 * A PERSONAL FEED PAST ITS FIRST PAGE (crumbs-38). Pinned: Show more asks the page after the last item shown and lays
 * it under the rest; the next press resumes after the last LOADED page, never the first page's cursor; an item is
 * shown once when the first page comes back shifted (a delete's revalidation moves the 201st up into it); a failed
 * page keeps what she has and asks again ("Try again"); a confirmed delete leaves a loaded page too; and at the end
 * there is no button at all (the honest note it replaces is gone with the cap).
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { GridMedia } from "@/components/app/media-grid";
import type { FeedCursor } from "@/lib/db/queries/my-uploads";

import { FeedMore, useFeedPages, type ReadFeedPage } from "./my-feed-more";

const item = (id: string): GridMedia => ({ id, type: "photo", url: `u-${id}` });
const cursor = (id: string): FeedCursor => ({
  at: `2026-09-23T23:31:24.6441${id.length}0+00:00`,
  id,
});

function Harness({
  first,
  next,
  read,
  dropId,
}: {
  first: GridMedia[];
  next: FeedCursor | null;
  read?: ReadFeedPage;
  /** A confirmed delete the test can press, the way the gallery calls `drop` after one. */
  dropId?: string;
}) {
  const feed = useFeedPages(first, next, read);
  return (
    <div>
      {dropId && (
        <button type="button" data-drop onClick={() => feed.drop(dropId)}>
          drop
        </button>
      )}
      <ul>
        {feed.items.map((m) => (
          <li key={m.id} data-id={m.id}>
            {m.id}
          </li>
        ))}
      </ul>
      <FeedMore feed={feed} label="Show more of your uploads" />
    </div>
  );
}

const shown = () =>
  [...document.querySelectorAll("li[data-id]")].map((li) =>
    li.getAttribute("data-id"),
  );

/** A reader answering scripted pages, recording each ask. */
function scripted(pages: Awaited<ReturnType<ReadFeedPage>>[]) {
  const asks: FeedCursor[] = [];
  const read: ReadFeedPage = vi.fn(async ({ before }) => {
    asks.push(before);
    const next = pages.shift();
    if (!next) throw new Error("no page scripted");
    return next;
  });
  return { read, asks };
}

describe("a personal feed's Show more", () => {
  it("adds the page after the last item shown, then resumes after the page it loaded", async () => {
    const { read, asks } = scripted([
      { ok: true, items: [item("c"), item("d")], next: cursor("d") },
      { ok: true, items: [item("e")], next: null },
    ]);
    render(
      <Harness first={[item("a"), item("b")]} next={cursor("b")} read={read} />,
    );
    expect(shown()).toEqual(["a", "b"]);
    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: "Show more of your uploads" }),
      );
    });
    expect(shown()).toEqual(["a", "b", "c", "d"]);
    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: "Show more of your uploads" }),
      );
    });
    expect(shown()).toEqual(["a", "b", "c", "d", "e"]);
    expect(asks).toEqual([cursor("b"), cursor("d")]);
    // The end: no button, and no note standing in for one.
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("★ shows an item once when the first page comes back shifted, and keeps paging from what it loaded", async () => {
    const { read, asks } = scripted([
      { ok: true, items: [item("c"), item("d")], next: cursor("d") },
      { ok: true, items: [item("e")], next: null },
    ]);
    const { rerender } = render(
      <Harness first={[item("a"), item("b")]} next={cursor("b")} read={read} />,
    );
    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
    });
    // A delete of "a" revalidates the page: the first page now ends at "c", which the loaded page also holds.
    rerender(
      <Harness first={[item("b"), item("c")]} next={cursor("c")} read={read} />,
    );
    expect(shown()).toEqual(["b", "c", "d"]);
    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
    });
    expect(asks).toEqual([cursor("b"), cursor("d")]);
    expect(shown()).toEqual(["b", "c", "d", "e"]);
  });

  it("a failed page keeps what she has, and the button asks again", async () => {
    const { read, asks } = scripted([
      { ok: false, message: "Couldn't load more. Please try again." },
      { ok: true, items: [item("c")], next: null },
    ]);
    render(<Harness first={[item("a")]} next={cursor("a")} read={read} />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
    });
    expect(shown()).toEqual(["a"]);
    expect(screen.getByRole("button")).toHaveTextContent("Try again");
    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
    });
    expect(shown()).toEqual(["a", "c"]);
    expect(asks).toEqual([cursor("a"), cursor("a")]);
  });

  it("says it is loading and asks once however often it is pressed", async () => {
    let release: (v: Awaited<ReturnType<ReadFeedPage>>) => void = () => {};
    const read = vi.fn<ReadFeedPage>(
      () =>
        new Promise((resolve) => {
          release = resolve;
        }),
    );
    render(<Harness first={[item("a")]} next={cursor("a")} read={read} />);
    const button = screen.getByRole("button");
    await act(async () => {
      fireEvent.click(button);
      fireEvent.click(button);
    });
    expect(screen.getByRole("button")).toHaveTextContent("Loading…");
    expect(screen.getByRole("button")).toBeDisabled();
    expect(read).toHaveBeenCalledTimes(1);
    await act(async () => {
      release({ ok: true, items: [item("b")], next: null });
    });
    expect(shown()).toEqual(["a", "b"]);
  });

  it("a confirmed delete leaves a page she loaded", async () => {
    const { read } = scripted([
      { ok: true, items: [item("c"), item("d")], next: null },
    ]);
    render(
      <Harness first={[item("a")]} next={cursor("a")} read={read} dropId="c" />,
    );
    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: "Show more of your uploads" }),
      );
    });
    fireEvent.click(screen.getByRole("button", { name: "drop" }));
    expect(shown()).toEqual(["a", "d"]);
  });

  it("offers nothing with no next page, or no reader to ask", () => {
    render(<Harness first={[item("a")]} next={null} read={vi.fn()} />);
    expect(screen.queryByRole("button")).toBeNull();
    render(<Harness first={[item("a")]} next={cursor("a")} />);
    expect(screen.queryByRole("button")).toBeNull();
  });
});
