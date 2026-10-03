/**
 * A CAMERA SHOT'S STATUS IS THE QUEUE ITEM HOLDING ITS VERY FILE, and what a refusal means to the camera is its code's.
 */
import { describe, expect, it } from "vitest";

import type { QueueItem } from "@/lib/guest/use-upload-queue";

import {
  inFlight,
  pendingSince,
  refusalOf,
  shotState,
  type CameraShot,
} from "./shots";

const file = (name = "shot.jpg") =>
  new File([new Uint8Array([1])], name, { type: "image/jpeg" });

function item(f: File, patch: Partial<QueueItem>): QueueItem {
  return {
    id: "q1",
    file: f,
    kind: "photo",
    status: "queued",
    progress: 0,
    ...patch,
  };
}

describe("shotState", () => {
  it("is taking while its frame encodes, sending before the queue holds it", () => {
    expect(shotState({ file: null }, [])).toEqual({ status: "taking" });
    expect(shotState({ file: file() }, [])).toEqual({ status: "sending" });
  });

  it("finds its queue item by the File itself, never by a name", () => {
    const mine = file("shot-1.jpg");
    const twin = file("shot-1.jpg");
    const queue = [
      item(twin, { id: "other", status: "error", error: "nope" }),
      item(mine, { id: "q-mine", status: "uploading" }),
    ];
    expect(shotState({ file: mine }, queue)).toEqual({
      status: "sending",
      queueId: "q-mine",
    });
  });

  it("reads a landing as the album holds it: in, sealed until the develop, or held for the host", () => {
    const f = file();
    const landed = (mediaStatus: string) =>
      shotState({ file: f }, [
        item(f, { status: "done", mediaStatus, mediaId: "m1" }),
      ]);
    expect(landed("approved")).toMatchObject({ status: "in", mediaId: "m1" });
    expect(landed("sealed")).toMatchObject({ status: "sealed", mediaId: "m1" });
    expect(landed("pending")).toMatchObject({ status: "held", mediaId: "m1" });
  });

  it("carries a refusal's sentence and code as the server said them", () => {
    const f = file();
    expect(
      shotState({ file: f }, [
        item(f, {
          status: "error",
          error: "You've taken all 24 shots on your roll.",
          errorCode: "roll_spent",
        }),
      ]),
    ).toEqual({
      status: "failed",
      queueId: "q1",
      error: "You've taken all 24 shots on your roll.",
      code: "roll_spent",
    });
  });

  it("is in flight while taking or sending, and only then", () => {
    expect(inFlight({ status: "taking" })).toBe(true);
    expect(inFlight({ status: "sending" })).toBe(true);
    for (const status of ["in", "sealed", "held", "failed"] as const) {
      expect(inFlight({ status })).toBe(false);
    }
  });
});

describe("refusalOf", () => {
  it("ends the roll on the roll's own code", () => {
    expect(refusalOf("roll_spent")).toBe("roll");
  });
  it("stops the shutter when the album itself refuses", () => {
    for (const code of [
      "uploads_closed",
      "cap_reached",
      "unauthorized",
      "verification_required",
      "invalid_session",
      "session_other_account",
      "unlock_required",
      "event_gone",
    ]) {
      expect(refusalOf(code)).toBe("blocked");
    }
  });
  it("keeps a refusal of the file to that shot", () => {
    for (const code of ["too_long", "too_large", "video_not_allowed"]) {
      expect(refusalOf(code)).toBe("file");
    }
  });
  it("offers another go for anything else (a dropped connection has no code)", () => {
    expect(refusalOf(undefined)).toBe("retry");
    expect(refusalOf("complete_failed")).toBe("retry");
  });
});

describe("pendingSince", () => {
  const shot = (takenAt: number, retriedAt?: number): CameraShot => ({
    key: `k${takenAt}`,
    kind: "photo",
    takenAt,
    file: null,
    ...(retriedAt ? { retriedAt } : {}),
  });

  it("counts the shots taken since the read began that the server has not refused", () => {
    const shots = [
      { shot: shot(100), state: { status: "in" as const } },
      { shot: shot(200), state: { status: "sending" as const } },
      { shot: shot(300), state: { status: "failed" as const } },
      { shot: shot(400), state: { status: "taking" as const } },
    ];
    expect(pendingSince(shots, 150)).toBe(2);
    expect(pendingSince(shots, 0)).toBe(3);
  });

  it("counts a shot sent again from when it was sent again", () => {
    const shots = [
      { shot: shot(100, 500), state: { status: "sending" as const } },
    ];
    expect(pendingSince(shots, 300)).toBe(1);
  });
});
