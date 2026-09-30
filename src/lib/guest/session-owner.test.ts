/**
 * WHOSE TICKET IS THIS: the one rule, the code both halves read by name, and the server check that
 * applies it. A browser that kept a confirmed guest's ticket would credit the next person's
 * photograph to that guest, signed in as someone else or signed out; these pin that an account's
 * row writes only for that account, that a confirmed row whose account is gone writes for nobody,
 * and that a name-only row is the device's ticket only while nobody is signed in: a signed-in account
 * writes through a name-only row only once the claim has made it hers (crumbs-26, build 27's red-team:
 * on a shared phone a signed-in account's photos were filed under another guest's typed name).
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  SESSION_OTHER_ACCOUNT,
  SESSION_OTHER_ACCOUNT_MESSAGE,
  sessionBelongsTo,
} from "@/lib/guest/session-owner";

const rowRead = vi.fn();
const rowsRead = vi.fn();
const getUser = vi.fn();
const claimRpc = vi.fn();
const selectSpy = vi.fn();
const eqSpy = vi.fn();
const inSpy = vi.fn();
const captureError = vi.fn();

vi.mock("server-only", () => ({}));
vi.mock("@/lib/observability/sentry", () => ({
  captureError: (...args: unknown[]) => captureError(...args),
}));
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
          // The read side asks for every ticket a request carries at once.
          in: (column: string, values: string[]) => {
            inSpy(column, values);
            return rowsRead();
          },
        };
      },
    }),
  }),
}));
// The viewer's own client: who is signed in, and the claim, which runs as them.
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: () => getUser() },
    rpc: (fn: string, args: unknown) => claimRpc(fn, args),
  }),
}));

const { checkSessionOwner, sortTickets } =
  await import("@/lib/guest/session-owner.server");

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

/** The same read, answered once: what the row was before the claim, then what it is after. */
function rowOnce(userId: string | null, verifiedAt: string | null) {
  rowRead.mockResolvedValueOnce({
    data: { user_id: userId, verified_at: verifiedAt },
    error: null,
  });
}

const nameOnly = { userId: null, verified: false };

beforeEach(() => {
  vi.clearAllMocks();
  signedInAs(null);
  // The claim answers how many claimed rows carry an upload; what it took is read off the row again.
  claimRpc.mockResolvedValue({ data: 0, error: null });
});

describe("the rule", () => {
  it("★ a name-only row is the device's ticket for someone signed out, and never a signed-in account's", () => {
    // Reshaped on purpose (crumbs-26): it read "anyone's who holds its ticket, signed in or out", and a
    // signed-in account on a shared phone then uploaded under the typed name of whoever held the phone
    // before her. Only the claim makes such a row hers (checkSessionOwner below).
    expect(sessionBelongsTo(nameOnly, null)).toBe(true);
    expect(sessionBelongsTo(nameOnly, OTHER)).toBe(false);
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

  it("★ a name-only row passes for someone signed out, and asks no claim", async () => {
    // Reshaped on purpose (crumbs-26): it passed for anyone and never asked Auth. It asks now, because
    // whether anyone is signed in is the question; with no session `getUser()` answers from the cookie
    // jar without a round trip (auth-js), so the anonymous crowd behind one venue's network still pays none.
    row(null, null);
    signedInAs(null);
    await expect(checkSessionOwner(TOKEN)).resolves.toEqual({ ok: true });
    expect(claimRpc).not.toHaveBeenCalled();
  });

  it("★ a name-only row is refused to a signed-in account the claim does not make it hers (build 27's red-team)", async () => {
    // The shared phone: a visitor typed "Sam" at the album and the next person signed in on it. Her
    // photo went up on Sam's ticket, under Sam's name, with no Delete of hers. The ticket is asked about
    // (or waits for its address's owner) and never taken, so it stays another person's.
    row(null, null);
    signedInAs(OTHER);
    await expect(checkSessionOwner(TOKEN)).resolves.toEqual({
      ok: false,
      code: SESSION_OTHER_ACCOUNT,
      message: SESSION_OTHER_ACCOUNT_MESSAGE,
    });
    // The claim was asked first, as her, about exactly this ticket, and the row read again after it.
    expect(claimRpc).toHaveBeenCalledWith("claim_anonymous_uploads", {
      p_session_tokens: [TOKEN],
    });
    expect(rowRead).toHaveBeenCalledTimes(2);
  });

  it("★ one the claim takes for her passes: a ticket she typed before she signed in is hers to add on", async () => {
    // `whose_ticket` says it is hers (her name, no address at odds), so the claim at sign-in would have
    // taken it; a claim that had not run yet (a sign-in in another tab, a claim that failed) runs here.
    rowOnce(null, null);
    rowOnce(OTHER, CONFIRMED_AT);
    signedInAs(OTHER);
    await expect(checkSessionOwner(TOKEN)).resolves.toEqual({ ok: true });
    expect(claimRpc).toHaveBeenCalledTimes(1);
  });

  it("a claim that fails THROWS: never fail open, never make her put down a ticket that may be hers", async () => {
    row(null, null);
    signedInAs(OTHER);
    claimRpc.mockResolvedValue({ data: null, error: { message: "boom" } });
    await expect(checkSessionOwner(TOKEN)).rejects.toThrow(/session owner/);
  });

  it("never asks the claim about an account's row or a confirmed row whose account is gone", async () => {
    for (const [userId, verifiedAt] of [
      [OWNER, CONFIRMED_AT],
      [null, CONFIRMED_AT],
    ] as const) {
      row(userId, verifiedAt);
      signedInAs(OTHER);
      expect((await checkSessionOwner(TOKEN)).ok).toBe(false);
    }
    expect(claimRpc).not.toHaveBeenCalled();
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

/**
 * THE READ SIDE OF THE OWNER RULE (crumbs-27): the tickets a request carries, sorted into the ones that may speak
 * for the viewer and the ones that may not. The write routes ask `checkSessionOwner` about the ticket a file is
 * sent on; the reads that decide what she is shown (the door's standing, A photo first, her Yours, the export's
 * own) asked nothing, and on a shared phone a signed-in account was read as whoever's ticket the phone still held:
 * let in through another guest's, held at the upload step (or not) by another's contribution, offered another's
 * photographs as hers. Same rule, same claim: her own row, or one the claim takes.
 */
describe("sortTickets: which of the tickets a request carries may speak for the viewer", () => {
  const T1 = "1".repeat(64);
  const T2 = "2".repeat(64);
  const T3 = "3".repeat(64);
  const T4 = "4".repeat(64);

  /** The service-role read of a set of tickets: token -> [user_id, verified_at]. */
  function owned(rows: Record<string, [string | null, string | null]>) {
    return {
      data: Object.entries(rows).map(
        ([session_token, [user_id, verified_at]]) => ({
          session_token,
          user_id,
          verified_at,
        }),
      ),
      error: null,
    };
  }

  it("signed out, every ticket is the device's: nothing is read, not even who is asking", async () => {
    await expect(sortTickets(null, [T1, T2, T1])).resolves.toEqual({
      hers: [T1, T2],
      others: [],
    });
    expect(inSpy).not.toHaveBeenCalled();
    expect(getUser).not.toHaveBeenCalled();
    expect(claimRpc).not.toHaveBeenCalled();
  });

  it("no tickets, no work", async () => {
    await expect(sortTickets(OWNER, [])).resolves.toEqual({
      hers: [],
      others: [],
    });
    expect(inSpy).not.toHaveBeenCalled();
  });

  it("★ signed in, a ticket of her own account speaks for her; another account's, and a confirmed row nobody holds any more, do not", async () => {
    rowsRead.mockResolvedValueOnce(
      owned({
        [T1]: [OWNER, CONFIRMED_AT],
        [T2]: [OTHER, CONFIRMED_AT],
        [T3]: [null, CONFIRMED_AT],
      }),
    );
    await expect(sortTickets(OWNER, [T1, T2, T3])).resolves.toEqual({
      hers: [T1],
      others: [T2, T3],
    });
    // One read for the lot, over the service-role client, by the tickets themselves.
    expect(selectSpy).toHaveBeenCalledWith(
      "guests",
      "session_token, user_id, verified_at",
    );
    expect(inSpy).toHaveBeenCalledWith("session_token", [T1, T2, T3]);
    // Nothing here is a name-only row, so the claim is never asked.
    expect(claimRpc).not.toHaveBeenCalled();
  });

  it("★ a name-only ticket the claim leaves is another guest's, and the claim was asked once, as her, about every such ticket (a shared phone)", async () => {
    // Sam typed a name at the album and the next person signed in on the phone: the ticket is asked about
    // (or waits for its address's owner) and never taken, so it stays Sam's, and her reads never ride it.
    rowsRead
      .mockResolvedValueOnce(
        owned({
          [T1]: [null, null],
          [T2]: [OWNER, CONFIRMED_AT],
          [T3]: [null, null],
        }),
      )
      // After the claim: neither name-only row became hers.
      .mockResolvedValueOnce(owned({ [T1]: [null, null], [T3]: [null, null] }));
    await expect(sortTickets(OWNER, [T1, T2, T3])).resolves.toEqual({
      hers: [T2],
      others: [T1, T3],
    });
    expect(claimRpc).toHaveBeenCalledTimes(1);
    expect(claimRpc).toHaveBeenCalledWith("claim_anonymous_uploads", {
      p_session_tokens: [T1, T3],
    });
    expect(rowsRead).toHaveBeenCalledTimes(2);
  });

  it("★ one the claim takes is hers: a ticket she typed before she signed in speaks for her from the first read", async () => {
    // `whose_ticket` says it is hers (her name, no address at odds); a claim that had not run yet (a sign-in
    // in another tab, a claim that failed) runs here, as it does under an upload.
    rowsRead
      .mockResolvedValueOnce(owned({ [T1]: [null, null], [T4]: [null, null] }))
      .mockResolvedValueOnce(
        owned({ [T1]: [OWNER, CONFIRMED_AT], [T4]: [null, null] }),
      );
    await expect(sortTickets(OWNER, [T1, T4])).resolves.toEqual({
      hers: [T1],
      others: [T4],
    });
    expect(claimRpc).toHaveBeenCalledTimes(1);
  });

  it("a ticket that names no row says nothing either way: the capability RPCs own the dead-session answer", async () => {
    rowsRead.mockResolvedValueOnce(owned({ [T2]: [OWNER, CONFIRMED_AT] }));
    await expect(sortTickets(OWNER, [T1, T2])).resolves.toEqual({
      hers: [T1, T2],
      others: [],
    });
  });

  it("★ a failed read sets every ticket aside and is captured: her account speaks alone, and the page is never thrown", async () => {
    rowsRead.mockResolvedValueOnce({ data: null, error: { message: "boom" } });
    await expect(sortTickets(OWNER, [T1, T2])).resolves.toEqual({
      hers: [],
      others: [T1, T2],
    });
    expect(captureError).toHaveBeenCalledTimes(1);
    expect(captureError.mock.calls[0][0]).toBe("security");
  });

  it("★ so does a failed claim: never a name-only ticket taken on faith", async () => {
    rowsRead.mockResolvedValueOnce(owned({ [T1]: [null, null] }));
    claimRpc.mockResolvedValue({ data: null, error: { message: "boom" } });
    await expect(sortTickets(OWNER, [T1])).resolves.toEqual({
      hers: [],
      others: [T1],
    });
    expect(captureError).toHaveBeenCalledTimes(1);
  });

  it("★ a string that is not a token names no row and is never sent to a query (the body's ticket is client input)", async () => {
    // `create_guest` mints 64 hex characters; a route passing the body's own string must not put anything
    // else into a filter list, where a comma or a quote is syntax.
    const JUNK = 'x","y';
    rowsRead.mockResolvedValueOnce(owned({ [T2]: [OTHER, CONFIRMED_AT] }));
    await expect(sortTickets(OWNER, [JUNK, T2])).resolves.toEqual({
      hers: [JUNK],
      others: [T2],
    });
    expect(inSpy).toHaveBeenCalledWith("session_token", [T2]);
    // Nothing but junk: nothing to read at all.
    inSpy.mockClear();
    await expect(sortTickets(OWNER, [JUNK])).resolves.toEqual({
      hers: [JUNK],
      others: [],
    });
    expect(inSpy).not.toHaveBeenCalled();
  });

  it("never hands back whose row a ticket was", async () => {
    rowsRead.mockResolvedValueOnce(owned({ [T2]: [OTHER, CONFIRMED_AT] }));
    expect(JSON.stringify(await sortTickets(OWNER, [T2]))).not.toContain(OTHER);
  });
});
