import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { DEFAULT_LOOK, scriptFor, specOf, stillAt } from "./looks";
import { TrailLayer } from "./trail-layer";

/**
 * THE PAGE STANDS WITH NO SCRIPT AT ALL.
 *
 * ★ WHY THIS IS A TEST AND NOT A MEASUREMENT. The whole composition is written
 * as custom properties DURING RENDER rather than inside an effect, which is
 * what lets the server's HTML, a reader with scripting off, a reduced-motion
 * reader and the loop's own first frame be one picture. The lab cannot show it:
 * a gated `Frame` is deliberately browser-only (frame.tsx: a server-rendered
 * gated iframe would paint a 404 and then reload), so a board page with
 * scripting off draws nothing whatever the layer does. A server render is the
 * only place the claim can be checked, so it is checked here.
 *
 * `renderToStaticMarkup` runs no effect, which is exactly the point: whatever
 * survives it is what a reader with no JavaScript gets.
 */
describe("the trail with no script", () => {
  const spec = specOf(DEFAULT_LOOK, "desktop");
  const html = renderToStaticMarkup(
    <TrailLayer
      spec={spec}
      source={{
        paths: [scriptFor("desktop")],
        drive: "pointer",
        stillAt: stillAt(DEFAULT_LOOK, "desktop"),
      }}
    />,
  );

  it("draws the whole pool, with a real composition in the markup", () => {
    const nodes = html.match(/itr-card/g) ?? [];
    expect(nodes.length).toBe(spec.pool);
    const placed = html.match(/--itr-rest:\s*translate3d/g) ?? [];
    expect(placed.length).toBeGreaterThan(4);
  });

  it("lights the photographs the still says are lit, and no others", () => {
    const lit = (html.match(/--itr-rest-o:\s*(0\.\d+|1)/g) ?? []).filter(
      (m) => !/:\s*0\.0{2}/.test(m),
    );
    expect(lit.length).toBeGreaterThan(4);
    // A dead slot is written as a real zero rather than left to the sheet's
    // default, so nothing paints at full strength before the loop starts.
    expect(html).toContain("--itr-rest-o:0");
  });

  it("is weather, not content: hidden from a reader and impossible to focus", () => {
    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toMatch(/tabindex|<button|<a\s/i);
  });

  it("asks for the photograph at the size it draws it, never at a vw", () => {
    // The box is a fixed pixel size at a given canvas, so a vw would over-fetch
    // on a wide screen and under-fetch on a narrow one.
    expect(html).toContain(`sizes="${spec.size}px"`);
    expect(html).not.toMatch(/sizes="[^"]*vw/);
  });
});
