import type { ComponentType } from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * THE TWO ROOT BOUNDARIES REPORT UNDER THEIR OWN AREAS (crumbs-78). The root `error.tsx` (a crash in a group's own
 * layout, which no group boundary reaches) and `global-error.tsx` (the root layout itself dead) both reported
 * `render:global`, so Sentry told them apart only by the stack. The root's is `render:root` now, and the last
 * resort keeps `render:global` for itself.
 *
 * ★ A FILE OF ITS OWN, AS `global-error.test.tsx` IS: `global-error` draws `<html>` and `<body>`, so it renders as
 * the document, and it goes first here for the same reason (a document root's listeners belong to the first root in
 * the document; this file presses nothing, but the order costs nothing).
 */
const captureError = vi.hoisted(() => vi.fn());
vi.mock("@/lib/observability/sentry", () => ({ captureError }));

type Crash = Error & { digest?: string };
type ScreenProps = {
  error: Crash;
  reset: () => void;
  unstable_retry: () => void;
};

function crash(): Crash {
  return Object.assign(new Error("relation media timed out"), {
    digest: "4242",
  });
}

/** A screen as Next draws it: the error, the boundary's reset and its retry, whatever the screen's own props say. */
function props(error: Crash): ScreenProps {
  return { error, reset: vi.fn(), unstable_retry: vi.fn() };
}

beforeEach(() => {
  captureError.mockClear();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("what each root boundary reports", () => {
  it("★ global-error reports render:global, the root layout's death", async () => {
    const { default: GlobalError } = await import("@/app/global-error");
    const Screen = GlobalError as unknown as ComponentType<ScreenProps>;
    const error = crash();
    const { unmount } = render(<Screen {...props(error)} />, {
      container: document as never,
    });
    expect(captureError).toHaveBeenCalledTimes(1);
    expect(captureError).toHaveBeenCalledWith("render:global", error, {
      digest: "4242",
    });
    unmount();
  });

  it("★ the root error.tsx reports render:root, a group layout's crash, and never render:global", async () => {
    const { default: RootError } = await import("@/app/error");
    const Screen = RootError as unknown as ComponentType<ScreenProps>;
    const error = crash();
    render(<Screen {...props(error)} />);
    expect(captureError).toHaveBeenCalledTimes(1);
    expect(captureError).toHaveBeenCalledWith("render:root", error, {
      digest: "4242",
    });
  });

  it("the root's screen keeps its line that reaches a person", async () => {
    const { default: RootError } = await import("@/app/error");
    const Screen = RootError as unknown as ComponentType<ScreenProps>;
    render(<Screen {...props(crash())} />);
    expect(
      screen.getByRole("link", { name: "Tell us what happened" }),
    ).toHaveAttribute("href", "/contact");
  });
});
