/**
 * THE PAGED BIN'S LIST (album-host-wiring): `useHubBin`, behind the hub's Deleted filter.
 *
 * Nothing is read until the filter is chosen, and then the list (ids, shapes, countdowns, no links)
 * is read again each time it is chosen: a host who deletes from the album and then opens Deleted must
 * find what she just deleted there. The last list stays on screen while a new one is read, one read
 * runs at a time, and an item that leaves the bin during a read never comes back with that read.
 * An open bin re-mints its aged links on a timer, since it has no poll to do it after.
 *
 * AND ITS VIEWER CARRIES ITS TWO VERBS (album-fixes): the tile pane is a desk's, so a phone's bin
 * acted on nothing. The viewer's Restore and Delete permanently are the pane's own writes (one hook),
 * closing the viewer first, toasting the outcome, and dropping the item from the list.
 */
import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  purgeMediaNowAction,
  restoreMediaAction,
} from "@/app/(app)/dashboard/[eventId]/actions";
import { TooltipProvider } from "@/components/ui/tooltip";
import { binItem, type BinEntry, type BinManifestBody } from "@/lib/event/bin";

import {
  BIN_RELINK_MS,
  RecentlyDeletedGrid,
  useHubBin,
  useRelinkWhileOpen,
} from "./recently-deleted-grid";

vi.mock("@/app/(app)/dashboard/[eventId]/actions", () => ({
  purgeMediaNowAction: vi.fn(),
  restoreMediaAction: vi.fn(),
}));

// The lazy wrapper is next/dynamic, which resolves after a pin is over: the real viewer mounts
// synchronously here (closed, it renders nothing).
vi.mock("@/components/shared/media-lightbox.lazy", async () => {
  const { MediaLightbox } = await import("@/components/shared/media-lightbox");
  return { MediaLightboxLazy: MediaLightbox, preloadMediaLightbox: () => {} };
});

const id = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const entry = (n: number): BinEntry => [id(n), 400, 300, 0, 29];

/** The bin's list route, answered by hand: each read waits until the test answers it. */
let reads: {
  url: string;
  answer: (entries: BinEntry[]) => void;
  fail: () => void;
}[] = [];

beforeEach(() => {
  reads = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(
      (url: string) =>
        new Promise((resolve) => {
          reads.push({
            url,
            answer: (entries) =>
              resolve({
                ok: true,
                status: 200,
                json: async () =>
                  ({ ok: true, entries }) satisfies BinManifestBody,
              }),
            fail: () =>
              resolve({ ok: false, status: 500, json: async () => ({}) }),
          });
        }),
    ),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const ids = (entries: readonly BinEntry[]) => entries.map((e) => e[0]);

describe("useHubBin", () => {
  it("reads nothing until the filter is chosen, then reads the list", async () => {
    const { result } = renderHook(() => useHubBin("e1"));
    expect(result.current.status).toBe("idle");
    expect(reads).toHaveLength(0);

    act(() => result.current.open());
    expect(result.current.status).toBe("loading");
    expect(reads).toHaveLength(1);
    expect(reads[0].url).toBe("/api/events/e1/bin");

    await act(async () => reads[0].answer([entry(1), entry(2)]));
    expect(result.current.status).toBe("ready");
    expect(ids(result.current.entries)).toEqual([id(1), id(2)]);
  });

  // ★ The reshape of "only once" (the old bin kept its list for the island's life because every item
  // in it cost a presign; the paged bin's list has none, and a kept list hid what she just deleted).
  it("reads the list again each time the filter is chosen, keeping the last list on screen meanwhile", async () => {
    const { result } = renderHook(() => useHubBin("e1"));
    act(() => result.current.open());
    await act(async () => reads[0].answer([entry(1)]));

    act(() => result.current.open());
    expect(reads).toHaveLength(2);
    expect(result.current.status).toBe("ready");
    expect(ids(result.current.entries)).toEqual([id(1)]);

    // She deleted a photograph from the album in between: it is in this read.
    await act(async () => reads[1].answer([entry(2), entry(1)]));
    expect(ids(result.current.entries)).toEqual([id(2), id(1)]);
  });

  it("runs one read at a time", async () => {
    const { result } = renderHook(() => useHubBin("e1"));
    act(() => {
      result.current.open();
      result.current.open();
    });
    expect(reads).toHaveLength(1);
    await act(async () => reads[0].answer([]));
    act(() => result.current.open());
    expect(reads).toHaveLength(2);
  });

  it("never brings back, with a read, an item that left the bin while it ran", async () => {
    const { result } = renderHook(() => useHubBin("e1"));
    act(() => result.current.open());
    await act(async () => reads[0].answer([entry(1), entry(2)]));

    act(() => result.current.open());
    // Restored while the read is out: the answer was read before the restore landed.
    act(() => result.current.drop([id(2)]));
    expect(ids(result.current.entries)).toEqual([id(1)]);
    await act(async () => reads[1].answer([entry(1), entry(2)]));
    expect(ids(result.current.entries)).toEqual([id(1)]);
  });

  it("says a failed first read, and keeps the list when a read again fails", async () => {
    const { result } = renderHook(() => useHubBin("e1"));
    act(() => result.current.open());
    await act(async () => reads[0].fail());
    expect(result.current.status).toBe("error");

    act(() => result.current.open());
    await act(async () => reads[1].answer([entry(1)]));
    expect(result.current.status).toBe("ready");

    act(() => result.current.open());
    await act(async () => reads[2].fail());
    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(ids(result.current.entries)).toEqual([id(1)]);
  });
});

describe("useRelinkWhileOpen", () => {
  it("asks the link store to re-mint what aged while the bin is on screen, and stops when it leaves", () => {
    vi.useFakeTimers();
    try {
      const links = { refreshAged: vi.fn(async () => {}) };
      const { unmount } = renderHook(() => useRelinkWhileOpen(links));
      expect(links.refreshAged).not.toHaveBeenCalled();
      vi.advanceTimersByTime(BIN_RELINK_MS);
      expect(links.refreshAged).toHaveBeenCalledTimes(1);
      vi.advanceTimersByTime(BIN_RELINK_MS * 2);
      expect(links.refreshAged).toHaveBeenCalledTimes(3);
      unmount();
      vi.advanceTimersByTime(BIN_RELINK_MS * 3);
      expect(links.refreshAged).toHaveBeenCalledTimes(3);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("the bin's viewer carries its two verbs", () => {
  const linked = (n: number) =>
    binItem(entry(n), {
      tile: `https://r2.test/t${n}.jpg`,
      view: `https://r2.test/v${n}.jpg`,
    });

  function openBin(
    items = [linked(1), linked(2)],
    extra: Partial<Parameters<typeof RecentlyDeletedGrid>[0]> = {},
  ) {
    const onGone = vi.fn();
    const onRestored = vi.fn();
    const utils = render(
      <TooltipProvider>
        <RecentlyDeletedGrid
          eventId="e1"
          items={items}
          onGone={onGone}
          onRestored={onRestored}
          {...extra}
        />
      </TooltipProvider>,
    );
    const open = (n: number) =>
      fireEvent.click(
        utils.container.querySelector(
          `[data-media-id="${id(n)}"] [data-tile-open]`,
        )!,
      );
    const capsule = () =>
      document.querySelector<HTMLElement>("[data-lightbox-capsule]");
    return { ...utils, onGone, onRestored, open, capsule };
  }

  afterEach(() => {
    vi.mocked(restoreMediaAction).mockReset();
    vi.mocked(purgeMediaNowAction).mockReset();
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
    window.history.replaceState(null, "", "/");
  });

  it("restores from the viewer at once: it closes, the write runs, and the item leaves the bin", async () => {
    vi.mocked(restoreMediaAction).mockResolvedValue({ ok: true });
    const { open, capsule, onGone, onRestored } = openBin();
    open(1);
    expect(window.location.search).toContain(id(1));
    fireEvent.click(
      within(capsule()!).getByRole("button", { name: "Restore" }),
    );
    // Closed first (its address with it), as the album's viewer closes for Remove.
    expect(window.location.search).not.toContain("photo=");
    await act(async () => {});
    expect(restoreMediaAction).toHaveBeenCalledWith("e1", id(1));
    expect(onGone).toHaveBeenCalledWith(id(1));
    expect(onRestored).toHaveBeenCalledTimes(1);
    expect(toast.success).toHaveBeenCalledWith(
      "Restored. It's back in the album.",
    );
  });

  it("deletes for good from the viewer only behind its confirm", async () => {
    vi.mocked(purgeMediaNowAction).mockResolvedValue({ ok: true });
    const { open, capsule, onGone } = openBin();
    open(2);
    fireEvent.click(
      within(capsule()!).getByRole("button", { name: "Delete permanently" }),
    );
    expect(purgeMediaNowAction).not.toHaveBeenCalled();
    const dialog = screen.getByRole("dialog", { name: "Delete permanently?" });
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Delete permanently" }),
    );
    await act(async () => {});
    expect(purgeMediaNowAction).toHaveBeenCalledWith("e1", [id(2)]);
    expect(onGone).toHaveBeenCalledWith(id(2));
    expect(toast.success).toHaveBeenCalledWith("Permanently deleted.");
  });

  it("offers the room sheet when the plan has no room, and the item stays", async () => {
    vi.mocked(restoreMediaAction).mockResolvedValue({
      ok: false,
      code: "insufficient_space",
      message: "Not enough room to restore this.",
    });
    const { open, capsule, onGone } = openBin();
    open(1);
    fireEvent.click(
      within(capsule()!).getByRole("button", { name: "Restore" }),
    );
    await act(async () => {});
    expect(onGone).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith(
      "Not enough room to restore this.",
      expect.objectContaining({
        action: expect.objectContaining({ label: "Upgrade" }),
      }),
    );
  });

  it("says so when a write never answers, and the item stays", async () => {
    vi.mocked(restoreMediaAction).mockRejectedValue(new Error("offline"));
    vi.mocked(purgeMediaNowAction).mockRejectedValue(new Error("offline"));
    const { open, capsule, onGone } = openBin();
    open(1);
    fireEvent.click(
      within(capsule()!).getByRole("button", { name: "Restore" }),
    );
    await act(async () => {});
    expect(toast.error).toHaveBeenCalledWith(
      "Couldn't restore that item.",
      expect.anything(),
    );
    open(2);
    fireEvent.click(
      within(capsule()!).getByRole("button", { name: "Delete permanently" }),
    );
    fireEvent.click(
      within(
        screen.getByRole("dialog", { name: "Delete permanently?" }),
      ).getByRole("button", { name: "Delete permanently" }),
    );
    await act(async () => {});
    expect(toast.error).toHaveBeenCalledWith(
      "Couldn't delete that item.",
      expect.anything(),
    );
    expect(onGone).not.toHaveBeenCalled();
  });

  it("is the desk pane's own pair of writes", async () => {
    vi.mocked(restoreMediaAction).mockResolvedValue({ ok: true });
    const { container, onGone } = openBin();
    const pane = container.querySelector<HTMLElement>(
      `[data-media-id="${id(2)}"] [data-reveal-chip]`,
    )!;
    fireEvent.click(within(pane).getByRole("button", { name: "Restore" }));
    await act(async () => {});
    expect(restoreMediaAction).toHaveBeenCalledWith("e1", id(2));
    expect(onGone).toHaveBeenCalledWith(id(2));
  });

  it("asks the bin for the links of what the viewer is about to show", () => {
    const onWindowChange = vi.fn();
    const unlinked = binItem(entry(2), undefined);
    const { open } = openBin([linked(1), unlinked, linked(3)], {
      onWindowChange,
    });
    onWindowChange.mockClear();
    open(1);
    expect(onWindowChange).toHaveBeenCalledWith([id(2)]);
  });
});
