import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";

import {
  CrumbsBar,
  CrumbsProvider,
  SetCrumbs,
} from "@/components/shared/crumbs";
import { RouteSkeleton } from "@/components/shared/route-skeleton";

/**
 * `app-vocabulary` r1, `loading=asneeded`: one shared skeleton, wired to
 * exactly the routes with a real pre-paint wait. What this guards is that the
 * shapes stay bare app-shell content and that every such route still delegates
 * here rather than drifting back to a hand-rolled fallback, never a size, a
 * count or a color. (The Studio's fixed dark shape and its two tests left with
 * the Studio: the reel no longer has a room of its own to load into.) Account
 * and the welcome joined the dashboard and the hub in crumbs-44, each a wait of
 * several reads and presigns that froze the page a press came from.
 */

const SHAPES = ["pulse", "hub", "account", "welcome"] as const;

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

describe("RouteSkeleton", () => {
  it("marks every shape busy for assistive tech", () => {
    for (const variant of SHAPES) {
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
    // for every one of them — a `fixed` root here would double up with it.
    for (const variant of SHAPES) {
      const { container, unmount } = render(
        <RouteSkeleton variant={variant} />,
      );
      const root = container.firstElementChild;
      expect(root?.className ?? "").not.toMatch(/\bfixed\b/);
      unmount();
    }
  });

  it("honours reduced motion on every shape", () => {
    for (const variant of SHAPES) {
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

  it("is what every route with a wait delegates to, on its own shape", () => {
    // The Studio's route became a redirect (`reel-host`, `home=view`) and lost
    // its loading.tsx with it: a skeleton of a room that never renders would
    // flash on the way to the view. Account and the welcome carried none at all
    // until crumbs-44, so a press on either froze the page it came from.
    const cases: { rel: string; variant: string }[] = [
      { rel: "src/app/(app)/dashboard/loading.tsx", variant: "pulse" },
      {
        rel: "src/app/(app)/dashboard/[eventId]/loading.tsx",
        variant: "hub",
      },
      { rel: "src/app/(app)/account/loading.tsx", variant: "account" },
      { rel: "src/app/(app)/welcome/loading.tsx", variant: "welcome" },
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

/**
 * A ROUTE WITH A WAIT HOLDS THE APP BAR'S TRAIL (crumbs-19). The new address commits with the skeleton on
 * screen and the page lands later (measured under the real router), so a bar that let go with the old page
 * blinked for the whole wait on every step between two routes with a trail; and a bar that never let go put
 * the last route's trail on a route that sets none. The skeleton holds the trail through the wait and the
 * page that lands decides (`crumbs.test.tsx` pins the rule; this pins that the skeleton is what holds).
 */
describe("RouteSkeleton holds the trail", () => {
  const trail = [
    { label: "Partyreel", href: "/dashboard" },
    { label: "Sarah and Tom" },
  ];
  const shell = (route: ReactNode) => (
    <CrumbsProvider>
      <CrumbsBar />
      {route}
    </CrumbsProvider>
  );
  const bar = () =>
    screen.queryByRole("navigation", { name: /breadcrumb/i })?.textContent ??
    null;

  it.each(SHAPES)(
    "keeps the last trail through the %s wait, and lets go when the page lands with none",
    (variant) => {
      const view = render(
        shell(
          <div key="hub">
            <SetCrumbs trail={trail} />
          </div>,
        ),
      );
      expect(bar()).toContain("Sarah and Tom");
      view.rerender(shell(<RouteSkeleton key="loading" variant={variant} />));
      expect(bar(), `the bar blinked through the ${variant} wait`).toContain(
        "Sarah and Tom",
      );
      view.rerender(shell(<p key="dashboard">a page that sets none</p>));
      expect(bar(), "the trail outlived the wait").toBeNull();
    },
  );

  it("is what EVERY loading.tsx of the host app delegates to, so no wait can forget the hold", () => {
    // A loading.tsx that draws its own fallback would blink the bar for the whole of its wait (the failure is
    // safe, and ugly): this is what keeps a third one from being written that way.
    const files = readdirSync(join(ROOT, "src/app/(app)"), { recursive: true })
      .map((f) => `src/app/(app)/${String(f).replace(/\\/g, "/")}`)
      .filter((rel) => rel.endsWith("/loading.tsx"));
    expect(
      files.length,
      "found the host app's loading files",
    ).toBeGreaterThanOrEqual(2);
    for (const rel of files) {
      expect(
        read(rel),
        `${rel} draws its own fallback and holds nothing`,
      ).toMatch(/\bRouteSkeleton\b/);
    }
  });

  it("draws nothing of its own: the skeleton's root is still the first element", () => {
    for (const variant of SHAPES) {
      const { container, unmount } = render(
        <RouteSkeleton variant={variant} />,
      );
      expect(
        container.firstElementChild?.hasAttribute("aria-busy"),
        variant,
      ).toBe(true);
      unmount();
    }
  });

  it("paints Account and the welcome at their pages' own width, never the shell's wide one", () => {
    // A skeleton wider than its page snaps narrow the moment the page streams in.
    const account = render(<RouteSkeleton variant="account" />);
    expect(account.container.firstElementChild?.className).toMatch(
      /\bmax-w-2xl\b/,
    );
    expect(account.container.querySelector("[data-app-wide]")).toBeNull();
    account.unmount();
    const welcome = render(<RouteSkeleton variant="welcome" />);
    expect(welcome.container.firstElementChild?.className).toMatch(
      /\bmax-w-lg\b/,
    );
    welcome.unmount();
  });
});
