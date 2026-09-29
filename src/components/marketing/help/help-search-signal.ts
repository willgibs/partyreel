/**
 * THE HELP PALETTE'S DOORBELL (help-center r1 `search=visible`, Will: "this help palette should have
 * zero conflicts with where they get used"). The palette stays mounted where it always was, under
 * /help and on /contact, and the header's Resources panel and the footer's Resources column each
 * carry a plain Search row that rings this bell instead of mounting a second provider sitewide:
 *
 *   - on a page whose palette is mounted, the ring is answered in place (`requestHelpSearch`
 *     returns true) and the palette opens where the reader is;
 *   - anywhere else nobody answers, so the row goes to `/help?search` and the palette there opens on
 *     arrival (`takeHelpSearchArrival`): a pending mark for a client navigation, the query for a hard
 *     load, a new tab or no JavaScript at all.
 *
 * ★ A QUERY, NEVER A HASH. A client navigation to `/help#search` makes the router look for an
 * element named `search`, and finding none it scrolled the arriving page 64px down (measured). The
 * query changes nothing the page renders (/help never reads it, so it stays static: the /contact
 * `?about=` idiom, read from `window.location` on mount) and is taken off the address on arrival.
 *
 * ★ A WINDOW EVENT, NOT A CONTEXT, because the chrome that rings it (the header and the footer) sits
 * ABOVE `help/layout.tsx`'s provider in the tree and can never read its context, and because an
 * event nobody listens for is simply unanswered: the admin portal mounts its own palette and never
 * this one, so a ring there (there is none) could not open the wrong one.
 *
 * Client-only by construction (it touches `window` only inside the calls), and dependency-free so
 * the chrome can import it without pulling the palette's ranking or its index into every page.
 */

/** Where a Search row goes when nothing on the page can answer it. */
export const HELP_SEARCH_HREF = "/help?search";

const PARAM = "search";
const EVENT = "partyreel:help-search";

let pendingArrival = false;

/**
 * Ring the bell. True when a mounted palette took it (it has already opened); false when nothing on
 * this page answers, and the caller should go to `HELP_SEARCH_HREF` instead.
 */
export function requestHelpSearch(): boolean {
  if (typeof window === "undefined") return false;
  const event = new CustomEvent(EVENT, { cancelable: true });
  // dispatchEvent answers false when a listener called preventDefault, which is how the palette
  // says "mine".
  return !window.dispatchEvent(event);
}

/** Before a client navigation to `HELP_SEARCH_HREF`: open the palette when that page mounts. */
export function markHelpSearchArrival(): void {
  pendingArrival = true;
}

/**
 * Did the reader arrive asking for search? Consumes the pending mark and the `?search` query (so a
 * reload, or Back to this page later, does not open the palette again uninvited).
 */
export function takeHelpSearchArrival(): boolean {
  const pending = pendingArrival;
  pendingArrival = false;
  if (typeof window === "undefined") return pending;
  const url = new URL(window.location.href);
  const asked = url.searchParams.has(PARAM);
  if (asked) {
    url.searchParams.delete(PARAM);
    window.history.replaceState(
      window.history.state,
      "",
      url.pathname + url.search + url.hash,
    );
  }
  return pending || asked;
}

/** The palette's side: answer the bell. Returns the unsubscribe. */
export function onHelpSearchRequest(open: () => void): () => void {
  const answer = (event: Event) => {
    event.preventDefault();
    open();
  };
  window.addEventListener(EVENT, answer);
  return () => window.removeEventListener(EVENT, answer);
}
