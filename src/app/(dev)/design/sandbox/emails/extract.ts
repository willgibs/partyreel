"use client";

/**
 * SPLITS A REAL MAIL'S HTML INTO ITS NAMED PARTS, so a shell candidate can
 * re-wrap the ACTUAL heading, body, button and footer `templates.ts` produced
 * without this board ever inventing copy of its own. `shell`, `brand` and
 * `dark` are the only three decisions that need this: every other decision
 * draws the real `{ subject, html }` untouched.
 *
 * DOMParser only, browser-side: every `layout()`-shaped mail is one div
 * holding an `<h1>`, one or more body `<p>`s, an optional CTA `<p><a>`, and a
 * footer `<p style="color:#888...">` (host and operator mails share this last
 * marker byte for byte — checked against every export in templates.ts).
 */
export type LayoutParts = {
  /** Plain text: no template heading carries markup today. */
  heading: string;
  /** The body paragraphs' own markup (a `<strong>` inside survives). */
  bodyHtml: string;
  cta: { href: string; label: string } | null;
  /** The footer paragraph's own markup. */
  footerHtml: string;
};

const EMPTY: LayoutParts = { heading: "", bodyHtml: "", cta: null, footerHtml: "" };

export function splitLayout(html: string): LayoutParts {
  // ★ THE BOARD PAGE IS SERVER-RENDERED FIRST, and DOMParser does not exist in
  // that runtime. A preview function calls this synchronously while building
  // its element tree, on the server pass too, so an unguarded call would 500
  // the whole board rather than just fail to draw one option. Frame's own
  // portal never mounts children server-side (its `doc` state starts null),
  // so this stub is never actually seen; the real split runs the moment
  // hydration reaches the browser.
  if (typeof DOMParser === "undefined") return EMPTY;
  const doc = new DOMParser().parseFromString(html, "text/html");
  const root = doc.body.firstElementChild;
  const paragraphs = [...(root?.querySelectorAll("p") ?? [])];
  const footerEl =
    paragraphs.find((p) => (p.getAttribute("style") ?? "").includes("color:#888")) ??
    null;
  const anchor = root?.querySelector("a") ?? null;
  const ctaPara = anchor?.closest("p") ?? null;
  const bodyHtml = paragraphs
    .filter((p) => p !== footerEl && p !== ctaPara)
    .map((p) => p.outerHTML)
    .join("");
  return {
    heading: root?.querySelector("h1")?.textContent ?? "",
    bodyHtml,
    cta: anchor
      ? {
          href: anchor.getAttribute("href") ?? "#",
          label: anchor.textContent ?? "",
        }
      : null,
    footerHtml: footerEl?.innerHTML ?? "",
  };
}
