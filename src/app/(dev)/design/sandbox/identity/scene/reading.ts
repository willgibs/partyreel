import { READING_MESSAGE, type ViewId } from "../model";

/**
 * WHAT A FRAME SAYS UNDER ITSELF, READ OFF ITS OWN DOCUMENT.
 *
 * An option's words claim things a reader can check ("a pill", "the lock",
 * "turns to ink", "graphite in the room", "the light edge"), so each caption
 * is the computed style of the parts those words are about, never the words
 * themselves. If a caption and an option's words disagree, the caption is the
 * truth. (A step hides the captions from the reviewer; `lab:demo --verbose`
 * prints them.)
 */

const px = (v: string) => Math.round(Number.parseFloat(v) * 10) / 10 || 0;

function q(doc: Document, sel: string, within?: string): HTMLElement | null {
  const root = within ? doc.querySelector(within) : doc;
  return (root?.querySelector(sel) as HTMLElement | null) ?? null;
}

/** "a pill", "a circle", or the corner in pixels. */
function corner(el: Element): string {
  const cs = getComputedStyle(el);
  const r = px(cs.borderTopLeftRadius);
  const h = (el as HTMLElement).offsetHeight;
  const w = (el as HTMLElement).offsetWidth;
  if (h > 0 && r >= h / 2 - 0.5) return w - h < 2 ? "a circle" : "a pill";
  return `${r}px corners`;
}

/** Whether a box's background (or a pseudo-element's) draws the four corner marks, visibly. */
function marked(el: Element, pseudo?: string): boolean {
  const cs = getComputedStyle(el, pseudo);
  const layers = (cs.backgroundImage.match(/linear-gradient/g) ?? []).length;
  if (layers < 8 || cs.opacity === "0") return false;
  const ink = cs.getPropertyValue("--m-c").trim();
  return ink !== "" && ink !== "transparent" && !/rgba\(0, 0, 0, 0\)/.test(ink);
}

/** Whether a pseudo-element draws production's light edge: a masked radial falloff. */
function lit(el: Element): boolean {
  return ["::after", "::before"].some((p) => {
    const cs = getComputedStyle(el, p);
    return (
      cs.content !== "none" &&
      /radial-gradient/.test(cs.backgroundImage) &&
      /exclude|xor/.test(
        cs.getPropertyValue("mask-composite") ||
          cs.getPropertyValue("-webkit-mask-composite"),
      )
    );
  });
}

/** A computed shadow list as offsets: `[x, y, blur, spread, inset]` each, its colour dropped. */
function shadowsOf(
  el: Element,
): { x: number; y: number; blur: number; spread: number; inset: boolean }[] {
  const raw = getComputedStyle(el).boxShadow;
  if (raw === "none") return [];
  return raw.split(/,(?![^(]*\))/).map((one) => {
    const lengths =
      one.replace(/^\s*\S*\([^)]*\)\s*/, "").match(/-?[\d.]+px/g) ?? [];
    const [x = 0, y = 0, blur = 0, spread = 0] = lengths.map((l) => px(l));
    return { x, y, blur, spread, inset: /inset/.test(one) };
  });
}

/** How a box ends: the light edge, marks, a ring, a hairline, a bevel, a shadow, its tone. */
function edge(el: Element): string {
  const parts: string[] = [];
  if (lit(el)) parts.push("the light edge");
  if (marked(el) || marked(el, "::before")) parts.push("four corner marks");
  const shadows = shadowsOf(el);
  const ring = shadows.filter(
    (s) => s.inset && !s.x && !s.y && !s.blur && s.spread > 0,
  );
  const widest = Math.max(0, ...ring.map((s) => s.spread));
  const above = shadows.some((s) => s.inset && s.y > 0 && !s.blur);
  const below = shadows.some((s) => s.inset && s.y < 0 && !s.blur);
  if (widest >= 1.4) parts.push(`a ${widest}px ring`);
  else if (widest > 0) parts.push("a hairline");
  if (above && below) parts.push("a bevel");
  else if (above) parts.push("a light line above");
  else if (below) parts.push("a line underneath");
  if (shadows.some((s) => !s.inset && (s.blur > 0 || s.y !== 0)))
    parts.push("a shadow");
  if (!parts.length) parts.push("its tone alone");
  return parts.join(", ");
}

/** The face a control speaks in. */
function face(el: Element): string {
  const cs = getComputedStyle(el);
  const family = /urbanist/i.test(cs.fontFamily) ? "Urbanist" : "Inter";
  return `${family} ${cs.fontWeight} at ${px(cs.fontSize)}px`;
}

/** Lightness of a colour as the browser computed it (an oklch's L, an rgb's luminance), with its alpha. */
function lightness(colour: string): { l: number; a: number } | null {
  const n = (colour.match(/-?[\d.]+/g) ?? []).map(Number);
  if (!n.length) return null;
  const a = /\//.test(colour) || /rgba/.test(colour) ? (n[3] ?? 1) : 1;
  const l = /^oklch|^oklab/.test(colour)
    ? n[0]
    : (0.2126 * n[0] + 0.7152 * n[1] + 0.0722 * n[2]) / 255;
  return { l, a };
}

/** Light, dark, graphite or clear, off a background colour. */
function tone(el: Element): string {
  const t = lightness(getComputedStyle(el).backgroundColor);
  if (!t || t.a < 0.2) return "clear";
  if (t.l < 0.22) return "near-black";
  if (t.l < 0.45) return "graphite";
  return t.l > 0.75 ? "white" : "mid-grey";
}

/** The focus mark a pinned focus draws: the lock, a ring, or ink with the cursor inside. */
function focusMark(el: Element | null): string {
  if (!el) return "not drawn";
  for (const p of ["::after", "::before"]) {
    const cs = getComputedStyle(el, p);
    if (marked(el, p) && cs.opacity !== "0")
      return `the lock, four marks ${-px(cs.top)}px out`;
  }
  if (marked(el)) return "the lock's four marks on its corners";
  const cs = getComputedStyle(el);
  if (
    cs.outlineStyle !== "none" &&
    px(cs.outlineWidth) > 0 &&
    !/0\)$/.test(cs.outlineColor)
  )
    return `a ring ${px(cs.outlineOffset)}px out`;
  const inner = shadowsOf(el).filter((s) => s.inset && s.spread >= 3);
  if (inner.length) return `it turns ${tone(el)}, the cursor inside`;
  if (shadowsOf(el).some((s) => !s.inset && s.spread >= 3))
    return "an ink ring round it";
  return "not drawn";
}

const ROOM = '[data-ground="room"]';
const PAPER = '[data-ground="paper"]';

/** The reading for one view, or null while it has not settled. */
export function readView(view: ViewId, doc: Document): string | null {
  if (view === "actions") {
    const within = q(doc, ROOM) ? ROOM : undefined;
    const primary = q(
      doc,
      '[data-variant="default"][data-size="default"]',
      within,
    );
    const outline = q(
      doc,
      '[data-variant="outline"][data-size="default"]',
      within,
    );
    const dial = q(doc, '[data-size="icon"]', within);
    const focus = q(
      doc,
      '[data-variant="outline"][data-demo~="focus"]',
      within,
    );
    if (!primary || !outline) return null;
    return `Primary ${primary.offsetHeight}px, ${corner(primary)}, ${face(primary)}; outline ends in ${edge(outline)}; a dial is ${dial ? corner(dial) : "absent"}; focus: ${focusMark(focus)}`;
  }
  if (view === "fields") {
    const within = q(doc, ROOM) ? ROOM : undefined;
    const input = q(doc, '[data-slot="input"]', within);
    const focused = q(doc, '[data-slot="input"][data-demo~="focus"]', within);
    const sw = q(doc, '[data-slot="switch"]', within);
    const check = q(doc, '[data-slot="checkbox"]', within);
    if (!input || !sw || !check) return null;
    return `A field ${input.offsetHeight}px, ${corner(input)}, ${tone(input) === "clear" ? "open" : "filled"}, ends in ${edge(input)}; focus: ${focusMark(focused)}; a switch ${sw.offsetWidth}×${sw.offsetHeight}, ${corner(sw)}; a check ${corner(check)}`;
  }
  if (view === "layers") {
    const roomMenu = q(doc, '[data-slot="dropdown-menu-content"]', ROOM);
    const paperMenu = q(doc, '[data-slot="dropdown-menu-content"]', PAPER);
    const menu = roomMenu ?? paperMenu;
    const card = q(doc, '[data-slot="card"]', q(doc, ROOM) ? ROOM : undefined);
    if (!menu || !card) return null;
    return `A menu is ${roomMenu ? tone(roomMenu) : "?"} in the room${paperMenu ? ` and ${tone(paperMenu)} on paper` : ""}, ${corner(menu)}, ending in ${edge(menu)}; a card ends in ${edge(card)}`;
  }
  // A screen: the atoms the page is made of, as this identity draws them.
  const primary = q(doc, '[data-slot="button"][data-variant="default"]');
  const field = q(doc, '[data-slot="input"]:not([data-demo])');
  const focused = q(doc, '[data-slot="input"][data-demo~="focus"]');
  const panel = q(
    doc,
    '[data-slot="dropdown-menu-content"], [data-slot="responsive-menu"], [data-slot="responsive-menu-rows"] > *, [data-slot="popup-content"], [data-sonner-toast]',
  );
  const glass = q(doc, '[data-variant="glass"]');
  const card = q(doc, '[data-slot="card"]');
  const parts = [
    primary ? `primary ${primary.offsetHeight}px, ${corner(primary)}` : null,
    field ? `a field ${field.offsetHeight}px, ${corner(field)}` : null,
    focused ? `the field in use: ${focusMark(focused)}` : null,
    panel ? `the layer ${tone(panel)}, ending in ${edge(panel)}` : null,
    card ? `a card ends in ${edge(card)}` : null,
    view === "cover" && glass ? `a glass round ends in ${edge(glass)}` : null,
  ].filter(Boolean) as string[];
  if (view === "door") {
    const seg = q(doc, '[data-slot="toggle-group-item"][data-state="on"]');
    const gate = q(doc, '[data-slot="radio-card"][data-state="on"]');
    if (!seg || !gate || !focused) return null;
    parts.push(
      `the door's choice ${corner(seg)}, ${tone(seg)}; its gate ${tone(gate)}, ending in ${edge(gate)}`,
    );
  }
  if ((view === "add" || view === "cover" || view === "menu") && !panel)
    return null;
  if ((view === "account" || view === "gate") && !focused) return null;
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
