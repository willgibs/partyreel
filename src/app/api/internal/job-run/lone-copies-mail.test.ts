/**
 * THE LONE COPIES' ALERT MAIL (lone-copies-mail.ts): an operator alert's shape (the tagged subject, no button, the
 * jobs console in the foot) that says how many keys the backup alone holds, who said so, what the restore's mode does
 * with them and what a person does next.
 */
import { describe, expect, it, vi } from "vitest";

// templates.ts takes the canonical origin from site.ts, which validates the public env on import (the templates
// test's own note): unset here, so SITE_URL takes its production fallback.
vi.mock("@/lib/env", () => ({ env: {}, serverEnv: {} }));

const { loneCopiesEmail } = await import("./lone-copies-mail");

const BASE = {
  keys: 12,
  reportedBy: "Backup prune",
  restoreMode: "on",
  runNote: null,
  jobsUrl: "https://admin.partyreel.com/admin/jobs#job-backup_restore",
};

describe("loneCopiesEmail", () => {
  it("says how many, who said so and what the restore does with them, in the operator's shape", () => {
    const mail = loneCopiesEmail(BASE);
    expect(mail.subject).toBe("[Partyreel] 12 keys held by the backup alone");
    expect(mail.text).toContain("Held by the backup alone: 12 keys");
    expect(mail.text).toContain("Reported by: Backup prune");
    expect(mail.text).toContain(
      "Restore mode: On: the restore copies them back",
    );
    expect(mail.text).toContain("Nothing has been deleted.");
    expect(mail.text).toMatch(
      /copy each key from partyreel-backup into partyreel by hand/,
    );
    expect(mail.text).toContain(BASE.jobsUrl);
    expect(mail.html).toContain("Open the backup restore");
  });

  it("reads one key as one, and each mode in its own words", () => {
    expect(loneCopiesEmail({ ...BASE, keys: 1 }).subject).toBe(
      "[Partyreel] 1 key held by the backup alone",
    );
    expect(loneCopiesEmail({ ...BASE, restoreMode: "dryrun" }).text).toContain(
      "Dry run: the restore copies nothing",
    );
    expect(loneCopiesEmail({ ...BASE, restoreMode: "off" }).text).toContain(
      "Off: the restore does nothing",
    );
    expect(loneCopiesEmail({ ...BASE, restoreMode: null }).text).toContain(
      "Restore mode: Not reported by this Worker",
    );
  });

  it("carries the run's own note when it sent one, and escapes it in the HTML", () => {
    const mail = loneCopiesEmail({ ...BASE, runNote: "2 keys <of> 1 item" });
    expect(mail.text).toContain("The run's note: 2 keys <of> 1 item");
    expect(mail.html).toContain("2 keys &lt;of&gt; 1 item");
    expect(loneCopiesEmail(BASE).text).not.toContain("The run's note");
  });
});
