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
        <TopBar onMenu={() => setMenuOpen(true)} />
        <div className="lab-shell-body">
          <Sidebar open={menuOpen} onOpenChange={setMenuOpen} />
          <main className="lab-content min-w-0" data-toc-root>
            {/* The narrow-window table of contents sits above the page, the
                one place a reader looks before reading. It is chrome, so the
                markdown copy skips it. */}
            <div
              className="lab-content-inner mx-auto w-full max-w-4xl px-4 sm:px-6"
              data-copy-skip
            >
              <Toc variant="inline" />
            </div>
            {children}
          </main>
          <aside className="lab-toc hidden xl:block">
            <Toc variant="column" />
          </aside>
        </div>
      </div>
      <LabKeys />
      <Palette />
    </ShellProvider>
  );
}
