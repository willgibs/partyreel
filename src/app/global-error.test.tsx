import type { ComponentType } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

/**
 * THE LAST-RESORT SCREEN'S TRY AGAIN ASKS FOR THE PAGE AGAIN TOO (crumbs-30): `global-error` draws when the root
 * layout itself crashed, and its own button called the bare `reset`, which re-rendered the root layout from the
 * payload that had just crashed it. It is `unstable_retry` now (the router's refresh with the reset), and it says so
 * while it asks, as every crash screen's `TryAgain` does (`route-error.test.tsx` pins the rest).
 *
 * ★ A FILE OF ITS OWN, ON PURPOSE: the screen draws `<html>` and `<body>` itself, so it renders as the document, and
 * React registers a document root's click listeners only when that root is the first in the document (an earlier
 * root marks the document for `selectionchange`, and the later one skips its listeners). Alone here, it is first.
 */
vi.mock("@/lib/observability/sentry", () => ({ captureError: vi.fn() }));

const { default: GlobalError } = await import("./global-error");

describe("global-error's Try again", () => {
  it("★ asks for the page again (the router's refresh with the reset), never the bare reset, and says so while it asks", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const reset = vi.fn();
    let finish: () => void = () => {};
    // A retry that holds its transition open, as the router's refresh does until the page lands.
    const retry = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    const props = {
      error: Object.assign(new Error("root layout crashed"), {
        digest: "4242",
      }),
      reset,
      unstable_retry: retry,
    };
    // Drawn as Next draws it: the error, the bare reset and the retry, whatever the screen's own props say.
    const Screen = GlobalError as unknown as ComponentType<typeof props>;
    const { unmount } = render(<Screen {...props} />, {
      container: document as never,
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    });
    expect(retry).toHaveBeenCalledTimes(1);
    expect(reset).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: "Trying again…" }),
    ).toBeDisabled();
    await act(async () => finish());
    expect(screen.getByRole("button", { name: "Try again" })).toBeEnabled();
    unmount();
  });
});
