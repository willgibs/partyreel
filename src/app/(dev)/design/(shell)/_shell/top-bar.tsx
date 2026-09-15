"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef } from "react";
import { FlaskConical, Menu, PanelLeft, X } from "lucide-react";

import { setLabPref, useLabPrefs } from "@/components/dev/board/lab-prefs";
import { cn } from "@/lib/utils";

import { AREA_HREF, areaOf } from "@/app/(dev)/design/_data/catalog";
import { ThemeToggle } from "@/app/(dev)/design/theme-toggle";
import { LabLink, useDesignKey, useNav } from "./shell-context";

/**
 * THE TOP BAR (the Library x Lab round, 2026-09-15): the mark, the two areas,
 * the sidebar toggle (the way back on a board page, where the sidebar is
 * tucked away), the theme control (the lab's single one, moved from the old
 * rail's footer) and the key chip. It measures itself into `--lab-topbar-h`
 * on <html>, which the sticky sidebar, the table of contents and a board's
 * dock all sit under.
 */
export function TopBar({
  menuOpen,
  onMenu,
}: {
  menuOpen: boolean;
  onMenu: () => void;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const nav = useNav();
  const pathname = usePathname();
  const key = useDesignKey();
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
      className="lab-topbar sticky top-0 z-40 flex h-12 items-center gap-2 border-b border-border bg-background/90 px-3 backdrop-blur sm:px-4"
    >
      <button
        type="button"
        onClick={onMenu}
        aria-expanded={menuOpen}
        aria-controls="lab-sidebar"
        aria-label={menuOpen ? "Close navigation" : "Open navigation"}
        className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden"
      >
        {menuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
      </button>
      <LabLink
        href="/design/library"
        className="flex items-center gap-2 text-sm font-semibold"
      >
        <FlaskConical className="size-4" />
        <span className="hidden sm:inline">Partyreel Design</span>
      </LabLink>
      <nav aria-label="Areas" className="ml-2 flex items-center gap-0.5">
        {nav.map((a) => (
          <LabLink
            key={a.id}
            href={AREA_HREF[a.id]}
            aria-current={area === a.id ? "page" : undefined}
            className={cn(
              "rounded-md px-2.5 py-1 text-[13px] font-medium transition-colors",
              area === a.id
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {a.label}
          </LabLink>
        ))}
      </nav>
      <div className="ml-auto flex items-center gap-2">
        <span
          className="hidden rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground sm:inline"
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
            sidebar === "collapsed"
              ? "Show the sidebar on wide pages"
              : "Hide the sidebar on wide pages"
          }
          title="The sidebar on a board page"
          className="hidden size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground lg:flex"
        >
          <PanelLeft className="size-4" />
        </button>
      </div>
    </header>
  );
}
