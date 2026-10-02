"use client";

import Link, { useLinkStatus } from "next/link";
import {
  type ComponentProps,
  createContext,
  type ReactNode,
  useContext,
  useState,
} from "react";

import { cn } from "@/lib/utils";

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

type ChromeLinkProps = ComponentProps<typeof Link> & {
  /**
   * Prefetch on INTENT, never on sight: the route is fetched when a pointer arrives, a finger touches
   * down or focus lands, and not before. For a link to a route whose sheets the page it sits on never
   * draws (the wordmark's door to `/`).
   */
  prefetchOnIntent?: boolean;
};

export function ChromeLink({ prefetchOnIntent, ...props }: ChromeLinkProps) {
  const quiet = useContext(Quiet);
  // A quiet page fetches on the press alone, intent or not (above).
  if (prefetchOnIntent && !quiet) return <IntentLink {...props} />;
  return <Link {...props} prefetch={quiet ? false : props.prefetch} />;
}

/**
 * ★ THE WORDMARK'S DOOR TO THE HOME PREFETCHED THE HOME'S THREE SHEETS INTO EVERY OTHER MARKETING PAGE.
 * The logo is in view from the first paint, so `next/link` prefetched `/` the moment any page loaded, and
 * React preloaded the home's hero, river and backdrop sheets from that payload and drew none of them:
 * three "preloaded but not used" warnings a load on /pricing, /about and /help, and about 4 KB of sheets
 * and 13 KB of payload at the highest priority, for a press only some visitors make (measured on
 * `next start`). Prefetching waits for a visitor who is going there: `prefetch={false}` (which stops the
 * viewport's prefetch AND the hover's, `next/link`'s own contract) until a pointer arrives or focus lands,
 * then `next/link`'s default, the pattern Next's prefetching guide gives for hover. A desk's hover has the
 * home fetched before the press; a finger's touch-down is the pointer's arrival, so a phone's tap carries
 * the same head start, shorter by the time a hover would have lasted.
 */
function IntentLink({
  prefetch,
  onPointerEnter,
  onFocus,
  ...props
}: ComponentProps<typeof Link>) {
  const [intent, setIntent] = useState(false);
  return (
    <Link
      {...props}
      prefetch={intent ? prefetch : false}
      onPointerEnter={(event) => {
        setIntent(true);
        onPointerEnter?.(event);
      }}
      onFocus={(event) => {
        setIntent(true);
        onFocus?.(event);
      }}
    />
  );
}

/**
 * Lives INSIDE a link and says, by being there, that the link's navigation has been pressed and has not yet
 * committed (`useLinkStatus`: true before the history updates, and skipped when the route was prefetched).
 * It draws nothing and takes no room; the link's own class reads it (`has-data-[link-pending]`), so the
 * feedback needs no layout of its own.
 */
export function LinkPending() {
  const { pending } = useLinkStatus();
  return pending ? <span aria-hidden data-link-pending="" /> : null;
}

/**
 * THE WORDMARK'S DOOR TO THE HOME, drawn once: the header's, the footer's and the phone menu's. It fetches
 * the home on intent and not on sight (`IntentLink`), which is what a press with no hover to lead it pays
 * for: on a slow connection the home's payload and chunks take most of a second to arrive, so the link
 * answers the press meanwhile. After 150 ms, so a navigation that commits at once never flashes, the wordmark
 * dims and the pointer shows the wait; it is the only link in the chrome with that wait to cover, the rest
 * being prefetched on sight as they always were.
 */
export function HomeLink({
  className,
  ...props
}: Omit<ComponentProps<typeof Link>, "href" | "prefetch">) {
  return (
    <ChromeLink
      {...props}
      href="/"
      aria-label="Partyreel home"
      prefetchOnIntent
      className={cn(
        "transition-opacity delay-150 has-data-[link-pending]:cursor-progress has-data-[link-pending]:opacity-60",
        className,
      )}
    >
      {props.children}
      <LinkPending />
    </ChromeLink>
  );
}
