/**
 * THE DOOR'S THIRD STEP. What is pinned here is the part of it that has no exit: a guest standing
 * at this step cannot close the sheet, so every way a run can end has to leave them somewhere they
 * can act. The refusal ladder is the whole of that decision, and it is pure, so it is pinned twice:
 * once as the function, once as the surface.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  UploadStep,
  classifyRun,
  uploadBarPercent,
  uploadStepChooseAgain,
  uploadStepReason,
} from "@/components/guest/upload-step";
import { type WaitClock, waitRule } from "@/lib/disposable/wait-words";
// The ladder's one home since build 23's NIT-2, which the album's failure sheet reads too.
import { classifyRefusal } from "@/lib/guest/upload-refusal";
import type { QueueItem } from "@/lib/guest/use-upload-queue";

function item(over: Partial<QueueItem> = {}): QueueItem {
  return {
    id: over.id ?? "q1",
    file: new File([new Uint8Array([1])], over.file?.name ?? "p.jpg", {
      type: "image/jpeg",
    }),
    kind: "photo",
    status: "error",
    progress: 0,
    ...over,
  };
}

function mount(props?: Partial<React.ComponentProps<typeof UploadStep>>) {
  const onSend = vi.fn();
  const onRetry = vi.fn();
  const onDismiss = vi.fn();
  const onContinueWithout = vi.fn();
  const utils = render(
    <UploadStep
      isDemo={false}
      requireUpload={false}
      albumEmpty={false}
      queue={[]}
      onSend={onSend}
      onRetry={onRetry}
      onDismiss={onDismiss}
      onContinueWithout={onContinueWithout}
      {...props}
    />,
  );
  return { ...utils, onSend, onRetry, onDismiss, onContinueWithout };
}

describe("the refusal ladder", () => {
  it("routes the four classes the step can act on", () => {
    // The event changed under the guest: only the server can answer.
    for (const code of [
      "uploads_closed",
      "cap_reached",
      "event_gone",
      "event_deleted",
      "unlock_required",
    ]) {
      expect(classifyRefusal(code)).toBe("refresh");
    }
    // The capability is dead: never a Retry inside a sheet with no exit.
    expect(classifyRefusal("invalid_session")).toBe("session");
    // The host flipped the other switch mid-run: the email step is the way in.
    expect(classifyRefusal("verification_required")).toBe("verify");
    // The file itself is the problem, so only a different file can help.
    for (const code of ["video_not_allowed", "unsupported_type", "too_large"]) {
      expect(classifyRefusal(code)).toBe("choose");
    }
    // Transport, R2, a bad key, no code at all: worth another go.
    expect(classifyRefusal("complete_failed")).toBe("retry");
    expect(classifyRefusal(undefined)).toBe("retry");
  });

  it("a RUN is only unfixable when EVERY refusal in it is", () => {
    expect(classifyRun([item({ errorCode: "cap_reached" })])).toBe("refresh");
    // One retryable file among them means the run is not stuck.
    expect(
      classifyRun([
        item({ id: "a", errorCode: "cap_reached" }),
        item({ id: "b", errorCode: "complete_failed" }),
      ]),
    ).toBe("retry");
    // A dead session and a flipped switch outrank everything: they are the SESSION's problem.
    expect(
      classifyRun([
        item({ id: "a", errorCode: "cap_reached" }),
        item({ id: "b", errorCode: "invalid_session" }),
      ]),
    ).toBe("session");
    expect(
      classifyRun([
        item({ id: "a", errorCode: "invalid_session" }),
        item({ id: "b", errorCode: "verification_required" }),
      ]),
    ).toBe("verify");
  });
});

describe("the step's one sentence", () => {
  const base = { isDemo: false, albumEmpty: false };

  it("promises the album opens ONLY where the host requires an upload (an OFF album is already open)", () => {
    for (const albumEmpty of [false, true]) {
      expect(
        uploadStepReason({ ...base, albumEmpty, requireUpload: true }),
      ).toMatch(/the album opens/);
      expect(
        uploadStepReason({ ...base, albumEmpty, requireUpload: false }),
      ).not.toMatch(/album opens/);
    }
    expect(uploadStepChooseAgain(true)).toMatch(/the album opens/);
    expect(uploadStepChooseAgain(false)).not.toMatch(/album opens/);
  });

  it("differs between the two switch states, and between a full album and an empty one", () => {
    const lines = new Set(
      [true, false].flatMap((requireUpload) =>
        [true, false].map((albumEmpty) =>
          uploadStepReason({ ...base, requireUpload, albumEmpty }),
        ),
      ),
    );
    expect(lines.size).toBe(4);
  });

  it("ON never names the host", () => {
    // ★ The line says "The host has asked..." so a long host name can never break the design.
    // There is no hostName input at all.
    expect(uploadStepReason({ ...base, requireUpload: true })).toBe(
      "The host has asked everyone to add a photo before the album opens.",
    );
  });

  it("the demo says what it is instead, whatever the switches read", () => {
    expect(
      uploadStepReason({ ...base, isDemo: true, requireUpload: true }),
    ).toBe("Add a photo the way a guest would. Nothing you add is saved.");
  });
});

/**
 * ★ OVER AN ALBUM THAT WAITS, THE DOOR SAYS WHAT WAITS (crumbs-72). Behind "A photo first" a newcomer stands at
 * `teaser`, where the page never reads whether photos wait, so an album showing nothing read "Nothing here yet. Add the
 * first photo and the album opens." even over photos nobody could see yet. The door knows how uploads wait on the album
 * at every level, which is true over an empty album and over one whose photos wait alike, and says it in the wait's
 * own rule (`waitRule`: one home), never naming the host.
 */
describe("the step over an album that waits", () => {
  const base = { isDemo: false, requireUpload: true, albumEmpty: true };
  const DEVELOP: WaitClock = {
    kind: "develop",
    developsAt: "2026-10-03T16:00:00.000Z",
  };
  const HELD: WaitClock = { kind: "held", hostName: null };
  const NOW = Date.parse("2026-10-02T20:00:00Z");

  it("★ says how uploads wait, in the wait's own rule, where nothing shows behind A photo first", () => {
    expect(uploadStepReason({ ...base, wait: HELD })).toBe(
      "Uploads develop as the host lets each one in. Add yours and the album opens.",
    );
    expect(uploadStepReason({ ...base, wait: DEVELOP })).toBe(
      "Uploads develop all at once. Add yours and the album opens.",
    );
    // The develop time is said in her own clock once it is known, by the same rule the sheet and her tracker read.
    expect(uploadStepReason({ ...base, wait: DEVELOP, nowMs: NOW })).toBe(
      `${waitRule(DEVELOP, NOW)} Add yours and the album opens.`,
    );
    expect(waitRule(DEVELOP, NOW)).not.toBe(waitRule(DEVELOP, null));
  });

  it("never says 'the first photo' or 'nothing here' over an album that waits, and never names the host", () => {
    for (const wait of [
      HELD,
      DEVELOP,
      { kind: "held", hostName: "Maya" },
    ] as const) {
      const line = uploadStepReason({ ...base, wait });
      expect(line).not.toMatch(/first photo|Nothing here/);
      expect(line).not.toMatch(/Maya/);
      expect(line).toMatch(/the album opens/);
    }
  });

  it("changes nothing where the album shows photos, the host asked for none, or it is the demo", () => {
    expect(
      uploadStepReason({ ...base, albumEmpty: false, wait: DEVELOP }),
    ).toBe(
      "The host has asked everyone to add a photo before the album opens.",
    );
    expect(
      uploadStepReason({ ...base, requireUpload: false, wait: DEVELOP }),
    ).toBe("Nothing here yet. Add the first photo.");
    expect(uploadStepReason({ ...base, isDemo: true, wait: DEVELOP })).toBe(
      "Add a photo the way a guest would. Nothing you add is saved.",
    );
    // And an album that holds nothing back still asks for its first photograph.
    expect(uploadStepReason({ ...base, wait: null })).toBe(
      "Nothing here yet. Add the first photo and the album opens.",
    );
  });

  describe("on the surface", () => {
    beforeEach(() => {
      vi.useFakeTimers({ toFake: ["Date"] });
      vi.setSystemTime(NOW);
    });
    afterEach(() => vi.useRealTimers());

    it("★ the door's sentence is the wait's rule, with the develop time in her own clock", () => {
      mount({ requireUpload: true, albumEmpty: true, wait: DEVELOP });
      expect(
        screen.getByText(
          `${waitRule(DEVELOP, NOW)} Add yours and the album opens.`,
        ),
      ).toBeInTheDocument();
      expect(screen.queryByText(/first photo/)).toBeNull();
    });

    it("an album that holds nothing back keeps its own first-photo line", () => {
      mount({ requireUpload: true, albumEmpty: true });
      expect(
        screen.getByText(
          "Nothing here yet. Add the first photo and the album opens.",
        ),
      ).toBeInTheDocument();
    });
  });
});

/**
 * ★ THE FAILURE HEADING COUNTS THE RUN'S OWN FILES (crumbs-76; ROADMAP: "a Retry that fails again, or a slot mounted
 * mid-run, reads '1 of 0 didn't upload'"). The step's "SENT" was the queue's length less a baseline taken at the run's
 * start, and its own Retry adds no item: counted that way a failure that failed again read "1 of 0".
 */
describe("the failure heading", () => {
  const step = (queue: QueueItem[]) => (
    <UploadStep
      isDemo={false}
      requireUpload={false}
      albumEmpty={false}
      queue={queue}
      onSend={vi.fn()}
      onRetry={vi.fn()}
      onDismiss={vi.fn()}
      onContinueWithout={vi.fn()}
    />
  );

  it("★ a Retry in place that fails again reads the run it was, never '1 of 0'", () => {
    const view = render(step([item({ id: "a" })]));
    expect(screen.getByText("1 of 1 didn't upload")).toBeInTheDocument();
    // Retry: the very item goes up again (no item is added), and fails again.
    view.rerender(step([item({ id: "a", status: "queued" })]));
    view.rerender(step([item({ id: "a" })]));
    expect(screen.getByText("1 of 1 didn't upload")).toBeInTheDocument();
  });

  it("★ a step that mounts mid-run reads the whole run it ends with", () => {
    const view = render(
      step([
        item({ id: "a", status: "done", progress: 100 }),
        item({ id: "b", status: "uploading", progress: 30 }),
        item({ id: "c", status: "queued" }),
      ]),
    );
    view.rerender(
      step([
        item({ id: "a", status: "done", progress: 100 }),
        item({ id: "b" }),
        item({ id: "c" }),
      ]),
    );
    expect(screen.getByText("2 of 3 didn't upload")).toBeInTheDocument();
  });

  it("counts the run it ends and leaves out what an earlier run landed", () => {
    const view = render(
      step([item({ id: "old", status: "done", progress: 100 })]),
    );
    view.rerender(
      step([
        item({ id: "old", status: "done", progress: 100 }),
        item({ id: "x", status: "queued" }),
        item({ id: "y", status: "queued" }),
      ]),
    );
    view.rerender(
      step([
        item({ id: "old", status: "done", progress: 100 }),
        item({ id: "x" }),
        item({ id: "y" }),
      ]),
    );
    expect(screen.getByText("2 of 2 didn't upload")).toBeInTheDocument();
  });
});

/**
 * ★ A CAMERA ALBUM'S FIRST PHOTOGRAPH IS THE ALBUM'S CAMERA, NEVER THE LIBRARY (crumbs-76; ROADMAP: "on a camera album the
 * door's first-photo step still offers Take a photo and Choose from your album, so a library photo reaches the roll").
 * The album's own Add opens its camera in place of the add sheet and offers no library; this step shared that sheet's
 * body and did. Its one primary opens the camera the door holds (`camera.onOpen`), and nothing asks for a file.
 */
describe("on an album whose host chose the camera", () => {
  const onOpen = vi.fn();
  const camera = { onOpen };

  it("★ offers the camera alone: one primary that opens it, and no picker of any kind", () => {
    const { container } = mount({ camera });
    fireEvent.click(screen.getByRole("button", { name: "Take a photo" }));
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(
      screen.queryByRole("button", { name: "Choose from your album" }),
    ).toBeNull();
    expect(container.querySelector('input[type="file"]')).toBeNull();
    // The facts of the library act (its kinds and its cap) are not said where the library is not offered.
    expect(container.querySelector("[data-upload-terms]")).toBeNull();
  });

  it("asks in the camera's verb, as the album's own Add does", () => {
    mount({ camera });
    expect(screen.getByText("Take your photos")).toBeInTheDocument();
    expect(screen.queryByText("Add your photos")).toBeNull();
    expect(
      screen.getByText("Take one now, or look around first."),
    ).toBeInTheDocument();
    expect(
      uploadStepReason({
        isDemo: false,
        requireUpload: true,
        albumEmpty: true,
        camera: true,
      }),
    ).toBe("Nothing here yet. Take the first photo and the album opens.");
    expect(
      uploadStepReason({
        isDemo: false,
        requireUpload: true,
        albumEmpty: false,
        camera: true,
      }),
    ).toBe(
      "The host has asked everyone to take a photo before the album opens.",
    );
    expect(
      uploadStepReason({
        isDemo: false,
        requireUpload: false,
        albumEmpty: true,
        camera: true,
      }),
    ).toBe("Nothing here yet. Take the first photo.");
    expect(uploadStepChooseAgain(true, true)).toBe(
      "Take another and the album opens.",
    );
    expect(uploadStepChooseAgain(false, true)).toBe("Take another to add one.");
    // A free-upload album says what it always said.
    expect(
      uploadStepReason({
        isDemo: false,
        requireUpload: true,
        albumEmpty: true,
      }),
    ).toBe("Nothing here yet. Add the first photo and the album opens.");
  });

  it("keeps its skip under the camera's primary where the host asked for none", () => {
    mount({ camera, onSkip: vi.fn() });
    expect(
      screen.getByRole("button", { name: "Skip for now" }),
    ).toBeInTheDocument();
  });

  it("the failure view takes another photograph, and clears what failed", () => {
    const { onDismiss } = mount({
      camera,
      queue: [
        item({
          id: "q9",
          errorCode: "invalid_image",
          error: "That photo could not be read.",
        }),
      ],
    });
    expect(
      screen.queryByRole("button", { name: "Choose other photos" }),
    ).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Take another photo" }));
    expect(onDismiss).toHaveBeenCalledWith(["q9"]);
  });

  it("is a free-upload album's step where there is none: the two rows, the picker, the terms", () => {
    const { container } = mount({ camera: null });
    expect(
      screen.getByRole("button", { name: "Choose from your album" }),
    ).toBeInTheDocument();
    expect(
      container.querySelector('input[type="file"][multiple]'),
    ).not.toBeNull();
    expect(container.querySelector("[data-upload-terms]")).not.toBeNull();
  });
});

describe("the surface", () => {
  it("offers the two named acts, and Send hands the picks up", () => {
    const { container, onSend } = mount();
    expect(
      screen.getByRole("button", { name: "Take a photo" }),
    ).toBeInTheDocument();
    const album = container.querySelector(
      'input[type="file"][multiple]',
    ) as HTMLInputElement;
    const file = new File([new Uint8Array([1])], "p.jpg", {
      type: "image/jpeg",
    });
    fireEvent.change(album, { target: { files: [file] } });
    fireEvent.click(screen.getByRole("button", { name: "Send 1" }));
    expect(onSend).toHaveBeenCalledWith([file]);
  });

  it("shows a progress strip per pick while a run is going, and no picker", () => {
    const { container } = mount({
      queue: [
        item({ id: "a", status: "uploading", progress: 40 }),
        item({ id: "b", status: "queued", progress: 0 }),
      ],
    });
    expect(screen.getByText("Sending your photos")).toBeInTheDocument();
    expect(container.querySelectorAll("[data-upload-progress]")).toHaveLength(
      2,
    );
    expect(
      screen.queryByRole("button", { name: "Take a photo" }),
    ).not.toBeInTheDocument();
  });

  it("★ each bar fills as its bytes go: the queue's 0 to 100 is a percent, never a fraction", () => {
    const { container } = mount({
      queue: [
        item({ id: "a", status: "uploading", progress: 1 }),
        item({ id: "b", status: "uploading", progress: 40 }),
        item({ id: "c", status: "queued", progress: 0 }),
        // Its bytes are up and it waits to be recorded with its burst (`queued` at 100).
        item({ id: "d", status: "queued", progress: 100 }),
        item({ id: "e", status: "done", progress: 100 }),
      ],
    });
    const widths = [
      ...container.querySelectorAll<HTMLElement>("[data-upload-progress] > *"),
    ].map((bar) => bar.style.width);
    // One percent in is a sliver (the floor), 40 is 40, a waiting pick shows its sliver, and a landed one is whole.
    expect(widths).toEqual(["4%", "40%", "4%", "100%", "100%"]);
  });

  it("the bar's percent is the progress itself, floored while it waits and capped at whole", () => {
    expect(uploadBarPercent({ status: "uploading", progress: 62 })).toBe(62);
    expect(uploadBarPercent({ status: "uploading", progress: 0 })).toBe(4);
    expect(uploadBarPercent({ status: "queued", progress: 100 })).toBe(100);
    expect(uploadBarPercent({ status: "uploading", progress: 140 })).toBe(100);
    expect(uploadBarPercent({ status: "done", progress: 0 })).toBe(100);
  });

  it("the OFF skip is offered once, and never ON", () => {
    mount({ onSkip: vi.fn() });
    expect(
      screen.getByRole("button", { name: "Skip for now" }),
    ).toBeInTheDocument();
    mount({ requireUpload: true });
    expect(
      screen.queryAllByRole("button", { name: "Skip for now" }),
    ).toHaveLength(1); // the first mount's, still on screen
  });

  it("the demo's skip says Look around", () => {
    mount({ isDemo: true, onSkip: vi.fn() });
    expect(
      screen.getByRole("button", { name: "Look around" }),
    ).toBeInTheDocument();
  });

  it("THE FAIL-OPEN: an unfixable run shows the server's own sentence and refreshes", () => {
    const { onContinueWithout } = mount({
      requireUpload: true,
      queue: [
        item({
          errorCode: "cap_reached",
          error: "This album is full right now.",
        }),
      ],
    });
    expect(
      screen.getByText("This album is full right now."),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Continue without adding" }),
    );
    expect(onContinueWithout).toHaveBeenCalled();
  });

  it("the failure view never carries the soft skip, even OFF", () => {
    mount({
      onSkip: vi.fn(),
      queue: [item({ errorCode: "cap_reached", error: "Uploads are closed." })],
    });
    expect(
      screen.queryByRole("button", { name: "Skip for now" }),
    ).not.toBeInTheDocument();
  });

  it("an OFF door's failure line promises nothing it cannot keep", () => {
    mount({
      queue: [item({ errorCode: "too_large", error: "Too large." })],
    });
    expect(screen.queryByText(/album opens/)).not.toBeInTheDocument();
  });

  it("a file the guest can do nothing about offers another file, never a Retry", () => {
    mount({
      queue: [
        item({
          errorCode: "video_not_allowed",
          error: "Videos aren't available.",
        }),
      ],
    });
    expect(
      screen.queryByRole("button", { name: "Retry" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Choose other photos" }),
    ).toBeInTheDocument();
  });

  it("★ names each file refused for itself and its reason, as the failure sheet does, with no Retry on any (red-team 54b's LOW)", () => {
    const named = (name: string, type: string) =>
      new File([new Uint8Array([1])], name, { type });
    mount({
      queue: [
        item({
          id: "a",
          file: named("party.gif", "image/gif"),
          errorCode: "unsupported_type",
          error: "That file type isn't supported.",
        }),
        item({
          id: "b",
          file: named("huge.mp4", "video/mp4"),
          errorCode: "too_large",
          error: "This file is larger than the 10 GB maximum.",
        }),
      ],
    });
    // The run's own heading and the way on, and under them each file with the sentence that refused it.
    expect(screen.getByText("2 of 2 didn't upload")).toBeInTheDocument();
    expect(screen.getByText("Pick something else to add.")).toBeInTheDocument();
    expect(screen.getByText("party.gif")).toBeInTheDocument();
    expect(
      screen.getByText("That file type isn't supported."),
    ).toBeInTheDocument();
    expect(screen.getByText("huge.mp4")).toBeInTheDocument();
    expect(
      screen.getByText("This file is larger than the 10 GB maximum."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Retry/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Choose other photos" }),
    ).toBeInTheDocument();
  });

  it("Choose other photos drops the failures so the next pass starts clean", () => {
    const { onDismiss } = mount({
      queue: [item({ id: "q9", errorCode: "too_large", error: "Too large." })],
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Choose other photos" }),
    );
    expect(onDismiss).toHaveBeenCalledWith(["q9"]);
  });
});
