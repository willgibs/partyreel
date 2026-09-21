import { describe, expect, it } from "vitest";

import { collectStoredSessionTokens } from "@/lib/guest/session-tokens";

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
        pr_pending_save_e1: "1", // a different pr_* key — must be ignored
        pr_save_prompt_abc: "1", // ditto
        // ★ THE NAME KEYS ARE NOT CAPABILITIES (the identity reshape,
        // 2026-09-21). `pr_guest_name_<qr>` and `pr_guest_name_last` sit beside
        // the session and hold a LABEL; handing either to
        // `claim_anonymous_uploads` as a token would be a name posted to an RPC
        // that expects a secret. The prefixes differ, so this is already true:
        // it is pinned rather than left to a reading of the code.
        pr_guest_name_abc: "Sam",
        pr_guest_name_last: "Sam",
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
