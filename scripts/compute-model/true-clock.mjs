/**
 * A SHIMMED PHONE ASKS THE WINDOW ITS TRUE CLOCK WOULD (crumbs-94, the compute model's clock artifact).
 *
 * The cheap "has anything changed?" ask (`GET /api/album/guest/sync/version?k=<key>&w=<window>`, `edge-version.ts`) names
 * a window of the device's clock, and the server answers `clock` (its own time) to a window it does not fill: the product
 * calibrates a clock that is off by a few seconds from that one answer. A phone's clock is true, and the model's shim
 * (`clockShim`, `chrome.mjs`) runs a page's `Date` K times fast so its hour passes in 60/K minutes, so every ask missed
 * the server's window, was told so, and the store fell back to a full sync a few ms later (milestone 40's run:
 * guest-hour-live 43 calls against 26, guest-hour-down 127 against 74, each GET .../sync/version followed 5 ms later by a
 * POST .../sync). The product's offset cannot follow a clock that races, and must not be taught to: it is the model that
 * is wrong. So the model asks as a true clock would, by rewriting `w` on the wire to the window the server is in NOW
 * (this machine's clock is the measuring server's), through the product's own arithmetic (`edgeWindowOf`), never a copy.
 * Nothing else about the ask is touched, only version asks are paused, and nothing in the product changes.
 */

const { ALBUM_VERSION_PATH, edgeWindowOf } = await import(
  new URL("../../src/lib/album/edge-version.ts", import.meta.url).href
);

export { ALBUM_VERSION_PATH };

/** The version ask's URL with its window the one the server is in at `now`; any other URL as it came. */
export function trueWindowUrl(href, now = Date.now()) {
  const url = new URL(href);
  if (url.pathname !== ALBUM_VERSION_PATH) return href;
  url.searchParams.set("w", String(edgeWindowOf(now)));
  return url.href;
}

/**
 * Pauses this device's version asks (and only those) and sends each on with the server's window. `browser` is the
 * DevTools connection (`on`), `send` the device's session-scoped command, `sessionId` the session the events are
 * filtered to; returns the function that stops listening.
 */
export async function keepVersionAsksTrue({
  browser,
  send,
  sessionId,
  now = Date.now,
}) {
  await send("Fetch.enable", {
    patterns: [
      { urlPattern: `*${ALBUM_VERSION_PATH}*`, requestStage: "Request" },
    ],
  });
  return browser.on((msg) => {
    if (msg.sessionId !== sessionId || msg.method !== "Fetch.requestPaused")
      return;
    const { requestId, request } = msg.params;
    // A request is never left paused: one whose address cannot be read goes on as it was.
    let url;
    try {
      url = trueWindowUrl(request.url, now());
    } catch {
      url = undefined;
    }
    send("Fetch.continueRequest", {
      requestId,
      ...(url === undefined ? {} : { url }),
    }).catch(() => {
      // the page went away with its ask in the air
    });
  });
}
