import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { JobHealthReport } from "@/lib/jobs/health-summary";

import { HealthBand } from "./health-band";

/**
 * THE BAND UNDER THE BAR (admin-wiring, 2026-09-20; `health=portal`: "a band
 * under the bar, on every page ... On a good day it is not there at all").
 *
 * Three rules, and the third is the one that matters most:
 *
 *  - a healthy platform draws nothing, so the band costs nothing to carry on
 *    eleven surfaces that are not the jobs console;
 *  - a paused job is named as a decision, never counted as a fault;
 *  - AN UNREADABLE HEARTBEAT NEVER SAYS "1 JOB". A number invented for a read
 *    that failed is the health signal fabricating the answer it exists to go
 *    and find, which is this console's failure mode in its purest form. The
 *    bell has nowhere to put a sentence and rings once; the band has a row.
 */

const base: JobHealthReport = {
  readable: true,
  unhealthy: [],
  pausedCount: 0,
  heartbeatAgeMs: 3_600_000,
};

describe("a good day", () => {
  it("draws nothing at all", () => {
    const { container } = render(<HealthBand health={base} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("still draws nothing when a job is paused on purpose", () => {
    // Pausing is a decision an operator made. A band that keeps shouting about
    // a switch they set themselves is a band they learn to ignore.
    const { container } = render(
      <HealthBand health={{ ...base, pausedCount: 2 }} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});

describe("a bad day", () => {
  it("names the jobs while there are few enough to name", () => {
    render(
      <HealthBand
        health={{
          ...base,
          unhealthy: [
            { id: "purge_cron", label: "Purge sweep", health: "failed" },
            {
              id: "backup_reconcile",
              label: "Backup reconcile",
              health: "missed",
            },
          ],
        }}
      />,
    );
    expect(
      screen.getByText(/Purge sweep and Backup reconcile need a look/),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /console/i })).toHaveAttribute(
      "href",
      "/admin/jobs",
    );
  });

  it("counts them once naming them would be a paragraph", () => {
    render(
      <HealthBand
        health={{
          ...base,
          unhealthy: ["a", "b", "c", "d"].map((id) => ({
            id: "purge_cron" as const,
            label: `Job ${id}`,
            health: "missed" as const,
          })),
        }}
      />,
    );
    expect(screen.getByText(/4 backend jobs need a look/)).toBeInTheDocument();
  });

  it("mentions a paused job beside the fault, without counting it as one", () => {
    render(
      <HealthBand
        health={{
          ...base,
          pausedCount: 1,
          unhealthy: [
            { id: "purge_cron", label: "Purge sweep", health: "failed" },
          ],
        }}
      />,
    );
    expect(screen.getByText(/1 job is paused on purpose/)).toBeInTheDocument();
  });
});

describe("an unreadable heartbeat", () => {
  it("says what happened, and puts no number on it", () => {
    render(
      <HealthBand
        health={{ ...base, readable: false, heartbeatAgeMs: null }}
      />,
    );
    const band = screen.getByText(/heartbeat could not be read/i);
    expect(band).toBeInTheDocument();
    // Not "1 job needs you", not "0 jobs": no count at all.
    expect(band.closest("[data-slot='health-band']")?.textContent).not.toMatch(
      /\d+\s+jobs?\b/,
    );
  });
});
