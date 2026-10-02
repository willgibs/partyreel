import { READING_MESSAGE, type ViewId } from "../model";

/**
 * WHAT A FRAME SAYS UNDER ITSELF, READ OFF ITS OWN DOCUMENT.
 *
 * A family's words claim things a reader can check ("square corners", "no
 * line anywhere", "glass"), so each frame's caption is the computed style of
 * the parts those words are about, never the words themselves: the primary's
 * height, corner and face, how a surface ends, what a layer is made of. If a
 * caption and an option's words disagree, the caption is the truth.
 */

const px = (v: string) => Math.round(Number.parseFloat(v) * 10) / 10 || 0;

/** "pill", or the corner in pixels. */
function corner(el: Element): string {
  const cs = getComputedStyle(el);
  const r = px(cs.borderTopLeftRadius);
  const h = (el as HTMLElement).offsetHeight;
  return h > 0 && r >= h / 2 - 0.5 ? "a pill" : `${r}px corners`;
}

/** The face a control speaks in, as a reader would name it. */
function face(el: Element): string {
  const cs = getComputedStyle(el);
  const family = /urbanist/i.test(cs.fontFamily) ? "Urbanist" : "Inter";
  const caps = cs.textTransform === "uppercase" ? " capitals" : "";
  return `${family} ${cs.fontWeight} at ${px(cs.fontSize)}px${caps}`;
}

/** How a surface ends: a rule, a hairline, a shadow, glass. */
function edge(el: Element): string {
  const cs = getComputedStyle(el);
  const parts: string[] = [];
  const blur = cs.backdropFilter && cs.backdropFilter !== "none";
  if (blur) parts.push("glass");
  const top = px(cs.borderTopWidth);
  const sides = px(cs.borderLeftWidth) + px(cs.borderRightWidth);
  if (top > 0 && sides === 0) parts.push("a rule above");
  else if (top > 0) parts.push("a border");
  if (cs.outlineStyle !== "none" && px(cs.outlineWidth) > 0)
    parts.push("an ink frame");
  const shadow = cs.boxShadow === "none" ? "" : cs.boxShadow;
  const layers = shadow.split(/,(?![^(]*\))/).map((s) => s.trim());
  const outer = layers.filter(
    (s) => s && !s.includes("inset") && !/ 0px 0px 0px /.test(s),
  );
  const ring = layers.some((s) => / 0px 0px 0px [0-9.]+px/.test(s));
  if (ring && !blur) parts.push("a hairline");
  if (outer.some((s) => !/0px 0px 0px 0px/.test(s))) parts.push("a shadow");
  if (parts.length === 0) parts.push("its tone alone");
  return parts.join(" and ");
}

/** A line about the first element a selector finds, or nothing. */
function about(
  doc: Document,
  selector: string,
  say: (el: Element) => string,
): string | null {
  const el = doc.querySelector(selector);
  return el ? say(el) : null;
}

/** The reading for one view, or null while it has not settled. */
export function readView(view: ViewId, doc: Document): string | null {
  const primary = about(
    doc,
    '[data-slot="button"][data-variant="default"]:not([data-on-photo] *)',
    (el) =>
      `Primary ${(el as HTMLElement).offsetHeight}px, ${corner(el)}, ${face(el)}`,
  );
  if (view === "hub") {
    const checklist = about(doc, "[data-checklist]", edge);
    const mark = about(doc, "[data-code-mark]", corner);
    if (!primary || !checklist) return null;
    return `${primary}; the checklist ends in ${checklist}; the code's mark has ${mark ?? "none"}`;
  }
  if (view === "settings") {
    const popup = doc.querySelector<HTMLElement>('[data-slot="popup-content"]');
    if (!popup) return null;
    const choice = about(doc, "[data-door-choice][data-state='on']", (el) =>
      corner(el),
    );
    return `Settings as a ${popup.dataset.shape}, made of ${edge(popup)}; the chosen door has ${choice ?? "no mark"}; ${primary ?? ""}`.replace(
      /; $/,
      "",
    );
  }
  if (view === "add") {
    const rows = doc.querySelector('[data-slot="responsive-menu-rows"]');
    const menu = doc.querySelector('[data-slot="responsive-menu"]');
    const item = doc.querySelector('[data-slot="responsive-menu-item"]');
    if (!item) return null;
    const panel = rows?.firstElementChild ?? menu;
    return `The Add ${rows ? "rises as rows with Cancel beneath" : "opens as a menu under the Add"}, made of ${panel ? edge(panel) : "nothing"}; a row ${(item as HTMLElement).offsetHeight}px, ${face(item)}`;
  }
  const card = about(doc, '[data-slot="card"]', edge);
  const layer = about(doc, '[data-slot="dropdown-menu-content"]', edge);
  const field = about(doc, '[data-slot="input"]', (el) => {
    const cs = getComputedStyle(el);
    const line =
      px(cs.borderTopWidth) === 0 && px(cs.borderBottomWidth) > 0
        ? "a line to write on"
        : `${corner(el)}`;
    return `${(el as HTMLElement).offsetHeight}px, ${line}`;
  });
  const parts = [
    primary,
    field ? `a field ${field}` : null,
    card ? `a card ends in ${card}` : null,
    layer ? `a menu is ${layer}` : null,
  ].filter(Boolean);
  return parts.length ? parts.join("; ") : null;
}

/** Posts a reading to the board that drew this frame. */
export function postReading(id: string, text: string): void {
  if (window.parent === window) return;
  window.parent.postMessage(
    { type: READING_MESSAGE, id, text },
    window.location.origin,
  );
}
