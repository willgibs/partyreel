/**
 * THE BACKUP RECONCILE'S ALERT MAIL (reconcile-mail.ts): an operator alert's shape (the tagged subject, no button, the
 * jobs console in the foot) that says whether the run failed, stopped early or found copies that differ, and what a
 * person does about each.
 */
import { describe, expect, it, vi } from "vitest";

// templates.ts takes the canonical origin from site.ts, which validates the public env on import (the templates
// test's own note): unset here, so SITE_URL takes its production fallback.
vi.mock("@/lib/env", () => ({ env: {}, serverEnv: {} }));

const { reconcileTroubleEmail } = await import("./reconcile-mail");

const URL = "https://admin.partyreel.com/admin/jobs#job-backup_reconcile";
const CLEAN = { failed: false, stoppedEarly: false, mismatched: 0 };

describe("reconcileTroubleEmail", () => {
  it("leads with the worst of what it says: a failure, then a stop, then copies that differ", () => {
    const subject = (trouble: typeof CLEAN) =>
      reconcileTroubleEmail({ trouble, runNote: null, jobsUrl: URL }).subject;
    expect(subject({ failed: true, stoppedEarly: true, mismatched: 3 })).toBe(
      "[Partyreel] The backup reconcile's run failed",
    );
    expect(subject({ ...CLEAN, stoppedEarly: true, mismatched: 3 })).toBe(
      "[Partyreel] The backup reconcile stopped before the end of its pass",
    );
    expect(subject({ ...CLEAN, mismatched: 1 })).toBe(
      "[Partyreel] 1 key differs between the media buckets",
    );
  });

  it("says nothing was deleted or overwritten, what to do for each, and links its card", () => {
    const mail = reconcileTroubleEmail({
      trouble: { ...CLEAN, mismatched: 2 },
      runNote: "2 keys differ <between> the buckets",
      jobsUrl: URL,
    });
    expect(mail.text).toContain("Nothing has been deleted or overwritten.");
    expect(mail.text).toContain("Copies that differ: 2");
    expect(mail.text).toContain("Pass: Reached its end");
    expect(mail.text).toMatch(
      /copied by hand from partyreel into partyreel-backup/,
    );
    expect(mail.text).toMatch(
      /delete the backup's copy once its lock has passed and the next run copies it again/,
    );
    expect(mail.text).toContain(
      "The run's note: 2 keys differ <between> the buckets",
    );
    expect(mail.html).toContain("2 keys differ &lt;between&gt; the buckets");
    expect(mail.text).toContain(URL);
    expect(mail.html).toContain("Open the backup reconcile");
  });
});
