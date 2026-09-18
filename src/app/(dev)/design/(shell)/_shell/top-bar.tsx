"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef } from "react";
import { FlaskConical, Menu, PanelLeft, Search } from "lucide-react";

import { setLabPref, useLabPrefs } from "@/components/lab/lab-prefs";
import { cn } from "@/lib/utils";

import { AREA_HREF, areaOf } from "@/app/(dev)/design/_data/catalog";
import { ThemeToggle } from "@/app/(dev)/design/theme-toggle";
import { Kbd } from "./kbd";
import { LabLink, useDesignKey, useNav, usePalette } from "./shell-context";

/**
 * THE TOP BAR (the Library x Lab round, 2026-09-15): the mark, the two areas,
 * the search that opens the palette, the theme control (the lab's single one)
 * and, from `lg`, the sidebar toggle (any page: a reader who wants the measure
 * collapses the nav on a doctrine doc as readily as on a board). It measures
 * itself into `--lab-topbar-h` on <html>, which the sticky sidebar, the table
 * of contents and a board's dock all sit under.
 *
 * SEARCH IS THE BAR'S CENTREPIECE and the sidebar's field is a filter: two
 * different jobs, named differently on purpose. This one crosses both areas
 * and every kind of thing the lab holds; the sidebar's narrows the tree you
 * are already looking at. From `md` it reads as a field with its ⌘K cap, which
 * is the only way a shortcut gets learned; below that it is the icon, because
 * a phone has no ⌘.
 *
 * Motion: the bar is on screen constantly, so nothing here eases except a
 * hovered control's colour (90ms). The area switch tints instantly, because a
 * sliding indicator would still be travelling when the next page paints.
 */
export function TopBar({ onMenu }: { onMenu: () => void }) {
  const ref = useRef<HTMLElement | null>(null);
  const nav = useNav();
  const pathname = usePathname();
  const key = useDesignKey();
  const { setOpen } = usePalette();
  const { sidebar } = useLabPrefs();
  const area = areaOf(pathname);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const html = document.documentElement;
    const sync = () =>
      html.style.setProperty(
        "--lab-topbar-h",
        `${Math.round(el.getBoundingClientRect().height)}px`,
      );
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => {
      ro.disconnect();
      html.style.removeProperty("--lab-topbar-h");
    };
  }, []);

  return (
    <header
      ref={ref}
      className="lab-topbar sticky top-0 z-40 flex h-12 items-center gap-1.5 border-b border-border bg-background/85 px-2.5 backdrop-blur-md sm:gap-2 sm:px-4"
    >
      <button
        type="button"
        onClick={onMenu}
        aria-controls="lab-sidebar"
        aria-label="Open navigation"
        className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors duration-90 hover:bg-muted hover:text-foreground lg:hidden"
      >
        <Menu className="size-4" />
      </button>
      <LabLink
        href="/design/library"
        className="flex shrink-0 items-center gap-2 rounded-md text-sm font-semibold"
      >
        <FlaskConical className="size-4" />
        <span className="hidden sm:inline">Partyreel Design</span>
        <span className="sr-only sm:hidden">Partyreel Design</span>
      </LabLink>
      <nav
        aria-label="Areas"
        className="ml-1 flex shrink-0 items-center gap-0.5 sm:ml-2"
      >
        {nav.map((a) => (
          <LabLink
            key={a.id}
            href={AREA_HREF[a.id]}
            aria-current={area === a.id ? "page" : undefined}
            title={a.blurb}
            className={cn(
              "rounded-md px-2.5 py-1 text-[13px] font-medium",
              area === a.id
                ? "bg-muted text-foreground"
                : "text-muted-foreground transition-colors duration-90 hover:text-foreground",
            )}
          >
            {a.label}
          </LabLink>
        ))}
      </nav>

      <div className="ml-auto flex min-w-0 items-center gap-1.5 sm:gap-2">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Search the library and the lab"
          className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors duration-90 hover:bg-muted hover:text-foreground md:hidden"
        >
          <Search className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="hidden h-8 w-48 items-center gap-2 rounded-md border border-border bg-card px-2.5 text-left text-[13px] text-muted-foreground transition-colors duration-90 hover:border-ring/60 hover:text-foreground md:flex lg:w-56"
        >
          <Search className="size-3.5 shrink-0" />
          <span className="min-w-0 flex-1 truncate">Search everything</span>
          <Kbd className="shrink-0">⌘K</Kbd>
        </button>
        <span
          className={cn(
            "hidden rounded-full border px-2 py-0.5 text-[10px] lg:inline",
            key
              ? "border-border text-muted-foreground"
              : "border-border/70 text-muted-foreground/70",
          )}
          title={
            key
              ? "The preview key rides every link on this page"
              : "No key on the URL: open in development, a 404 in production"
          }
        >
          {key
            ? "Key ····"
            : process.env.NODE_ENV === "development"
              ? "Gate open (dev)"
              : "No key"}
        </span>
        <ThemeToggle />
        <button
          type="button"
          onClick={() =>
            setLabPref(
              "sidebar",
              sidebar === "collapsed" ? "open" : "collapsed",
            )
          }
          aria-pressed={sidebar === "open"}
          aria-label={
            sidebar === "collapsed" ? "Show the sidebar" : "Hide the sidebar"
          }
          // It used to say "on a board page", which was the truth and the bug:
          // the grid honoured the preference only on a board, so the one
          // control on screen at every width did nothing on nine pages in ten
          // (the sweep, 2026-09-16; design.css now collapses on any page).
          title={
            sidebar === "collapsed" ? "Show the sidebar" : "Hide the sidebar"
          }
          className={cn(
            "hidden size-8 items-center justify-center rounded-md transition-colors duration-90 hover:bg-muted lg:flex",
            sidebar === "open"
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <PanelLeft className="size-4" />
        </button>
      </div>
    </header>
  );
}
