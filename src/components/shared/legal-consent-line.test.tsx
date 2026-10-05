import { readFileSync } from "node:fs";
import { join } from "node:path";

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LegalConsentLine } from "@/components/shared/legal-consent-line";

// The deployment's surface and the canonical origin, stood in so each is a case of its own.
const deployment = vi.hoisted(() => ({ servesApp: true }));
vi.mock("@/lib/surface", () => ({ servesApp: () => deployment.servesApp }));
vi.mock("@/lib/constants/site", () => ({ SITE_URL: "https://partyreel.test" }));

beforeEach(() => {
  deployment.servesApp = true;
});

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

  // ★ THE ADMIN DEPLOYMENT SERVES NEITHER PAGE (crumbs-81). It is an allow-list (`src/lib/surface`), so a relative
  // `/terms` on admin.partyreel.com is a 404, and its sign-in carries this very line. Where the deployment does not
  // serve the app, the links are the app's own pages, in a new tab: they leave the host, and a sign-in in the middle of
  // a code must survive the read.
  it("★ on the admin deployment links the app's own pages, in a new tab, since the host serves neither", () => {
    deployment.servesApp = false;
    render(<LegalConsentLine />);
    const terms = screen.getByRole("link", { name: "Terms" });
    const privacy = screen.getByRole("link", { name: "Privacy Policy" });
    expect(terms).toHaveAttribute("href", "https://partyreel.test/terms");
    expect(privacy).toHaveAttribute("href", "https://partyreel.test/privacy");
    for (const link of [terms, privacy]) {
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener");
    }
  });

  it("keeps its own origin's pages where the deployment serves them (the app, an unset surface): a preview or a local build stays on itself", () => {
    deployment.servesApp = true;
    render(<LegalConsentLine newTab />);
    expect(screen.getByRole("link", { name: "Terms" })).toHaveAttribute(
      "href",
      "/terms",
    );
    expect(
      screen.getByRole("link", { name: "Privacy Policy" }),
    ).toHaveAttribute("href", "/privacy");
  });

  it("opens in a new tab with noopener when asked", () => {
    render(<LegalConsentLine newTab />);
    for (const name of ["Terms", "Privacy Policy"]) {
      const link = screen.getByRole("link", { name });
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener");
    }
  });

  it("★ neither link prefetches: the line stands in every guest's door (compute-levers)", () => {
    const src = readFileSync(
      join(process.cwd(), "src/components/shared/legal-consent-line.tsx"),
      "utf8",
    );
    const links = src.match(/<Link\b[^>]*>/g) ?? [];
    expect(links).toHaveLength(2);
    for (const link of links) expect(link).toContain("prefetch={false}");
  });

  it("both consumers use the component, not a copy", () => {
    for (const rel of [
      "src/components/auth/account-door.tsx",
      // The welcome at the doorway (`locked-door` r2), the door every guest passes once.
      "src/components/guest/door/welcome.tsx",
    ]) {
      const src = readFileSync(join(process.cwd(), rel), "utf8");
      expect(src).toContain("LegalConsentLine");
      expect(src).not.toContain("By continuing you agree");
    }
  });
});
