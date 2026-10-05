import { type MomentId, READING_MESSAGE, type ViewId } from "../model";

/**
 * WHAT A FRAME SAYS UNDER ITSELF, READ OFF ITS OWN DOCUMENT.
 *
 * An option's words claim things a reader can check ("a well", "a key",
 * "a halo", "it sinks a pixel", "three lights", "the light edge"), so each
 * caption is the computed style of the parts those words are about, never the
 * words themselves. If a caption and an option's words disagree, the caption
 * is the truth. (A step hides the captions from the reviewer; `lab:demo
 * --verbose` prints them.)
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

type Shadow = {
  x: number;
  y: number;
  blur: number;
  spread: number;
  inset: boolean;
  clear: boolean;
};

/** A computed shadow list as offsets, each marked clear when its colour has no alpha left. */
function shadowsOf(el: Element): Shadow[] {
  const raw = getComputedStyle(el).boxShadow;
  if (raw === "none") return [];
  return raw.split(/,(?![^(]*\))/).map((one) => {
    const lengths =
      one.replace(/^\s*\S*\([^)]*\)\s*/, "").match(/-?[\d.]+px/g) ?? [];
    const [x = 0, y = 0, blur = 0, spread = 0] = lengths.map((l) => px(l));
    const clear =
      /rgba\(0, 0, 0, 0\)|transparent/.test(one) ||
      (x === 0 && y === 0 && blur === 0 && spread === 0);
    return { x, y, blur, spread, inset: /inset/.test(one), clear };
  });
}

/** How a box ends: the light edge, marks, a ring, a hairline, a bevel, a shadow, its tone. */
function edge(el: Element): string {
  const parts: string[] = [];
  if (lit(el)) parts.push("the light edge");
  if (marked(el) || marked(el, "::before")) parts.push("four corner marks");
  const shadows = shadowsOf(el).filter((s) => !s.clear);
  const ring = shadows.filter(
    (s) => s.inset && !s.x && !s.y && !s.blur && s.spread > 0,
  );
  const widest = Math.max(0, ...ring.map((s) => s.spread));
  const outside = shadows.some(
    (s) => !s.inset && !s.x && !s.y && !s.blur && s.spread > 0,
  );
  const above = shadows.some((s) => s.inset && s.y > 0 && !s.blur);
  const below = shadows.some((s) => s.inset && s.y < 0 && !s.blur);
  const shade = shadows.some((s) => s.inset && s.blur > 0);
  if (widest >= 1.4) parts.push(`a ${widest}px ring`);
  else if (widest > 0) parts.push("a hairline");
  else if (outside) parts.push("a hairline ring outside");
  if (above && below) parts.push("a bevel");
  else if (above) parts.push("a light line above");
  else if (below) parts.push("a line underneath");
  if (shade) parts.push("a shade inside");
  if (shadows.some((s) => !s.inset && (s.blur > 0 || s.y !== 0)))
    parts.push("a shadow");
  if (!parts.length) parts.push("its tone alone");
  return parts.join(", ");
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

/** The vertical travel a box wears, off its computed translate. */
function travel(el: Element): number {
  const t = getComputedStyle(el).translate;
  if (!t || t === "none") return 0;
  const parts = t.split(/\s+/).map((v) => px(v));
  return parts[1] ?? 0;
}

/** The focus mark a pinned focus draws: the lock, a ring, the cursor, a halo, a lift. */
function focusMark(el: Element | null): string {
  if (!el) return "not drawn";
  for (const p of ["::after", "::before"]) {
    const cs = getComputedStyle(el, p);
    if (marked(el, p) && cs.opacity !== "0")
      return `the lock, four marks ${-px(cs.top)}px out`;
  }
  if (marked(el)) return "the lock's four marks on its corners";
  const cs = getComputedStyle(el);
  const words: string[] = [];
  if (
    cs.outlineStyle !== "none" &&
    px(cs.outlineWidth) > 0 &&
    !/0\)$/.test(cs.outlineColor)
  )
    words.push(
      `a ${px(cs.outlineWidth)}px outline ${px(cs.outlineOffset)}px out`,
    );
  const shadows = shadowsOf(el).filter((s) => !s.clear);
  const outer = shadows.filter((s) => !s.inset && s.spread > 0 && !s.blur);
  const inner = shadows.filter((s) => s.inset && !s.blur && !s.x && !s.y);
  const at = (n: number) => inner.some((s) => Math.abs(s.spread - n) < 0.2);
  // The cursor is ink with its inverse two pixels in (2px, then 3.5px); lit is
  // a rim of light with a keyline inside it (1.5px, then 3px), on any fill.
  if (at(2) && at(3.5)) words.push(`it turns ${tone(el)}, the cursor inside`);
  else if (at(1.5) && at(3)) words.push("its edge lit, a keyline inside");
  if (outer.length)
    words.push(
      `a ring of light ${Math.max(...outer.map((s) => s.spread))}px out`,
    );
  const rise = travel(el);
  if (rise < 0) words.push(`it lifts ${-rise}px`);
  return words.length ? words.join(", ") : "not drawn";
}

/** What a busy control draws: three lights, an arc, a track. */
function working(el: Element | null): string {
  if (!el) return "not drawn";
  const before = getComputedStyle(el, "::before");
  const own = getComputedStyle(el);
  const kept = own.color !== "rgba(0, 0, 0, 0)";
  if (
    before.content !== "none" &&
    /conic-gradient/.test(before.backgroundImage)
  )
    return `an arc runs round it, its words ${kept ? "kept" : "hidden"}`;
  if (
    before.content !== "none" &&
    (before.backgroundImage.match(/radial-gradient/g) ?? []).length >= 3
  )
    return `three lights, its words ${kept ? "kept" : "hidden"}`;
  if ((own.backgroundImage.match(/linear-gradient/g) ?? []).length >= 2)
    return `a track fills along its floor, its words ${kept ? "kept" : "hidden"}`;
  return "not drawn";
}

/** What a held press draws: its travel, its scale, its fill. */
function pressed(el: Element | null): string {
  if (!el) return "not drawn";
  const cs = getComputedStyle(el);
  const words: string[] = [];
  const down = travel(el);
  if (down > 0) words.push(`it sinks ${down}px`);
  const s = Number.parseFloat(cs.scale);
  if (cs.scale !== "none" && s < 1)
    words.push(`it shrinks to ${Math.round(s * 100)}%`);
  words.push(`${tone(el)}, ending in ${edge(el)}`);
  return words.join(", ");
}

const ROOM = '[data-ground="room"]';

/** The reading for one view in one moment, or null while it has not settled. */
export function readView(
  view: ViewId,
  moment: MomentId,
  doc: Document,
): string | null {
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
    const focus = q(
      doc,
      '[data-variant="outline"][data-demo~="focus"]',
      within,
    );
    if (!primary || !outline) return null;
    return `Primary ${primary.offsetHeight}px, ${corner(primary)}, ending in ${edge(primary)}; outline ends in ${edge(outline)}; focus: ${focusMark(focus)}`;
  }
  if (view === "fields") {
    const within = q(doc, ROOM) ? ROOM : undefined;
    const input = q(doc, '[data-slot="input"]', within);
    const focused = q(doc, '[data-slot="input"][data-demo~="focus"]', within);
    const sw = q(doc, '[data-slot="switch"]', within);
    const check = q(doc, '[data-slot="checkbox"]', within);
    if (!input || !sw || !check) return null;
    return `A field ${input.offsetHeight}px, ${corner(input)}, ${tone(input) === "clear" ? "open" : "filled"}, ending in ${edge(input)}; focus: ${focusMark(focused)}; a switch ${sw.offsetWidth}×${sw.offsetHeight}, ${corner(sw)}; a check ${corner(check)}`;
  }

  // A screen, read for the trait it is caught in.
  const parts: string[] = [];
  const say = (
    what: string,
    el: Element | null,
    words: (el: Element) => string,
  ) => {
    if (el) parts.push(`${what}: ${words(el)}`);
  };
  if (moment === "field") {
    const field =
      q(doc, '[data-slot="input"][data-demo~="focus"]') ??
      q(doc, '[data-slot="input"]');
    if (!field) return null;
    say(
      "a field",
      field,
      (el) =>
        `${(el as HTMLElement).offsetHeight}px, ${corner(el)}, ${tone(el)}, ending in ${edge(el)}`,
    );
  } else if (moment === "button") {
    const primary = q(doc, '[data-slot="button"][data-variant="default"]');
    const quiet = q(
      doc,
      '[data-slot="button"]:is([data-variant="outline"],[data-variant="secondary"])',
    );
    if (!primary) return null;
    say(
      "the primary",
      primary,
      (el) =>
        `${(el as HTMLElement).offsetHeight}px, ${corner(el)}, ending in ${edge(el)}`,
    );
    say(
      "a quiet one",
      quiet,
      (el) => `${corner(el)}, ${tone(el)}, ending in ${edge(el)}`,
    );
  } else if (moment === "focus") {
    const on = q(doc, '[data-demo~="focus"]');
    if (!on) return null;
    say("focus", on, focusMark);
  } else if (moment === "selected") {
    const chosen =
      q(doc, '[data-slot="toggle-group-item"][data-state="on"]') ??
      q(doc, '[data-slot="radio-card"][data-state="on"]');
    if (!chosen) return null;
    say(
      "the chosen one",
      chosen,
      (el) => `${corner(el)}, ${tone(el)}, ending in ${edge(el)}`,
    );
  } else if (moment === "press") {
    const held = q(doc, '[data-demo~="press"]');
    if (!held) return null;
    say("held down", held, pressed);
  } else if (moment === "loading") {
    const on = q(
      doc,
      '[aria-busy="true"]:is([data-slot="button"],[data-variant])',
    );
    if (!on) return null;
    say("working", on, working);
  } else if (moment === "toggles") {
    const sw = q(doc, '[data-slot="switch"]');
    if (!sw) return null;
    say(
      "a switch",
      sw,
      (el) =>
        `${(el as HTMLElement).offsetWidth}×${(el as HTMLElement).offsetHeight}, ${tone(el)}, ending in ${edge(el)}`,
    );
  } else {
    const layer = q(
      doc,
      '[data-slot="dropdown-menu-content"], [data-slot="popover-content"], [data-slot="tooltip-content"], [data-slot="responsive-menu"], [data-slot="responsive-menu-rows"] > *, [data-slot="popup-content"], [data-slot="dialog-content"], [data-slot="sheet-content"], [data-sonner-toast]',
    );
    if (!layer) return null;
    say(
      "the layer",
      layer,
      (el) => `${tone(el)}, ${corner(el)}, ending in ${edge(el)}`,
    );
  }
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
