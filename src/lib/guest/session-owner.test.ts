/**
 * WHOSE TICKET IS THIS (the upload-owner lane, 2026-09-23): the one rule, the code both halves read
 * by name, and the server check that applies it. The alias red-team found a browser that kept a
 * confirmed guest's ticket crediting the next person's photograph to that guest, signed in as
 * someone else or signed out; these pin that an account's row writes only for that account, that a
 * confirmed row whose account is gone writes for nobody, and that a name-only row stays the
 * device's ticket.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  SESSION_OTHER_ACCOUNT,
  SESSION_OTHER_ACCOUNT_MESSAGE,
  sessionBelongsTo,
} from "@/lib/guest/session-owner";

const rowRead = vi.fn();
const getUser = vi.fn();
const selectSpy = vi.fn();
const eqSpy = vi.fn();

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (table: string) => ({
      select: (columns: string) => {
        selectSpy(table, columns);
        return {
          eq: (column: string, value: string) => {
            eqSpy(column, value);
            return { maybeSingle: () => rowRead() };
          },
        };
      },
    }),
  }),
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser: () => getUser() } }),
}));

const { checkSessionOwner } = await import("@/lib/guest/session-owner.server");

const TOKEN = "a".repeat(64);
const OWNER = "11111111-1111-4111-8111-111111111111";
const OTHER = "22222222-2222-4222-8222-222222222222";
const CONFIRMED_AT = "2026-09-22T20:00:00Z";

function signedInAs(id: string | null) {
  getUser.mockResolvedValue({ data: { user: id ? { id } : null } });
}

/** The row the ticket names, as the service-role read returns it. */
function row(userId: string | null, verifiedAt: string | null) {
  rowRead.mockResolvedValue({
    data: { user_id: userId, verified_at: verifiedAt },
    error: null,
  });
}

const nameOnly = { userId: null, verified: false };

beforeEach(() => {
  vi.clearAllMocks();
  signedInAs(null);
});

describe("the rule", () => {
  it("a name-only row is anyone's who holds its ticket, signed in or out", () => {
    expect(sessionBelongsTo(nameOnly, null)).toBe(true);
    expect(sessionBelongsTo(nameOnly, OTHER)).toBe(true);
  });

  it("an account's row belongs to that account alone, confirmed or not", () => {
    for (const verified of [true, false]) {
      const owned = { userId: OWNER, verified };
      expect(sessionBelongsTo(owned, OWNER)).toBe(true);
      expect(sessionBelongsTo(owned, OTHER)).toBe(false);
      expect(sessionBelongsTo(owned, null)).toBe(false);
    }
  });

  it("★ a confirmed row whose account was deleted belongs to nobody", () => {
    const orphan = { userId: null, verified: true };
    expect(sessionBelongsTo(orphan, null)).toBe(false);
    expect(sessionBelongsTo(orphan, OTHER)).toBe(false);
  });

  it("the code is its own name, never a substring an older mapping already matches", () => {
    expect(SESSION_OTHER_ACCOUNT).toBe("session_other_account");
    // mapCheckViolation reads these words out of create_media's refusals; the queue and the
    // refusal ladder read codes by exact name. Neither may mistake this sentence for theirs.
    for (const word of [
      "verified email",
      "not accepting",
      "no longer exists",
      "does not belong",
      "exceeds",
      "longer than",
      "paid plan",
      "limit",
      "capacity",
      "locked",
      "private",
    ]) {
      expect(SESSION_OTHER_ACCOUNT_MESSAGE.toLowerCase()).not.toContain(word);
    }
  });

  it("the sentence names nobody and carries no em-dash", () => {
    expect(SESSION_OTHER_ACCOUNT_MESSAGE).not.toContain("—");
    expect(SESSION_OTHER_ACCOUNT_MESSAGE).not.toMatch(/@/);
  });
});

describe("checkSessionOwner, on the server", () => {
  it("reads the row's account and confirmation by the posted token on the service-role client", async () => {
    row(null, null);
    await checkSessionOwner(TOKEN);
    expect(selectSpy).toHaveBeenCalledWith("guests", "user_id, verified_at");
    expect(eqSpy).toHaveBeenCalledWith("session_token", TOKEN);
  });

  it("★ a name-only row passes for anyone and never pays the Auth round trip", async () => {
    row(null, null);
    signedInAs(OTHER);
    await expect(checkSessionOwner(TOKEN)).resolves.toEqual({ ok: true });
    expect(getUser).not.toHaveBeenCalled();
  });

  it("an unknown token passes here: the capability RPC owns the dead-session refusal", async () => {
    rowRead.mockResolvedValue({ data: null, error: null });
    await expect(checkSessionOwner(TOKEN)).resolves.toEqual({ ok: true });
    expect(getUser).not.toHaveBeenCalled();
  });

  it("an account's row passes for that account, signed in", async () => {
    row(OWNER, CONFIRMED_AT);
    signedInAs(OWNER);
    await expect(checkSessionOwner(TOKEN)).resolves.toEqual({ ok: true });
  });

  it("★ an account's row is refused to ANOTHER account", async () => {
    row(OWNER, CONFIRMED_AT);
    signedInAs(OTHER);
    await expect(checkSessionOwner(TOKEN)).resolves.toEqual({
      ok: false,
      code: SESSION_OTHER_ACCOUNT,
      message: SESSION_OTHER_ACCOUNT_MESSAGE,
    });
  });

  it("★ an account's row is refused to anyone signed out", async () => {
    row(OWNER, CONFIRMED_AT);
    signedInAs(null);
    const answer = await checkSessionOwner(TOKEN);
    expect(answer.ok).toBe(false);
  });

  it("an unconfirmed account's row is held to that account too", async () => {
    row(OWNER, null);
    signedInAs(null);
    expect((await checkSessionOwner(TOKEN)).ok).toBe(false);
    signedInAs(OWNER);
    expect((await checkSessionOwner(TOKEN)).ok).toBe(true);
  });

  it("★ a confirmed row whose account was deleted is refused to everyone, without asking Auth", async () => {
    row(null, CONFIRMED_AT);
    signedInAs(OTHER);
    expect((await checkSessionOwner(TOKEN)).ok).toBe(false);
    expect(getUser).not.toHaveBeenCalled();
  });

  it("never hands back whose row it was", async () => {
    row(OWNER, CONFIRMED_AT);
    signedInAs(OTHER);
    expect(JSON.stringify(await checkSessionOwner(TOKEN))).not.toContain(OWNER);
  });

  it("a failed read THROWS: never fail open, never make a guest put their own ticket down", async () => {
    rowRead.mockResolvedValue({ data: null, error: { message: "boom" } });
    await expect(checkSessionOwner(TOKEN)).rejects.toThrow(/session owner/);
  });
});
