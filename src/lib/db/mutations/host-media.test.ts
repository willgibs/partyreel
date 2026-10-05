/**
 * ★ THE LINE HER COMPLETE MET, IN HER PLAN'S WORDS (billing-integrity). create_media_as_host refuses an upload past her
 * plan's uploads line ("Upload limit reached for this plan.") or past storage ("Storage capacity exceeded for this
 * plan."), and the wrapper said "Storage is full for your plan. Free up space or upgrade." for every refusal holding
 * "limit": a host at her uploads allowance was told to free space, which lowers no upload count. Each line now says its
 * own sentence (`cap-words.ts`): the uploads line her presign's, storage the plan's own, which the help center quotes;
 * and a cap sentence it does not know reads as `unknown`.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

let answer: { data: unknown; error: { code: string; message: string } | null };
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ rpc: () => Promise.resolve(answer) }),
}));

const { createMediaAsHost } = await import("@/lib/db/mutations/host-media");
const { PLAN_STORAGE_FULL, PLAN_UPLOADS_SPENT } =
  await import("@/lib/upload/cap-words");

function refused(message: string) {
  answer = { data: null, error: { code: "23514", message } };
}

const upload = () =>
  createMediaAsHost({
    hostId: "h",
    eventId: "e",
    mediaId: "m",
    type: "photo",
    originalKey: "k",
    fileSizeBytes: 1,
  });

beforeEach(() => {
  answer = { data: null, error: null };
});

describe("the uploads line and storage, each in her plan's words", () => {
  it("★ the uploads line says her plan's upload limit, never that storage is full", async () => {
    refused("Upload limit reached for this plan.");
    expect(await upload()).toEqual({
      ok: false,
      code: "cap_reached",
      message: "You've hit this plan's upload limit for now.",
    });
  });

  it("★ storage says her plan's storage is full, as it always did", async () => {
    refused("Storage capacity exceeded for this plan.");
    expect(await upload()).toEqual({
      ok: false,
      code: "cap_reached",
      message: "Storage is full for your plan. Free up space or upgrade.",
    });
  });

  it("each is its line's one sentence, word for word", async () => {
    refused("Upload limit reached for this plan.");
    expect(await upload()).toMatchObject({ message: PLAN_UPLOADS_SPENT });
    refused("Storage capacity exceeded for this plan.");
    expect(await upload()).toMatchObject({ message: PLAN_STORAGE_FULL });
  });

  it("a cap sentence it does not know is unknown, never a line it guessed", async () => {
    refused("Some new limit reached for this plan.");
    expect(await upload()).toEqual({
      ok: false,
      code: "unknown",
      message: "Couldn't save the upload. Please try again.",
    });
  });

  it("the other refusals keep their own codes", async () => {
    refused("File exceeds the 10 GB maximum.");
    expect(await upload()).toMatchObject({ code: "too_large" });
    refused("Video uploads are available on paid plans.");
    expect(await upload()).toMatchObject({ code: "video_not_allowed" });
    refused("Object key does not belong to this event.");
    expect(await upload()).toMatchObject({ code: "bad_key" });
  });
});
