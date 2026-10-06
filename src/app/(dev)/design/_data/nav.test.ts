import { existsSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it, vi } from "vitest";

import { breadcrumbs } from "./catalog";

// nav.ts reads the manifests and the specs at request time (server-only), and the gallery registry it lists mounts
// production components, some of which parse the public env on import; the values are never used here.
vi.mock("server-only", () => ({}));
vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "test-key");
vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000");
const { buildNav } = await import("./nav");

/**
 * THE TOOLS INDEX IS LINKED (lab-kit-2). `/design/lab/tools` had no link anywhere: the Tools section carried no `href`,
 * and a section's href is the only thing that puts it in a tool's breadcrumbs, so the index was reached by its URL alone
 * and `lab:smoke`'s crawl (which follows hrefs) never visited it. The crumb is what is held here, because the crumb is
 * what a reader and the crawl both meet.
 */
const nav = await buildNav();
const tools = nav
  .find((area) => area.id === "lab")
  ?.sections.find((section) => section.id === "tools");

describe("the Tools section", () => {
  it("carries the tools' index as its href, and the index is a page", () => {
    expect(tools?.href).toBe("/design/lab/tools");
    expect(
      existsSync(
        join(process.cwd(), "src/app/(dev)/design/(shell)/lab/tools/page.tsx"),
      ),
    ).toBe(true);
  });

  it("puts the index between the lab and every tool, in each tool's breadcrumbs", () => {
    const items = tools?.items ?? [];
    expect(items.length).toBeGreaterThan(0);
    for (const tool of items)
      expect(
        breadcrumbs(nav, tool.href).map((crumb) => crumb.href),
        tool.label,
      ).toEqual(["/design/lab", "/design/lab/tools", tool.href]);
  });
});
