import { READING_MESSAGE, type ViewId } from "../model";

/**
 * WHAT A FRAME SAYS UNDER ITSELF, READ OFF ITS OWN DOCUMENT.
 *
 * An option's words claim things a reader can check ("a pill", "four corner
 * marks", "the display, near-black on paper"), so each caption is the computed
 * style of the parts those words are about, never the words themselves. If a
 * caption and an option's words disagree, the caption is the truth. (A step
 * hides the captions from the reviewer; `lab:demo --verbose` prints them.)
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

/** How a box ends: marks, a ring, a hairline, a bevel, a line, a shadow, its tone. */
function edge(el: Element): string {
  const parts: string[] = [];
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
  const caps = cs.textTransform === "uppercase" ? " capitals" : "";
  const track = px(cs.letterSpacing) / Math.max(1, px(cs.fontSize));
  const tracked =
    track > 0.05 ? ` tracked ${Math.round(track * 100) / 100}em` : "";
  return `${family} ${cs.fontWeight} at ${px(cs.fontSize)}px${caps}${tracked}`;
}

/**
 * Light, dark or clear, off a background colour. A token resolves to the
 * colour space it was written in, so an `oklch()` reads its lightness and an
 * `rgb()` its luminance.
 */
function tone(el: Element): string {
  const bg = getComputedStyle(el).backgroundColor;
  const n = (bg.match(/-?[\d.]+/g) ?? []).map(Number);
  if (!n.length) return "clear";
  const alpha = /\//.test(bg) || /rgba/.test(bg) ? (n[3] ?? 1) : 1;
  if (alpha < 0.2) return "clear";
  const l = /^oklch|^oklab/.test(bg)
    ? n[0]
    : (0.2126 * n[0] + 0.7152 * n[1] + 0.0722 * n[2]) / 255;
  return l < 0.4 ? "dark" : l > 0.75 ? "light" : "mid-grey";
}

/** The meter's build, off the voice's own variables. */
function meter(el: Element): string {
  const cs = getComputedStyle(el);
  const mask = cs.getPropertyValue("--vf-meter-mask").trim();
  if (mask && mask !== "none") return `frames, ${px(cs.height)}px tall`;
  if (px(cs.borderTopLeftRadius) > 1) return `a bar, ${px(cs.height)}px tall`;
  return `tape, ${px(cs.height)}px tall`;
}

/** The lock's kind, off a pinned focus. */
function lock(el: Element | null): string {
  if (!el) return "not drawn";
  const after = getComputedStyle(el, "::after");
  if (marked(el, "::after") && after.opacity !== "0")
    return `four marks ${-px(after.top)}px out`;
  const cs = getComputedStyle(el);
  if (
    cs.outlineStyle !== "none" &&
    px(cs.outlineWidth) > 0 &&
    !/0\)$/.test(cs.outlineColor)
  )
    return `a ring ${px(cs.outlineOffset)}px out`;
  return "not drawn";
}

const ROOM = '[data-ground="room"]';

/** The reading for one view, or null while it has not settled. */
export function readView(view: ViewId, doc: Document): string | null {
  if (view === "voice") {
    const label = q(doc, '[data-slot="label"]', ROOM);
    const badge = q(doc, '[data-slot="badge"]', ROOM);
    const progress = q(doc, '[data-slot="progress"]', ROOM);
    const link = q(doc, '[data-variant="link"]', ROOM);
    if (!label || !badge || !progress) return null;
    const mark = link ? getComputedStyle(link, "::before").content : "none";
    const said =
      mark === "none" || mark === '""' || mark === "normal" ? "none" : mark;
    return `Labels in ${face(label)}; readouts in ${face(badge)}; the meter as ${meter(progress)}; a link's mark ${said}`;
  }
  if (view === "actions") {
    const primary = q(
      doc,
      '[data-variant="default"][data-size="default"]',
      ROOM,
    );
    const outline = q(
      doc,
      '[data-variant="outline"][data-size="default"]',
      ROOM,
    );
    const dial = q(doc, '[data-size="icon"]', ROOM);
    const focus = q(doc, '[data-variant="default"][data-demo~="focus"]', ROOM);
    if (!primary || !outline) return null;
    return `Primary ${primary.offsetHeight}px, ${corner(primary)}, ${face(primary)}; outline ends in ${edge(outline)}; a dial is ${dial ? corner(dial) : "absent"}; focus is ${lock(focus)}`;
  }
  if (view === "fields") {
    const input = q(doc, '[data-slot="input"]', ROOM);
    const sw = q(doc, '[data-slot="switch"]', ROOM);
    const check = q(doc, '[data-slot="checkbox"]', ROOM);
    if (!input || !sw || !check) return null;
    return `A field ${input.offsetHeight}px, ${corner(input)}, ${tone(input) === "clear" ? "open" : "filled"}, ends in ${edge(input)}; a switch ${sw.offsetWidth}×${sw.offsetHeight}, ${corner(sw)}; a check ${corner(check)}`;
  }
  if (view === "layers") {
    const card = q(doc, '[data-slot="card"]', ROOM);
    const roomMenu = q(doc, '[data-slot="dropdown-menu-content"]', ROOM);
    const paperMenu = q(
      doc,
      '[data-slot="dropdown-menu-content"]',
      '[data-ground="paper"]',
    );
    const menu = roomMenu ?? paperMenu;
    if (!card || !menu) return null;
    return `A card ends in ${edge(card)}, ${corner(card)}; a menu is ${roomMenu ? tone(roomMenu) : "?"} in the room${paperMenu ? ` and ${tone(paperMenu)} on paper` : ""}, ${corner(menu)}, ending in ${edge(menu)}`;
  }
  if (view === "status") {
    const badge = q(doc, '[data-slot="badge"][data-variant="success"]', ROOM);
    const face1 = doc.querySelector<HTMLElement>(
      `${ROOM} [data-slot="avatar-group"] > [data-slot="avatar"][data-size="default"]`,
    );
    const glyph = q(doc, '[data-slot="empty-glyph"]', ROOM);
    if (!badge || !face1 || !glyph) return null;
    const share = Math.round(
      (-px(getComputedStyle(face1).marginInlineEnd) /
        Math.max(1, face1.offsetWidth)) *
        100,
    );
    return `A badge has ${tone(badge) === "clear" ? "no plate" : "a plate"} and ends in ${edge(badge)}; faces overlap ${share}% of a face; the empty place's glyph ${glyph.offsetWidth}×${glyph.offsetHeight}, ${corner(glyph)}`;
  }
  // A screen: the atoms the page is made of, as this identity draws them.
  const primary = q(doc, '[data-slot="button"][data-variant="default"]');
  const field = q(doc, '[data-slot="input"]');
  const panel = q(
    doc,
    '[data-slot="popup-content"], [data-slot="responsive-menu"], [data-slot="responsive-menu-rows"] > *',
  );
  const parts = [
    primary ? `primary ${primary.offsetHeight}px, ${corner(primary)}` : null,
    field ? `a field ${field.offsetHeight}px, ${corner(field)}` : null,
    panel ? `the layer ${tone(panel)}, ${corner(panel)}` : null,
  ].filter(Boolean) as string[];
  if (view === "door") {
    const seg = q(doc, '[data-slot="toggle-group-item"][data-state="on"]');
    const gate = q(doc, '[data-slot="radio-card"][data-state="on"]');
    if (!seg || !gate) return null;
    parts.push(
      `the door's choice ${corner(seg)}; its gate ends in ${edge(gate)}`,
    );
  }
  if (view === "review") {
    const count = q(doc, '[data-review-room] [data-slot="badge"]');
    if (!count) return null;
    parts.push(
      `the queue's count ${tone(count) === "clear" ? "a light" : "a plate"}`,
    );
  }
  if (view === "add" && !panel) return null;
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
