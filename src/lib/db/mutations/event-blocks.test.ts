/**
 * THE PER-EVENT BLOCK'S TWO ACTS, THE WIRING: both run on the host's own client after `getUser()`
 * (the RPCs re-check the host on `auth.uid()`, verified against the database by the migration's
 * rolled-back checks, not here), a refusal comes back in the host's words, and an answer is read
 * defensively over the typed seam.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db/queries/event-blocks", () => ({
  isBlockSchemaMissing: (error: { code?: string } | null) =>
    ["42P01", "42883", "PGRST202", "PGRST205"].includes(error?.code ?? ""),
}));

let user: { id: string } | null = { id: "host-1" };
const rpc = vi.fn();
const createClient = vi.fn(async () => ({
  auth: { getUser: async () => ({ data: { user } }) },
  rpc: (...args: unknown[]) => rpc(...args),
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => createClient(),
}));
const createAdminClient = vi.fn();
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient }));

const { blockFromEvent, letBackIn, previewBlock } =
  await import("@/lib/db/mutations/event-blocks");

const ROW = { kind: "row", guestId: "g-1" } as const;

beforeEach(() => {
  user = { id: "host-1" };
  rpc.mockReset();
  createClient.mockClear();
});

describe("who may act", () => {
  it("signed out: refused before any RPC", async () => {
    user = null;
    await expect(previewBlock(ROW)).resolves.toMatchObject({
      ok: false,
      code: "unauthorized",
    });
    await expect(
      blockFromEvent(ROW, { requireVerifiedEmail: false }),
    ).resolves.toMatchObject({ ok: false, code: "unauthorized" });
    await expect(letBackIn("b-1", { restore: false })).resolves.toMatchObject({
      ok: false,
      code: "unauthorized",
    });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("★ every act rides the host's own client, never the admin client", async () => {
    rpc.mockResolvedValue({ data: { ok: true }, error: null });
    await previewBlock(ROW);
    await blockFromEvent(ROW, { requireVerifiedEmail: true });
    await letBackIn("b-1", { restore: true });
    expect(createClient).toHaveBeenCalledTimes(3);
    expect(createAdminClient).not.toHaveBeenCalled();
  });
});

describe("what each act sends", () => {
  it("the preview asks the act itself, with the preview flag", async () => {
    rpc.mockResolvedValue({ data: { ok: true }, error: null });
    await previewBlock({ kind: "media", mediaId: "m-1" });
    expect(rpc).toHaveBeenCalledWith("block_from_event", {
      p_media_id: "m-1",
      p_preview: true,
    });
  });

  it("the block carries the names-only switch; let back in carries the restore", async () => {
    rpc.mockResolvedValue({ data: { ok: true }, error: null });
    await blockFromEvent(
      { kind: "account", eventId: "e-1", userId: "u-1" },
      { requireVerifiedEmail: true },
    );
    expect(rpc).toHaveBeenLastCalledWith("block_from_event", {
      p_event_id: "e-1",
      p_user_id: "u-1",
      p_require_verified_email: true,
    });
    await letBackIn("b-1", { restore: false });
    expect(rpc).toHaveBeenLastCalledWith("let_back_in", {
      p_block_id: "b-1",
      p_restore: false,
    });
  });
});

describe("what comes back", () => {
  it("reads the preview defensively", async () => {
    rpc.mockResolvedValue({
      data: {
        ok: true,
        event_id: "e-1",
        label: "Sam",
        verified: true,
        uploads: 7,
        names_only: false,
        already: false,
      },
      error: null,
    });
    await expect(previewBlock(ROW)).resolves.toEqual({
      ok: true,
      data: {
        eventId: "e-1",
        label: "Sam",
        verified: true,
        uploads: 7,
        namesOnly: false,
        already: false,
      },
    });
    rpc.mockResolvedValue({
      data: {
        ok: true,
        uploads: -3.5,
        verified: "yes",
        names_only: 1,
        label: 5,
      },
      error: null,
    });
    await expect(previewBlock(ROW)).resolves.toEqual({
      ok: true,
      data: {
        eventId: "",
        label: null,
        verified: false,
        uploads: 0,
        namesOnly: false,
        already: false,
      },
    });
  });

  it("the block and the way back report their counts and their event", async () => {
    rpc.mockResolvedValue({
      data: {
        ok: true,
        event_id: "e-1",
        block_id: "b-1",
        removed: 3,
        already: false,
      },
      error: null,
    });
    await expect(
      blockFromEvent(ROW, { requireVerifiedEmail: false }),
    ).resolves.toEqual({
      ok: true,
      data: { eventId: "e-1", blockId: "b-1", removed: 3, already: false },
    });
    rpc.mockResolvedValue({
      data: { ok: true, event_id: "e-1", restored: 2, no_room: 1 },
      error: null,
    });
    await expect(letBackIn("b-1", { restore: true })).resolves.toEqual({
      ok: true,
      data: { eventId: "e-1", restored: 2, noRoom: 1 },
    });
  });

  it("★ each refusal in the host's words, none naming another host's event", async () => {
    const said: Record<string, string> = {};
    for (const reason of [
      "unauthorized",
      "not_found",
      "bad_target",
      "not_a_guest",
      "mystery",
    ]) {
      rpc.mockResolvedValue({ data: { ok: false, reason }, error: null });
      const result = await previewBlock(ROW);
      expect(result.ok).toBe(false);
      if (!result.ok) said[reason] = `${result.code}: ${result.message}`;
    }
    expect(said).toEqual({
      unauthorized: "unauthorized: Please sign in and try again.",
      not_found: "not_found: That person or event is no longer available.",
      bad_target: "not_found: That person or event is no longer available.",
      not_a_guest: "not_a_guest: Only a guest who added photos can be blocked.",
      mystery: "unknown: That didn't go through. Please try again.",
    });
  });

  it("a database error is unknown and carries its cause; the unapplied migration says so in words", async () => {
    const boom = { code: "XX000", message: "boom" };
    rpc.mockResolvedValue({ data: null, error: boom });
    await expect(letBackIn("b-1", { restore: false })).resolves.toMatchObject({
      ok: false,
      code: "unknown",
      cause: boom,
    });
    rpc.mockResolvedValue({
      data: null,
      error: { code: "PGRST202", message: "no fn" },
    });
    const missing = await letBackIn("b-1", { restore: false });
    expect(missing).toEqual({
      ok: false,
      code: "unknown",
      message: "Blocking isn't ready yet. Please try again in a little while.",
    });
  });
});
