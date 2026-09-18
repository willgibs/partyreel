"use client";

import { useState } from "react";

import type { Nav } from "@/app/(dev)/design/_data/catalog";
import type { SearchIndex } from "@/app/(dev)/design/_data/search";
import { LabKeys } from "./keys";
import { Palette } from "./palette";
import { ShellProvider } from "./shell-context";
import { Sidebar } from "./sidebar";
import { Toc } from "./toc";
import { TopBar } from "./top-bar";

/**
 * THE FRAME (the Library x Lab round, 2026-09-15): the top bar over a grid of
 * sidebar, content and table of contents (design.css: 240px at `lg`, plus a
 * 200px rail at `xl`; one column below, where the sidebar is a sheet). The nav
 * and the search index come in as props from the server layout, so nothing
 * heavy is imported on the client. The page's own server tree renders through
 * `children`.
 *
 * `LabKeys` binds the window once for the whole lab and `Palette` is the one
 * ⌘K surface; both live here rather than on a page so no two pages can install
 * a second copy.
 *
 * THE NARROW-WINDOW TABLE OF CONTENTS IS NOT HERE (the sweep, 2026-09-16). It
 * used to open the content column, above the breadcrumbs and the title, so
 * every page below 1280 began with a grey "On this page" bar before it said
 * what the page was; Will read it as "a weird section at the top". It now
 * renders inside the page header (page-header.tsx), under the title and the one
 * line, which is where a reader is when they decide whether to jump.
 *
 * THE SKIP LINK is the first thing in the tab order. The sidebar carries up to
 * forty links between the top bar and the page, so a keyboard reader used to
 * take thirty-odd stops to reach the content of a page they had just chosen.
 */
export function Shell({
  nav,
  index,
  designKey,
  children,
}: {
  nav: Nav;
  index: SearchIndex;
  /** The gate key the proxy forwarded; null in open dev. */
  designKey: string | null;
  children: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <ShellProvider nav={nav} index={index} designKey={designKey}>
      <div className="lab-shell min-h-dvh bg-background text-foreground">
        {/* Plain CSS, not `sr-only` + `focus-visible:not-sr-only`: the lab's
            sheet compiles into the `utilities.lab` SUB-layer, `not-sr-only` is
            used nowhere in production, and a sub-layer rule loses to
            production's `sr-only` at equal specificity, so the link would never
            appear (the landmine at the head of design.css). */}
        <a href="#lab-content" className="lab-skip">
          Skip to the page
        </a>
        <TopBar onMenu={() => setMenuOpen(true)} />
        <div className="lab-shell-body">
          <Sidebar open={menuOpen} onOpenChange={setMenuOpen} />
          <main
            id="lab-content"
            // -1 so the skip link MOVES the focus rather than only scrolling:
            // without it the next Tab lands back in the sidebar.
            tabIndex={-1}
            className="lab-content min-w-0 outline-none"
            data-toc-root
          >
            {children}
          </main>
          <aside className="lab-toc">
            <Toc variant="column" />
          </aside>
        </div>
      </div>
      <LabKeys />
      <Palette />
    </ShellProvider>
  );
}
