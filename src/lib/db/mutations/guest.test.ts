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
