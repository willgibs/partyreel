import { existsSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it, vi } from "vitest";

import { BIBLE, BIBLE_GROUP_LABEL, BIBLE_GROUPS } from "../rules/bible";
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
import { KIND_ORDER, type SearchEntry, scoreEntry, searchLab } from "./search";
import {
  applyLabState,
  carryLabState,
  commandFor,
  isTypingTarget,
  LAB_PARAMS,
  labSearchString,
  LOCAL_PARAMS,
  readLabState,
  STICKY_PARAMS,
  withLabParam,
} from "./state";

// nav.ts reads the manifests and the specs at request time (server-only), and
// the gallery registry it lists mounts production components, some of which
// parse the public env on import; the values are never used here.
vi.mock("server-only", () => ({}));
vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "test-key");
vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000");
const { buildNav, buildSearchIndex } = await import("./nav");

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

/**
 * THE URL STATE (the Library x Lab round, 2026-09-15). A link is supposed to be
 * an exact view, which only holds if the sticky params ride every link, the
 * page-local ones never leave their page, and the query always lands BEFORE the
 * fragment (a key after a `#` is a 404 at the gate).
 */
describe("the lab's URL state", () => {
  it("splits the vocabulary into sticky and local, with nothing left over", () => {
    expect([...STICKY_PARAMS, ...LOCAL_PARAMS].sort()).toEqual(
      [...LAB_PARAMS].sort(),
    );
  });

  it("reads only the params it knows, and never an empty one", () => {
    expect(readLabState("key=abc&canvas=phone&utm=x&ground=")).toEqual({
      key: "abc",
      canvas: "phone",
    });
    expect(readLabState("")).toEqual({});
    expect(readLabState(null)).toEqual({});
  });

  it("writes the params in one order, so two equal states read alike", () => {
    expect(labSearchString({ canvas: "phone", key: "k" })).toBe(
      "?key=k&canvas=phone",
    );
    expect(labSearchString({})).toBe("");
  });

  it("puts the query before the fragment", () => {
    expect(applyLabState("/design/lab/palette#ramp", { key: "k" })).toBe(
      "/design/lab/palette?key=k#ramp",
    );
  });

  it("lets the href's own params win, and keeps params it does not know", () => {
    expect(
      applyLabState("/design/lab/light?candidate=c&debug=1", {
        candidate: "a",
        key: "k",
      }),
    ).toBe("/design/lab/light?key=k&candidate=c&debug=1");
  });

  it("leaves an absolute url alone", () => {
    expect(applyLabState("https://partyreel.com/x", { key: "k" })).toBe(
      "https://partyreel.com/x",
    );
  });

  it("carries the reading context across pages and the position never", () => {
    const state = { key: "k", canvas: "phone", candidate: "b", s: "ramp" };
    expect(
      carryLabState("/design/lab/light", state, "/design/lab/palette"),
    ).toBe("/design/lab/light?key=k&canvas=phone");
  });

  it("carries the position on a link that stays on the page", () => {
    const state = { key: "k", candidate: "b", s: "ramp" };
    expect(
      carryLabState("/design/lab/palette#steps", state, "/design/lab/palette"),
    ).toBe("/design/lab/palette?key=k&candidate=b&s=ramp#steps");
    expect(carryLabState("#steps", state, "/design/lab/palette")).toBe(
      "?key=k&candidate=b&s=ramp#steps",
    );
  });

  it("sets and clears one param without touching the rest", () => {
    const state = { key: "k", canvas: "phone" };
    expect(withLabParam(state, "candidate", "b")).toEqual({
      key: "k",
      canvas: "phone",
      candidate: "b",
    });
    expect(withLabParam(state, "canvas", null)).toEqual({ key: "k" });
    expect(state).toEqual({ key: "k", canvas: "phone" });
  });
});

describe("the keyboard contract", () => {
  const field = { tagName: "INPUT" };

  it("opens the palette on the chord, even while typing", () => {
    expect(commandFor({ key: "k", metaKey: true })).toEqual({
      kind: "palette",
    });
    expect(commandFor({ key: "K", ctrlKey: true, target: field })).toEqual({
      kind: "palette",
    });
  });

  it("reads the bare keys only when no field has focus", () => {
    expect(commandFor({ key: "[" })).toEqual({ kind: "prev" });
    expect(commandFor({ key: "]" })).toEqual({ kind: "next" });
    expect(commandFor({ key: "3" })).toEqual({ kind: "digit", n: 3 });
    expect(commandFor({ key: "/" })).toEqual({ kind: "palette" });
    for (const key of ["[", "]", "3", "/"])
      expect(commandFor({ key, target: field }), key).toBeNull();
  });

  it("means nothing with a modifier, or for any other key", () => {
    expect(commandFor({ key: "]", metaKey: true })).toBeNull();
    expect(commandFor({ key: "0" })).toBeNull();
    expect(commandFor({ key: "a" })).toBeNull();
  });

  it("knows where a reader is typing", () => {
    expect(isTypingTarget({ tagName: "TEXTAREA" })).toBe(true);
    expect(isTypingTarget({ isContentEditable: true })).toBe(true);
    expect(isTypingTarget({ tagName: "DIV" })).toBe(false);
    expect(isTypingTarget(null)).toBe(false);
    expect(
      isTypingTarget({ tagName: "DIV", closest: () => ({}) }),
      "an opted-out region",
    ).toBe(true);
  });
});

/**
 * THE SEARCH INDEX. The palette is the only place a rule, a landmine, a
 * component, a board, a doc heading and a glossary term are all reachable, so
 * a kind that silently stops being indexed is invisible until someone fails to
 * find something. Held against the real registries, like the nav above.
 */
const index = buildSearchIndex(nav);

describe("the search index", () => {
  it("carries every kind the palette groups by", () => {
    const kinds = new Set(index.map((e) => e.kind));
    for (const kind of KIND_ORDER) expect(kinds.has(kind), kind).toBe(true);
  });

  it("points every entry at a lab route", () => {
    const bad = index.filter((e) => !e.href.startsWith("/design/"));
    expect(bad.map((e) => e.key)).toEqual([]);
  });

  it("keys every entry uniquely", () => {
    expect(new Set(index.map((e) => e.key)).size).toBe(index.length);
  });

  it("answers a component once, never also as a nav page", () => {
    const hrefs = index
      .filter((e) => e.kind === "page" || e.kind === "component")
      .map((e) => e.href);
    expect(hrefs.length).toBe(new Set(hrefs).size);
  });

  it("lists every bible rule and every board", () => {
    const ids = new Set(
      index.filter((e) => e.kind === "rule").map((e) => e.id),
    );
    for (const r of BIBLE) expect(ids.has(r.id), r.id).toBe(true);
    const boards = new Set(
      index.filter((e) => e.kind === "board").map((e) => e.id),
    );
    for (const r of SANDBOX) expect(boards.has(r.id), r.id).toBe(true);
  });

  it("scores id exact over title prefix over word over keyword", () => {
    const entry = (over: Partial<SearchEntry>): SearchEntry => ({
      key: "k",
      kind: "rule",
      id: "no-em-dashes",
      title: "19. No em-dashes in copy",
      href: "/design/library/rules/no-em-dashes",
      ...over,
    });
    const exact = scoreEntry(entry({}), "no-em-dashes");
    const prefix = scoreEntry(entry({ title: "no em" }), "no em");
    const word = scoreEntry(entry({}), "em-dashes");
    const keyword = scoreEntry(entry({ keywords: "bible 19" }), "bible 19");
    expect(exact).toBeGreaterThan(prefix);
    expect(prefix).toBeGreaterThan(word);
    expect(word).toBeGreaterThan(keyword);
    expect(scoreEntry(entry({}), "nothing-like-this")).toBe(0);
  });

  it("breaks a tie toward the shorter title", () => {
    const base = { key: "k", kind: "component" as const, href: "/design/x" };
    const short = scoreEntry({ ...base, id: "a", title: "Tag" }, "tag");
    const long = scoreEntry(
      { ...base, id: "b", title: "Tag row block" },
      "tag",
    );
    expect(short).toBeGreaterThan(long);
  });

  it("finds a rule by its number, a board by its id and a glossary word", () => {
    const has = (query: string, kind: string) =>
      searchLab(index, query).some((g) => g.kind === kind && g.entries.length);
    expect(has("bible 22", "rule")).toBe(true);
    expect(has("palette", "board")).toBe(true);
    expect(has("landmine", "glossary")).toBe(true);
    expect(has("no-em-dash-policy", "policy")).toBe(true);
  });

  it("groups in KIND_ORDER and never exceeds the limit", () => {
    const groups = searchLab(index, "the", 12);
    const order = groups.map((g) => g.kind);
    expect(order).toEqual(KIND_ORDER.filter((k) => order.includes(k)));
    expect(
      groups.reduce((n, g) => n + g.entries.length, 0),
    ).toBeLessThanOrEqual(12);
  });

  it("returns nothing for an empty query", () => {
    expect(searchLab(index, "   ")).toEqual([]);
  });
});
