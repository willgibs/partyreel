/**
 * A LOST ANSWER HEALS ITSELF (red-team 55's LOW): a file whose complete lost its answer is asked again for the guest,
 * quietly, so the sheet that lists it as failed lets it go when the server's own row answers, instead of saying "didn't
 * upload" over a photograph the album already shows. These pin WHEN it asks (a few seconds after, when the line is
 * back, when the page is looked at again), WHAT it asks for (a dropped file whose complete is kept, never a refusal and
 * never a file whose bytes never went) and that it is never a loop (a few asks a file, however it is triggered).
 * The queue's half (what an ask does to the queue and the sheet) is in `use-upload-queue.test.tsx` and
 * `guest-upload.test.tsx`.
 */
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// What the uploader says is kept: a case names the files whose complete lost its answer.
const kept = vi.hoisted(() => new WeakSet<File>());
vi.mock("@/lib/upload/uploader", () => ({
  hasKeptComplete: (file: File) => kept.has(file),
}));

import {
  HEAL_AFTER_MS,
  isLostAnswer,
  useHealLostAnswers,
} from "./use-upload-queue.heal";

type Row = {
  id: string;
  file: File;
  status: string;
  cause?: "dropped" | "cancelled";
};

/** A file whose complete lost its answer (kept) and that failed as a dropped connection: the row the heal is for. */
function lostRow(id: string): Row {
  const file = new File([new Uint8Array([1])], `${id}.jpg`, {
    type: "image/jpeg",
  });
  kept.add(file);
  return { id, file, status: "error", cause: "dropped" };
}

const mount = (items: readonly Row[], heal = vi.fn()) => {
  const view = renderHook(
    ({ items }: { items: readonly Row[] }) => useHealLostAnswers(items, heal),
    { initialProps: { items } },
  );
  return { heal, ...view };
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(1_000_000);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("what is a lost answer", () => {
  it("★ is a file that failed as a dropped connection and whose complete is kept, and nothing else", () => {
    const row = lostRow("a");
    expect(isLostAnswer(row)).toBe(true);
    // A refusal says no cause: the server's settled word on the file, never an unknown.
    expect(isLostAnswer({ ...row, cause: undefined })).toBe(false);
    // A drop before the complete (a PUT, a presign) kept nothing: its bytes never went, so asking would answer nothing.
    const unsent = { ...row, file: new File([new Uint8Array([1])], "u.jpg") };
    expect(isLostAnswer(unsent)).toBe(false);
    // And only a failure is in doubt: going, waiting and landed files are not.
    for (const status of ["queued", "uploading", "done"]) {
      expect(isLostAnswer({ ...row, status })).toBe(false);
    }
  });
});

describe("when it asks", () => {
  it("★ asks for a lost answer a few seconds after, once, for its id", () => {
    const { heal } = mount([lostRow("a")]);
    act(() => void vi.advanceTimersByTime(HEAL_AFTER_MS[0] - 1));
    expect(heal).not.toHaveBeenCalled();
    act(() => void vi.advanceTimersByTime(1));
    expect(heal).toHaveBeenCalledTimes(1);
    expect(heal).toHaveBeenCalledWith(["a"]);
  });

  it("asks for every lost answer in one go, and for nothing that is not one", () => {
    const refused: Row = {
      id: "r",
      file: new File([new Uint8Array([1])], "r.jpg"),
      status: "error",
    };
    const { heal } = mount([lostRow("a"), refused, lostRow("b")]);
    act(() => void vi.advanceTimersByTime(HEAL_AFTER_MS[0]));
    expect(heal).toHaveBeenCalledTimes(1);
    expect(heal).toHaveBeenCalledWith(["a", "b"]);
  });

  it("asks nothing for a file that landed before its turn", () => {
    const row = lostRow("a");
    const { heal, rerender } = mount([row]);
    act(() => void vi.advanceTimersByTime(HEAL_AFTER_MS[0] - 1_000));
    rerender({ items: [{ ...row, status: "done", cause: undefined }] });
    act(() => void vi.advanceTimersByTime(HEAL_AFTER_MS[2]));
    expect(heal).not.toHaveBeenCalled();
  });

  it("★ never more than a few asks a file: an ask that finds the line still down is followed by a longer wait, and then none", () => {
    const row = lostRow("a");
    const { heal, rerender } = mount([row]);
    const failsAgain = () => rerender({ items: [{ ...row }] });
    act(() => void vi.advanceTimersByTime(HEAL_AFTER_MS[0]));
    expect(heal).toHaveBeenCalledTimes(1);
    failsAgain();
    act(() => void vi.advanceTimersByTime(HEAL_AFTER_MS[1] - 1));
    expect(heal).toHaveBeenCalledTimes(1);
    act(() => void vi.advanceTimersByTime(1));
    expect(heal).toHaveBeenCalledTimes(2);
    failsAgain();
    act(() => void vi.advanceTimersByTime(HEAL_AFTER_MS[2]));
    expect(heal).toHaveBeenCalledTimes(3);
    failsAgain();
    act(() => void vi.advanceTimersByTime(10 * 60_000));
    expect(heal).toHaveBeenCalledTimes(HEAL_AFTER_MS.length);
  });

  it("★ the cap is the file's own: a fresh mount of the same file is given no more", () => {
    const row = lostRow("a");
    for (let k = 0; k < HEAL_AFTER_MS.length; k++) {
      const { heal, unmount } = mount([{ ...row }]);
      act(() => void vi.advanceTimersByTime(HEAL_AFTER_MS[k]!));
      expect(heal).toHaveBeenCalledTimes(1);
      unmount();
    }
    const { heal } = mount([{ ...row }]);
    act(() => void vi.advanceTimersByTime(10 * 60_000));
    expect(heal).not.toHaveBeenCalled();
  });

  it("anything the owner holds changing starts the wait again: nothing heals in the middle of a burst", () => {
    const row = lostRow("a");
    const { heal, rerender } = mount([row]);
    act(() => void vi.advanceTimersByTime(HEAL_AFTER_MS[0] - 1_000));
    rerender({ items: [row, { ...lostRow("b"), status: "queued" }] });
    act(() => void vi.advanceTimersByTime(HEAL_AFTER_MS[0] - 1_000));
    expect(heal).not.toHaveBeenCalled();
    act(() => void vi.advanceTimersByTime(1_000));
    expect(heal).toHaveBeenCalledWith(["a"]);
  });

  it("goes with the owner: nothing is asked after it unmounts", () => {
    const { heal, unmount } = mount([lostRow("a")]);
    unmount();
    act(() => void vi.advanceTimersByTime(HEAL_AFTER_MS[2]));
    expect(heal).not.toHaveBeenCalled();
  });
});

describe("★ when the line is back, or the page is looked at again", () => {
  it("asks at once when the browser says it is online, and never twice inside a few seconds", () => {
    const { heal } = mount([lostRow("a")]);
    act(() => {
      window.dispatchEvent(new Event("online"));
    });
    expect(heal).toHaveBeenCalledTimes(1);
    expect(heal).toHaveBeenCalledWith(["a"]);
    // A line that flaps fires `online` again at once: that is not a second set of asks.
    act(() => {
      window.dispatchEvent(new Event("online"));
    });
    expect(heal).toHaveBeenCalledTimes(1);
  });

  it("asks when the page comes back to the screen, not when it leaves", () => {
    const { heal } = mount([lostRow("a")]);
    const visibility = vi.spyOn(document, "visibilityState", "get");
    visibility.mockReturnValue("hidden");
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(heal).not.toHaveBeenCalled();
    visibility.mockReturnValue("visible");
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(heal).toHaveBeenCalledTimes(1);
    visibility.mockRestore();
  });

  it("asks nothing when nothing is in doubt", () => {
    const { heal } = mount([
      { ...lostRow("a"), status: "done", cause: undefined },
    ]);
    act(() => {
      window.dispatchEvent(new Event("online"));
    });
    expect(heal).not.toHaveBeenCalled();
  });

  it("lets go of its listeners with the owner", () => {
    const { heal, unmount } = mount([lostRow("a")]);
    unmount();
    act(() => {
      window.dispatchEvent(new Event("online"));
    });
    expect(heal).not.toHaveBeenCalled();
  });
});
