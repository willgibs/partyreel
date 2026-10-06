import { describe, expect, it } from "vitest";

import { filesUnder, read } from "@/testing/source-tree";

/**
 * EVERY RADIX LAYER PORTALS INTO THE CONTAINER IT IS HANDED (lab-sitting, from
 * ROADMAP's line on the lab's frame: "radix layers portal to the lab's
 * document").
 *
 * Radix's `Portal` reads `globalThis.document.body` when nobody names a
 * container, and in the lab a production page drawn inside a portalled frame
 * still runs in the lab's window, so its Settings popup, its menus and its
 * tooltips opened OUTSIDE the frame, over the lab, at the lab's coordinates. A
 * board could not draw production whole; one quoted the popup inline instead.
 * `usePortalContainer()` (portal-container.tsx) answers undefined everywhere in
 * production, which is radix's own default, and a frame's body inside a frame.
 * A portal that forgets it opens outside the frame again, so every `.Portal` in
 * the product names it. The lab's own tools and the dev tools are not the
 * product and are not read.
 */

const ROOT = "src";
const SKIP = ["components/lab", "components/dev", "app/(dev)"];

function sources(dir: string): string[] {
  return filesUnder(dir).filter((path) => {
    if (SKIP.some((s) => path.startsWith(`${ROOT}/${s}/`))) return false;
    const name = path.slice(path.lastIndexOf("/") + 1);
    return name.endsWith(".tsx") && !name.includes(".test.");
  });
}

/** Every `<X.Portal ...>` opening tag in a file, whole, with where it stands. */
function portals(
  path: string,
): { at: string; tag: string; reads: boolean }[] {
  const text = read(path);
  // A `container={container}` names the hook's answer read at the top.
  const reads = /usePortalContainer\(\)/.test(text);
  const out: { at: string; tag: string; reads: boolean }[] = [];
  for (const m of text.matchAll(/<\w+\.Portal\b/g)) {
    // The tag runs to the first ">" outside braces.
    let depth = 0;
    let end = m.index;
    for (let i = m.index; i < text.length; i++) {
      const c = text[i];
      if (c === "{") depth++;
      else if (c === "}") depth--;
      else if (c === ">" && depth === 0) {
        end = i;
        break;
      }
    }
    const line = text.slice(0, m.index).split("\n").length;
    out.push({
      at: `${path}:${line}`,
      tag: text.slice(m.index, end + 1),
      reads,
    });
  }
  return out;
}

const ALL = sources(ROOT).flatMap(portals);

describe("the product's radix portals", () => {
  it("finds the portals to check (the premise)", () => {
    expect(ALL.length).toBeGreaterThan(10);
    expect(ALL.some((p) => p.at.includes("ui/dialog.tsx"))).toBe(true);
  });

  it("hands every one the container the page provides", () => {
    // Read in the tag (`container={usePortalContainer()}`) or, where the
    // portal is drawn conditionally, once at the top of the component.
    expect(
      ALL.filter(
        (p) =>
          !/container=\{(usePortalContainer\(\)|container)\}/.test(p.tag) ||
          !p.reads,
      ).map((p) => p.at),
    ).toEqual([]);
  });
});
