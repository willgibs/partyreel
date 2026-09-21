// @contract-for: src/components/guest/upload/failure-sheet.tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { UploadFailureSheet } from "@/components/guest/upload/failure-sheet";

/**
 * WHAT A GUEST READS WHEN SOMETHING WILL NOT GO (Will, `failed=sheet`,
 * 2026-09-21: "Don't want users to have to check the cards of their uploads to
 * ensure everything made it, very easy to miss. An upload failure should be
 * bubbled up clearly.").
 *
 * FUNCTION ONLY, and the function is: every refused file is NAMED, its reason is
 * the SERVER's own sentence rather than a house paraphrase, and every one of
 * them is one tap from going again. The words in the header and the order of the
 * buttons are Will's. WHEN the sheet opens (the end of a run, once) belongs to
 * the engine and is pinned in `guest-upload.test.tsx`.
 */
const failure = (name: string, error?: string) => ({
  id: name,
  file: new File([new Uint8Array([1])], name, { type: "image/jpeg" }),
  error,
});

const mount = (
  failures: ReturnType<typeof failure>[],
  onRetry = vi.fn(),
  onOpenChange = vi.fn(),
) => {
  render(
    <UploadFailureSheet
      open
      onOpenChange={onOpenChange}
      failures={failures}
      hostName="Maya"
      onRetry={onRetry}
    />,
  );
  return { onRetry, onOpenChange };
};

describe("every refusal is named, with the server's own reason", () => {
  it("draws one line per file", () => {
    mount([
      failure("a.jpg", "Files for this event are capped at 500 MB."),
      failure("b.mov", "This album is full right now."),
    ]);
    expect(
      document.querySelectorAll("[data-upload-failures] > li"),
    ).toHaveLength(2);
    expect(screen.getByText("a.jpg")).toBeInTheDocument();
    expect(
      screen.getByText("Files for this event are capped at 500 MB."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("This album is full right now."),
    ).toBeInTheDocument();
  });

  it("still says something when the failure arrived without words", () => {
    // A rejected fetch has no server sentence at all, and a blank line under a
    // filename is the one thing worse than a generic one.
    mount([failure("a.jpg")]);
    const line = document.querySelector("[data-upload-failures] > li")!;
    expect(line.textContent).toMatch(/\S/);
    expect(line.textContent).toContain("a.jpg");
  });
});

describe("everything on it is one tap from going again", () => {
  it("retries one line without touching the others", () => {
    const { onRetry } = mount([failure("a.jpg"), failure("b.jpg")]);
    fireEvent.click(screen.getAllByRole("button", { name: "Retry" })[1]);
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onRetry).toHaveBeenCalledWith("b.jpg");
  });

  it("retries all of them at once, and closes behind itself", () => {
    const { onRetry, onOpenChange } = mount([
      failure("a.jpg"),
      failure("b.jpg"),
    ]);
    fireEvent.click(screen.getByRole("button", { name: /Retry all/ }));
    expect(onRetry.mock.calls.map(([id]) => id)).toEqual(["a.jpg", "b.jpg"]);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("offers ONE retry when one file failed, never two for the same act", () => {
    const { onRetry } = mount([failure("a.jpg")]);
    expect(screen.queryByRole("button", { name: "Retry" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Try again/ }));
    expect(onRetry).toHaveBeenCalledWith("a.jpg");
  });

  it("has a way out that is not the retry", () => {
    const { onOpenChange, onRetry } = mount([failure("a.jpg")]);
    fireEvent.click(screen.getByRole("button", { name: "Not now" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onRetry).not.toHaveBeenCalled();
  });
});
