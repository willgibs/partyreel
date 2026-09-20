// @contract-for: src/components/shared/route-skeleton.tsx
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RouteSkeleton } from "@/components/shared/route-skeleton";

/**
 * `app-vocabulary` r1, `loading=asneeded`: one shared skeleton, wired to
 * exactly the three routes with a real pre-paint wait. What this guards is
 * that the three shapes stay DISTINCT (the Studio is not the app's light
 * chrome wearing a dark tint) and that the three routes still delegate here
 * rather than drifting back to a hand-rolled fallback — never a size, a
 * count or a color.
 */

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

describe("RouteSkeleton", () => {
  it("marks all three shapes busy for assistive tech", () => {
    for (const variant of ["pulse", "hub", "studio"] as const) {
      const { container, unmount } = render(
        <RouteSkeleton variant={variant} />,
      );
      expect(
        container.querySelector("[aria-busy]"),
        `${variant} carries no aria-busy root`,
      ).toBeTruthy();
      unmount();
    }
  });

  it("draws the pulse and the hub as bare app-shell content, never a fixed takeover", () => {
    // The (app) layout's AppShell already supplies <main> + Container chrome
    // for these two — a `fixed` root here would double up with it.
    for (const variant of ["pulse", "hub"] as const) {
      const { container, unmount } = render(
        <RouteSkeleton variant={variant} />,
      );
      const root = container.firstElementChild;
      expect(root?.className ?? "").not.toMatch(/\bfixed\b/);
      unmount();
    }
  });

  it("draws the studio as the room itself: fixed, full-bleed, always dark", () => {
    // The real Studio (reel-studio.tsx) sits OUTSIDE the (app) shell's light
    // chrome on purpose ("its own world"); its skeleton has to match, or the
    // app's own background flashes for one frame first.
    const { container } = render(<RouteSkeleton variant="studio" />);
    const root = container.firstElementChild;
    expect(root?.className ?? "").toMatch(/\bfixed\b/);
    expect(root?.className ?? "").toMatch(/inset-x-0/);
    expect(root?.className ?? "").toMatch(/oklch\(0\.11_0_0\)/);
  });

  it("never tints the studio's blocks off the theme's --color-foreground", () => {
    // A theme-aware shimmer reads as a stray light patch on this room's
    // literal near-black in light mode (the room ignores the site's
    // light/dark preference); the studio shape hand-composes its own white
    // shimmer instead of the shared Skeleton's foreground-tinted gradient.
    const { container } = render(<RouteSkeleton variant="studio" />);
    const html = container.innerHTML;
    expect(html).not.toMatch(/--color-foreground/);
    expect(html).toMatch(/bg-white\/10/);
  });

  it("honours reduced motion on every shape", () => {
    for (const variant of ["pulse", "hub", "studio"] as const) {
      const { container, unmount } = render(
        <RouteSkeleton variant={variant} />,
      );
      expect(
        container.innerHTML,
        `${variant} ships a shimmer with no reduced-motion drop`,
      ).toMatch(/motion-reduce:animate-none/);
      unmount();
    }
  });

  it("is what all three loading.tsx files delegate to, on their own shape", () => {
    const cases: { rel: string; variant: string }[] = [
      { rel: "src/app/(app)/dashboard/loading.tsx", variant: "pulse" },
      {
        rel: "src/app/(app)/dashboard/[eventId]/loading.tsx",
        variant: "hub",
      },
      {
        rel: "src/app/(app)/dashboard/[eventId]/reel/loading.tsx",
        variant: "studio",
      },
    ];
    for (const { rel, variant } of cases) {
      const src = read(rel);
      expect(src, `${rel} stopped importing RouteSkeleton`).toMatch(
        /import \{ RouteSkeleton \} from "@\/components\/shared\/route-skeleton"/,
      );
      expect(
        src,
        `${rel} stopped rendering the "${variant}" shape`,
      ).toMatch(new RegExp(`variant="${variant}"`));
    }
  });
});
