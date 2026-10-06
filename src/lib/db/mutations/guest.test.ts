/**
 * THE MINT'S REFUSALS, READ BY THEIR WORDS.
 *
 * `create_guest` raises one SQLSTATE (check_violation) for several different refusals, so
 * `createGuest` tells them apart by message, and its LAST arm reads any refusal it cannot name as
 * `verification_required` (the safest catch-all: "prove an email"). That makes the ORDER load-bearing:
 * the identity contract's "Add your name to upload." must be named ahead of the fallback, or a guest
 * who simply typed no name would be walked to the email step.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

let answer: { data: unknown; error: { code: string; message: string } | null };

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ rpc: () => Promise.resolve(answer) }),
}));

const { createGuest, createMedia, setGuestDisplayName, setGuestPendingEmail } =
  await import("@/lib/db/mutations/guest");

const JOIN = {
  qrToken: "q".repeat(32),
  userId: null,
  unlockProven: false,
  displayName: null,
};

function refused(message: string) {
  answer = { data: null, error: { code: "23514", message } };
}

beforeEach(() => {
  answer = { data: null, error: null };
});

describe("createGuest: each refusal by its own words", () => {
  it("a nameless mint is name_required, never the email step", async () => {
    refused("Add your name to upload.");
    expect(await createGuest(JOIN)).toEqual({
      ok: false,
      code: "name_required",
      message: "Add your name to upload.",
    });
  });

  it("the switch's own refusal is still verification_required", async () => {
    refused("This event requires a verified email to upload.");
    expect(await createGuest(JOIN)).toMatchObject({
      ok: false,
      code: "verification_required",
    });
  });

  it("the other named refusals keep their codes", async () => {
    for (const [message, code] of [
      [
        "This event is locked. Enter the event password to upload.",
        "unlock_required",
      ],
      ["This event is private.", "unauthorized"],
      ["That name is too long.", "name_invalid"],
      ["That email address does not look right.", "email_invalid"],
    ] as const) {
      refused(message);
      expect(await createGuest(JOIN), message).toMatchObject({
        ok: false,
        code,
      });
    }
  });

  it("an unknown event is not_found", async () => {
    answer = {
      data: null,
      error: { code: "P0002", message: "Event not found." },
    };
    expect(await createGuest(JOIN)).toMatchObject({
      ok: false,
      code: "not_found",
    });
  });
});

/**
 * ★ THE SNEAKY BLOCK'S REFUSAL (migration 20260928120000): a ticket a block holds is refused by the
 * three writes in the private album's own words, and each maps it to the private album's own answer
 * (`unauthorized`, "This event is private."), ahead of every other refusal, so a guest can never
 * tell a block from a private album by what a write says.
 */
describe("a blocked ticket's write reads as a private album's", () => {
  const PRIVATE = {
    ok: false,
    code: "unauthorized",
    message: "This event is private.",
  };

  it("the name, the email and the upload each answer it as the private album does", async () => {
    refused("This event is private.");
    expect(
      await setGuestDisplayName({
        sessionToken: "t".repeat(64),
        displayName: "Sam",
      }),
    ).toEqual(PRIVATE);
    expect(
      await setGuestPendingEmail({
        sessionToken: "t".repeat(64),
        email: "sam@example.com",
      }),
    ).toEqual(PRIVATE);
    expect(
      await createMedia({
        sessionToken: "t".repeat(64),
        mediaId: "m",
        type: "photo",
        originalKey: "k",
        fileSizeBytes: 1,
      }),
    ).toEqual(PRIVATE);
  });
});

/**
 * THE CAMERA'S REFUSALS (20261002200000): the shot past the roll and past its ceiling travel in create_media's own
 * sentence (its number is the album's roll), the code the complete route answers 409 for; a video past a camera
 * shot's bounds is too_long or too_large, by the words every such refusal uses; a sentence this code does not know
 * reads as the taxonomy's own, never as the server's raw words.
 */
describe("the camera's refusals, by their own words", () => {
  const shot = () =>
    createMedia({
      sessionToken: "t".repeat(64),
      mediaId: "m",
      type: "video",
      originalKey: "k",
      fileSizeBytes: 1,
    });

  it("the roll, at the album's own size, and the ceiling, each in the server's sentence", async () => {
    refused("You've taken all 24 shots on your roll.");
    expect(await shot()).toEqual({
      ok: false,
      code: "roll_spent",
      message: "You've taken all 24 shots on your roll.",
    });
    refused("You've taken all 12 shots on your roll.");
    expect(await shot()).toMatchObject({
      code: "roll_spent",
      message: "You've taken all 12 shots on your roll.",
    });
    refused("You've used every retake this roll allows.");
    expect(await shot()).toEqual({
      ok: false,
      code: "roll_spent",
      message: "You've used every retake this roll allows.",
    });
  });

  it("a roll sentence it does not know reads as the taxonomy's own", async () => {
    refused("The roll is jammed <b>today</b>.");
    expect(await shot()).toEqual({
      ok: false,
      code: "roll_spent",
      message: "You've taken every shot on your roll.",
    });
  });

  it("a camera video's bounds are too_long and too_large, as every such refusal is", async () => {
    refused("This video is longer than the 10 seconds a camera shot can be.");
    expect((await shot()).ok === false && (await shot())).toMatchObject({
      code: "too_long",
    });
    refused("This video exceeds the 128 MB a camera shot can be.");
    expect(await shot()).toMatchObject({ code: "too_large" });
  });
});

/**
 * ★ THE LINE A COMPLETE MET, IN THE ALBUM'S WORDS (billing-integrity): create_media refuses an upload past her plan's
 * uploads line ("Upload limit reached for this plan.") or past storage ("Storage capacity exceeded for this plan."), and
 * a guest got that sentence as it stood, the host's plan named to her. Each now says its line in the presign's own words
 * for it (`cap-words.ts`), and a cap sentence the wrapper does not know reads as `unknown`, never as a guessed line.
 */
describe("the uploads line and storage, each in the album's words", () => {
  const upload = () =>
    createMedia({
      sessionToken: "t".repeat(64),
      mediaId: "m",
      type: "photo",
      originalKey: "k",
      fileSizeBytes: 1,
    });

  it("★ the uploads line says the album hit its upload limit, never the plan", async () => {
    refused("Upload limit reached for this plan.");
    expect(await upload()).toEqual({
      ok: false,
      code: "cap_reached",
      message: "This album has hit its upload limit for now.",
    });
  });

  it("★ storage says the album is full and the host can free space", async () => {
    refused("Storage capacity exceeded for this plan.");
    expect(await upload()).toEqual({
      ok: false,
      code: "cap_reached",
      message: "This album is full right now. The host needs to free up space.",
    });
  });

  it("each is the presign's own sentence for its line, word for word", async () => {
    const words = await import("@/lib/upload/cap-words");
    refused("Upload limit reached for this plan.");
    expect(await upload()).toMatchObject({
      message: words.ALBUM_UPLOADS_SPENT,
    });
    refused("Storage capacity exceeded for this plan.");
    expect(await upload()).toMatchObject({ message: words.ALBUM_STORAGE_FULL });
  });

  it("a cap sentence it does not know is unknown, never a line it guessed, and never the plan's raw words", async () => {
    refused("Some new limit reached for this plan.");
    expect(await upload()).toEqual({
      ok: false,
      code: "unknown",
      message: "Couldn't save the upload. Please try again.",
    });
  });
});
