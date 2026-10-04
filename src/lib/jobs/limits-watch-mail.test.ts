/**
 * THE PLAN LIMITS' MAIL, red first: it names each crossing with its words (the share, the days left, "estimated" for a
 * computed meter), says what breaking each limit does once, wears the operator shell (the tagged subject, a plain-text
 * twin of the same words, an escaped name) and stays one readable line in a subject however many cross at once.
 */
import { describe, expect, it, vi } from "vitest";

import {
  assessMeter,
  type Crossing,
  type MeterTaken,
} from "@/lib/jobs/limits-watch";
import { meterById, type MeterId } from "@/lib/jobs/limits-watch-limits";

// templates.ts takes the canonical origin from site.ts, which validates the public env on import (the templates
// test's own note): unset here, so SITE_URL takes its production fallback.
vi.mock("@/lib/env", () => ({ env: {}, serverEnv: {} }));

const { limitsWatchEmail } = await import("@/lib/jobs/limits-watch-mail");

const NOW = Date.parse("2026-10-04T16:52:00.000Z");
const DAY = 24 * 60 * 60 * 1000;

function crossing(id: MeterId, taken: MeterTaken): Crossing {
  const def = meterById(id)!;
  const a = assessMeter(def, taken, { nowMs: NOW });
  if (a.state !== "read" || a.level === "ok")
    throw new Error(`${id} did not cross`);
  return { id, level: a.level, assessed: a };
}

const days = (value: number) =>
  Array.from({ length: 31 }, (_, i) => ({
    day: new Date(NOW - (30 - i) * DAY).toISOString().slice(0, 10),
    value,
  }));

const URL = "https://admin.partyreel.com/admin/jobs#plan-limits";

describe("the plan limits' mail", () => {
  // CPU at 98% on a flat 30 days (critical by its share); CDN requests at 55% but climbing: a warning on its days left.
  const cpu = crossing("vercel_active_cpu", {
    kind: "days",
    days: days(14_110 / 31),
  });
  const climbing = {
    kind: "days",
    days: Array.from({ length: 31 }, (_, i) => ({
      day: new Date(NOW - (30 - i) * DAY).toISOString().slice(0, 10),
      value: i < 23 ? 10_000 : 40_000,
    })),
  } as const;
  const cdn = crossing("vercel_cdn_requests", climbing);

  it("names each crossing with its share, its climb and its days left, and says a computed meter is estimated", () => {
    const mail = limitsWatchEmail({ crossings: [cpu, cdn], jobsUrl: URL });
    expect(mail.subject).toBe(
      "[Partyreel] Plan limits: Vercel Active CPU critical, Vercel CDN requests warning",
    );
    expect(mail.text).toContain("Vercel Active CPU (Critical)");
    expect(mail.text).toContain(
      "3 h 55 m of 4 h (98%). +8 m a day this week. Not reached within 30 days at that rate. Estimated: it is computed, not reported.",
    );
    expect(mail.text).toContain("Vercel CDN requests (Warning)");
    expect(mail.text).toContain(
      "550,000 of 1,000,000 (55%). +40,000 a day this week. About 15 days to the limit at that rate.",
    );
    // The estimate's flag belongs to the CPU line only.
    expect(mail.text.match(/Estimated: it is computed/g)).toHaveLength(1);
  });

  it("says what a break does once for a vendor's shared wording, and the foot opens the card", () => {
    const mail = limitsWatchEmail({ crossings: [cpu, cdn], jobsUrl: URL });
    expect(mail.text.match(/If it is passed:/g)).toHaveLength(1);
    expect(mail.text).toContain("the team's functions pause with it");
    expect(mail.text).toContain(`Open the plan limits: ${URL}`);
    expect(mail.html).toContain(`href="${URL}"`);
  });

  it("wears the shell: the same words in the html and the text, the thresholds named", () => {
    const mail = limitsWatchEmail({ crossings: [cdn], jobsUrl: URL });
    expect(mail.subject).toBe(
      "[Partyreel] Plan limits: Vercel CDN requests warning",
    );
    expect(mail.html).toContain("A plan limit is closing in");
    expect(mail.html).toContain("critical at 85%");
    expect(mail.text).toContain(
      "60% of its limit (or 30 days left at this week's rate)",
    );
    expect(mail.text).toContain("(or 7 days left)");
    expect(limitsWatchEmail({ crossings: [cpu], jobsUrl: URL }).html).toContain(
      "A plan limit is nearly reached",
    );
  });

  it("keeps a subject to three names and a count when a first run finds many", () => {
    const many = [
      cpu,
      cdn,
      crossing("vercel_invocations", { kind: "days", days: days(30_000) }),
      crossing("vercel_fast_data", { kind: "days", days: days(4e9) }),
      crossing("resend_month", { kind: "days", days: days(5_000) }),
    ];
    const subject = limitsWatchEmail({ crossings: many, jobsUrl: URL }).subject;
    expect(subject).toMatch(/and 2 more$/);
    expect(subject.length).toBeLessThan(170);
  });
});
