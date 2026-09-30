import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import AuthLayout from "@/app/(auth)/layout";
import { EARLY_PRESS_RECORDER } from "@/lib/early-press";

/**
 * THE SIGN-IN PAGE REMEMBERS A TAP MADE BEFORE ITS SCRIPTS RAN (crumbs-23, build 26's red-team: Continue
 * with Google's first click on a cold phone reached nothing). The recorder must be in the server's HTML
 * BEFORE the page it serves: the tap it exists for comes before any script, and only an inline script in
 * the markup is there for it. Where it stands is pinned here; what it records and what answers it are
 * `early-press.test.tsx`'s and `early-press-button.test.tsx`'s.
 */
describe("(auth)/layout", () => {
  const html = renderToString(
    <AuthLayout>
      <button data-early-press="">Continue with Google</button>
    </AuthLayout>,
  );

  it("★ draws the recorder as a plain inline script, ahead of the page", () => {
    const script = html.indexOf("<script>");
    const button = html.indexOf("<button");
    expect(script).toBeGreaterThanOrEqual(0);
    expect(script).toBeLessThan(button);
    expect(html).toContain(EARLY_PRESS_RECORDER);
    // Plain: no src to fetch, no async or defer that would let a tap come first.
    expect(html.slice(script, script + 8)).toBe("<script>");
  });

  it("wraps nothing around what it serves", () => {
    expect(html).toContain(
      '<button data-early-press="">Continue with Google</button>',
    );
  });
});
