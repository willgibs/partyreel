// @contract-for: src/components/shared/legal-consent-line.tsx
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LegalConsentLine } from "@/components/shared/legal-consent-line";

/**
 * The acceptance line: both documents linked, and the guest door's copy
 * opens them in a new tab so the entry sheet survives. The source pin keeps
 * the two consumers on the component (a hand-rolled copy on either surface is
 * how the line drifts).
 */
describe("LegalConsentLine", () => {
  it("links both documents in the same tab by default", () => {
    render(<LegalConsentLine />);
    const terms = screen.getByRole("link", { name: "Terms" });
    const privacy = screen.getByRole("link", { name: "Privacy Policy" });
    expect(terms).toHaveAttribute("href", "/terms");
    expect(privacy).toHaveAttribute("href", "/privacy");
    expect(terms).not.toHaveAttribute("target");
  });

  it("opens in a new tab with noopener when asked", () => {
    render(<LegalConsentLine newTab />);
    for (const name of ["Terms", "Privacy Policy"]) {
      const link = screen.getByRole("link", { name });
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener");
    }
  });

  it("both consumers use the component, not a copy", () => {
    for (const rel of [
      "src/components/auth/account-door.tsx",
      "src/components/guest/entry-modal.tsx",
    ]) {
      const src = readFileSync(join(process.cwd(), rel), "utf8");
      expect(src).toContain("LegalConsentLine");
      expect(src).not.toContain("By continuing you agree");
    }
  });
});
