import { describe, expect, it } from "vitest";

import {
  DRIFT,
  ERASE_MS,
  FOLD_MS,
  foldAt,
  GAP_MS,
  rateAt,
  scoreOf,
  stepAt,
  typedAt,
} from "./typing";

/**
 * The typewriter's score is what three things read at once (the frames' loop,
 * their captions and the score printed under an option), so its shape is held
 * here: the loop visits every address once and closes on the demo's own, the
 * text is always a prefix of the address it is about, a drifting stream is
 * full while an address stands and never stops, and a rewinding album is
 * folded whenever the address is not standing.
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

  it("runs the stream full while an address stands and slows it to a drift, never a stop, while it types", () => {
    expect(rateAt(score, 10)).toBe(1);
    let least = 1;
    for (let t = 0; t < score.loop * 2; t += 5) {
      const r = rateAt(score, t);
      least = Math.min(least, r);
      expect(r).toBeGreaterThanOrEqual(DRIFT);
      expect(r).toBeLessThanOrEqual(1);
      const phase = stepAt(score, t).phase;
      if (phase !== "hold") expect(r).toBe(DRIFT);
    }
    expect(least).toBe(DRIFT);
    // Mid-hold, clear of both ramps, the stream is at full.
    const hold = score.steps.find((s) => s.phase === "hold" && s.party === 1)!;
    expect(rateAt(score, (hold.from + hold.to) / 2)).toBe(1);
  });

  it("is a still address when there is only the demo's own", () => {
    const one = scoreOf(["our-party"], PACE);
    expect(one.steps).toHaveLength(1);
    expect(typedAt(one, 123_456).text).toBe("our-party");
    expect(rateAt(one, 99_999)).toBe(1);
    expect(foldAt(one, 99_999).fold).toBe(0);
  });

  it("pours an address's album while it stands and folds it before the erase", () => {
    const hold = score.steps.find((s) => s.phase === "hold" && s.party === 1)!;
    // Poured from its landing, the burst's clock starting there.
    expect(foldAt(score, hold.from + 10)).toEqual({ fold: 0, since: 10 });
    // Folding over the stand's last FOLD_MS, its clock held where it began.
    const mid = foldAt(score, hold.to - FOLD_MS / 2);
    expect(mid.fold).toBeGreaterThan(0.4);
    expect(mid.fold).toBeLessThan(0.6);
    expect(mid.since).toBe(hold.to - hold.from - FOLD_MS);
    // Wholly folded by the erase, and held so until the next address lands.
    for (let t = 0; t < score.loop * 2; t += 11) {
      const step = stepAt(score, t);
      const f = foldAt(score, t);
      expect(f.fold).toBeGreaterThanOrEqual(0);
      expect(f.fold).toBeLessThanOrEqual(1);
      if (step.phase !== "hold") expect(f.fold).toBe(1);
    }
  });

  it("freezes a folded album where the stand before the change began to fold", () => {
    const erase = score.steps.find(
      (s) => s.phase === "erase" && s.party === 1,
    )!;
    const before = score.steps[score.steps.indexOf(erase) - 1];
    expect(before.phase).toBe("hold");
    const f = foldAt(score, erase.from + 5);
    expect(f.since).toBe(before.to - before.from - FOLD_MS);
  });
});
