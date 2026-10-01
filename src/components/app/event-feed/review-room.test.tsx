/**
 * THE REVIEW ROOM IN THE HAND (host-curation's seven, curation-wiring): the keys, the peek's
 * verdict and the line, driven through the real room over fake writes.
 *
 * Pinned by behaviour: an arrow puts the cursor on a tile and walks it; Enter approves the upload
 * under it and Backspace (or Delete) rejects it, the cursor moving on before the tile leaves;
 * Space opens the peek, where the keys and the verdict judge the photograph it shows and it moves
 * on; a key on any other control is that control's; select mode keeps a checkbox's keys and Escape
 * leaves it; uploads a server render brings wait behind the line until a tap folds them in.
 */
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { type GridMedia } from "@/components/app/media-grid";
import { TooltipProvider } from "@/components/ui/tooltip";

import { ReviewRoom } from "./review-room";
import type { ReviewWrites } from "./use-review-triage";

vi.mock("@/app/(app)/dashboard/actions", () => ({
  updateEventAction: vi.fn(async () => ({ ok: true })),
}));
vi.mock("@/app/(app)/dashboard/[eventId]/actions", () => ({}));
// The exit's and the beat's clocks are CSS variables; a test reads them as instant.
vi.mock("@/lib/shared/read-css-ms", () => ({ readCssMs: () => 0 }));

const item = (i: number): GridMedia => ({
  id: `m${i}`,
  type: "photo",
  url: `signed:m${i}`,
  status: "pending",
});

let writes: {
  approve: ReturnType<typeof vi.fn>;
  reject: ReturnType<typeof vi.fn>;
  undo: ReturnType<typeof vi.fn>;
};

beforeEach(() => {
  writes = {
    approve: vi.fn(async () => ({ ok: true })),
    reject: vi.fn(async () => ({ ok: true })),
    undo: vi.fn(async () => ({ ok: true })),
  };
});

function room(items: GridMedia[] = [item(1), item(2), item(3)]) {
  const ui = (list: GridMedia[]) => (
    <TooltipProvider>
      <ReviewRoom
        eventId="ev-1"
        moderationOn
        pendingItems={list}
        writes={writes as unknown as ReviewWrites}
      />
    </TooltipProvider>
  );
  const view = render(ui(items));
  return {
    ...view,
    rerenderWith: (list: GridMedia[]) => view.rerender(ui(list)),
  };
}

/** The focusable button of the tile for `id`. */
function tile(id: string): HTMLElement {
  const el = document.querySelector<HTMLElement>(
    `[data-tile-id="${id}"] [data-tile-button]`,
  );
  if (!el) throw new Error(`no tile ${id}`);
  return el;
}

const focusedTile = () =>
  (document.activeElement?.closest("[data-tile-id]") as HTMLElement | null)
    ?.dataset.tileId ?? null;

describe("the grid's keys", () => {
  it("puts the cursor on the first tile from nothing, then walks it", () => {
    room();
    fireEvent.keyDown(document.body, { key: "ArrowRight" });
    expect(focusedTile()).toBe("m1");
    fireEvent.keyDown(document.activeElement!, { key: "ArrowRight" });
    expect(focusedTile()).toBe("m2");
    fireEvent.keyDown(document.activeElement!, { key: "End" });
    expect(focusedTile()).toBe("m3");
    fireEvent.keyDown(document.activeElement!, { key: "Home" });
    expect(focusedTile()).toBe("m1");
  });

  it("approves with Enter and rejects with Backspace or Delete, the cursor moving on first", async () => {
    room([item(1), item(2), item(3), item(4)]);
    tile("m2").focus();
    fireEvent.keyDown(tile("m2"), { key: "Enter" });
    expect(writes.approve).toHaveBeenCalledWith("ev-1", ["m2"]);
    expect(focusedTile()).toBe("m3");
    fireEvent.keyDown(tile("m3"), { key: "Backspace" });
    expect(writes.reject).toHaveBeenCalledWith("ev-1", ["m3"]);
    expect(focusedTile()).toBe("m4");
    fireEvent.keyDown(tile("m4"), { key: "Delete" });
    expect(writes.reject).toHaveBeenCalledWith("ev-1", ["m4"]);
    await waitFor(() =>
      expect(document.querySelectorAll("[data-tile-id]")).toHaveLength(1),
    );
  });

  it("leaves a key on any other control to that control", () => {
    room();
    const approveAll = screen.getByRole("button", { name: /approve all/i });
    approveAll.focus();
    fireEvent.keyDown(approveAll, { key: "Enter" });
    fireEvent.keyDown(approveAll, { key: "Backspace" });
    fireEvent.keyDown(approveAll, { key: "ArrowRight" });
    expect(writes.approve).not.toHaveBeenCalled();
    expect(writes.reject).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(approveAll);
  });

  // Every confirm popup is an `alertdialog` now (ui/popup.tsx), so "another layer is up: its keys are its
  // own" has to see it as one (crumbs-20); a room that only looked for `dialog` judged under a confirm.
  it("★ leaves every key to a confirm standing over it, and takes them back once it is gone", () => {
    room();
    const confirm = document.createElement("div");
    confirm.setAttribute("role", "alertdialog");
    document.body.appendChild(confirm);
    tile("m1").focus();
    fireEvent.keyDown(tile("m1"), { key: "Enter" });
    fireEvent.keyDown(tile("m1"), { key: "Backspace" });
    expect(writes.approve).not.toHaveBeenCalled();
    expect(writes.reject).not.toHaveBeenCalled();
    confirm.remove();
    fireEvent.keyDown(tile("m1"), { key: "Enter" });
    expect(writes.approve).toHaveBeenCalledWith("ev-1", ["m1"]);
  });

  it("gives no verdict while selecting, and Escape leaves select mode", () => {
    room();
    fireEvent.click(screen.getByRole("button", { name: /select/i }));
    const first = tile("m1");
    first.focus();
    fireEvent.keyDown(first, { key: "Backspace" });
    expect(writes.reject).not.toHaveBeenCalled();
    fireEvent.keyDown(first, { key: "Escape" });
    expect(screen.getByRole("button", { name: /approve all/i })).toBeTruthy();
  });
});

describe("the peek", () => {
  it("opens on Space; its keys judge the photograph it shows and it moves on", async () => {
    room();
    tile("m1").focus();
    fireEvent.keyDown(tile("m1"), { key: " " });
    const peek = screen.getByRole("dialog", { name: /photo preview/i });
    expect(document.activeElement).toBe(peek);
    expect(peek.querySelector("img")?.getAttribute("src")).toBe("signed:m1");

    fireEvent.keyDown(peek, { key: "ArrowRight" });
    expect(peek.querySelector("img")?.getAttribute("src")).toBe("signed:m2");
    fireEvent.keyDown(peek, { key: "Enter" });
    expect(writes.approve).toHaveBeenCalledWith("ev-1", ["m2"]);
    await waitFor(() =>
      expect(
        screen.getByRole("dialog").querySelector("img")?.getAttribute("src"),
      ).toBe("signed:m3"),
    );
    fireEvent.keyDown(screen.getByRole("dialog"), { key: " " });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("carries the verdict on the look a tap opens", async () => {
    room();
    fireEvent.click(tile("m1"));
    const peek = screen.getByRole("dialog");
    fireEvent.click(within(peek).getByRole("button", { name: /reject/i }));
    expect(writes.reject).toHaveBeenCalledWith("ev-1", ["m1"]);
    await waitFor(() =>
      expect(
        screen.getByRole("dialog").querySelector("img")?.getAttribute("src"),
      ).toBe("signed:m2"),
    );
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: /approve/i,
      }),
    );
    expect(writes.approve).toHaveBeenCalledWith("ev-1", ["m2"]);
  });

  // Build 14's red-team: a browser focuses the button a pointer presses, so after a Reject by
  // mouse the next Enter pressed that button again, rejecting the next upload.
  it("hands focus back to the look after a pressed verdict, so its keys decide the next", async () => {
    room();
    fireEvent.click(tile("m1"));
    const reject = within(screen.getByRole("dialog")).getByRole("button", {
      name: /reject/i,
    });
    reject.focus();
    fireEvent.click(reject);
    expect(writes.reject).toHaveBeenCalledWith("ev-1", ["m1"]);
    expect(document.activeElement).toBe(screen.getByRole("dialog"));
    await waitFor(() =>
      expect(
        screen.getByRole("dialog").querySelector("img")?.getAttribute("src"),
      ).toBe("signed:m2"),
    );

    fireEvent.keyDown(document.activeElement!, { key: "Enter" });
    expect(writes.approve).toHaveBeenCalledWith("ev-1", ["m2"]);
    expect(writes.reject).toHaveBeenCalledTimes(1);
  });

  it("leaves Enter and Space on a focused peek button to the button, and decides every other key", () => {
    room();
    fireEvent.click(tile("m1"));
    const approve = within(screen.getByRole("dialog")).getByRole("button", {
      name: /approve/i,
    });
    approve.focus();
    // The keys a button acts on are its own: the browser presses it (jsdom does not).
    fireEvent.keyDown(approve, { key: "Enter" });
    fireEvent.keyDown(approve, { key: " " });
    expect(writes.approve).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeTruthy();

    fireEvent.keyDown(approve, { key: "Backspace" });
    expect(writes.reject).toHaveBeenCalledWith("ev-1", ["m1"]);
  });
});

describe("the line", () => {
  it("holds a render's new uploads behind a count, and a tap folds them in at the head", async () => {
    const { rerenderWith } = room([item(1), item(2)]);
    expect(screen.queryByText(/new/)).toBeNull();
    rerenderWith([item(7), item(8), item(1), item(2)]);
    expect(document.querySelectorAll("[data-tile-id]")).toHaveLength(2);
    const line = screen.getByRole("button", { name: /2 new/i });
    await act(async () => {
      fireEvent.click(line);
    });
    await waitFor(() =>
      expect(
        [...document.querySelectorAll<HTMLElement>("[data-tile-id]")].map(
          (t) => t.dataset.tileId,
        ),
      ).toEqual(["m7", "m8", "m1", "m2"]),
    );
    expect(screen.queryByRole("button", { name: /new/i })).toBeNull();
  });
});

/**
 * ★ HIS HOST NOTE (voice-guest r2 on `status`, Will: "a note for the host when making approvals that
 * they can always hide an approved photo later"): one quiet line while there is a queue to judge,
 * and nothing where no approval is made (caught up, or review off).
 */
describe("the host note", () => {
  const note = () => document.querySelectorAll("[data-review-note]");

  it("says once, over the queue, that anything approved can still be hidden", () => {
    room();
    expect(note()).toHaveLength(1);
    expect(note()[0]).toHaveTextContent(
      "Anything you approve can still be hidden later.",
    );
  });

  it("is gone once the room is caught up, and while review is off", async () => {
    room([item(1)]);
    fireEvent.click(screen.getByRole("button", { name: /approve all/i }));
    await waitFor(() => expect(note()).toHaveLength(0));
    render(
      <TooltipProvider>
        <ReviewRoom
          eventId="ev-2"
          moderationOn={false}
          pendingItems={[]}
          writes={writes as unknown as ReviewWrites}
          claimPage={false}
        />
      </TooltipProvider>,
    );
    expect(note()).toHaveLength(0);
  });
});

/**
 * THE ROOM'S ONE HEADING (crumbs-42, from crumbs-7). The page headed the room "Review" and the room said Review
 * again in the amber label over its grid. The room draws its title itself now, the page's one heading, with the
 * queue's count beside it and its actions on its row; the page draws none (`review/page.test.tsx`).
 */
describe("the room's one heading", () => {
  const reviewHeadings = () =>
    screen
      .queryAllByRole("heading")
      .filter((h) => /review/i.test(h.textContent ?? ""));

  it("★ is the page's title, Review, once, with the queue's count beside it", () => {
    room();
    expect(reviewHeadings()).toHaveLength(1);
    const title = screen.getByRole("heading", { level: 1, name: "Review" });
    // The count reads as what it counts.
    expect(title.parentElement).toHaveTextContent(/^Review3 waiting$/);
  });

  it("stands in every state, its count gone with the queue: caught up, and review off", async () => {
    room([item(1)]);
    fireEvent.click(screen.getByRole("button", { name: /approve all/i }));
    await waitFor(() =>
      expect(screen.getByText("You're all caught up")).toBeInTheDocument(),
    );
    expect(reviewHeadings()).toHaveLength(1);
    expect(
      screen.getByRole("heading", { level: 1, name: "Review" }).parentElement,
    ).toHaveTextContent(/^Review$/);
    cleanup();
    render(
      <TooltipProvider>
        <ReviewRoom
          eventId="ev-2"
          moderationOn={false}
          pendingItems={[]}
          writes={writes as unknown as ReviewWrites}
          claimPage={false}
        />
      </TooltipProvider>,
    );
    expect(
      screen.getByRole("heading", { level: 1, name: "Review" }),
    ).toBeInTheDocument();
  });
});
