// @contract-for: src/components/guest/upload-step.tsx
/**
 * THE DOOR'S THIRD STEP (Will, 2026-09-21, "the door as three steps"). What is pinned here is the
 * part of it that has no exit: a guest standing at this step cannot close the sheet, so every way
 * a run can end has to leave them somewhere they can act. The refusal ladder is the whole of that
 * decision, and it is pure, so it is pinned twice: once as the function, once as the surface.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  UploadStep,
  classifyRefusal,
  classifyRun,
  uploadStepReason,
} from "@/components/guest/upload-step";
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
      hostName="Maya"
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
  it("is the whole difference between the two switch states", () => {
    const base = { isDemo: false, albumEmpty: false, hostName: "Maya" };
    expect(uploadStepReason({ ...base, requireUpload: false })).toBe(
      "Add one now and the album opens.",
    );
    expect(uploadStepReason({ ...base, requireUpload: true })).toBe(
      "Maya asked everyone to add a photo before the album opens.",
    );
    // An empty album is the same ask worded for the first guest through the door.
    expect(
      uploadStepReason({ ...base, requireUpload: true, albumEmpty: true }),
    ).toBe("Nothing here yet. Add the first photo and the album opens.");
    // The demo says what it is instead, whatever the switches read.
    expect(
      uploadStepReason({ ...base, isDemo: true, requireUpload: true }),
    ).toBe("Add a photo the way a guest would. Nothing you add is saved.");
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
    const file = new File([new Uint8Array([1])], "p.jpg", { type: "image/jpeg" });
    fireEvent.change(album, { target: { files: [file] } });
    fireEvent.click(screen.getByRole("button", { name: "Send 1" }));
    expect(onSend).toHaveBeenCalledWith([file]);
  });

  it("shows a progress strip per pick while a run is going, and no picker", () => {
    const { container } = mount({
      queue: [
        item({ id: "a", status: "uploading", progress: 0.4 }),
        item({ id: "b", status: "queued", progress: 0 }),
      ],
    });
    expect(screen.getByText("Sending your photos")).toBeInTheDocument();
    expect(container.querySelectorAll("[data-upload-progress]")).toHaveLength(2);
    expect(
      screen.queryByRole("button", { name: "Take a photo" }),
    ).not.toBeInTheDocument();
  });

  it("the OFF skip is offered once, and never ON", () => {
    mount({ onSkip: vi.fn() });
    expect(
      screen.getByRole("button", { name: "Skip for now" }),
    ).toBeInTheDocument();
    mount({ requireUpload: true });
    expect(screen.queryAllByRole("button", { name: "Skip for now" })).toHaveLength(
      1,
    ); // the first mount's, still on screen
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
        item({ errorCode: "cap_reached", error: "This album is full right now." }),
      ],
    });
    expect(screen.getByText("This album is full right now.")).toBeInTheDocument();
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

  it("a file the guest can do nothing about offers another file, never a Retry", () => {
    mount({
      queue: [
        item({ errorCode: "video_not_allowed", error: "Videos aren't available." }),
      ],
    });
    expect(
      screen.queryByRole("button", { name: "Try again" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Choose other photos" }),
    ).toBeInTheDocument();
  });

  it("Choose other photos drops the failures so the next pass starts clean", () => {
    const { onDismiss } = mount({
      queue: [item({ id: "q9", errorCode: "too_large", error: "Too large." })],
    });
    fireEvent.click(screen.getByRole("button", { name: "Choose other photos" }));
    expect(onDismiss).toHaveBeenCalledWith(["q9"]);
  });
});
