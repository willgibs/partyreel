import { render, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { METERS } from "@/lib/jobs/limits-watch-limits";

import { PlanLimitsDemo, type PlanLimitsState } from "./plan-limits-demo";

/**
 * THE PLAN LIMITS' SPECIMENS SHOW THE STATES THEIR LABELS CLAIM (`plan-limits-demo.tsx`), over the real card and the
 * real `METERS`: the healthy card is the one that says a plain OK, the critical one carries a critical meter and a
 * warning, a failed read has no bar and no number, a gap says Not wired, and a missing or unreadable run is said in
 * words. The card's own behavior is `limits-card.test.tsx`'s; this holds the fixtures to what the Library says they are,
 * so a meter added with no reader, or a card that stops saying a state, fails here and not only to a look.
 */

function draw(state: PlanLimitsState) {
  const { container } = render(<PlanLimitsDemo state={state} />);
  return container;
}

/** The chip in the card's title: the worst level, or what stands in for one. */
const chip = (c: HTMLElement) =>
  c.querySelector('[data-slot="card-title"] [data-slot="badge"]')?.textContent;

const rows = (c: HTMLElement, selector = "li[id^='limit-']") => [
  ...c.querySelectorAll<HTMLElement>(selector),
];

describe("the Plan limits specimens", () => {
  it("healthy: every meter read, a bar for each, and a plain OK with nothing to attend to", () => {
    const c = draw("healthy");
    expect(chip(c)).toBe("OK");
    expect(rows(c)).toHaveLength(METERS.length);
    expect(rows(c, "li[data-state='read']")).toHaveLength(METERS.length);
    expect(within(c).getAllByRole("progressbar")).toHaveLength(METERS.length);
    expect(c.querySelector("[data-level='critical']")).toBeNull();
    expect(c.querySelector("[data-level='warn']")).toBeNull();
    expect(c.textContent).toContain("Taken Oct 4, 2026, 05:00 UTC");
  });

  it("critical: the chip takes the worst, a critical meter says what breaking it costs, a floor says at least", () => {
    const c = draw("critical");
    expect(chip(c)).toBe("Critical");
    const critical = rows(c, "li[data-level='critical']");
    expect(critical.map((r) => r.id)).toEqual(["limit-vercel_active_cpu"]);
    expect(critical[0].textContent).toContain("estimated");
    expect(critical[0].textContent).toMatch(/Past a Hobby limit/);
    expect(rows(c, "li[data-level='warn']").map((r) => r.id)).toEqual([
      "limit-vercel_cdn_requests",
    ]);
    expect(c.querySelector("#limit-r2_storage")?.textContent).toMatch(
      /at least/,
    );
  });

  it("failed: Vercel's four meters say No reading and why in the failure tone, with no bar and no number", () => {
    const c = draw("failed");
    expect(chip(c)).toBe("No reading");
    const failed = rows(c, "li[data-state='none']").filter(
      (r) => r.querySelector(".text-destructive") !== null,
    );
    expect(failed.map((r) => r.id).sort()).toEqual(
      [
        "limit-vercel_active_cpu",
        "limit-vercel_cdn_requests",
        "limit-vercel_fast_data",
        "limit-vercel_invocations",
      ].sort(),
    );
    for (const r of failed) {
      expect(r.textContent).toContain("Vercel refused the token");
      expect(within(r).queryByRole("progressbar")).toBeNull();
      expect(r.textContent).not.toMatch(/\d+%/);
    }
  });

  it("gaps: every meter the watch has no reader for says so in words and no tone, and the chip says Partly read", () => {
    const c = draw("gaps");
    const gapIds = METERS.filter((m) => m.gap).map((m) => `limit-${m.id}`);
    expect(gapIds.length).toBeGreaterThan(0);
    const none = rows(c, "li[data-state='none']");
    expect(none.map((r) => r.id).sort()).toEqual([...gapIds].sort());
    // "Not wired" is the card's word for a credential the app does not hold.
    expect(none.some((r) => /Not wired/.test(r.textContent ?? ""))).toBe(true);
    for (const r of none) {
      expect(r.querySelector(".text-destructive")).toBeNull();
      expect(within(r).queryByRole("progressbar")).toBeNull();
    }
    expect(chip(c)).toBe("Partly read");
    expect(c.textContent).toContain(
      `${gapIds.length} of ${METERS.length} meters have no reading`,
    );
  });

  it("never read and unreadable: said in words, with no table and no calm chip", () => {
    const never = draw("never");
    expect(chip(never)).toBe("Not read yet");
    expect(never.textContent).toMatch(/No plan-limits reading yet/);
    expect(rows(never)).toHaveLength(0);

    const unreadable = draw("unreadable");
    expect(chip(unreadable)).toBe("Not read yet");
    expect(unreadable.textContent).toMatch(
      /The plan limits could not be read: plan limits: its own history: connection reset/,
    );
    expect(rows(unreadable)).toHaveLength(0);
  });
});
