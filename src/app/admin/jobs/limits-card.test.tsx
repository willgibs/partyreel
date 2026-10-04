import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PlanLimitsCard } from "@/app/admin/jobs/limits-card";
import type { StoredLimits, StoredMeter } from "@/lib/jobs/limits-watch";
import { METERS, type MeterId } from "@/lib/jobs/limits-watch-limits";

/**
 * THE PLAN LIMITS' CARD (admin-observability.md, "Plan limits"): a meter is drawn as what it is (a bar and its words
 * under a level's chip, "at least" for a floor, "estimated" for a computed meter, what breaking it costs when it is
 * past a threshold), never as a number it is not: a meter that could not be read says "No reading" and why and has no
 * bar, a failed read in the failure tone; and an unreadable, empty or stale run says so in words, never a calm card.
 */

const AT = Date.parse("2026-10-04T05:00:00.000Z");
const NOW = AT + 60 * 60 * 1000;

function read(
  share: number,
  used: number,
  level: "ok" | "warn" | "critical" = "ok",
  extra: Partial<Extract<StoredMeter, { state: "read" }>> = {},
): StoredMeter {
  return {
    state: "read",
    used,
    share,
    level,
    rate: null,
    daysLeft: null,
    atLeast: false,
    ...extra,
  };
}

/** A quiet run: every meter with a reader a few percent in, every other a gap that says why. */
function quiet(over: Partial<Record<MeterId, StoredMeter>> = {}): StoredLimits {
  const meters: Partial<Record<MeterId, StoredMeter>> = {};
  for (const def of METERS) {
    meters[def.id] = def.gap
      ? { state: "none", cause: def.gap.cause, why: def.gap.why }
      : read(0.05, def.limit * 0.05);
  }
  return { atMs: AT, meters: { ...meters, ...over } };
}

/** Every meter read, a few percent in: the one card that may say a plain OK. */
function allRead(
  over: Partial<Record<MeterId, StoredMeter>> = {},
): StoredLimits {
  const meters: Partial<Record<MeterId, StoredMeter>> = {};
  for (const def of METERS) meters[def.id] = read(0.05, def.limit * 0.05);
  return { atMs: AT, meters: { ...meters, ...over } };
}

function card(
  limits: StoredLimits | null,
  opts: { unreadable?: string | null; nowMs?: number } = {},
) {
  return render(
    <PlanLimitsCard
      latest={
        limits
          ? { limits, startedAt: new Date(AT).toISOString(), status: "ok" }
          : null
      }
      unreadable={opts.unreadable ?? null}
      nowMs={opts.nowMs ?? NOW}
    />,
  );
}

/** The chip in the card's title: the worst level, or what stands in for one. */
function headline(container: HTMLElement): string | null | undefined {
  return container.querySelector('[data-slot="card-title"] [data-slot="badge"]')
    ?.textContent;
}

function row(container: HTMLElement, id: MeterId): HTMLElement {
  const el = container.querySelector<HTMLElement>(`#limit-${id}`);
  if (!el) throw new Error(`no row for ${id}`);
  return el;
}

describe("a quiet card", () => {
  it("heads each vendor with its plan, draws every meter, and says OK with no attention line", () => {
    const { container } = card(allRead());
    expect(container.querySelector("#plan-limits")).not.toBeNull();
    expect(screen.getByText("Plan limits")).toBeInTheDocument();
    expect(headline(container)).toBe("OK");
    expect(
      screen.getByRole("heading", { name: "Vercel Hobby plan" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Supabase Pro plan" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Cloudflare Free plan" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Resend Free plan" }),
    ).toBeInTheDocument();
    for (const def of METERS) {
      expect(row(container, def.id)).toBeInTheDocument();
    }
    expect(screen.getAllByRole("progressbar")).toHaveLength(METERS.length);
    expect(container.querySelector('[data-level="critical"]')).toBeNull();
    expect(
      screen.getByText("Taken Oct 4, 2026, 05:00 UTC"),
    ).toBeInTheDocument();
  });

  it("says OK, and counts them, when the only meters unread are ones the vendor's API cannot answer", () => {
    const limits = allRead({
      vercel_fast_origin: {
        state: "none",
        cause: "unavailable",
        why: "no API",
      },
      vercel_image_transforms: {
        state: "none",
        cause: "unavailable",
        why: "no API",
      },
    });
    const { container } = card(limits);
    expect(headline(container)).toBe("OK");
    expect(
      screen.getByText(
        `Taken Oct 4, 2026, 05:00 UTC · 2 of ${METERS.length} meters have no reading`,
      ),
    ).toBeInTheDocument();
  });

  it("★ never says a plain OK over meters that have no reading: it says Partly read and counts them", () => {
    const { container } = card(quiet());
    expect(headline(container)).toBe("Partly read");
    expect(
      screen.getByText(
        `Taken Oct 4, 2026, 05:00 UTC · ${METERS.filter((m) => m.gap).length} of ${METERS.length} meters have no reading`,
      ),
    ).toBeInTheDocument();
    // One bar for each meter that reads, none for a gap.
    expect(screen.getAllByRole("progressbar")).toHaveLength(
      METERS.filter((m) => !m.gap).length,
    );
  });

  it("states the thresholds the badge and the mail use, and that a crossing is mailed once", () => {
    card(quiet());
    expect(
      screen.getByText(
        /A warning at 60% of a limit or 30 days left at this week.s rate, critical at 85% or 7 days/,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/mailed once a crossing, never daily/),
    ).toBeInTheDocument();
  });
});

describe("★ a meter is drawn as what it is", () => {
  it("shows a critical meter with its numbers, its days left, what a break costs, and 'estimated' for a computed one", () => {
    const limits = quiet({
      vercel_active_cpu: read(0.98, 14_110, "critical", {
        rate: 1_067,
        daysLeft: 0.28,
      }),
    });
    const { container } = card(limits);
    const cpu = row(container, "vercel_active_cpu");
    expect(cpu).toHaveAttribute("data-level", "critical");
    expect(within(cpu).getByText("Critical")).toBeInTheDocument();
    expect(within(cpu).getByText("estimated")).toBeInTheDocument();
    expect(within(cpu).getByText("3 h 55 m of 4 h (98%)")).toBeInTheDocument();
    expect(
      within(cpu).getByText(
        "+18 m a day this week · Under a day to the limit at that rate",
      ),
    ).toBeInTheDocument();
    expect(
      within(cpu).getByText(/the team's functions pause with it/),
    ).toBeInTheDocument();
    expect(
      within(cpu).getByRole("progressbar", {
        name: "Active CPU: 98% of the plan's limit",
      }),
    ).toHaveAttribute("aria-invalid", "true");
    // The headline takes the worst level.
    expect(headline(container)).toBe("Critical");
  });

  it("shows a warning in the warning light, and a quiet meter in neither", () => {
    const limits = quiet({ vercel_cdn_requests: read(0.74, 741_697, "warn") });
    const { container } = card(limits);
    const cdn = row(container, "vercel_cdn_requests");
    expect(within(cdn).getByText("Warning")).toBeInTheDocument();
    expect(
      within(cdn).getByText("741,697 of 1,000,000 (74%)"),
    ).toBeInTheDocument();
    expect(within(cdn).getByRole("progressbar").className).toContain(
      "progress-indicator]]:bg-warning",
    );
    const invocations = row(container, "vercel_invocations");
    expect(within(invocations).getByRole("progressbar")).not.toHaveAttribute(
      "aria-invalid",
    );
    expect(within(invocations).queryByText(/Past a Hobby limit/)).toBeNull();
  });

  it("says 'at least' for a floor and warming up for a climb it cannot tell yet", () => {
    const limits = quiet({
      r2_storage: read(0.087, 870_000_000, "ok", { atLeast: true }),
    });
    const { container } = card(limits);
    const r2 = row(container, "r2_storage");
    expect(
      within(r2).getByText("at least 870 MB of 10 GB (9%)"),
    ).toBeInTheDocument();
    expect(within(r2).getByText(/warming up/)).toBeInTheDocument();
  });

  it("★ gives a meter that could not be read no bar and no number, only 'No reading' and why", () => {
    const limits = quiet({
      vercel_invocations: {
        state: "none",
        cause: "failed",
        why: "Vercel refused the token (HTTP 403): mint a new VERCEL_USAGE_TOKEN",
      },
    });
    const { container } = card(limits);
    const failed = row(container, "vercel_invocations");
    expect(within(failed).getByText("No reading")).toBeInTheDocument();
    expect(
      within(failed).getByText(/Vercel refused the token \(HTTP 403\)/),
    ).toHaveClass("text-destructive");
    expect(within(failed).queryByRole("progressbar")).toBeNull();
    expect(failed.textContent).not.toMatch(/\d+%/);
    // A failed read is not a calm card: the headline says it when nothing else is wrong.
    expect(headline(container)).toBe("No reading");
  });

  it("says a gap in words and no tone, with the plan's limit it would be measured against", () => {
    const { container } = card(quiet());
    const egress = row(container, "supabase_egress");
    expect(egress).toHaveAttribute("data-state", "none");
    expect(within(egress).getByText("No reading")).toBeInTheDocument();
    expect(
      within(egress).getByText(/Supabase personal access token/),
    ).not.toHaveClass("text-destructive");
    expect(
      within(egress).getByText(/Plan limit: 250 GB a billing month/),
    ).toBeInTheDocument();
    // A gap is not a failure: the card is partly read, never red.
    expect(headline(container)).toBe("Partly read");
  });

  it("draws a meter this run did not carry as not in this run, never as zero", () => {
    const limits = quiet();
    delete limits.meters.resend_month;
    const { container } = card(limits);
    expect(
      within(row(container, "resend_month")).getByText("Not in this run"),
    ).toBeInTheDocument();
  });
});

describe("★ a run it cannot show is said in words", () => {
  it("says an unreadable run, and draws no table and no calm chip", () => {
    const { container } = card(quiet(), {
      unreadable: "plan limits: its own history: connection reset",
    });
    expect(
      screen.getByText(
        /The plan limits could not be read: plan limits: its own history: connection reset/,
      ),
    ).toBeInTheDocument();
    expect(headline(container)).toBe("Not read yet");
    expect(container.querySelector("[data-level]")).toBeNull();
  });

  it("says the watch has not learned them yet when no run carried them", () => {
    card(null);
    expect(
      screen.getByText(
        /No plan-limits reading yet: the spend watch has not run since it learned them/,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Not read yet")).toBeInTheDocument();
  });

  it("says a stale reading is not current, with its time, once it is past two days old", () => {
    card(quiet(), { nowMs: AT + 49 * 60 * 60 * 1000 });
    expect(
      screen.getByText(
        /These readings are from Oct 4, 2026, 05:00 UTC: the spend watch has not run since/,
      ),
    ).toBeInTheDocument();
    card(quiet(), { nowMs: AT + 47 * 60 * 60 * 1000 });
    expect(
      screen.getAllByText(
        /the spend watch has not run since\. Nothing below is current/,
      ),
    ).toHaveLength(1);
  });

  it("names what it does not watch, and what its estimate rests on", () => {
    card(quiet());
    expect(
      screen.getByText(/Not watched: Vercel ISR Reads\./),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/read off the dashboard on 2026-10-04/),
    ).toBeInTheDocument();
  });
});
