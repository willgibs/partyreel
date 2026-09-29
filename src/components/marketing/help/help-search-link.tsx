"use client";

import Link from "next/link";
import type { ComponentProps } from "react";

import {
  HELP_SEARCH_HREF,
  markHelpSearchArrival,
  requestHelpSearch,
} from "./help-search-signal";

/**
 * THE PLAIN SEARCH ROW (help-center r1 `search=visible`: "The mount stays local; the footer's
 * Resources column and header panel each gain a plain Search row"). A real link to `/help?search`,
 * so a new tab, a middle-click or a page with no JavaScript still lands on the help center with the
 * palette opening; a plain click rings the palette on this page first (help-search-signal.ts), and
 * only when nothing here answers does the link go on to /help, where the palette opens on arrival.
 *
 * It takes its look from where it sits (the footer's link, the panel's footnote, the phone menu's
 * row) and composes with a wrapper's own click, which is how the header panel closes and the phone
 * menu's sheet folds away under it.
 */
export function HelpSearchLink({
  onClick,
  children,
  ...props
}: Omit<ComponentProps<typeof Link>, "href">) {
  return (
    <Link
      {...props}
      href={HELP_SEARCH_HREF}
      prefetch={false}
      onClick={(event) => {
        onClick?.(event);
        // A modified or a non-primary click is the browser's own: a new tab opens /help?search,
        // and the palette opens on arrival there.
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        ) {
          return;
        }
        if (requestHelpSearch()) {
          // A palette on this page took it: no navigation at all.
          event.preventDefault();
          return;
        }
        // Nothing here answers: the link goes on to /help, whose palette opens once it mounts.
        markHelpSearchArrival();
      }}
    >
      {children}
    </Link>
  );
}
