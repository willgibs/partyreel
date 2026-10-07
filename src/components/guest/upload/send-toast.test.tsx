import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { NOTHING_WAITS, type UploadsWait } from "@/lib/guest/upload-tracker";
import type { QueueItem } from "@/lib/guest/use-upload-queue";

const h = vi.hoisted(() => ({ toast: vi.fn() }));
vi.mock("sonner", () => ({ toast: h.toast }));

const { SEND_TOAST_ID, SEND_TOAST_PRESS, sendToastWords, useSendToast } =
  await import("./send-toast");

/**
 * THE SEND'S TOAST (guest-moments r1, Will's note on `own=glow`: "If we can pop up a temporary toast, whether when
 * their uploads begin landing or the last one completes (your call...)"): once, as a send's last file lands, what
 * landed in the album's truth, with Show yours; never at the start, never for what was refused, never where another
 * surface already says it.
 */

const file = (name = "a.jpg", type = "image/jpeg") =>
  new File(["x"], name, { type });

function item(
  id: string,
  status: QueueItem["status"],
  over: Partial<QueueItem> = {},
): QueueItem {
  return {
    id,
    file: file(),
    kind: "photo",
    status,
    progress: status === "done" ? 100 : 0,
    ...(status === "done"
      ? { mediaId: `m-${id}`, mediaStatus: "approved" }
      : {}),
    ...over,
  };
}

const HELD: UploadsWait = { waits: true, developsAt: null };
const DEVELOP: UploadsWait = {
  waits: true,
  developsAt: "2099-01-01T09:00:00.000Z",
};

describe("what the toast says", () => {
  const live = (n: number, over: Partial<QueueItem> = {}) =>
    Array.from({ length: n }, (_, i) =>
      item(`q${i}`, "done", { mediaStatus: "approved", ...over }),
    );

  it("★ in an album that shows them at once: how many joined it, by the host's name, and Show yours goes to the album", () => {
    expect(
      sendToastWords({
        landed: live(6),
        wait: NOTHING_WAITS,
        hostName: "Maya",
        camera: false,
        pressable: true,
      }),
    ).toEqual({ title: "Your 6 photos joined Maya’s album.", place: "album" });
  });

  it("one of them in the singular, and a mix named as uploads", () => {
    expect(
      sendToastWords({
        landed: live(1),
        wait: NOTHING_WAITS,
        hostName: "Maya",
        camera: false,
        pressable: true,
      })?.title,
    ).toBe("Your photo joined Maya’s album.");
    expect(
      sendToastWords({
        landed: [...live(2), item("v", "done", { kind: "video" })],
        wait: NOTHING_WAITS,
        hostName: "Maya",
        camera: false,
        pressable: true,
      })?.title,
    ).toBe("Your 3 uploads joined Maya’s album.");
  });

  it("★ in a Review album: that they develop as the host lets them in, and Show yours goes to her uploads", () => {
    expect(
      sendToastWords({
        landed: live(2, { mediaStatus: "pending" }),
        wait: HELD,
        hostName: "Maya",
        camera: false,
        pressable: true,
      }),
    ).toEqual({
      title: "Your 2 photos develop as Maya lets them in.",
      place: "uploads",
    });
  });

  it("in an album that develops later: with everyone's, at the develop time once her clock is known", () => {
    const words = (nowMs: number | null) =>
      sendToastWords({
        landed: live(2, { mediaStatus: "sealed" }),
        wait: DEVELOP,
        hostName: "Maya",
        camera: true,
        pressable: true,
        nowMs,
      });
    expect(words(null)).toEqual({
      title: "Your 2 shots develop with everyone's.",
      place: "uploads",
    });
  });

  it("says what is in the album when a send went two ways (her uploads list the rest)", () => {
    expect(
      sendToastWords({
        landed: [...live(2), item("p", "done", { mediaStatus: "pending" })],
        wait: HELD,
        hostName: "Maya",
        camera: false,
        pressable: true,
      }),
    ).toEqual({ title: "Your 2 photos joined Maya’s album.", place: "album" });
  });

  it("names nobody's album for the owner on her own, and offers no press in the demo", () => {
    expect(
      sendToastWords({
        landed: live(3),
        wait: NOTHING_WAITS,
        hostName: null,
        camera: false,
        pressable: false,
      }),
    ).toEqual({ title: "Your 3 photos joined the album.", place: null });
  });

  it("says nothing for a send that landed nothing", () => {
    expect(
      sendToastWords({
        landed: [],
        wait: NOTHING_WAITS,
        hostName: "Maya",
        camera: false,
        pressable: true,
      }),
    ).toBeNull();
  });
});

describe("when the toast is said", () => {
  type Props = Parameters<typeof useSendToast>[0];
  const onShow = vi.fn();
  const base = (queue: QueueItem[], over: Partial<Props> = {}): Props => ({
    queue,
    removedIds: new Set(),
    wait: NOTHING_WAITS,
    hostName: "Maya",
    camera: false,
    isDemo: false,
    quiet: false,
    onShow,
    ...over,
  });
  const mount = (queue: QueueItem[], over: Partial<Props> = {}) =>
    renderHook((props: Props) => useSendToast(props), {
      initialProps: base(queue, over),
    });

  beforeEach(() => {
    h.toast.mockClear();
    onShow.mockClear();
    window.history.replaceState(null, "", "/e/token");
  });
  afterEach(() => {
    window.history.replaceState(null, "", "/");
  });

  it("★ once, as the send's last file lands, never at its start or while it runs", () => {
    const view = mount([]);
    view.rerender(base([item("a", "uploading"), item("b", "queued")]));
    view.rerender(base([item("a", "done"), item("b", "uploading")]));
    expect(h.toast).not.toHaveBeenCalled();
    view.rerender(base([item("a", "done"), item("b", "done")]));
    expect(h.toast).toHaveBeenCalledTimes(1);
    const [title, options] = h.toast.mock.calls[0];
    expect(title).toBe("Your 2 photos joined Maya’s album.");
    expect(options).toMatchObject({ id: SEND_TOAST_ID });
    expect(options.action.label).toBe(SEND_TOAST_PRESS);
    // Its press shows hers where they are.
    options.action.onClick();
    expect(onShow).toHaveBeenCalledWith("album");
    // Nothing more is said for a render that changes nothing.
    view.rerender(base([item("a", "done"), item("b", "done")]));
    expect(h.toast).toHaveBeenCalledTimes(1);
  });

  /* ★ RESHAPED ON PURPOSE (crumbs-90, no-signal r1's drop helper). Scar kept: a refused file is the failure sheet's,
     never the toast's. Reason expired: "the toast counts the rest". The sheet that opens on the refusal already says
     what joined ("Everything else is in Maya's album."), and the toast's "Your 2 photos joined Maya's album." stood
     beside its "1 of 3 didn't upload": two voices at one moment, the one that leaves by itself first. */
  it("★ a refused file is the failure sheet's, and so is the send it ended: the sheet says what joined", () => {
    const view = mount([]);
    view.rerender(
      base([item("a", "uploading"), item("b", "queued"), item("c", "queued")]),
    );
    view.rerender(
      base([
        item("a", "done"),
        item("b", "error", { error: "This album is full right now" }),
        item("c", "done"),
      ]),
    );
    expect(h.toast).not.toHaveBeenCalled();
  });

  it("★ a send that ends under a standing sheet (a row's Retry, a heal of one of its rows) is the sheet's too", () => {
    const listed = item("b", "error", { error: "Your connection dropped" });
    const standing = { sheetStands: () => true };
    const view = mount([item("a", "error"), listed], standing);
    view.rerender(base([item("a", "queued"), listed], standing));
    view.rerender(base([item("a", "done"), listed], standing));
    expect(h.toast).not.toHaveBeenCalled();
  });

  it("a failure the queue held from before the send, which no sheet stands over, never silences it", () => {
    // A failure the door's step reported and nobody dismissed (`carriedFailures`): no sheet lists it.
    const old = item("x", "error", { error: "This album is full right now" });
    const view = mount([old]);
    view.rerender(base([old, item("a", "uploading")]));
    view.rerender(base([old, item("a", "done")]));
    expect(h.toast.mock.calls[0][0]).toBe("Your photo joined Maya’s album.");
  });

  it("says nothing for a send that landed nothing (all refused, or all stopped)", () => {
    const view = mount([]);
    view.rerender(base([item("a", "uploading")]));
    view.rerender(base([item("a", "error", { error: "Nope" })]));
    view.rerender(
      base([item("a", "error", { error: "Nope" }), item("b", "queued")]),
    );
    view.rerender(base([item("a", "error", { error: "Nope" })]));
    expect(h.toast).not.toHaveBeenCalled();
  });

  it("★ counts each send's own files: an earlier send's landing is never told again", () => {
    const view = mount([]);
    view.rerender(base([item("a", "uploading")]));
    view.rerender(base([item("a", "done")]));
    expect(h.toast.mock.calls[0][0]).toBe("Your photo joined Maya’s album.");
    view.rerender(
      base([item("a", "done"), item("b", "queued"), item("c", "queued")]),
    );
    view.rerender(
      base([item("a", "done"), item("b", "done"), item("c", "done")]),
    );
    expect(h.toast).toHaveBeenCalledTimes(2);
    expect(h.toast.mock.calls[1][0]).toBe("Your 2 photos joined Maya’s album.");
  });

  it("a Retry is the send's own: the file sent again counts once it lands", () => {
    const failed = item("a", "error", { error: "Your connection dropped" });
    const view = mount([failed]);
    view.rerender(base([{ ...failed, status: "queued", error: undefined }]));
    view.rerender(base([item("a", "done")]));
    expect(h.toast.mock.calls[0][0]).toBe("Your photo joined Maya’s album.");
  });

  it("★ is spent, never said later, where another surface says the landing (the keep, the door's step, the camera)", () => {
    const view = mount([]);
    view.rerender(base([item("a", "uploading")], { quiet: true }));
    view.rerender(base([item("a", "done")], { quiet: true }));
    view.rerender(base([item("a", "done")], { quiet: false }));
    expect(h.toast).not.toHaveBeenCalled();
  });

  it("is not said over the reel's view, whose arrivals name her on the picture", () => {
    window.history.replaceState(null, "", "/e/token?reel");
    const view = mount([]);
    view.rerender(base([item("a", "uploading")]));
    view.rerender(base([item("a", "done")]));
    expect(h.toast).not.toHaveBeenCalled();
  });

  it("leaves out what she took back before the send ended", () => {
    const view = mount([]);
    view.rerender(base([item("a", "uploading"), item("b", "queued")]));
    view.rerender(
      base([item("a", "done"), item("b", "done")], {
        removedIds: new Set(["m-a"]),
      }),
    );
    expect(h.toast.mock.calls[0][0]).toBe("Your photo joined Maya’s album.");
  });

  it("where what she adds waits, says how it develops and shows her uploads", () => {
    const view = mount([], { wait: HELD });
    view.rerender(base([item("a", "uploading")], { wait: HELD }));
    view.rerender(
      base([item("a", "done", { mediaStatus: "pending" })], { wait: HELD }),
    );
    const [title, options] = h.toast.mock.calls[0];
    expect(title).toBe("Your photo develops as Maya lets it in.");
    options.action.onClick();
    expect(onShow).toHaveBeenCalledWith("uploads");
  });

  it("offers no press in the demo, and sets the press on every show (sonner merges by id)", () => {
    const view = mount([], { isDemo: true });
    view.rerender(base([item("a", "uploading")], { isDemo: true }));
    view.rerender(base([item("a", "done")], { isDemo: true }));
    const options = h.toast.mock.calls[0][1];
    expect("action" in options).toBe(true);
    expect(options.action).toBeUndefined();
  });
});
