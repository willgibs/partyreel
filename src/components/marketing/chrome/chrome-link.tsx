"use client";

import Link from "next/link";
import {
  type ComponentProps,
  createContext,
  type ReactNode,
  useContext,
} from "react";

/**
 * THE CHROME'S LINKS, WHICH A PAGE CAN QUIET (mkt-polish). Every link the marketing header, footer and
 * 404 words draw is this: `next/link` itself, unless the page drawing them asked for quiet, when it
 * prefetches nothing on sight and fetches on the press instead.
 *
 * ★ WHY THE ROOT 404 ASKS. It draws the marketing chrome OUTSIDE `(marketing)` (an unmatched URL has no
 * group layout), so every marketing route its links point at needs a stylesheet the 404 never loads. A
 * link in view prefetches its route, the prefetched payload names that route's sheets, and React preloads
 * each one the moment it decodes the payload: the 404 preloaded marketing.css and the home's three
 * sheets (the hero's, the river's, the backdrop's) and drew none of them, so Chrome warned four times a
 * load that each was "preloaded but not used". A lost visitor presses one link, a moment later or not at
 * all, so there the prefetch was all cost.
 *
 * A client island of its own, never a prop through the chrome: the header and footer are Server
 * Components on every page that mounts them directly, and only a client component can read the 404's
 * context. `next/link` is a client component already, so a link drawn through this one costs a page
 * nothing it was not already paying.
 */
const Quiet = createContext(false);

/** Wraps a page whose chrome should prefetch nothing on sight (the root 404). */
export function QuietChromePrefetch({ children }: { children: ReactNode }) {
  return <Quiet.Provider value>{children}</Quiet.Provider>;
}

export function ChromeLink(props: ComponentProps<typeof Link>) {
  const quiet = useContext(Quiet);
  return <Link {...props} prefetch={quiet ? false : props.prefetch} />;
}
