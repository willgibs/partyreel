/**
 * THE PER-EVENT BLOCK'S TWO ACTS, THE WIRING: both run on the host's own client after `getUser()`
 * (the RPCs re-check the host on `auth.uid()`, verified against the database by the migration's
 * rolled-back checks, not here), a refusal comes back in the host's words, and an answer is read
 * defensively off its jsonb.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { liveFunctions } from "@/lib/db/testing/migrations";

vi.mock("server-only", () => ({}));

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
    await expect(
      letBackIn("b-1", { restore: false, letIn: false }),
    ).resolves.toMatchObject({
      ok: false,
      code: "unauthorized",
    });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("★ every act rides the host's own client, never the admin client", async () => {
    rpc.mockResolvedValue({ data: { ok: true }, error: null });
    await previewBlock(ROW);
    await blockFromEvent(ROW, { requireVerifiedEmail: true });
    await letBackIn("b-1", { restore: true, letIn: true });
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

  it("the block carries the names-only switch; let back in carries the restore and the Let in", async () => {
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
    // ★ A lift that is no Let in names today's two alone, so it runs on either side of 20261007020000.
    await letBackIn("b-1", { restore: false, letIn: false });
    expect(rpc).toHaveBeenLastCalledWith("let_back_in", {
      p_block_id: "b-1",
      p_restore: false,
    });
    // The Let in rides the same lift (host-moments r1), naming the one argument that migration adds.
    await letBackIn("b-1", { restore: true, letIn: true });
    expect(rpc).toHaveBeenLastCalledWith("let_back_in", {
      p_block_id: "b-1",
      p_restore: true,
      p_let_in: true,
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
    await expect(
      letBackIn("b-1", { restore: true, letIn: false }),
    ).resolves.toEqual({
      ok: true,
      data: { eventId: "e-1", restored: 2, noRoom: 1, admitted: 0 },
    });
  });

  it("★ who the lift let in is the door's arms and her answer together, read defensively", async () => {
    // The door's own (Public, the list) count under `admitted`, her Let in under `let_in` (20261007020000): the
    // words after the press ask one question, whether anyone came in.
    for (const [answer, admitted] of [
      [{ admitted: 0, let_in: 1 }, 1],
      [{ admitted: 1, let_in: 0 }, 1],
      [{ admitted: 0, let_in: 0 }, 0],
      // milestone 38's answer, before the migration: no `let_in` at all.
      [{ admitted: 0 }, 0],
      [{ admitted: "2", let_in: -1 }, 0],
    ] as const) {
      rpc.mockResolvedValue({
        data: { ok: true, event_id: "e-1", restored: 0, no_room: 0, ...answer },
        error: null,
      });
      const result = await letBackIn("b-1", { restore: false, letIn: true });
      expect(result.ok && result.data.admitted, JSON.stringify(answer)).toBe(
        admitted,
      );
    }
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

  // ★ RESHAPED ON PURPOSE (crumbs-15, 2026-09-29; scar kept: a failed act is a failure the Server Function can
  // report, never a success and never a silent one). It read "a database error is unknown and carries its cause;
  // the unapplied migration says so in words": a missing function answered "Blocking isn't ready yet" with NO
  // cause, which the seam had already captured. The migration is applied and the seam went, so a missing
  // function is an unknown failure like any other, carrying its cause for the action to capture.
  it("a database error, a missing function included, is unknown and carries its cause", async () => {
    for (const error of [
      { code: "XX000", message: "boom" },
      { code: "PGRST202", message: "no fn" },
    ]) {
      rpc.mockResolvedValue({ data: null, error });
      await expect(
        letBackIn("b-1", { restore: false, letIn: false }),
      ).resolves.toEqual({
        ok: false,
        code: "unknown",
        message: "That didn't go through. Please try again.",
        cause: error,
      });
    }
  });
});

/**
 * ★ THE LIFT'S NAMES ARE THE LIVE FUNCTION'S (host-moments r1, migration 20261007020000). PostgREST finds an RPC by the
 * argument names it is sent, so the three this mutation sends must be exactly the parameters the migrations leave
 * standing, in ONE overload: a second `let_back_in` would answer the deployed build's two names with PGRST203. Read
 * through the one replay of the set (`testing/migrations.ts`), so a later file that drops or redefines it is seen.
 */
describe("★ the RPC the lift calls, as the migrations leave it", () => {
  const lift = () => liveFunctions().filter((f) => f.name === "let_back_in");

  it("one overload, taking exactly the lift's names, the Let in defaulting to today's lift", () => {
    expect(lift()).toHaveLength(1);
    expect(lift()[0]!.params).toBe(
      "p_block_id uuid, p_restore boolean default false, p_let_in boolean default false",
    );
  });

  it("its Let in admits only the asks its own block named, through the door's asks, and says how many", () => {
    const code = lift()[0]!.code;
    expect(code).toContain(
      "if coalesce(p_let_in, false) then with let_in as ( update public.guests g set admission = 'in' from public.event_door_asks(v_block.event_id) a where g.id = a.guest_id and public.event_block_names_row(v_block.user_id, v_block.email, v_block.guest_id, g)",
    );
    // After the block is gone and the door's own arms have run, so the door keeps its count.
    expect(code.indexOf("if coalesce(p_let_in, false)")).toBeGreaterThan(
      code.indexOf(
        "v_admitted := public.event_door_admit_listed(v_block.event_id);",
      ),
    );
    expect(code).toContain(
      "'admitted', v_admitted + v_opened, 'let_in', v_let_in",
    );
  });

  it("the authenticated host's alone, PUBLIC's default revoked before the one grant", () => {
    const file = lift()[0]!.fileSql.replace(/\s+/g, " ");
    expect(file).toContain(
      "revoke all on function public.let_back_in(uuid, boolean, boolean) from public, anon, authenticated; grant execute on function public.let_back_in(uuid, boolean, boolean) to authenticated;",
    );
    expect(lift()[0]!.code).toContain("security definer set search_path = ''");
  });
});
