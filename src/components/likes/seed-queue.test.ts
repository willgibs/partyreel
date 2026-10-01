import { afterEach, describe, expect, it, vi } from "vitest";

import { SLOT_TIMEOUT_MS } from "@/lib/album/links";

import { createSeedQueue } from "./seed-queue";

/**
 * THE HEARTS' SEED, pure (crumbs-40): the account it asks for is read at every ask and followed as it changes, and a
 * burst's asks go two out at once, the rest as one. The provider's own pins drive it through the product
 * (`likes-provider.test.tsx`); these hold the machine's edges: the stall, the order of looks, a read that fails.
 */

type Answer = { data: unknown; error: { code: string } | null };

function harness(account: string | null = "u1") {
  const hearts = new Set<string>();
  const store = {
    set: (id: string, on: boolean) =>
      void (on ? hearts.add(id) : hearts.delete(id)),
    clear: () => hearts.clear(),
  };
  const who = { account };
  const readAccount = vi.fn(async () => who.account);
  const answers: ((answer: Answer) => void)[] = [];
  const asked: string[][] = [];
  const askLiked = vi.fn(
    (ids: string[]) =>
      new Promise<Answer>((resolve) => {
        asked.push(ids);
        answers.push(resolve);
      }),
  );
  const onFailed = vi.fn();
  const queue = createSeedQueue({ store, readAccount, askLiked, onFailed });
  /** Lets the pump and every awaited read run. */
  const settle = async () => {
    for (let i = 0; i < 10; i++) await Promise.resolve();
  };
  return {
    queue,
    hearts,
    who,
    readAccount,
    askLiked,
    asked,
    answers,
    onFailed,
    settle,
  };
}

afterEach(() => {
  vi.useRealTimers();
});

describe("createSeedQueue: the asks", () => {
  it("one tick's seeds are one ask; two are out at once and the rest wait as one", async () => {
    const h = harness();
    h.queue.seed(["a", "b"]);
    h.queue.seed(["b", "c"]);
    await h.settle();
    expect(h.asked).toEqual([["a", "b", "c"]]);

    h.queue.seed(["d"]);
    await h.settle();
    h.queue.seed(["e"]);
    await h.settle();
    h.queue.seed(["f"]);
    await h.settle();
    // Two out ([a,b,c] and [d]); e and f wait.
    expect(h.asked).toEqual([["a", "b", "c"], ["d"]]);

    h.answers[0]({ data: ["b"], error: null });
    await h.settle();
    expect(h.asked.at(-1)).toEqual(["e", "f"]);
    expect(h.hearts).toEqual(new Set(["b"]));
  });

  it("an ask out past the slot's time gives its place up, and still lands", async () => {
    vi.useFakeTimers();
    const h = harness();
    h.queue.seed(["a"]);
    await h.settle();
    h.queue.seed(["b"]);
    await h.settle();
    h.queue.seed(["c"]);
    await h.settle();
    expect(h.asked).toEqual([["a"], ["b"]]);

    await vi.advanceTimersByTimeAsync(SLOT_TIMEOUT_MS);
    await h.settle();
    expect(h.asked).toEqual([["a"], ["b"], ["c"]]);

    h.answers[0]({ data: ["a"], error: null });
    await h.settle();
    expect(h.hearts.has("a")).toBe(true);
  });

  it("never asks an answered id again for the same account", async () => {
    const h = harness();
    h.queue.seed(["a"]);
    await h.settle();
    h.answers[0]({ data: [], error: null });
    await h.settle();
    h.queue.seed(["a", "b"]);
    await h.settle();
    expect(h.asked).toEqual([["a"], ["b"]]);
  });
});

describe("createSeedQueue: the account", () => {
  it("asks nothing with nobody signed in, and marks nothing answered", async () => {
    const h = harness(null);
    h.queue.seed(["a"]);
    await h.settle();
    expect(h.askLiked).not.toHaveBeenCalled();

    // She signs in: what the album mounted is asked for her.
    h.who.account = "u1";
    h.queue.follow("u1");
    await h.settle();
    expect(h.asked).toEqual([["a"]]);
  });

  it("the first look takes nothing away, a sign-out takes every heart, and another account is asked afresh", async () => {
    const h = harness();
    h.hearts.add("painted-before-any-read");
    expect(await h.queue.look()).toBe("u1");
    expect(h.hearts.has("painted-before-any-read")).toBe(true);

    h.queue.seed(["a"]);
    await h.settle();
    h.answers[0]({ data: ["a"], error: null });
    await h.settle();

    h.queue.follow(null);
    expect(h.hearts.size).toBe(0);

    h.who.account = "u2";
    h.queue.follow("u2");
    await h.settle();
    expect(h.asked).toEqual([["a"], ["a"]]);
  });

  it("the newest look wins over an older read that lands after it", async () => {
    const h = harness();
    await h.queue.look();
    let slow!: (account: string | null) => void;
    h.readAccount.mockImplementationOnce(
      () => new Promise((resolve) => (slow = resolve)),
    );
    const older = h.queue.look();
    h.who.account = null;
    await h.queue.look();
    expect(h.queue.account()).toBeNull();
    slow("u1");
    await older;
    expect(h.queue.account()).toBeNull();
  });

  it("a read that fails keeps what is drawn", async () => {
    const h = harness();
    await h.queue.look();
    h.hearts.add("a");
    h.readAccount.mockRejectedValueOnce(new Error("storage blocked"));
    expect(await h.queue.look()).toBe("u1");
    expect(h.hearts.has("a")).toBe(true);
  });

  it("reports a refusal while the account stands, never one the session's end explains", async () => {
    const h = harness();
    h.queue.seed(["a"]);
    await h.settle();
    h.answers[0]({ data: null, error: { code: "57014" } });
    await h.settle();
    expect(h.onFailed).toHaveBeenCalledWith({ code: "57014" }, 1);

    h.queue.seed(["b"]);
    await h.settle();
    h.who.account = null;
    h.answers[1]({ data: null, error: { code: "42501" } });
    await h.settle();
    expect(h.onFailed).toHaveBeenCalledTimes(1);
  });
});
