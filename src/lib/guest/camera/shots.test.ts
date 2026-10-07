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

  it("carries the transport's cause beside the sentence, so the camera never matches the words", () => {
    const f = file();
    expect(
      shotState({ file: f }, [
        item(f, {
          status: "error",
          error: "Your connection dropped. Check your signal, then try again.",
          cause: "dropped",
        }),
      ]),
    ).toMatchObject({ status: "failed", cause: "dropped" });
    // An answer that was an error is the server's, not the line's: no cause.
    expect(
      shotState({ file: f }, [
        item(f, {
          status: "error",
          error: "Nope.",
          errorCode: "storage_error",
        }),
      ]).cause,
    ).toBeUndefined();
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

/**
 * ★ A SHOT WAITING FOR THE LINE IS ON ITS WAY, AND COUNTED (no-signal r1, Will's `roll=taken`): its send dropped and the
 * queue holds it standing by (`queued`, its cause kept), so it is `sending` and `waiting`, never `failed`, and the count
 * since the roll's last read keeps it: the shutter spent its frame at the press, like film.
 */
describe("a shot waiting for the line", () => {
  it("★ is sending, waiting, still in flight, and never failed", () => {
    const f = file();
    const state = shotState({ file: f }, [
      item(f, { id: "q-w", status: "queued", cause: "dropped" }),
    ]);
    expect(state).toEqual({ status: "sending", queueId: "q-w", waiting: true });
    expect(inFlight(state)).toBe(true);
  });

  it("★ stays counted on the roll, where a shot refused for a reason of its own leaves it", () => {
    const f1 = file("a.jpg");
    const f2 = file("b.jpg");
    const shots: { shot: CameraShot; state: ReturnType<typeof shotState> }[] = [
      {
        shot: { key: "a", kind: "photo", takenAt: 2_000, file: f1 },
        state: shotState({ file: f1 }, [
          item(f1, { id: "qa", status: "queued", cause: "dropped" }),
        ]),
      },
      {
        shot: { key: "b", kind: "photo", takenAt: 2_000, file: f2 },
        state: shotState({ file: f2 }, [
          item(f2, {
            id: "qb",
            status: "error",
            errorCode: "unsupported_type",
          }),
        ]),
      },
    ];
    expect(pendingSince(shots, 1_000)).toBe(1);
  });

  it("is not waiting once it goes again: the line's return clears its cause", () => {
    const f = file();
    expect(
      shotState({ file: f }, [item(f, { id: "q", status: "uploading" })]),
    ).toEqual({ status: "sending", queueId: "q" });
  });
});
