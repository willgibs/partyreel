"use client";

import { useEffect, useState } from "react";

import type { ArticleHeading } from "@/lib/content/help";
import { pickActiveHeading } from "@/lib/shared/pick-active-heading";
import { cn } from "@/lib/utils";

/**
 * The article ToC list with scroll-spy (R6). Geometry decides the active
 * heading (pickActiveHeading, pure + unit-tested); IntersectionObserver is only
 * the recompute trigger, with hashchange/popstate resyncs so programmatic jumps
 * can't strand the highlight. Active state is the measurement-free treatment
 * (ink text + the rail segment): the gliding indicator was deliberately cut.
 * The header offset is MEASURED from the sticky header's rect — never read
 * --mkt-header-h off documentElement (it's declared on [data-mkt], the
 * readCssMs lesson).
 */
export function ArticleToc({ headings }: { headings: ArticleHeading[] }) {
  const [activeId, setActiveId] = useState<string | null>(
    headings[0]?.id ?? null,
  );

  useEffect(() => {
    const elements = headings
      .map((heading) => document.getElementById(heading.id))
      .filter((el): el is HTMLElement => el !== null);
    if (elements.length === 0) return;

    const offset =
      (document.querySelector("header")?.getBoundingClientRect().height ?? 64) +
      24;

    const sync = () =>
      setActiveId(
        pickActiveHeading(
          elements.map((el) => ({
            id: el.id,
            top: el.getBoundingClientRect().top,
          })),
          offset,
        ),
      );

    sync();
    // Top margin -offset puts the observer's upper boundary exactly on the
    // decision line, so a heading crossing it always fires a recompute.
    const observer = new IntersectionObserver(sync, {
      rootMargin: `-${Math.round(offset)}px 0px -70% 0px`,
    });
    for (const el of elements) observer.observe(el);
    window.addEventListener("hashchange", sync);
    window.addEventListener("popstate", sync);
    return () => {
      observer.disconnect();
      window.removeEventListener("hashchange", sync);
      window.removeEventListener("popstate", sync);
    };
  }, [headings]);

  return (
    <ul className="mt-3 flex flex-col border-l">
      {headings.map((heading) => {
        const isActive = activeId === heading.id;
        return (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              aria-current={isActive ? "true" : undefined}
              className={cn(
                "-ml-px block border-l py-1.5 pl-3 text-sm transition-colors duration-150",
                isActive
                  ? "border-foreground font-medium text-foreground"
                  : "border-transparent text-muted-foreground hover:border-foreground/40 hover:text-foreground",
              )}
            >
              {heading.text}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
