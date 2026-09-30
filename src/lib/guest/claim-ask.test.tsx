import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  claimAskWords,
  currentClaimAsks,
  NOT_MINE_PREFIX,
  publishClaimAsks,
  rememberNotMine,
  saidNotMine,
  settleClaimAsk,
  subscribeClaimAsks,
  type ClaimAsk,
} from "@/lib/guest/claim-ask";

/**
 * THE ASK ON A SHARED PHONE (shared-claims). A ticket typed under a name at odds with the account's
 * is never claimed in silence: the phone asks, once, in plain words, and remembers a "Not mine" for
 * that account and those albums. What is pinned: the words, the queue every host reads, and the
 * answer's memory (never a token, never across accounts, never a crash on blocked storage).
 */

function ask(over: Partial<ClaimAsk> = {}): ClaimAsk {
  return {
    account: "acct-sam",
    name: "Dana",
    uploads: 3,
    tickets: [
      { album: "album-1", token: "tok-1" },
      { album: "album-2", token: "tok-2" },
    ],
    ...over,
  };
}

beforeEach(() => {
  localStorage.clear();
  publishClaimAsks([]);
});

describe("the words", () => {
  it("say the brief's sentence, counted, and ask one question", () => {
    expect(claimAskWords({ name: "Dana", uploads: 3 })).toEqual({
      title: "3 photos were added on this phone as Dana",
      question: "Are they yours? If they are, they join your account.",
      mine: "They're mine",
      notMine: "Not mine",
    });
  });

  it("speak of one photo in the singular", () => {
    expect(claimAskWords({ name: "Dana", uploads: 1 })).toEqual({
      title: "1 photo was added on this phone as Dana",
      question: "Is it yours? If it is, it joins your account.",
      mine: "It's mine",
      notMine: "Not mine",
    });
  });

  it("group a big number the house way", () => {
    expect(claimAskWords({ name: "Dana", uploads: 1200 }).title).toBe(
      "1,200 photos were added on this phone as Dana",
    );
  });
});

describe("the queue", () => {
  it("publishes asks to every subscriber and settles one at a time", () => {
    const heard = vi.fn();
    const stop = subscribeClaimAsks(heard);
    const first = ask();
    const second = ask({
      name: "Mike",
      tickets: [{ album: "a3", token: "t3" }],
    });
    publishClaimAsks([first, second]);
    expect(currentClaimAsks()).toEqual([first, second]);
    settleClaimAsk(first);
    expect(currentClaimAsks()).toEqual([second]);
    expect(heard).toHaveBeenCalledTimes(2);
    stop();
  });

  it("keeps an ask already queued when the same one is published again, so a shown ask stays shown", () => {
    const first = ask();
    publishClaimAsks([first]);
    publishClaimAsks([ask()]);
    expect(currentClaimAsks()[0]).toBe(first);
  });

  it("settling an ask that is not queued changes nothing and tells nobody", () => {
    const heard = vi.fn();
    publishClaimAsks([ask()]);
    const stop = subscribeClaimAsks(heard);
    settleClaimAsk(ask({ name: "Nobody" }));
    expect(heard).not.toHaveBeenCalled();
    expect(currentClaimAsks()).toHaveLength(1);
    stop();
  });
});

describe("the answer's memory", () => {
  it("remembers a Not mine for the account asked, on every album the ask covered", () => {
    rememberNotMine(ask());
    expect(saidNotMine("acct-sam", "album-1")).toBe(true);
    expect(saidNotMine("acct-sam", "album-2")).toBe(true);
    // Another account on the same phone was never asked, and a third album was never in question.
    expect(saidNotMine("acct-dana", "album-1")).toBe(false);
    expect(saidNotMine("acct-sam", "album-3")).toBe(false);
  });

  it("keeps each account's answer beside the others', once each", () => {
    rememberNotMine(ask());
    rememberNotMine(ask({ account: "acct-mike" }));
    rememberNotMine(ask());
    expect(
      JSON.parse(localStorage.getItem(`${NOT_MINE_PREFIX}album-1`)!),
    ).toEqual(["acct-sam", "acct-mike"]);
  });

  it("★ never writes a token: the answer is keyed on the album and holds account ids alone", () => {
    rememberNotMine(ask());
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)!;
      expect(key).not.toContain("tok-");
      expect(localStorage.getItem(key)).not.toContain("tok-");
    }
  });

  it("reads a damaged answer as none, and survives storage that throws", () => {
    localStorage.setItem(`${NOT_MINE_PREFIX}album-1`, "{not json");
    expect(saidNotMine("acct-sam", "album-1")).toBe(false);
    const getItem = vi
      .spyOn(Storage.prototype, "getItem")
      .mockImplementation(() => {
        throw new DOMException("blocked", "SecurityError");
      });
    const setItem = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new DOMException("blocked", "SecurityError");
      });
    expect(saidNotMine("acct-sam", "album-1")).toBe(false);
    expect(() => rememberNotMine(ask())).not.toThrow();
    getItem.mockRestore();
    setItem.mockRestore();
  });
});
