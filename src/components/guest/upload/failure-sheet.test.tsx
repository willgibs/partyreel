import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  UploadFailureSheet,
  type UploadFailure,
} from "@/components/guest/upload/failure-sheet";

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
const failure = (
  name: string,
  error?: string,
  code?: string,
  cause?: UploadFailure["cause"],
) => ({
  id: name,
  file: new File([new Uint8Array([1])], name, { type: "image/jpeg" }),
  error,
  code,
  cause,
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

describe("★ a dropped connection is drawn apart from a refusal (the queue's cause, never its words)", () => {
  it("marks the line's row with the signal's mark and no refusal's, whatever words a refusal carries", () => {
    mount([
      // The words are not the uploader's: the cause alone says it was the line's.
      failure("a.jpg", "The line went quiet.", undefined, "dropped"),
      // A refusal that happens to say the very words of a drop: no cause, so no mark.
      failure(
        "b.jpg",
        "Your connection dropped. Check your signal, then try again.",
        "storage_error",
      ),
      failure("c.mov", "This album is full right now.", "cap_reached"),
    ]);
    const row = (name: string) => screen.getByText(name).closest("li")!;
    expect(row("a.jpg")).toHaveAttribute("data-cause", "dropped");
    expect(row("a.jpg").querySelector("svg.lucide-wifi-off")).not.toBeNull();
    for (const refused of ["b.jpg", "c.mov"]) {
      expect(row(refused)).not.toHaveAttribute("data-cause");
      expect(row(refused).querySelector("svg.lucide-wifi-off")).toBeNull();
    }
    // The mark is a drawing beside the words, never the words: the sentence still reads whole.
    expect(screen.getByText("The line went quiet.")).toBeInTheDocument();
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

/**
 * ★ A RUN THAT FAILED WHOLE HAS NO "EVERYTHING ELSE" TO SAY (crumbs-76; ROADMAP: the sheet "speaks of 'Everything else'
 * when a send failed whole ('1 of 1 didn't upload')"). The line speaks of the rest of the run, and a run that sent only
 * what failed has none: it said the rest was in Maya's album (or developing with everyone's) over a heading that said
 * nothing had gone. It is said where the run sent more than failed, and the dialog is described by it only then.
 */
describe("a run that failed whole", () => {
  const AT = "2026-10-04T02:00:00.000Z";
  const WAITS = [
    undefined,
    { waits: false, developsAt: null },
    { waits: true, developsAt: AT },
    { waits: true, developsAt: null },
  ];
  const sheet = (
    failed: number,
    sent: number,
    waits?: { waits: boolean; developsAt: string | null },
  ) =>
    render(
      <UploadFailureSheet
        open
        onOpenChange={vi.fn()}
        failures={Array.from({ length: failed }, (_, i) =>
          failure(`${i}.jpg`, "This event isn't accepting uploads."),
        )}
        sent={sent}
        hostName="Maya"
        onRetry={vi.fn()}
        waits={waits}
      />,
    );

  it("★ says nothing of the rest, however the album shows what is added", () => {
    for (const waits of WAITS) {
      const { unmount } = sheet(1, 1, waits);
      expect(screen.getByText("1 of 1 didn't upload")).toBeInTheDocument();
      expect(screen.queryByText(/Everything else/)).toBeNull();
      unmount();
    }
    sheet(2, 2);
    expect(screen.getByText("2 of 2 didn't upload")).toBeInTheDocument();
    expect(screen.queryByText(/Everything else/)).toBeNull();
  });

  it("still says it where something else went", () => {
    sheet(1, 3);
    expect(
      screen.getByText("Everything else is in Maya’s album."),
    ).toBeInTheDocument();
  });

  it("describes the dialog by that line only where there is one", () => {
    const whole = sheet(1, 1);
    const wholeDialog = screen.getByRole("dialog");
    expect(wholeDialog).not.toHaveAttribute("aria-describedby");
    whole.unmount();

    sheet(1, 3);
    expect(screen.getByRole("dialog")).toHaveAccessibleDescription(
      "Everything else is in Maya’s album.",
    );
  });
});

/**
 * ★ ONE HEADING SCALE FOR ONE FAILURE (crumbs-76; ROADMAP: the album's sheet "heads with a Sheet's card title" while
 * the same failure in the door's upload step "heads on the door's scale"). The sheet's heading is the door's own
 * (`door/heading.tsx`), and its words are the dialog's title and description themselves: one node each, named once.
 */
describe("the heading", () => {
  it("★ is the door's heading, and names the dialog, once", () => {
    mount(
      [failure("a.jpg", "That upload did not finish.")],
      undefined,
      undefined,
      3,
    );
    const dialog = screen.getByRole("dialog", {
      name: "1 of 3 didn't upload",
    });
    const title = within(dialog).getByText("1 of 3 didn't upload");
    // The door's own heading (the scale lives there, and so does its reveal), not a Sheet's card title.
    expect(title.closest("[data-door-heading]")).not.toBeNull();
    expect(title).toHaveAttribute("data-door-line");
    expect(dialog.querySelector('[data-slot="sheet-title"]')).toBeNull();
    // Said once for the eye and the ear alike: the same words are not hidden in a second copy.
    expect(within(dialog).getAllByText("1 of 3 didn't upload")).toHaveLength(1);
    expect(dialog).toHaveAccessibleDescription(
      "Everything else is in Maya’s album.",
    );
  });
});

/**
 * ★ A REFUSAL THAT CANNOT SUCCEED ON RETRY OFFERS NONE, AND SAYS WHAT SHE CAN DO (red-team 54's LOW: "the failure sheet
 * offers Retry and 'Retry both' on the uploader's own refusals (a wrong type, a file over 10 GB), which carry no code, so
 * pressing Retry sends nothing"). The queue tells those refusals as the codes the ladder knows (`localRefusalCode`), the
 * ladder offers no Retry for them (`retryCanPass`), and where nothing listed can be retried the sheet says the way on:
 * another file, in the door's own words (`uploadStepChooseAgain`).
 */
describe("a failure no retry could pass", () => {
  const WRONG_TYPE = "That file type isn't supported.";
  const wrongType = (name: string) =>
    failure(name, WRONG_TYPE, "unsupported_type");
  const sheet = (
    failures: ReturnType<typeof failure>[],
    sent = failures.length,
    camera = false,
  ) =>
    render(
      <UploadFailureSheet
        open
        onOpenChange={vi.fn()}
        failures={failures}
        sent={sent}
        hostName="Maya"
        camera={camera}
        onRetry={vi.fn()}
      />,
    );

  it("★ offers no Retry, says why in the refusal's own sentence, and says what she can do", () => {
    sheet([wrongType("notes.txt"), wrongType("scan.tiff")]);
    expect(screen.queryByRole("button", { name: /Retry/ })).toBeNull();
    expect(screen.getAllByText(WRONG_TYPE)).toHaveLength(2);
    expect(screen.getByText("Pick something else to add.")).toBeInTheDocument();
    // "Not now" would promise a later go; with nothing a retry could pass there is none.
    expect(screen.getByRole("button", { name: "Done" })).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toHaveAccessibleDescription(
      "Pick something else to add.",
    );
  });

  it("says it in the camera's verb on a camera album", () => {
    sheet([wrongType("clip.avi")], 1, true);
    expect(screen.getByText("Take another to add one.")).toBeInTheDocument();
    expect(screen.queryByText("Pick something else to add.")).toBeNull();
  });

  it("joins it to the rest where something else went, one paragraph", () => {
    sheet([wrongType("notes.txt")], 3);
    expect(
      screen.getByText(
        "Everything else is in Maya’s album. Pick something else to add.",
      ),
    ).toBeInTheDocument();
  });

  it("says nothing of another file where one of the failures could go again, whose Retry stands for it alone", () => {
    const { container } = sheet([
      wrongType("notes.txt"),
      failure("b.jpg", "That upload did not finish."),
    ]);
    expect(screen.queryByText(/Pick something else/)).toBeNull();
    // Retry takes only what could go: one file, so the primary is its Retry and no second one is drawn.
    expect(screen.getAllByRole("button", { name: "Retry" })).toHaveLength(1);
    expect(
      screen.getByText("notes.txt").closest("li")!.querySelector("button"),
    ).toBeNull();
    expect(
      container.ownerDocument.querySelectorAll("[data-upload-failures] > li"),
    ).toHaveLength(2);
  });

  it("is a refusal of the file by whatever code the ladder reads as one, and not one by none", () => {
    sheet([
      failure(
        "too-big.mp4",
        "Files for this event are capped at 500 MB.",
        "too_large",
      ),
    ]);
    expect(screen.queryByRole("button", { name: /Retry/ })).toBeNull();
    expect(screen.getByText("Pick something else to add.")).toBeInTheDocument();
  });
});
