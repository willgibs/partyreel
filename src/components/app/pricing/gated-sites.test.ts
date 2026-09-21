// @contract-for: src/components/app/pricing/lock-chip.tsx
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * ONE RULE, ONE COMPONENT, AND NO WAY BACK OUT OF THE APP (`words=chip` and
 * `first=trigger`, Will 2026-09-20).
 *
 * Four gated controls used to word one rule four ways ("Password-protected
 * albums are a paid feature", "Password protection is a paid feature", "A
 * custom link is a paid feature", "Upgrade to allow video") and three cap
 * refusals sent the host to a static, tier-blind marketing page. Both halves
 * regress the same way: somebody adds a fifth gate and writes a fifth sentence
 * with a fifth link, because that is what the neighbours used to do.
 *
 * So this pins the SHAPE of the surface rather than any component's behaviour
 * (that is lock-chip.test.tsx's job): every gated site in the host app reaches
 * for the shared chip, and no host-app file links out to /pricing at all. The
 * sheet's own quiet foot is the one door that leaves, and it lives in
 * `pricing-sheet.tsx`, which is excluded below by name.
 */

const read = (...parts: string[]) =>
  readFileSync(join(process.cwd(), ...parts), "utf8");

/** The four controls his ruling names, at their shipped paths. */
const GATED_SITES = [
  ["the password panel", "src", "components", "app", "event-password-control.tsx"],
  [
    "the visibility section's password line",
    "src",
    "components",
    "app",
    "event-settings",
    "visibility-section.tsx",
  ],
  [
    "the video status row",
    "src",
    "components",
    "app",
    "event-settings",
    "uploads-section.tsx",
  ],
  ["the custom link", "src", "components", "app", "event-slug-control.tsx"],
] as const;

describe("every locked control wears the one chip", () => {
  it.each(GATED_SITES.map(([label, ...parts]) => [label, parts] as const))(
    "%s",
    (_label, parts) => {
      const source = read(...parts);
      expect(source).toContain("LockChip");
      // The retired wording, in the shape all four shared.
      expect(source).not.toMatch(/is a paid feature/);
      expect(source).not.toMatch(/Upgrade to (enable|allow)/);
    },
  );
});

describe("nothing in the host app leaves for the marketing page", () => {
  /** Every door that used to link out, and the two the refusals toasted to. */
  const DOORS = [
    ["the dashboard", "src", "app", "(app)", "dashboard", "page.tsx"],
    ["the account page", "src", "app", "(app)", "account", "page.tsx"],
    ["the storage meter", "src", "components", "app", "dashboard", "storage-meter.tsx"],
    ["the create wizard", "src", "components", "app", "create-event-wizard.tsx"],
    ["the restore button", "src", "components", "app", "restore-event-button.tsx"],
    ["the bin grid", "src", "components", "app", "recently-deleted-grid.tsx"],
  ] as const;

  it.each(DOORS.map(([label, ...parts]) => [label, parts] as const))(
    "%s opens the sheet instead of routing to /pricing",
    (_label, parts) => {
      const source = read(...parts);
      // A comment may still SAY /pricing (several explain why they no longer go
      // there); a link, a router.push or an href may not.
      expect(source).not.toMatch(/href=["']\/pricing["']/);
      expect(source).not.toMatch(/push\(["']\/pricing["']\)/);
      expect(source).toContain("PricingSheet");
    },
  );
});
