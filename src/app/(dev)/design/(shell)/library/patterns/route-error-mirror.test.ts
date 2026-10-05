import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * THE ROUTE-ERROR SPECIMEN IS A MIRROR, SO IT IS HELD TO ITS ORIGINAL (`patterns/gallery-demos.tsx`, `RouteErrorMock`).
 *
 * The boundary cannot mount in the Library (its mount effect files a Sentry event on every load of the page), so the
 * specimen draws the screen it draws by hand. A hand-drawn copy drifts the day the boundary's words move (it drew
 * the retired "Error code" chip and no help line for a whole round), so this reads both sources and holds the words
 * the reader sees to one another: the crash's title and its reassurance, the two ways out, the surface's quiet line
 * (the app's with its link, the portal's without) and the shape of the call (`NotFoundScreen` handed the icon, the
 * help line and the digest).
 */
const ROOT = process.cwd();
const REAL = readFileSync(
  join(ROOT, "src/components/shared/route-error.tsx"),
  "utf8",
);
const MIRROR_SOURCE = readFileSync(
  join(ROOT, "src/app/(dev)/design/(shell)/library/patterns/gallery-demos.tsx"),
  "utf8",
);
/** The mirror's own function, so a word elsewhere in the module never satisfies a check. */
const MIRROR = MIRROR_SOURCE.slice(MIRROR_SOURCE.indexOf("function RouteErrorMock"));

/** A prop's string as a source writes it: `title="..."`. */
function prop(source: string, name: string): string | undefined {
  return new RegExp(`${name}="([^"]+)"`).exec(source)?.[1];
}

describe("the route-error mirror says what the boundary says", () => {
  it("has the same title and reassurance", () => {
    expect(prop(REAL, "title")).toBeTruthy();
    expect(prop(MIRROR, "title")).toBe(prop(REAL, "title"));
    expect(prop(MIRROR, "description")).toBe(prop(REAL, "description"));
  });

  it("has the same two ways out, in the same order", () => {
    // The real boundary's buttons: its TryAgain (the words, written inside it) and the link home.
    const real = REAL.indexOf("Back home");
    expect(REAL.includes('"Try again"') || REAL.includes(">Try again<")).toBe(
      true,
    );
    expect(real).toBeGreaterThan(0);
    const tryAgain = MIRROR.indexOf("Try again");
    const home = MIRROR.indexOf("Back home");
    expect(tryAgain).toBeGreaterThan(0);
    expect(home).toBeGreaterThan(tryAgain);
  });

  it("words the quiet line for the surface, the portal's without a link", () => {
    // The real map: render:app is a link to /help, render:admin a bare line.
    const app = /"render:app":\s*<HelpLine href="([^"]+)">([^<]+)<\/HelpLine>/.exec(
      REAL,
    );
    const admin = /"render:admin":\s*<HelpLine>([^<]+)<\/HelpLine>/.exec(REAL);
    expect(app, "the boundary's render:app line").toBeTruthy();
    expect(admin, "the boundary's render:admin line").toBeTruthy();
    expect(MIRROR).toContain(`<HelpLine href="${app![1]}">${app![2]}</HelpLine>`);
    expect(MIRROR).toContain(`<HelpLine>${admin![1]}</HelpLine>`);
  });

  it("calls the shared screen with an icon, a help line and the digest, as the boundary does", () => {
    for (const source of [REAL, MIRROR]) {
      expect(source).toContain("<NotFoundScreen");
      expect(source).toContain("icon={CircleAlert}");
      expect(source).toMatch(/help=\{/);
      expect(source).toMatch(/digest=/);
    }
  });

  it("never mounts the boundary or reports: a specimen that did would file an error per load", () => {
    expect(MIRROR_SOURCE).not.toMatch(/from "@\/components\/shared\/route-error"/);
    expect(MIRROR).not.toMatch(/captureError|\bRouteError\b/);
  });
});
