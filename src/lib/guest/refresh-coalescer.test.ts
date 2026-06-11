import { describe, expect, it } from "vitest";

import { createRefreshCoalescer } from "./refresh-coalescer";

/** Deterministic clock + timer harness. */
function harness(opts?: { jitter?: number }) {
  let t = 1000;
  const fires: number[] = [];
  const timers: { at: number; cb: () => void; id: number; cleared: boolean }[] = [];
  let nextId = 1;
  const c = createRefreshCoalescer(() => fires.push(t), {
    windowMs: 2000,
    jitterMs: 400,
    now: () => t,
    random: () => opts?.jitter ?? 0,
    setTimeoutFn: (cb, ms) => {
      const id = nextId++;
      timers.push({ at: t + ms, cb, id, cleared: false });
      return id as unknown as ReturnType<typeof setTimeout>;
    },
    clearTimeoutFn: (id) => {
      const timer = timers.find((x) => x.id === (id as unknown as number));
      if (timer) timer.cleared = true;
    },
  });
  const advance = (ms: number) => {
    const target = t + ms;
    for (const timer of timers.filter((x) => !x.cleared && x.at <= target)) {
      t = timer.at;
      timer.cleared = true;
      timer.cb();
    }
    t = target;
  };
  return { c, fires, advance, timers };
}

describe("refresh coalescer", () => {
  it("fires immediately on the leading edge", () => {
    const { c, fires } = harness();
    c.ping();
    expect(fires).toEqual([1000]);
  });

  it("suppresses pings inside the window, then fires ONE trailing refresh", () => {
    const { c, fires, advance } = harness();
    c.ping(); // fires at 1000, window until 3000
    advance(500);
    c.ping(); // suppressed -> schedules trailing at 3000
    advance(300);
    c.ping(); // still suppressed, no second timer
    advance(5000);
    expect(fires).toEqual([1000, 3000]);
  });

  it("a ping after the window fires immediately again", () => {
    const { c, fires, advance } = harness();
    c.ping();
    advance(2500); // past the 2000ms window, no suppressed pings -> no trailing
    c.ping();
    expect(fires).toEqual([1000, 3500]);
  });

  it("quiet windows never produce a trailing fire", () => {
    const { c, fires, advance } = harness();
    c.ping();
    advance(10_000);
    expect(fires).toEqual([1000]);
  });

  it("jitter extends the suppression window", () => {
    const { c, fires, advance } = harness({ jitter: 1 }); // full 400ms jitter
    c.ping(); // window until 3400
    advance(2100);
    c.ping(); // 3100 < 3400 -> suppressed, trailing at 3400
    advance(2000);
    expect(fires).toEqual([1000, 3400]);
  });

  it("dispose cancels a pending trailing fire", () => {
    const { c, fires, advance } = harness();
    c.ping();
    advance(500);
    c.ping(); // trailing scheduled
    c.dispose();
    advance(10_000);
    expect(fires).toEqual([1000]);
  });
});
