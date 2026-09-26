import { readFileSync } from "node:fs";
import { join } from "node:path";

import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RouteSkeleton } from "@/components/shared/route-skeleton";

/**
 * `app-vocabulary` r1, `loading=asneeded`: one shared skeleton, wired to
 * exactly the routes with a real pre-paint wait. What this guards is that the
 * shapes stay bare app-shell content and that both routes still delegate here
 * rather than drifting back to a hand-rolled fallback, never a size, a count
 * or a color. (The Studio's fixed dark shape and its two tests left with the
 * Studio: the reel no longer has a room of its own to load into.)
 */

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

describe("RouteSkeleton", () => {
  it("marks every shape busy for assistive tech", () => {
    for (const variant of ["pulse", "hub"] as const) {
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

  it("honours reduced motion on every shape", () => {
    for (const variant of ["pulse", "hub"] as const) {
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

  it("is what both loading.tsx files delegate to, on their own shape", () => {
    // The Studio's route became a redirect (`reel-host`, `home=view`) and lost
    // its loading.tsx with it: a skeleton of a room that never renders would
    // flash on the way to the view.
    const cases: { rel: string; variant: string }[] = [
      { rel: "src/app/(app)/dashboard/loading.tsx", variant: "pulse" },
      {
        rel: "src/app/(app)/dashboard/[eventId]/loading.tsx",
        variant: "hub",
      },
    ];
    for (const { rel, variant } of cases) {
      const src = read(rel);
      expect(src, `${rel} stopped importing RouteSkeleton`).toMatch(
        /import \{ RouteSkeleton \} from "@\/components\/shared\/route-skeleton"/,
      );
      expect(src, `${rel} stopped rendering the "${variant}" shape`).toMatch(
        new RegExp(`variant="${variant}"`),
      );
    }
  });
});
