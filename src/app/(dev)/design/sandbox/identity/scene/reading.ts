import { type MomentId, READING_MESSAGE, type ViewId } from "../model";

/**
 * WHAT A FRAME SAYS UNDER ITSELF, READ OFF ITS OWN DOCUMENT.
 *
 * An option's words claim things a reader can check ("a well", "a key",
 * "a tone", "a halo", "an arc", "still at it"), so each caption is the
 * computed style of the parts those words are about, never the words
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

/**
 * What a pseudo-element draws on a part's one-pixel edge (the bright edge's
 * mask): "the light edge" (a falloff with light left in it), "a graded edge"
 * (ink graded down the edge, lit edges on paper), or nothing.
 */
function lit(el: Element): string | null {
  for (const p of ["::after", "::before"]) {
    const cs = getComputedStyle(el, p);
    const masked = /exclude|xor/.test(
      cs.getPropertyValue("mask-composite") ||
        cs.getPropertyValue("-webkit-mask-composite"),
    );
    if (cs.content === "none" || !masked || cs.opacity === "0") continue;
    if (/linear-gradient/.test(cs.backgroundImage)) return "a graded edge";
    // A falloff whose light is all clear (paper's floating parts) draws nothing.
    if (
      /radial-gradient/.test(cs.backgroundImage) &&
      !/radial-gradient\([^)]*?(rgba\(0, 0, 0, 0\)|\/ 0\))/.test(
        cs.backgroundImage.split(",").slice(0, 3).join(","),
      )
    )
      return "the light edge";
  }
  return null;
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
      /rgba\(0, 0, 0, 0\)|transparent|\/ 0\)/.test(one) ||
      (x === 0 && y === 0 && blur === 0 && spread === 0);
    return { x, y, blur, spread, inset: /inset/.test(one), clear };
  });
}

/** How a box ends: the light edge, a ring, a hairline, a bevel, a shade, a shadow, its tone. */
function edge(el: Element): string {
  const parts: string[] = [];
  const light = lit(el);
  if (light) parts.push(light);
  const shadows = shadowsOf(el).filter((s) => !s.clear);
  const ring = shadows.filter(
    (s) => s.inset && !s.x && !s.y && !s.blur && s.spread > 0,
  );
  const outside = shadows.filter(
    (s) => !s.inset && !s.x && !s.y && !s.blur && s.spread > 0,
  );
  const widest = Math.max(0, ...ring.map((s) => s.spread));
  if (widest >= 1.4) parts.push(`a ${widest}px ring`);
  else if (widest > 0) parts.push("a hairline inside");
  if (outside.some((s) => s.spread <= 1.2)) parts.push("a hairline round it");
  const above = shadows.some((s) => s.inset && s.y > 0 && !s.blur);
  const below = shadows.some((s) => s.inset && s.y < 0 && !s.blur);
  const shade = shadows.some((s) => s.inset && s.blur > 0);
  if (above && below) parts.push("a line above and below");
  else if (above) parts.push("a line along its top");
  else if (below) parts.push("a line along its foot");
  if (shade) parts.push("a shade inside");
  if (shadows.some((s) => !s.inset && (s.blur > 0 || s.y !== 0)))
    parts.push("a shadow under it");
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

/** Light, dark, graphite, a tone or clear, off a background colour. */
function tone(el: Element): string {
  const cs = getComputedStyle(el);
  const t = lightness(cs.backgroundColor);
  if (/gradient/.test(cs.backgroundImage) && (!t || t.a < 0.2))
    return "a lit face";
  if (!t || t.a < 0.03) return "clear";
  if (t.a < 0.5) return "a tone";
  if (t.l < 0.22) return "near-black";
  if (t.l < 0.45) return "graphite";
  return t.l > 0.75 ? "white" : "mid-grey";
}

/** The focus mark a pinned focus draws: a halo, or none. */
function focusMark(el: Element | null): string {
  if (!el) return "not drawn";
  const outer = shadowsOf(el).filter((s) => !s.inset && s.spread > 0);
  if (outer.some((s) => s.blur > 0))
    return `a halo ${Math.max(...outer.map((s) => s.spread))}px out`;
  return outer.length ? "a ring outside" : "not drawn";
}

/** What a working control draws: the arc beside its words, its working words, and its time. */
function working(el: Element | null): string {
  if (!el) return "not drawn";
  const before = getComputedStyle(el, "::before");
  const words = (el as HTMLElement).innerText?.trim().replace(/\s+/g, " ");
  const said = el.getAttribute("data-working-shown")
    ? "its working words"
    : "its own words";
  const still = /^Still /.test(words ?? "") ? ", still at it" : "";
  if (
    before.content === "none" ||
    !/conic-gradient/.test(before.backgroundImage)
  )
    return "not drawn";
  return `an arc runs round, ${px(before.width)}px, saying "${words}" (${said}${still})`;
}

const ROOM = '[data-ground="room"]';

/** A key's or a field's reading: its height, its corner, its tone and how it ends. */
const body = (el: Element) =>
  `${(el as HTMLElement).offsetHeight}px, ${corner(el)}, ${tone(el)}, ending in ${edge(el)}`;

/** The reading for one view in one moment, or null while it has not settled. */
export function readView(
  view: ViewId,
  moment: MomentId,
  doc: Document,
): string | null {
  const parts: string[] = [];
  const say = (
    what: string,
    el: Element | null,
    words: (el: Element) => string,
  ) => {
    if (el) parts.push(`${what}: ${words(el)}`);
  };
  const within = q(doc, ROOM) ? ROOM : undefined;

  if (view === "actions") {
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
    if (!primary || !outline) return null;
    say("primary", primary, body);
    say("outline", outline, body);
    say(
      "focus",
      q(doc, '[data-variant="outline"][data-demo~="focus"]', within),
      focusMark,
    );
    return parts.join("; ");
  }
  if (view === "fields") {
    const input = q(doc, '[data-slot="input"]', within);
    const sw = q(doc, '[data-slot="switch"]', within);
    if (!input || !sw) return null;
    say("a field", input, body);
    say(
      "focus",
      q(doc, '[data-slot="input"][data-demo~="focus"]', within),
      focusMark,
    );
    say(
      "a switch",
      sw,
      (el) =>
        `${(el as HTMLElement).offsetWidth}×${(el as HTMLElement).offsetHeight}, ${tone(el)}, ending in ${edge(el)}`,
    );
    say(
      "the chosen tab",
      q(doc, '[data-slot="tabs-trigger"][data-state="active"]', within),
      body,
    );
    return parts.join("; ");
  }
  if (view === "working") {
    const keys = [
      ...doc.querySelectorAll(
        '[aria-busy="true"]:is([data-slot="button"],[data-variant])',
      ),
    ];
    if (!keys.length) return null;
    say("a primary working", keys[0] ?? null, working);
    say(
      "a quiet key working",
      keys.find((k) => k.getAttribute("data-variant") === "outline") ?? null,
      working,
    );
    const status = q(doc, '[data-slot="field-status"]');
    if (status)
      parts.push(
        `a field checking: its slot ${getComputedStyle(status).display === "none" ? "empty" : "drawn"}`,
      );
    return parts.join("; ");
  }
  if (moment === "working") {
    const on = q(
      doc,
      '[aria-busy="true"]:is([data-slot="button"],[data-variant])',
    );
    if (!on) return null;
    say("working", on, working);
    return parts.join("; ");
  }

  // A screen in use, read for the families the set draws on it.
  const typed =
    q(doc, '[data-slot="input"][data-demo~="focus"]') ??
    q(doc, '[data-slot="input"]');
  say("a field", typed, body);
  if (typed?.getAttribute("data-demo")?.includes("focus"))
    say("focus", typed, focusMark);
  say(
    "the primary",
    q(doc, '[data-variant="default"]:not([data-size="cta"])') ??
      q(doc, '[data-variant="default"]'),
    body,
  );
  say(
    "a quiet key",
    q(doc, '[data-variant="outline"], [data-variant="secondary"]'),
    body,
  );
  say(
    "the chosen segment",
    q(doc, '[data-slot="toggle-group-item"][data-state="on"]'),
    body,
  );
  say(
    "the chosen card",
    q(doc, '[data-slot="radio-card"][data-state="checked"]'),
    (el) => `${tone(el)}, ending in ${edge(el)}`,
  );
  say(
    "a switch",
    q(doc, '[data-slot="switch"]'),
    (el) => `${tone(el)}, ending in ${edge(el)}`,
  );
  say(
    "the pop-out",
    q(
      doc,
      '[data-slot="dropdown-menu-content"], [data-slot="popover-content"], [data-slot="responsive-menu"]',
    ),
    (el) => `${tone(el)}, ending in ${edge(el)}`,
  );
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
