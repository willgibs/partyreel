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
 * them a retry could land is one tap from going again. The words in the header and
 * the order of the buttons are not pinned. WHEN the sheet opens (the end of a run,
 * once) belongs to the engine and is pinned in `guest-upload.test.tsx`.
 *
 * ★ RESHAPED ON PURPOSE (crumbs-17, build 23's NIT-2; scar kept: a failure a retry
 * could land is one tap from going again): "every one of them is one tap from going
 * again" offered Retry for "This event accepts photos only", which no retry can pass.
 * A refusal of the file itself now stands with its sentence and no Retry.
 */
const failure = (name: string, error?: string, code?: string) => ({
  id: name,
  file: new File([new Uint8Array([1])], name, { type: "image/jpeg" }),
  error,
  code,
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

describe("a Retry only where a retry could pass (build 23's NIT-2)", () => {
  it("★ a refusal of the file itself stands with its sentence, and no Retry", () => {
    const { onOpenChange } = mount([
      failure(
        "clip.mp4",
        "This event accepts photos only.",
        "video_not_allowed",
      ),
    ]);
    expect(
      screen.getByText("This event accepts photos only."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Retry/ })).toBeNull();
    // "Not now" would promise a later go there is none of.
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("in a mixed run, Retry takes only what could go", () => {
    const { onRetry } = mount([
      failure("a.jpg", "That upload did not finish."),
      failure(
        "clip.mp4",
        "This event accepts photos only.",
        "video_not_allowed",
      ),
      failure("b.jpg", undefined, "complete_failed"),
    ]);
    // Two could go, so the primary says both, and each of the two keeps its own.
    fireEvent.click(screen.getByRole("button", { name: /Retry both/ }));
    expect(onRetry.mock.calls.map(([id]) => id)).toEqual(["a.jpg", "b.jpg"]);
    const clipLine = screen.getByText("clip.mp4").closest("li")!;
    expect(clipLine.querySelector("button")).toBeNull();
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

/**
 * ★ WHAT IT SAYS OF THE REST IS TRUE WHERE IT IS SAID (red-team 44's LOW, and 43's before it): "Everything else is in
 * Maya's album." stood over a run on an album whose uploads wait, where nothing of hers is in the album until it
 * develops or the host lets it in. There it says what is true in her uploads' own words, the develop's time in the one
 * format the keep and her tracker say it in; an album that shows uploads at once keeps its line byte for byte.
 */
describe("what it says of everything else", () => {
  const AT = "2026-10-04T02:00:00.000Z";
  const sheet = (waits?: { waits: boolean; developsAt: string | null }) =>
    render(
      <UploadFailureSheet
        open
        onOpenChange={vi.fn()}
        failures={[failure("a.jpg", "This event isn't accepting uploads.")]}
        sent={3}
        hostName="Maya"
        onRetry={vi.fn()}
        waits={waits}
      />,
    );

  it("says the rest is in the host's album where what she adds shows at once", () => {
    sheet({ waits: false, developsAt: null });
    expect(
      screen.getByText("Everything else is in Maya’s album."),
    ).toBeInTheDocument();
  });

  it("says the same with no reading handed (an album that shows uploads at once)", () => {
    sheet();
    expect(
      screen.getByText("Everything else is in Maya’s album."),
    ).toBeInTheDocument();
  });

  // RESHAPED (the-wait r1, `model=time`): the rest said "is waiting to develop" and "is waiting for approval"; every
  // wait develops now, the clock telling them apart. The scar kept: never "in Maya's album" for what waits.
  it("★ says the rest develops with everyone's, and when, on an album with a develop time ahead", () => {
    sheet({ waits: true, developsAt: AT });
    expect(
      screen.getByText(/^Everything else develops with everyone's/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/album\.$/)).toBeNull();
  });

  it("★ says the rest develops as the host lets it in, where she approves each", () => {
    sheet({ waits: true, developsAt: null });
    expect(
      screen.getByText("Everything else develops as Maya lets it in."),
    ).toBeInTheDocument();
    expect(screen.queryByText(/in Maya’s album/)).toBeNull();
  });
});
