"use client";

import { useEffect, useRef, useState } from "react";

import type { ArticleHeading } from "@/lib/content/collection";
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
 *
 * `progress` turns the rail into a READING SPINE: the hairline fills as you move
 * through the body. Position in a long read is real information, not decoration,
 * which is what earns it past the frequency rule. BOTH reading surfaces take it
 * (Will, 2026-08-29): it arrived blog-only in that round, and shipping one
 * behaviour on one of two pages built from the same component is the drift this
 * component exists to prevent. It stays a PROP rather than always-on because it
 * needs a measurable body, and the caller is what knows the body's id.
 *
 * ★ NOT `animation-timeline: scroll()`. It is the obvious CSS-only answer and it
 * is unsupported in Firefox, where the spine would simply never fill — a bar
 * that is silently broken for a third of readers is worse than the listener.
 * The listener is passive and rAF-coalesced, and writes ONE custom property on
 * ONE element (never a var on a shared ancestor: inherited custom properties
 * recalculate every descendant, the drawer-swipe lesson in design-system.md).
 */
/**
 * The id both reading pages put on their <article>, and the `progress` target. Shared so the two
 * cannot drift onto different ids and silently lose the spine on one of them.
 */
export const ARTICLE_BODY_ID = "article-body";

export function ArticleToc({
  headings,
  progress,
}: {
  headings: ArticleHeading[];
  /** Fill the rail against this element's scroll extent. `targetId` is the article body. */
  progress?: { targetId: string };
}) {
  const railRef = useRef<HTMLUListElement | null>(null);
  const progressTargetId = progress?.targetId;
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

  useEffect(() => {
    if (!progressTargetId) return;
    const body = document.getElementById(progressTargetId);
    const rail = railRef.current;
    if (!body || !rail) return;

    let frame = 0;
    const measure = () => {
      frame = 0;
      const rect = body.getBoundingClientRect();
      if (rect.height <= 0) return;
      // A READING LINE at 40% viewport height, tracked across the body's own height - NOT the
      // body's scroll overflow (`height - innerHeight`). The overflow version is arithmetically
      // honest and expressively useless: a 2-minute post is barely taller than the viewport, so it
      // gave a 167px sweep that snapped 0 -> 1 almost at once and then sat full for the rest of the
      // page. Measuring where the reading line sits WITHIN the piece gives a full sweep whatever
      // the length, and still completes at the end of the article rather than the end of the page
      // (the CTA band and footer must never count as reading).
      const line = window.innerHeight * 0.4;
      const fraction = Math.min(
        Math.max((line - rect.top) / rect.height, 0),
        1,
      );
      rail.style.setProperty("--toc-progress", String(fraction));
    };

    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    // rAF is SUSPENDED in a hidden tab, so a scroll restored while backgrounded leaves the spine
    // stale until the next scroll. Re-measuring on the way back costs nothing.
    document.addEventListener("visibilitychange", onScroll);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      document.removeEventListener("visibilitychange", onScroll);
    };
  }, [progressTargetId]);

  return (
    <ul
      ref={railRef}
      className={cn(
        "mt-3 flex flex-col border-l",
        // The spine is a scaleY overlay on the rail's own hairline: one composited property, and
        // the unfilled remainder stays visible underneath as the plain border.
        progressTargetId &&
          "relative before:absolute before:inset-y-0 before:-left-px before:w-px before:origin-top before:scale-y-[var(--toc-progress,0)] before:bg-foreground before:content-['']",
      )}
    >
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
