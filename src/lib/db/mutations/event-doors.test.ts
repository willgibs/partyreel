/**
 * THE HOST'S DOOR ACTS, THE WIRING (event-settings r1, migration 20260929120000): all four run on the host's
 * own client after `getUser()` (the RPCs re-check the host on `auth.uid()`, verified against the database by
 * the migration's rolled-back checks, not here), a refusal comes back in the host's words, and an answer is
 * read defensively off its jsonb.
 *
 * ★ A FAILED ACT IS A FAILURE THE SERVER FUNCTION CAN REPORT, never a success and never a silent one: a
 * database error, a missing function included, is `unknown` and carries its cause. (Before the migration was
 * applied a missing function answered "not ready", and Public, a password and Only me still moved through
 * `updateEvent`; both went with the seam, crumbs-15, 2026-09-29.)
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

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

const { addEventInvites, letInAtDoor, removeEventInvite, setEventDoor } =
  await import("@/lib/db/mutations/event-doors");

const EVENT = "11111111-1111-4111-8111-111111111111";
const GUEST = "22222222-2222-4222-8222-222222222222";

beforeEach(() => {
  user = { id: "host-1" };
  rpc.mockReset();
  createClient.mockClear();
  createAdminClient.mockClear();
});

/** Each of the four acts, called the way its Server Function calls it. */
const ACTS = [
  ["setEventDoor", () => setEventDoor(EVENT, "approve")],
  ["letInAtDoor", () => letInAtDoor(EVENT, GUEST)],
  ["addEventInvites", () => addEventInvites(EVENT, ["a@example.com"])],
  ["removeEventInvite", () => removeEventInvite(EVENT, "a@example.com")],
] as const;

describe("who may act", () => {
  it("signed out: every act is refused before any RPC", async () => {
    user = null;
    for (const [, act] of ACTS) {
      await expect(act()).resolves.toMatchObject({
        ok: false,
        code: "unauthorized",
      });
    }
    expect(rpc).not.toHaveBeenCalled();
  });

  it("★ every act rides the host's own client, never the admin client", async () => {
    rpc.mockResolvedValue({ data: { ok: true }, error: null });
    for (const [, act] of ACTS) await act();
    expect(createClient).toHaveBeenCalledTimes(4);
    expect(createAdminClient).not.toHaveBeenCalled();
  });
});

describe("what each act sends", () => {
  it("names the event and the one thing it acts on", async () => {
    rpc.mockResolvedValue({ data: { ok: true }, error: null });
    await setEventDoor(EVENT, "invite");
    expect(rpc).toHaveBeenLastCalledWith("set_event_door", {
      p_event_id: EVENT,
      p_door: "invite",
    });
    await letInAtDoor(EVENT, GUEST);
    expect(rpc).toHaveBeenLastCalledWith("let_in_at_door", {
      p_event_id: EVENT,
      p_guest_id: GUEST,
    });
    const emails = ["a@example.com", "b@example.com"];
    await addEventInvites(EVENT, emails);
    expect(rpc).toHaveBeenLastCalledWith("add_event_invites", {
      p_event_id: EVENT,
      p_emails: emails,
    });
    await removeEventInvite(EVENT, "a@example.com");
    expect(rpc).toHaveBeenLastCalledWith("remove_event_invite", {
      p_event_id: EVENT,
      p_email: "a@example.com",
    });
  });
});

describe("what comes back", () => {
  it("the door reports whether the email step came with it and who it let in", async () => {
    rpc.mockResolvedValue({
      data: { ok: true, email_held: true, admitted: 3 },
      error: null,
    });
    await expect(setEventDoor(EVENT, "invite")).resolves.toEqual({
      ok: true,
      data: { emailHeld: true, admitted: 3 },
    });
    rpc.mockResolvedValue({
      data: { ok: true, email_held: "yes", admitted: -2.5 },
      error: null,
    });
    await expect(setEventDoor(EVENT, "open")).resolves.toEqual({
      ok: true,
      data: { emailHeld: false, admitted: 0 },
    });
  });

  it("the let-in, the list and the removal report their counts, read as whole non-negative numbers", async () => {
    rpc.mockResolvedValue({
      data: { ok: true, admitted: 2, already: true },
      error: null,
    });
    await expect(letInAtDoor(EVENT, GUEST)).resolves.toEqual({
      ok: true,
      data: { admitted: 2, already: true },
    });
    rpc.mockResolvedValue({
      data: {
        ok: true,
        added: 5,
        already: 1,
        invalid: 2,
        over_cap: 3,
        total: 9,
      },
      error: null,
    });
    // ★ RESHAPED ON PURPOSE (crumbs-17, build 23's BUG-2; scar kept: every count whole and
    // non-negative, read defensively): the listing's answer grew `admitted`, the waiting people the list
    // now lets in. A database from before 20260929220000 answers no such key, which reads 0, so the
    // lane's build and the deployed one each run against either side of the apply.
    await expect(addEventInvites(EVENT, ["a@example.com"])).resolves.toEqual({
      ok: true,
      data: {
        added: 5,
        already: 1,
        invalid: 2,
        overCap: 3,
        total: 9,
        admitted: 0,
      },
    });
    rpc.mockResolvedValue({
      data: {
        ok: true,
        added: 1,
        already: 0,
        invalid: 0,
        over_cap: 0,
        total: 3,
        admitted: 1,
      },
      error: null,
    });
    await expect(addEventInvites(EVENT, ["a@example.com"])).resolves.toEqual({
      ok: true,
      data: {
        added: 1,
        already: 0,
        invalid: 0,
        overCap: 0,
        total: 3,
        admitted: 1,
      },
    });
    rpc.mockResolvedValue({ data: { ok: true, removed: "one" }, error: null });
    await expect(removeEventInvite(EVENT, "a@example.com")).resolves.toEqual({
      ok: true,
      data: { removed: 0 },
    });
  });

  it("★ each refusal in the host's words, none naming another host's event", async () => {
    const said: Record<string, string> = {};
    for (const reason of [
      "unauthorized",
      "not_found",
      "bad_door",
      "no_password",
      "blocked",
      "too_many",
      "mystery",
    ]) {
      rpc.mockResolvedValue({ data: { ok: false, reason }, error: null });
      const result = await setEventDoor(EVENT, "approve");
      expect(result.ok).toBe(false);
      if (!result.ok) said[reason] = `${result.code}: ${result.message}`;
    }
    expect(said).toEqual({
      unauthorized: "unauthorized: Please sign in and try again.",
      not_found: "not_found: That event is no longer available.",
      bad_door: "not_found: That event is no longer available.",
      no_password:
        "no_password: Set a password first, then it becomes the way in.",
      blocked:
        "blocked: They're in Blocked. Let them back in from there first.",
      too_many:
        "too_many: That's more addresses than one paste can take. Try fewer at a time.",
      mystery: "unknown: That didn't go through. Please try again.",
    });
  });

  it("a database error, a missing function included, is unknown and carries its cause", async () => {
    for (const error of [
      { code: "XX000", message: "boom" },
      { code: "PGRST202", message: "no fn" },
    ]) {
      rpc.mockResolvedValue({ data: null, error });
      for (const [, act] of ACTS) {
        await expect(act()).resolves.toEqual({
          ok: false,
          code: "unknown",
          message: "That didn't go through. Please try again.",
          cause: error,
        });
      }
    }
  });
});
