import { describe, expect, it } from "vitest";

import {
  inactivityRemovedEmail,
  overCapGraceStartEmail,
  overCapReducedEmail,
} from "@/lib/email/templates";

// Recovery Phase 5 locked the system-removal email copy: a CONCRETE 30-day window (not the old
// vague "a short time / short window") and a pointer to the in-app self-serve Recently-deleted UI
// instead of "reply to this email" (the manual-recovery courtesy is gone). Guard against regressions.
describe("system-removal email copy (recovery Phase 5)", () => {
  it("overCapReducedEmail: concrete window date + self-serve, no reply-to-email or vague copy", () => {
    const { html } = overCapReducedEmail({
      recoverableUntil: "July 2, 2026",
      dashboardUrl: "https://partyreel.com/dashboard",
    });
    expect(html).toContain("July 2, 2026");
    expect(html).toContain("Trash");
    expect(html).not.toMatch(/reply to this email/i);
    expect(html).not.toContain("a short time");
  });

  it("overCapGraceStartEmail: concrete 30-day window, not 'a short window'", () => {
    const { html } = overCapGraceStartEmail({
      capLabel: "2 GB",
      deadline: "July 1, 2026",
      dashboardUrl: "https://partyreel.com/dashboard",
    });
    expect(html).toContain("30 days");
    expect(html).not.toContain("a short window");
  });

  it("inactivityRemovedEmail: points to self-serve restore, no reply-to-email", () => {
    const { html } = inactivityRemovedEmail({
      eventName: "Summer Party",
      recoverableUntil: "July 2, 2026",
      dashboardUrl: "https://partyreel.com/dashboard",
    });
    expect(html).toContain("July 2, 2026");
    expect(html).toContain("Trash");
    expect(html).not.toMatch(/reply to this email/i);
  });
});
