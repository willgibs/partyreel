import { existsSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it, vi } from "vitest";

import { BIBLE_GROUP_LABEL, BIBLE_GROUPS } from "../rules/bible";
import { FAMILY_LABEL } from "../gallery/entry";
import { SANDBOX } from "../touchpoints";
import {
  activeItem,
  areaOf,
  breadcrumbs,
  filterNav,
  flatten,
  neighbours,
  RESERVED,
} from "./catalog";
import { GLOSSARY } from "./glossary";
import { LAB_REDIRECTS } from "./legacy-routes";

// nav.ts reads the manifests and the specs at request time (server-only), and
// the gallery registry it lists mounts production components, some of which
// parse the public env on import; the values are never used here.
vi.mock("server-only", () => ({}));
vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "test-key");
vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000");
const { buildNav } = await import("./nav");

/**
 * THE NAV, HELD AGAINST THE TREE (the Library x Lab round, 2026-09-15). The
 * sidebar is data; a link in it that lands on a 404, a board it forgot, or a
 * section a component id could shadow is a shell bug the smoke script would
 * find late. Held here at test time instead: every href resolves to a page
 * file, every standing board and family and tool is listed, no href repeats,
 * the reserved segments never collide with an id, and the helpers the chrome
 * relies on (the active item, the crumbs, the neighbours) behave.
 */
const SHELL = join(process.cwd(), "src/app/(dev)/design/(shell)");

/** The page file the App Router serves for a lab href (dynamic dirs by name). */
function pageFor(href: string): string | null {
  const segments = href
    .replace(/#.*$/, "")
    .replace(/^\/design\/?/, "")
    .split("/")
    .filter(Boolean);
  const dynamic: Record<string, string> = {
    "library/rules": "[id]",
    "library/record": "[id]",
    "library/doctrine": "[doc]",
    "lab/proposals": "[slug]",
    "lab/tracks": "[track]",
    lab: "[board]",
    library: "[id]",
  };
  const exact = join(SHELL, ...segments, "page.tsx");
  if (existsSync(exact)) return exact;
  const parent = segments.slice(0, -1).join("/");
  const dyn = dynamic[parent];
  if (dyn) {
    const candidate = join(SHELL, ...segments.slice(0, -1), dyn, "page.tsx");
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

const nav = await buildNav();
const items = flatten(nav);

describe("the nav", () => {
  it("has the two areas, in order", () => {
    expect(nav.map((a) => a.id)).toEqual(["library", "lab"]);
  });

  it("links only to pages that exist", () => {
    const missing = items
      .filter((it) => !pageFor(it.href))
      .map((it) => it.href);
    expect(missing).toEqual([]);
  });

  it("never repeats an href", () => {
    const seen = new Map<string, number>();
    for (const it of items) seen.set(it.href, (seen.get(it.href) ?? 0) + 1);
    const dupes = [...seen].filter(([, n]) => n > 1).map(([h]) => h);
    expect(dupes).toEqual([]);
  });

  it("lists every standing board, every family and every tool", () => {
    const hrefs = new Set(items.map((it) => it.href));
    for (const r of SANDBOX)
      expect(hrefs.has(`/design/lab/${r.id}`), r.id).toBe(true);
    for (const family of Object.keys(FAMILY_LABEL))
      expect(hrefs.has(`/design/library/${family}`), family).toBe(true);
    for (const tool of ["motion", "reel-parity", "stream-probe", "boom"])
      expect(hrefs.has(`/design/lab/tools/${tool}`), tool).toBe(true);
    expect(hrefs.has("/design/lab")).toBe(true);
    expect(hrefs.has("/design/library/rules")).toBe(true);
    expect(hrefs.has("/design/library/glossary")).toBe(true);
  });

  it("keeps every old route's destination in the nav or under a listed page", () => {
    const hrefs = new Set(items.map((it) => it.href));
    for (const r of LAB_REDIRECTS) {
      const dest = r.destination.replace(/\/:\w+$/, "");
      expect(hrefs.has(dest), r.destination).toBe(true);
    }
  });

  it("names the bible's groups as keywords of the rules item", () => {
    const rules = items.find((it) => it.href === "/design/library/rules");
    expect(rules?.keywords?.length).toBe(BIBLE_GROUPS.length);
  });
});

describe("reserved segments", () => {
  it("never collide with a board id", () => {
    for (const r of SANDBOX) expect(RESERVED.lab).not.toContain(r.id);
  });
  it("never collide with a component id", async () => {
    const { COMPONENTS } = await import("../rules/rules");
    for (const c of COMPONENTS) expect(RESERVED.library).not.toContain(c.id);
  });
  it("name a directory under the area (a page, or a dynamic child)", () => {
    for (const seg of RESERVED.library)
      expect(existsSync(join(SHELL, "library", seg)), seg).toBe(true);
    for (const seg of RESERVED.lab)
      expect(existsSync(join(SHELL, "lab", seg)), seg).toBe(true);
  });
});

describe("the helpers", () => {
  it("light the longest matching item", () => {
    const hit = activeItem(nav, "/design/library/rules/no-em-dash");
    expect(hit?.item.href).toBe("/design/library/rules");
    const board = activeItem(nav, "/design/lab/light");
    expect(board?.item.href).toBe("/design/lab/light");
    const family = activeItem(nav, "/design/library/marketing");
    expect(family?.item.href).toBe("/design/library/marketing");
  });

  it("keep an exact item off nested routes", () => {
    const hit = activeItem(nav, "/design/library/button");
    expect(hit?.item.href).not.toBe("/design/library");
  });

  it("build crumbs area > section > item", () => {
    const crumbs = breadcrumbs(nav, "/design/library/rulings");
    expect(crumbs.map((c) => c.label)).toEqual([
      "Library",
      "Rules",
      "Will's rulings",
    ]);
    expect(breadcrumbs(nav, "/design/lab")[0]?.label).toBe("Lab");
  });

  it("know which area a path is in", () => {
    expect(areaOf("/design/lab/light")).toBe("lab");
    expect(areaOf("/design/library")).toBe("library");
    expect(areaOf("/design/labs")).toBe("library");
  });

  it("give neighbours in section order", () => {
    const { prev, next } = neighbours(nav, "/design/library/policies");
    expect(prev?.href).toBe("/design/library/rules");
    expect(next?.href).toBe("/design/library/guidance");
  });

  it("filter by label, note, id and keyword", () => {
    expect(flatten(filterNav(nav, "glossary")).length).toBeGreaterThan(0);
    expect(flatten(filterNav(nav, "zzz-nothing")).length).toBe(0);
    const byGroup = flatten(filterNav(nav, BIBLE_GROUP_LABEL[BIBLE_GROUPS[0]]));
    expect(byGroup.some((it) => it.href === "/design/library/rules")).toBe(
      true,
    );
  });
});

describe("the glossary", () => {
  it("links only to pages that exist", () => {
    for (const t of GLOSSARY)
      if (t.href) expect(pageFor(t.href), t.term).not.toBeNull();
  });
});
