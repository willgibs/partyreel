/**
 * THE PRODUCT'S UNDO, PINNED BY BEHAVIOUR (host-curation `undo=undo`).
 *
 * The contract a host leans on: the toast names the act in its colour and carries one Undo; the
 * press puts the items back first and only then asks the server; a refusal (or a network failure)
 * takes them away again and says why; a later act's toast replaces the earlier one (one id per
 * surface). Not a duration's value, a class or a colour is pinned.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { showUndoToast, UNDO_WINDOW_MS, type UndoToast } from "./undo-toast";

// This file runs in the unit project, which carries no global sonner stub: the toast is mocked here.
const { mocked } = vi.hoisted(() => ({
  mocked: { success: vi.fn(), warning: vi.fn(), error: vi.fn() },
}));
vi.mock("sonner", () => ({ toast: mocked }));

type ToastOptions = {
  id: string;
  duration: number;
  action: { label: string; onClick: () => void };
};

function lastOptions(tone: "success" | "warning"): ToastOptions {
  const calls = mocked[tone].mock.calls;
  return calls[calls.length - 1][1] as ToastOptions;
}

function toastWith(over: Partial<UndoToast> = {}) {
  const order: string[] = [];
  const t: UndoToast = {
    id: "review-undo",
    message: "Approved 5 photos",
    tone: "success",
    onUndo: vi.fn(() => order.push("onUndo")),
    undo: vi.fn(async () => {
      order.push("undo");
      return { ok: true as const };
    }),
    onUndoFailed: vi.fn(() => order.push("onUndoFailed")),
    onUndone: vi.fn(() => order.push("onUndone")),
    ...over,
  };
  showUndoToast(t);
  return { t, order };
}

const flush = () => new Promise((r) => setTimeout(r, 0));

beforeEach(() => {
  mocked.success.mockReset();
  mocked.warning.mockReset();
  mocked.error.mockReset();
});

describe("the Undo toast", () => {
  it("names the act in its tone, on the surface's one toast, with one Undo", () => {
    toastWith();
    expect(mocked.success).toHaveBeenCalledWith(
      "Approved 5 photos",
      expect.objectContaining({ id: "review-undo" }),
    );
    const options = lastOptions("success");
    expect(options.action.label).toBe("Undo");
    expect(options.duration).toBe(UNDO_WINDOW_MS);

    toastWith({ tone: "warning", message: "Rejected 2 photos" });
    expect(mocked.warning).toHaveBeenCalledWith(
      "Rejected 2 photos",
      expect.objectContaining({ id: "review-undo" }),
    );
  });

  it("puts the items back before it asks the server, then reports the reversal landed", async () => {
    const { order } = toastWith();
    lastOptions("success").action.onClick();
    await flush();
    expect(order).toEqual(["onUndo", "undo", "onUndone"]);
    expect(mocked.error).not.toHaveBeenCalled();
  });

  it("takes them away again, in the server's words, when the reversal is refused", async () => {
    const { t } = toastWith({
      undo: vi.fn(async () => ({
        ok: false as const,
        code: "validation",
        message: "Review is off for this event.",
      })),
    });
    lastOptions("success").action.onClick();
    await flush();
    expect(t.onUndoFailed).toHaveBeenCalledTimes(1);
    expect(t.onUndone).not.toHaveBeenCalled();
    expect(mocked.error).toHaveBeenCalledWith("Review is off for this event.");
  });

  it("takes them away again when the reversal never answers", async () => {
    const { t } = toastWith({
      undo: vi.fn(async () => {
        throw new Error("offline");
      }),
    });
    lastOptions("success").action.onClick();
    await flush();
    expect(t.onUndoFailed).toHaveBeenCalledTimes(1);
    expect(mocked.error).toHaveBeenCalledTimes(1);
  });
});
