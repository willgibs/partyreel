"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

type Item = { id: string; text: string; level: 2 | 3 };

/**
 * ON THIS PAGE (the Library x Lab round, 2026-09-15): the h2 and h3 headings
 * with ids inside `[data-toc-root]`, scanned after the page renders and
 * again when the route changes, with the heading in view marked. A page with
 * fewer than two headings shows nothing. The `column` variant is the right
 * rail from `xl`; `inline` is the disclosure a narrower window gets. Server
 * headings would be exact; the DOM scan needs nothing from a page, which is
 * what Phase 0 wants (the lab-shell track may pass items from the data).
 */
export function Toc({ variant }: { variant: "column" | "inline" }) {
  const pathname = usePathname();
  const [items, setItems] = useState<Item[]>([]);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    let raf = 0;
    let observer: IntersectionObserver | null = null;
    const scan = () => {
      const root = document.querySelector("[data-toc-root]");
      const heads = root
        ? Array.from(
            root.querySelectorAll<HTMLHeadingElement>("h2[id], h3[id]"),
          )
        : [];
      const next: Item[] = heads
        .filter((h) => !h.closest("[data-toc-skip]"))
        .map((h) => ({
          id: h.id,
          text: h.textContent?.trim() ?? h.id,
          level: h.tagName === "H2" ? 2 : 3,
        }));
      setItems(next);
      observer?.disconnect();
      if (next.length === 0) return;
      observer = new IntersectionObserver(
        (entries) => {
          const hit = entries
            .filter((e) => e.isIntersecting)
            .sort(
              (a, b) => a.boundingClientRect.top - b.boundingClientRect.top,
            )[0];
          if (hit) setActive((hit.target as HTMLElement).id);
        },
        { rootMargin: "-10% 0px -70% 0px", threshold: [0, 1] },
      );
      heads.forEach((h) => observer?.observe(h));
    };
    // After paint, so client-rendered pages (a board's client tree) have their
    // headings in the DOM; a second pass a moment later catches lazy mounts.
    raf = requestAnimationFrame(scan);
    const late = setTimeout(scan, 600);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(late);
      observer?.disconnect();
    };
  }, [pathname]);

  if (items.length < 2) return null;

  const list = (
    <ul className="space-y-1 text-[12px]">
      {items.map((it) => (
        <li key={it.id} className={cn(it.level === 3 && "pl-3")}>
          <a
            href={`#${it.id}`}
            aria-current={active === it.id ? "location" : undefined}
            className={cn(
              "block truncate py-0.5 text-muted-foreground transition-colors hover:text-foreground",
              active === it.id && "text-foreground",
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
      <details className="mt-4 rounded-lg border border-border px-3 py-2 xl:hidden">
        <summary className="cursor-pointer text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
          On this page
        </summary>
        <div className="pt-2">{list}</div>
      </details>
    );
  }

  return (
    <div>
      <p className="mb-2 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
        On this page
      </p>
      {list}
    </div>
  );
}
