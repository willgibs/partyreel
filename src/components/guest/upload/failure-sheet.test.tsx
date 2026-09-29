import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { UploadFailureSheet } from "@/components/guest/upload/failure-sheet";

/**
 * WHAT A GUEST READS WHEN SOMETHING WILL NOT GO. A guest should never have to
 * check their upload cards to learn whether everything made it (a failure there
 * is easy to miss), so a failure is brought up clearly, in one place.
 *
 * FUNCTION ONLY, and the function is: every refused file is NAMED, its reason is
 * the SERVER's own sentence rather than a house paraphrase, and every one of
 * them is one tap from going again. The words in the header and the order of the
 * buttons are not pinned. WHEN the sheet opens (the end of a run, once) belongs to
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
  // Defaults to a fully-failed run (nothing this file pins the exact heading
  // words against — see the note above — so any value that keeps `sent >=
  // failures.length` is a fine stand-in).
  sent = failures.length,
) => {
  render(
    <UploadFailureSheet
      open
      onOpenChange={onOpenChange}
      failures={failures}
      sent={sent}
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
    fireEvent.click(screen.getByRole("button", { name: /Retry both/ }));
    expect(onRetry.mock.calls.map(([id]) => id)).toEqual(["a.jpg", "b.jpg"]);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("offers ONE retry when one file failed, never two for the same act", () => {
    // The lone failure's per-row button is the one hidden for count===1
    // (the doc comment's "a second button for the same act is furniture"),
    // and the primary shares its word ("Retry") — so exactly one renders,
    // never a "Retry" and a redundant second beside it.
    const { onRetry } = mount([failure("a.jpg")]);
    expect(screen.getAllByRole("button", { name: "Retry" })).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalledWith("a.jpg");
  });

  it("has a way out that is not the retry", () => {
    const { onOpenChange, onRetry } = mount([failure("a.jpg")]);
    fireEvent.click(screen.getByRole("button", { name: "Not now" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onRetry).not.toHaveBeenCalled();
  });
});

describe("the link at the moment of trouble", () => {
  // help-center r1 `from-product=contextual`: the sheet a guest is already reading links to the
  // article that answers it, in a NEW TAB, because the files she can retry live in this page.
  it("links to what stops an upload, in a new tab", () => {
    mount([failure("IMG_1.jpg"), failure("IMG_2.jpg")]);
    const link = screen.getByRole("link", { name: "What stops an upload" });
    expect(link).toHaveAttribute("href", "/help/an-upload-wont-finish");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });
});
