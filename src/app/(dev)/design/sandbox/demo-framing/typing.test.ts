import { describe, expect, it } from "vitest";

import {
  DOWN_MS,
  DRIFT,
  ERASE_MS,
  GAP_MS,
  scoreOf,
  stepAt,
  typedAt,
  WARP,
  WARP_IN_MS,
  WARP_OUT_MS,
  warpAt,
  warpSince,
  WAVE_MS,
  waveAt,
} from "./typing";

/**
 * The typewriter's score is what three things read at once (the frames' loop,
 * their captions and the score printed under a hero), so its shape is held
 * here: the loop visits every address once and closes on the demo's own, the
 * text is always a prefix of the address it is about, the stream drifts
 * (never stops) while an address types and leaves each landing at lightspeed
 * before settling, and a wall of photographs rests whenever the address is not
 * standing and fills anew as the next lands.
 */
const PACE = { hold: 3000, restHold: 4000 };
const LIST = ["our-party", "our-wedding", "my-30th"];

describe("the typewriter's score", () => {
  const score = scoreOf(LIST, PACE);

  it("stands on the demo's own address first and closes by typing it back", () => {
    expect(score.steps[0]).toMatchObject({
      phase: "hold",
      slug: "our-party",
      from: 0,
      to: 4000,
    });
    const last = score.steps[score.steps.length - 1];
    expect(last).toMatchObject({ phase: "type", slug: "our-party" });
    expect(last.to).toBe(score.loop);
    // Every step starts where the one before it ended: no hole, no overlap.
    score.steps.forEach((s, i) => {
      if (i > 0) expect(s.from).toBe(score.steps[i - 1].to);
    });
  });

  it("holds each host's address once, in order", () => {
    const held = score.steps
      .filter((s) => s.phase === "hold")
      .map((s) => s.slug);
    expect(held).toEqual(LIST);
  });

  it("never types the address already standing", () => {
    const again = scoreOf(["our-party", "our-party", "my-30th"], PACE);
    expect(again.addresses).toEqual(["our-party", "my-30th"]);
  });

  it("reads a prefix of the address at every instant, and the whole of it while it stands", () => {
    for (let t = 0; t < score.loop * 2; t += 7) {
      const typed = typedAt(score, t);
      const step = stepAt(score, t);
      expect(step.slug.startsWith(typed.text)).toBe(true);
      if (typed.phase === "hold") expect(typed.text).toBe(step.slug);
      if (typed.phase === "gap") expect(typed.text).toBe("");
    }
  });

  it("erases a key every ERASE_MS and waits GAP_MS on the bare domain", () => {
    const erase = score.steps[1];
    expect(erase.phase).toBe("erase");
    expect(erase.to - erase.from).toBe("our-party".length * ERASE_MS);
    expect(score.steps[2]).toMatchObject({ phase: "gap" });
    expect(score.steps[2].to - score.steps[2].from).toBe(GAP_MS);
  });

  it("shows no caret on arrival, and one on every landing after", () => {
    expect(typedAt(score, 100).caret).toBe(0);
    expect(typedAt(score, score.loop + 100).caret).toBe(1);
    const firstHost = score.steps.find(
      (s) => s.phase === "hold" && s.party === 1,
    )!;
    expect(typedAt(score, firstHost.from + 50).caret).toBe(1);
    expect(typedAt(score, firstHost.to - 10).caret).toBe(0);
  });

  it("keeps the address that stood out until the next one lands", () => {
    const type = score.steps.find((s) => s.phase === "type" && s.party === 1)!;
    expect(typedAt(score, type.from + 1).standing).toBe(0);
    expect(typedAt(score, type.to + 1).standing).toBe(1);
  });

  it("drifts the stream while an address types, never stopping, and runs it full on arrival", () => {
    expect(warpAt(score, 10)).toBe(1);
    for (let t = 0; t < score.loop * 2; t += 5) {
      const r = warpAt(score, t);
      expect(r).toBeGreaterThanOrEqual(DRIFT);
      expect(r).toBeLessThanOrEqual(WARP);
      if (stepAt(score, t).phase !== "hold") expect(r).toBe(DRIFT);
    }
  });

  it("leaves every landing after the first at lightspeed, then settles to full before slowing for the erase", () => {
    const hold = score.steps.find((s) => s.phase === "hold" && s.party === 1)!;
    // The peak, a breath after the landing.
    expect(warpAt(score, hold.from + WARP_IN_MS)).toBeCloseTo(WARP, 5);
    // Settled to full once the warp is spent, and slowing only at the end.
    const settled = hold.from + WARP_IN_MS + WARP_OUT_MS + 1;
    expect(warpAt(score, settled)).toBeCloseTo(1, 5);
    expect(warpAt(score, hold.to - DOWN_MS / 2)).toBeLessThan(1);
    expect(warpAt(score, hold.to - DOWN_MS / 2)).toBeGreaterThan(DRIFT);
    // The curve only falls once it has peaked: a jump, never a stutter.
    let prev = Infinity;
    for (let ms = WARP_IN_MS; ms <= WARP_IN_MS + WARP_OUT_MS; ms += 10) {
      const r = warpSince(ms);
      expect(r).toBeLessThanOrEqual(prev + 1e-9);
      prev = r;
    }
    // On the loop's second pass the demo's own landing warps too.
    expect(warpAt(score, score.loop + WARP_IN_MS)).toBeCloseTo(WARP, 5);
  });

  it("is a still address when there is only the demo's own", () => {
    const one = scoreOf(["our-party"], PACE);
    expect(one.steps).toHaveLength(1);
    expect(typedAt(one, 123_456).text).toBe("our-party");
    expect(warpAt(one, 99_999)).toBe(1);
    expect(waveAt(one, 99_999)).toEqual({ since: WAVE_MS * 4, rest: 0 });
  });

  it("fills a wall anew from each landing and rests it while the next types", () => {
    const hold = score.steps.find((s) => s.phase === "hold" && s.party === 1)!;
    expect(waveAt(score, hold.from + 10)).toEqual({ since: 10, rest: 0 });
    // The arrival's wall is already full.
    expect(waveAt(score, 10).since).toBeGreaterThan(WAVE_MS);
    for (let t = 0; t < score.loop * 2; t += 11) {
      const w = waveAt(score, t);
      expect(w.rest).toBeGreaterThanOrEqual(0);
      expect(w.rest).toBeLessThanOrEqual(1);
      if (stepAt(score, t).phase !== "hold") expect(w.rest).toBe(1);
    }
    expect(waveAt(score, hold.to - 1).rest).toBeGreaterThan(0.9);
  });
});
