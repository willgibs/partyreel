"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, ArrowUp } from "lucide-react";

import { cn } from "@/lib/utils";

type Item = { id: string; text: string; level: 2 | 3 };

/**
 * ON THIS PAGE (the Library x Lab round, 2026-09-15): the h2 and h3 headings
 * with ids inside `[data-toc-root]`, scanned after the page renders and again
 * when the route changes, with the heading in view marked. A page with fewer
 * than two headings shows nothing, and no page has to pass anything: the scan
 * is what lets a board's client tree and a rendered doc both get one.
 *
 * TWO PLACES: the `column` variant is the rail the shell mounts beside the page
 * from 1280 (shell.tsx); the `inline` variant is the disclosure the PAGE HEADER
 * closes with below that width (page-header.tsx). Neither is ever the first
 * thing on a page.
 *
 * ACTIVE BY POSITION, NOT BY INTERSECTION. An IntersectionObserver marks
 * nothing once you scroll past the last heading (nothing is intersecting), and
 * marks the wrong one on a page whose sections are taller than the viewport;
 * both were visible on the bible and on a doctrine page. This measures instead:
 * the active heading is the last one above the reading line, which is the top
 * of the content under the bar and the dock. Cheap, because it reads the
 * cached rects on a rAF-throttled scroll rather than on every event.
 *
 * Motion: the rail and the label change instantly while you scroll (anything
 * that eases lags behind the scroll and reads as a bug); the inline
 * disclosure, which is occasional, takes the shell's 180ms collapse.
 */
export function Toc({ variant }: { variant: "column" | "inline" }) {
  const pathname = usePathname();
  const [items, setItems] = useState<Item[]>([]);
  const [active, setActive] = useState<string | null>(null);
  // The disclosure remembers WHICH page it was opened on, so a route change
  // closes it without an effect that would set state behind every navigation.
  // The column variant lives in the layout and never unmounts; the inline one
  // now rides the page header (the sweep, 2026-09-16) and does, so this is
  // belt and braces rather than dead weight.
  const [openFor, setOpenFor] = useState<string | null>(null);
  const open = openFor === pathname;
  const anchors = useRef<{ id: string; el: Element }[]>([]);

  const mark = useCallback(() => {
    const line = readingLine();
    let current: string | null = anchors.current[0]?.id ?? null;
    for (const a of anchors.current) {
      if (a.el.getBoundingClientRect().top - line <= 1) current = a.id;
      else break;
    }
    setActive(current);
  }, []);

  useEffect(() => {
    let raf = 0;
    let ticking = 0;
    const scan = () => {
      const root = document.querySelector("[data-toc-root]");
      const found = root
        ? Array.from(
            root.querySelectorAll<HTMLHeadingElement>("h2, h3"),
          ).filter((h) => !h.closest("[data-toc-skip]"))
        : [];
      const seen = new Set<string>();
      const next: Item[] = [];
      const targets: { id: string; el: Element }[] = [];
      for (const h of found) {
        const box = anchorOf(h);
        if (!box || seen.has(box.id)) continue;
        seen.add(box.id);
        next.push({
          id: box.id,
          text: h.textContent?.trim() ?? box.id,
          level: h.tagName === "H2" ? 2 : 3,
        });
        // Measured on the element that CARRIES the id, because that is where
        // the browser scrolls when the link is followed.
        targets.push({ id: box.id, el: box });
      }
      anchors.current = targets;
      setItems(next);
      mark();
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = requestAnimationFrame(() => {
        ticking = 0;
        mark();
      });
    };
    // After paint, so a client tree has its headings in the DOM; a second pass
    // a moment later catches lazy mounts.
    raf = requestAnimationFrame(scan);
    const late = setTimeout(scan, 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      if (ticking) cancelAnimationFrame(ticking);
      clearTimeout(late);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [pathname, mark]);

  if (items.length < 2) return null;

  const list = (
    <ul className="space-y-px text-[12px]">
      {items.map((it) => (
        <li key={it.id}>
          <a
            href={`#${it.id}`}
            aria-current={active === it.id ? "location" : undefined}
            className={cn(
              "block truncate rounded-r-md border-l py-1 pr-2",
              it.level === 3 ? "pl-5" : "pl-2.5",
              active === it.id
                ? "border-foreground font-medium text-foreground"
                : "border-border text-muted-foreground transition-colors duration-90 hover:border-foreground/40 hover:text-foreground",
            )}
          >
            {it.text}
          </a>
        </li>
      ))}
    </ul>
  );

  if (variant === "inline") {
    return (
      <div className="lab-toc-compact mt-5">
        <button
          type="button"
          aria-expanded={open}
          aria-controls="lab-toc-inline"
          onClick={() => setOpenFor(open ? null : pathname)}
          className="flex w-full items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-left transition-colors duration-90 hover:bg-muted/40"
        >
          <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
            On this page
          </span>
          <span className="min-w-0 flex-1 truncate text-[12px] text-foreground/80">
            {items.find((it) => it.id === active)?.text ?? ""}
          </span>
          <ChevronDown
            className={cn(
              "lab-chevron size-3.5 shrink-0 text-muted-foreground",
              !open && "-rotate-90",
            )}
          />
        </button>
        <div
          id="lab-toc-inline"
          className="lab-disclosure"
          data-open={open}
          inert={!open}
        >
          {/* No padding on the disclosure's own child: a grid item's
              padding survives `grid-template-rows: 0fr`, so `pt-2` here left
              every closed section 8px tall. */}
          <div className="min-h-0 overflow-hidden">
            <div className="pt-2">{list}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-2 pl-2.5 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
        On this page
      </p>
      {list}
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="mt-3 flex items-center gap-1.5 pl-2.5 text-[11px] text-muted-foreground transition-colors duration-90 hover:text-foreground"
      >
        <ArrowUp className="size-3" />
        Back to top
      </button>
    </div>
  );
}

/**
 * The element a heading's link points at. TWO MARKUP SHAPES exist in the lab
 * and the shell refuses to demand one: the shell's own `Section` and every
 * rendered markdown doc put the id on the HEADING, while the gallery's older
 * `RefSection` puts it on the wrapper with a bare `<h2>` inside. A heading with
 * no id of its own therefore adopts its nearest `[id]` ancestor, but only when
 * it is that container's FIRST heading, so two `<h2>`s in one box never claim
 * the same anchor.
 */
function anchorOf(h: HTMLHeadingElement): Element | null {
  if (h.id) return h;
  const box = h.closest("[id]");
  if (!box) return null;
  return box.querySelector("h1, h2, h3, h4") === h ? box : null;
}

/**
 * The y at which a heading counts as reached: under the top bar and, on a
 * board, under the dock as well. Both write their height to <html>, so this is
 * one read of two custom properties rather than a measurement of either.
 */
function readingLine(): number {
  const style = getComputedStyle(document.documentElement);
  const px = (name: string) => {
    const value = parseFloat(style.getPropertyValue(name));
    return Number.isFinite(value) ? value : 0;
  };
  // The review card pins under the dock while a review is open and writes its
  // height the same way (review-card.tsx); without this term a heading reads
  // as "reached" a card early (the lab-review-card track's handoff, 2026-09-16).
  return (
    px("--lab-topbar-h") + px("--board-dock-h") + px("--review-card-h") + 24
  );
}
