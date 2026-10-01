import { describe, expect, it } from "vitest";

import {
  collectStoredSessionTokens,
  collectStoredTickets,
  storedTicketFor,
} from "@/lib/guest/session-tokens";

// A minimal in-memory Storage-like for the pure collector (Node env; no jsdom needed — the function takes
// an injectable StorageLike). Mirrors how localStorage exposes length / key(i) / getItem(k).
function fakeStorage(entries: Record<string, string>) {
  const keys = Object.keys(entries);
  return {
    length: keys.length,
    key: (i: number) => keys[i] ?? null,
    getItem: (k: string) => (k in entries ? entries[k] : null),
  };
}

describe("collectStoredSessionTokens", () => {
  it("returns [] when storage is empty", () => {
    expect(collectStoredSessionTokens(fakeStorage({}))).toEqual([]);
  });

  it("picks ONLY pr_session_* values, ignoring other keys", () => {
    const tokens = collectStoredSessionTokens(
      fakeStorage({
        pr_session_abc: "tok-a",
        pr_session_def: "tok-b",
        pr_pending_offer_abc: "1", // the return marker, a different pr_* key — must be ignored
        pr_save_prompt_abc: "1", // ditto
        // ★ THE NAME KEYS ARE NOT CAPABILITIES. `pr_guest_name_<qr>` and
        // `pr_guest_name_last` sit beside the session and hold a LABEL; handing
        // either to `claim_anonymous_uploads` as a token would be a name posted
        // to an RPC that expects a secret. The prefixes differ, so this is
        // already true: it is pinned rather than left to a reading of the code.
        pr_guest_name_abc: "Sam",
        pr_guest_name_last: "Sam",
        // ★ AND NEITHER IS THE EMAIL FLAG (the door's optional field).
        // `pr_guest_email_attached_<qr>` holds "1" and says only that this
        // device put an unconfirmed address on that event's row; the
        // ADDRESS is never written anywhere at all. Handing "1" to
        // `claim_anonymous_uploads` would post a literal where a secret is
        // expected, so the whole `pr_guest_email_` family is pinned out of the
        // scan here exactly as the name keys are.
        pr_guest_email_attached_abc: "1",
        // ★ AND NEITHER IS A SHARED PHONE'S ANSWER (claim-ask.ts): `pr_not_mine_<qr>` holds the
        // account ids that said a ticket was not theirs, never a token.
        pr_not_mine_abc: '["acct-1"]',
        theme: "dark",
        "sb-xyz-auth-token": "jwt",
      }),
    );
    expect(tokens.sort()).toEqual(["tok-a", "tok-b"]);
  });

  it("de-dupes repeated token values (same session across keys)", () => {
    const tokens = collectStoredSessionTokens(
      fakeStorage({ pr_session_a: "same", pr_session_b: "same" }),
    );
    expect(tokens).toEqual(["same"]);
  });

  it("drops empty values", () => {
    const tokens = collectStoredSessionTokens(
      fakeStorage({ pr_session_a: "", pr_session_b: "real" }),
    );
    expect(tokens).toEqual(["real"]);
  });
});

describe("collectStoredTickets", () => {
  it("names the album each ticket is for, from its key, and nothing that is not a ticket", () => {
    expect(
      collectStoredTickets(
        fakeStorage({
          pr_session_abc: "tok-a",
          pr_session_def: "",
          pr_not_mine_abc: '["acct-1"]',
          pr_guest_name_abc: "Sam",
          pr_session_ghi: "tok-g",
        }),
      ),
    ).toEqual([
      { album: "abc", token: "tok-a" },
      { album: "ghi", token: "tok-g" },
    ]);
  });

  it("keeps a token held under two albums on both (the claim's list de-dupes, the answer names both)", () => {
    expect(
      collectStoredTickets(
        fakeStorage({ pr_session_a: "same", pr_session_b: "same" }),
      ),
    ).toEqual([
      { album: "a", token: "same" },
      { album: "b", token: "same" },
    ]);
  });
});

describe("storedTicketFor", () => {
  it("reads the one album's ticket, and nothing kept beside it under another key", () => {
    const storage = fakeStorage({
      pr_session_abc: "tok-a",
      pr_session_def: "tok-b",
      pr_pending_offer_abc: "1",
      pr_guest_name_abc: "Sam",
    });
    expect(storedTicketFor("abc", storage)).toBe("tok-a");
    expect(storedTicketFor("def", storage)).toBe("tok-b");
    expect(storedTicketFor("xyz", storage)).toBeNull();
  });

  it("reads an empty value, and a store that refuses to be read, as no ticket", () => {
    expect(storedTicketFor("abc", fakeStorage({ pr_session_abc: "" }))).toBe(
      null,
    );
    const blocked = {
      getItem: () => {
        throw new Error("SecurityError");
      },
    };
    expect(storedTicketFor("abc", blocked)).toBeNull();
  });
});
