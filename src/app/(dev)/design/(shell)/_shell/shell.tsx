"use client";

import { useState } from "react";

import type { Nav } from "@/app/(dev)/design/_data/catalog";
import { ShellProvider } from "./shell-context";
import { Sidebar } from "./sidebar";
import { Toc } from "./toc";
import { TopBar } from "./top-bar";

/**
 * THE FRAME (the Library x Lab round, 2026-09-15): the top bar over a grid of
 * sidebar, content and table of contents (design.css: 240px at `lg`, plus a
 * 200px rail at `xl`; one column below). The nav comes in as props from the
 * server layout, so nothing heavy is imported on the client. The page's own
 * server tree renders through `children`.
 */
export function Shell({
  nav,
  designKey,
  children,
}: {
  nav: Nav;
  /** The gate key the proxy forwarded; null in open dev. */
  designKey: string | null;
  children: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <ShellProvider nav={nav} designKey={designKey}>
      <div className="lab-shell min-h-dvh bg-background text-foreground">
        <TopBar menuOpen={menuOpen} onMenu={() => setMenuOpen((o) => !o)} />
        <div className="lab-shell-body">
          <Sidebar open={menuOpen} onNavigate={() => setMenuOpen(false)} />
          <main className="lab-content min-w-0" data-toc-root>
            <div className="lab-content-inner mx-auto w-full max-w-4xl px-4 sm:px-6">
              <Toc variant="inline" />
            </div>
            {children}
          </main>
          <aside className="lab-toc hidden xl:block">
            <Toc variant="column" />
          </aside>
        </div>
      </div>
    </ShellProvider>
  );
}
