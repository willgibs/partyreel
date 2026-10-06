import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PALETTE_ACTIONS } from "@/lib/admin/palette";
import type {
  StoredReading,
  StoredRun,
  SwitchStates,
} from "@/lib/jobs/spend-watch";

vi.mock("@/app/admin/jobs/actions", () => ({
  toggleWatchSwitchAction: vi.fn(async () => ({ ok: true })),
}));

const { SpendWatchReadings, SpendWatchSwitches } =
  await import("@/app/admin/jobs/spend-watch-card");

/**
 * THE SPEND WATCH'S CARD (admin-observability.md, "The spend watch"): a reading is drawn as what it is (a number
 * against its ceiling, "Tripped" with what to check, "No reading" with why, "Warming up"), never as a number
 * it is not; and a switch is never drawn ON when it could not be read. The watch's own pause shows only while it is
 * still the watch's.
 */

const AT = Date.parse("2026-10-03T05:00:00.000Z");

const ok = (
  value: number,
  ceiling: number,
  peak: number | null = null,
): StoredReading => ({
  state: "ok",
  value,
  ceiling,
  basis: "floor",
  peak,
});

function latest(
  readings: StoredRun["readings"],
  extra: Partial<StoredRun> = {},
) {
  return {
    run: {
      readAtMs: AT,
      fromMs: AT - 24 * 60 * 60 * 1000,
      readings,
      snap: {},
      pausedAt: {},
      ...extra,
    },
    startedAt: new Date(AT).toISOString(),
    status: "ok",
  };
}

const quiet: StoredRun["readings"] = {
  uploads: ok(29.2, 1_000, 41),
  upload_bytes: ok(0.2 * 1024 ** 3, 10 * 1024 ** 3),
  album_changes: ok(31, 2_000),
  lifecycle_mail: ok(1, 50),
  resend_mail: { state: "ok", value: 7, ceiling: 80, basis: "cap", peak: 9 },
  sign_ins: ok(2, 200),
  downloads: ok(3, 100, 12),
  purge_runs: ok(1, 4, 2),
};

function row(label: string): HTMLElement {
  const cell = screen.getByText(label);
  const tr = cell.closest("tr");
  if (!tr) throw new Error(`no row for ${label}`);
  return tr as HTMLElement;
}

describe("the readings", () => {
  it("draws a quiet night as numbers under their ceilings, no row tinted", () => {
    render(<SpendWatchReadings latest={latest(quiet)} unreadable={null} />);
    expect(within(row("Uploads")).getByText("29 an hour")).toBeInTheDocument();
    expect(
      within(row("Download all")).getByText("3 a day"),
    ).toBeInTheDocument();
    expect(
      within(row("Mail through Resend")).getByText(
        "under the vendor's own daily stop",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText("Tripped")).toBeNull();
    for (const tr of screen.getAllByRole("row")) {
      expect(tr).not.toHaveAttribute("data-tone");
    }
  });

  it("★ marks a trip, tints its row and says what to check in place of where the number comes from", () => {
    render(
      <SpendWatchReadings
        latest={latest({
          ...quiet,
          downloads: {
            state: "tripped",
            value: 900,
            ceiling: 120,
            basis: "peak",
            peak: 12,
          },
        })}
        unreadable={null}
      />,
    );
    const tripped = row("Download all");
    expect(tripped).toHaveAttribute("data-tone", "warning");
    expect(within(tripped).getByText("Tripped")).toBeInTheDocument();
    expect(
      within(tripped).getByText(/A client minting over and over is the shape/),
    ).toBeInTheDocument();
    expect(
      within(tripped).getByText("10x the week's busiest"),
    ).toBeInTheDocument();
  });

  it("★ draws a reading it could not take as 'No reading' and why, never as a number, in the failure tone", () => {
    render(
      <SpendWatchReadings
        latest={latest({
          ...quiet,
          sign_ins: {
            state: "missing",
            value: null,
            ceiling: 200,
            basis: "floor",
            peak: null,
            why: "permission denied for table users",
          },
          uploads: {
            state: "warming",
            value: null,
            why: "a first reading: the next run measures from this one",
          },
        })}
        unreadable={null}
      />,
    );
    const missing = row("Accounts signed in");
    expect(missing).toHaveAttribute("data-tone", "destructive");
    expect(within(missing).getByText("No reading")).toBeInTheDocument();
    expect(
      within(missing).getByText("permission denied for table users"),
    ).toBeInTheDocument();
    expect(within(row("Uploads")).getByText("Warming up")).toBeInTheDocument();
  });

  it("says so in words when there is no run yet, or the run could not be read", () => {
    const { rerender } = render(
      <SpendWatchReadings latest={null} unreadable={null} />,
    );
    expect(
      screen.getByText(/No readings yet: the watch has not run/),
    ).toBeInTheDocument();
    rerender(
      <SpendWatchReadings latest={null} unreadable="statement timeout" />,
    );
    expect(
      screen.getByText("The readings could not be read: statement timeout"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("table")).toBeNull();
  });
});

const allOn: SwitchStates = {
  uploads_enabled: { enabled: true, updatedAtMs: null },
  lifecycle_mail_enabled: { enabled: true, updatedAtMs: null },
  export_enabled: { enabled: true, updatedAtMs: AT - 1_000 },
  purge_cron_enabled: { enabled: true, updatedAtMs: AT - 1_000 },
};

describe("what it can stop", () => {
  it("offers its two switches in place, and sends the other two to their homes", () => {
    render(
      <SpendWatchSwitches switches={allOn} latest={null} unreadable={null} />,
    );
    expect(
      screen.getByRole("switch", { name: "Toggle Guest uploads" }),
    ).toBeChecked();
    expect(
      screen.getByRole("switch", { name: "Toggle Lifecycle mail" }),
    ).toBeChecked();
    expect(screen.getByRole("link", { name: "Open Exports" })).toHaveAttribute(
      "href",
      "/admin/exports#downloads",
    );
    expect(screen.getByRole("link", { name: "Open its card" })).toHaveAttribute(
      "href",
      "/admin/jobs#job-purge_cron",
    );
    expect(screen.getByText(/Only a person pauses it/)).toBeInTheDocument();
  });

  it("★ says a pause is the watch's only while the switch still holds the instant the watch wrote", () => {
    const at = "2026-10-03T05:00:00.250Z";
    const { rerender } = render(
      <SpendWatchSwitches
        switches={{
          ...allOn,
          export_enabled: { enabled: false, updatedAtMs: Date.parse(at) },
        }}
        latest={latest({}, { pausedAt: { export_enabled: at } }).run}
        unreadable={null}
      />,
    );
    expect(screen.getByText(/Paused by the spend watch/)).toBeInTheDocument();
    expect(screen.getByText("Paused")).toBeInTheDocument();
    // An operator touched it since (on again, or off at another instant): it is theirs now.
    rerender(
      <SpendWatchSwitches
        switches={{
          ...allOn,
          export_enabled: {
            enabled: false,
            updatedAtMs: Date.parse(at) + 60_000,
          },
        }}
        latest={latest({}, { pausedAt: { export_enabled: at } }).run}
        unreadable={null}
      />,
    );
    expect(screen.queryByText(/Paused by the spend watch/)).toBeNull();
  });

  it("★ says beside the uploads switch when a trip left it for a person, and only while it is on", () => {
    const tripped = latest({
      uploads: {
        state: "tripped",
        value: 4_210,
        ceiling: 1_000,
        basis: "floor",
        peak: 22,
      },
      upload_bytes: {
        state: "tripped",
        value: 12 * 1024 ** 3,
        ceiling: 10 * 1024 ** 3,
        basis: "floor",
        peak: 1,
      },
    }).run;
    const { rerender } = render(
      <SpendWatchSwitches
        switches={allOn}
        latest={tripped}
        unreadable={null}
      />,
    );
    expect(
      screen.getByText(/Uploads and Bytes uploaded went past the ceiling/),
    ).toBeInTheDocument();
    rerender(
      <SpendWatchSwitches
        switches={{
          ...allOn,
          uploads_enabled: { enabled: false, updatedAtMs: AT },
        }}
        latest={tripped}
        unreadable={null}
      />,
    );
    expect(screen.queryByText(/went past the ceiling/)).toBeNull();
  });

  it("★ never draws a switch it could not read as on", () => {
    render(
      <SpendWatchSwitches
        switches={null}
        latest={null}
        unreadable="connection refused"
      />,
    );
    expect(
      screen.getByText(
        "The switches could not be read: connection refused None of them is shown as on.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole("switch")).toBeNull();
  });

  // ★ crumbs-75: the palette jumps to each switch this card holds itself, by the row's own id, so a palette entry
  // whose anchor the card stopped rendering fails here rather than landing an operator at the top of the page.
  it("★ renders the row every palette jump to a switch lands on, and holds that switch there", () => {
    const { container } = render(
      <SpendWatchSwitches switches={allOn} latest={null} unreadable={null} />,
    );
    const jumps = PALETTE_ACTIONS.filter((a) =>
      a.href.startsWith("/admin/jobs#switch-"),
    ).map((a) => a.href.split("#")[1]);
    expect(jumps.sort()).toEqual(
      ["switch-lifecycle_mail_enabled", "switch-uploads_enabled"].sort(),
    );
    for (const id of jumps) {
      const row = container.querySelector(`#${id}`);
      expect(row, id).not.toBeNull();
      expect(within(row as HTMLElement).getByRole("switch")).toBeTruthy();
    }
  });
});

describe("the change-plan configuration's line (billing-orphans)", () => {
  it("★ names each Pro price the tagged configuration lacks, in the band's voice", () => {
    const { container } = render(
      <SpendWatchReadings
        latest={{
          ...latest(quiet),
          changePlan: {
            state: "missing",
            configuration_id: "bpc_test",
            sold: 6,
            missing: [
              {
                plan_id: "pro_50_yr",
                label: "Pro 50 GB, $90/yr",
                price_id: "price_50y",
              },
            ],
          },
        }}
        unreadable={null}
      />,
    );
    const line = container.querySelector('[data-line="change-plan"]');
    expect(line?.textContent).toBe(
      "Change plan in Stripe: the tagged configuration (bpc_test) lacks Pro 50 GB, $90/yr (price_50y), so Stripe refuses a switch to it.",
    );
    expect(line?.querySelector(".bg-warning\\/8")).not.toBeNull();
  });

  it("is quiet when whole, the failure's when unread, and absent from a run before it", () => {
    const { container, rerender } = render(
      <SpendWatchReadings
        latest={{
          ...latest(quiet),
          changePlan: { state: "whole", configuration_id: "bpc_test", sold: 6 },
        }}
        unreadable={null}
      />,
    );
    expect(
      container.querySelector('[data-line="change-plan"]')?.textContent,
    ).toBe("Change plan in Stripe lists all 6 Pro prices (bpc_test).");
    rerender(
      <SpendWatchReadings
        latest={{
          ...latest(quiet),
          changePlan: { state: "unread", message: "Stripe timed out" },
        }}
        unreadable={null}
      />,
    );
    const unread = container.querySelector('[data-line="change-plan"]');
    expect(unread?.textContent).toBe(
      "Change plan in Stripe: no reading (Stripe timed out).",
    );
    expect(unread?.className).toContain("text-destructive");
    rerender(<SpendWatchReadings latest={latest(quiet)} unreadable={null} />);
    expect(container.querySelector('[data-line="change-plan"]')).toBeNull();
  });
});
