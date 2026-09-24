/**
 * A STRING IN, A DETERMINISTIC COLOUR OUT: the seeded default avatar's generator.
 *
 * ★ HOME: the generator lives here so `src/components/ui/avatar.tsx` can import
 * it without pulling a sandbox path into the production bundle; its test is
 * `gradient.test.ts` beside this file.
 *
 * Will asked for this by name (2026-09-19): "seed-generated
 * dither avatars, which made new accounts feel way cooler than something generic
 * ... I like the gradient over dither for our purposes". Today an account with no
 * photograph is one letter on `bg-muted` on every avatar surface, so a guest list
 * of two dozen is two dozen identical grey discs.
 *
 * ★ CREDIT: hashvatar (MIT, medhychabour, https://github.com/medhychabour/hashvatar).
 * Its GRADIENT mode is what this learns from, and the debt is exact: FNV-1a over the
 * lowercased string, mulberry32 to turn that one integer into a stream of seeds, one
 * base hue per identity with every colour of the avatar sharing it, and OKLCH as the
 * space the palette is reasoned in. Nothing here is copied; the library is a runtime
 * dependency that renders into a `<canvas>` with blurred polygons, six blend-mode
 * layers and a `requestAnimationFrame` loop, and we need none of that.
 *
 * ★ ROUND TWO ADDS `mesh` (2026-09-20, `avatar-mesh-wiring`, `seed-avatar` r2:
 * "is the diagonal the richest look hashvatar had to offer? The preview ones
 * felt much more alive and rich"). Read from hashvatar's OWN source this
 * round (`gradient.ts`, `color.ts`, `index.ts`, `demo/index.html`, all on
 * GitHub): its default view — no `tones` supplied, which is what every one
 * of its own gallery samples renders — draws four colours that all share ONE
 * hue, never rotated: a bright primary and three darker, desaturated
 * secondaries, composited back with `overlay` and `soft-light` at varying
 * alpha. So the richness he saw is one hue read at several DEPTHS, diffused
 * and blended, never several hues in one avatar. `mesh` below is the honest
 * CSS-only translation: layered `radial-gradient`s plus `background-blend-
 * mode` (`blendMode`, applied by the caller alongside this file's plain
 * string, since one CSS value cannot itself declare a blend mode) — no
 * canvas, no blur filter, no polygon path.
 *
 * ★ WHAT WE CHANGE, AND WHY EACH CHANGE IS FORCED.
 *
 *  1. NO CANVAS, NO DEPENDENCY, NO CLIENT. The guest list, the user menu and the
 *     profile's identity row are server-rendered, and a canvas avatar would make
 *     every one of them a client island that paints one frame late. This emits a
 *     CSS `background-image` string instead: one pure function, renderable in a
 *     Server Component, composited on the GPU, and it costs one `style` attribute.
 *     A CSS gradient also beats an inline SVG here, which would need a `<defs>` id
 *     unique per instance and stable across hydration.
 *  2. THE LIGHTNESS IS FITTED, NOT SAMPLED. hashvatar draws a LIGHT base (L 0.55 to
 *     0.77) with dark blurred blobs over it, which is a lovely picture and an
 *     illegible background for a letter. Our orb carries an initial at 10px on a
 *     24px chip, so the body colour is fitted into the one lightness window where
 *     the letter clears 4.5:1 AND the whole disc still clears 3:1 against BOTH page
 *     grounds (paper at the top of the file, ink at the bottom). See `fitBody`.
 *  3. THE CHROMA IS GAMUT-CLAMPED. hashvatar clamps chroma at a flat 0.37, which is
 *     outside sRGB for most hues and gets clipped channel by channel on the way out,
 *     which shifts the lightness the fit just paid for. We binary-search the chroma
 *     down to the gamut boundary at the hue and lightness we actually want.
 *  4. NO ANIMATION BY DEFAULT. hashvatar's `animated` runs a rAF loop forever: six
 *     layers rotating at 0.45 to 0.65 rad/s, drifting sinusoidally by up to 18% of
 *     the avatar and pulsing scale by 15%. An avatar is chrome; a crowd of them
 *     breathing is a lava lamp in a guest list. `motion` is a decision on the board.
 *  5. `tones` BECOMES `palette`. hashvatar's `tones` option picks a tone per colour
 *     and jitters its hue by 30 degrees. Ours restricts the WHEEL itself (the whole
 *     360, a curated set, or one warm arc), because the question a crowd asks is how
 *     far apart two strangers' colours should be, not how a single one is tinted.
 *
 * ★ THE SEED IS NEVER ANYTHING PRIVATE (docs/systems/profiles-social.md). A colour
 * is public by construction: it is painted on every album the person ever uploaded
 * to. Feed it the account id or the display name, never an email, never a token.
 * On the production path the caller feeds this `seedFor(id)` (`./seed.ts`), a
 * server-side SHA-256 of the id, never the id itself — see that file for why.
 */

/* ── 1. The hash: a string to a stream of numbers ─────────────────────────── */

/**
 * FNV-1a, 32-bit, over the lowercased and trimmed string. hashvatar's, unchanged:
 * it is fast, stable across engines, and the avalanche is good enough that "u-priya"
 * and "u-priyb" land nowhere near each other on the wheel.
 */
export function fnv1a(input: string): number {
  let hash = 2166136261;
  const s = input.toLowerCase().trim();
  for (let i = 0; i < s.length; i++) {
    hash ^= s.charCodeAt(i);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash;
}

/**
 * mulberry32: one integer in, an endless stream of uniform floats out. hashvatar's
 * again. FNV-1a alone is not enough here because its low bits are correlated for
 * similar inputs, and the hue comes straight off the first draw.
 */
function mulberry32(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** `count` deterministic numbers in [0, 1) from any string. */
export function seedsFrom(input: string, count: number): number[] {
  const rng = mulberry32(fnv1a(input));
  return Array.from({ length: count }, () => rng());
}

/* ── 2. The colour space: OKLCH out to sRGB, and back to a luminance ──────── */

export type Lch = { l: number; c: number; h: number };

/** OKLCH to LINEAR sRGB (Ottosson's matrices). Values outside [0, 1] are out of gamut. */
function toLinear({ l, c, h }: Lch): [number, number, number] {
  const rad = (h * Math.PI) / 180;
  const a = c * Math.cos(rad);
  const b = c * Math.sin(rad);
  const lc = l + 0.3963377774 * a + 0.2158037573 * b;
  const mc = l - 0.1055613458 * a - 0.0638541728 * b;
  const sc = l - 0.0894841775 * a - 1.291485548 * b;
  const l3 = lc * lc * lc;
  const m3 = mc * mc * mc;
  const s3 = sc * sc * sc;
  return [
    4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3,
    -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3,
    -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3,
  ];
}

/** True when every channel lands inside sRGB, with a hair of slack for float noise. */
export function inGamut(lch: Lch): boolean {
  return toLinear(lch).every((v) => v >= -0.0005 && v <= 1.0005);
}

/**
 * The largest chroma at this hue and lightness that sRGB can actually show.
 *
 * ★ THIS IS THE STEP hashvatar SKIPS, and skipping it is what makes a flat 0.37
 * clamp lie: an out-of-gamut colour is clipped per channel on its way to a hex
 * string, which drags the lightness with it. Sixteen bisections land inside a
 * thousandth of a chroma unit, which is far below anything an eye resolves.
 */
export function fitChroma(lch: Lch): Lch {
  if (inGamut(lch)) return lch;
  let lo = 0;
  let hi = lch.c;
  for (let i = 0; i < 16; i++) {
    const mid = (lo + hi) / 2;
    if (inGamut({ ...lch, c: mid })) lo = mid;
    else hi = mid;
  }
  return { ...lch, c: lo };
}

const srgb = (v: number): number => {
  const cv = Math.max(0, Math.min(1, v));
  return cv <= 0.0031308 ? cv * 12.92 : 1.055 * Math.pow(cv, 1 / 2.4) - 0.055;
};

/** A CSS colour. `oklch()` itself, because every browser we support reads it and it
 *  keeps the gradient's own interpolation honest about what it was handed. */
export function css({ l, c, h }: Lch): string {
  return `oklch(${l.toFixed(4)} ${c.toFixed(4)} ${h.toFixed(1)})`;
}

/** Hex, for anywhere a test or a caption needs to name the colour plainly. */
export function hex(lch: Lch): string {
  return `#${toLinear(lch)
    .map((v) =>
      Math.round(srgb(v) * 255)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}

/** WCAG relative luminance. Computed from the LINEAR channels we already have,
 *  which is the same number the browser arrives at from the hex string. */
export function luminance(lch: Lch): number {
  const [r, g, b] = toLinear(lch).map((v) => Math.max(0, Math.min(1, v)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast between two colours, the usual (L1 + 0.05) / (L2 + 0.05). */
export function contrast(a: Lch, b: Lch): number {
  const x = luminance(a);
  const y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

/* ── 3. What the orb has to clear ─────────────────────────────────────────── */

/**
 * The two grounds an avatar is met on and the hairline drawn over it, read off
 * `src/app/globals.css` rather than guessed. The ring is `--border`; on paper it is
 * a real grey and on ink it is white at 12%, so the paper value is the one an orb
 * can actually be mistaken for and the one the floor is measured against.
 */
export const GROUND = {
  paper: { l: 0.995, c: 0.002, h: 286 },
  ink: { l: 0.105, c: 0.0053, h: 286 },
} as const satisfies Record<string, Lch>;

/** `--border` on paper: the avatar's own ring, `after:border-border`. */
export const RING: Lch = { l: 0.89, c: 0.0068, h: 286 };

/**
 * The floors, and why each is the number it is.
 *
 *  - `letter` 4.5: the initial is TEXT over the orb, and none of our three sizes
 *    reaches WCAG's large-text relief (10px on a 24px chip, 14px on 32, 18px on 40;
 *    large text starts at 18.66px bold or 24px). So one floor covers every size.
 *  - `ground` 3: the disc is a non-text object that has to be findable on the page
 *    (WCAG 1.4.11), on paper AND on ink, because the theme is the reader's choice.
 *  - `ring` 3: the hairline must not be mistaken for the fill it sits on.
 */
export const FLOOR = { letter: 4.5, ground: 3, ring: 3 } as const;

/**
 * The initial's ink: near-white, carrying a breath of the orb's own hue so the
 * letter belongs to the disc rather than being stamped on it.
 *
 * ★ ONE INK FOR EVERY ORB, NEVER "whichever pole reads better". Picking white on
 * some avatars and near-black on others would make a guest list of two dozen look
 * like two products, and it is the lightness window below that pays for it instead.
 */
export const inkFor = (hue: number): Lch => ({ l: 0.985, c: 0.012, h: hue });

/* ── 4. seed -> hue -> palette ────────────────────────────────────────────── */

/** How wide a wheel a crowd draws from. The `palette` decision on the board. */
export type PaletteMode = "wheel" | "curated" | "warm";

/**
 * Twelve hues chosen to sit apart: no two neighbours within 22 degrees, so a wrapping
 * chip list never puts two colours side by side that argue about being the same one.
 */
const CURATED = [
  12, 34, 58, 86, 112, 146, 178, 212, 248, 278, 306, 334,
] as const;

/** The warm arc: a crowd that reads as one gathering rather than a paint chart. */
const WARM = { from: 8, span: 110 } as const;

function hueFor(s: number, mode: PaletteMode): number {
  if (mode === "curated") return CURATED[Math.floor(s * CURATED.length) % CURATED.length];
  if (mode === "warm") return (WARM.from + s * WARM.span) % 360;
  return s * 360;
}

/**
 * The lightness window, found rather than assumed.
 *
 * Luminance rises with L at a fixed hue and chroma, so both ends are a bisection:
 * the floor is the dimmest body that still clears 3:1 on ink, the ceiling the
 * brightest that still holds 4.5:1 under the letter. The gamut clamp runs INSIDE the
 * probe, so what is measured is the colour a browser will really paint, not the one
 * we asked for. When the window closes (a very high chroma at a hue sRGB cannot
 * carry), the chroma drops a fifth and the search runs again.
 */
function fitBody(hue: number, chroma: number): Lch {
  const ink = inkFor(hue);
  for (let attempt = 0; attempt < 6; attempt++) {
    const c = chroma * Math.pow(0.8, attempt);
    const at = (l: number): Lch => fitChroma({ l, c, h: hue });
    // The dimmest body that still separates from the dark theme's ground.
    let lo = 0.3;
    let hi = 0.8;
    for (let i = 0; i < 18; i++) {
      const mid = (lo + hi) / 2;
      if (contrast(at(mid), GROUND.ink) >= FLOOR.ground) hi = mid;
      else lo = mid;
    }
    const floor = hi;
    // The brightest body the letter still reads on.
    lo = 0.3;
    hi = 0.8;
    for (let i = 0; i < 18; i++) {
      const mid = (lo + hi) / 2;
      if (contrast(ink, at(mid)) >= FLOOR.letter) lo = mid;
      else hi = mid;
    }
    const ceiling = lo;
    if (ceiling > floor) {
      // Halfway up a window that is only about 0.08 of lightness wide, which leaves
      // roughly 5.4:1 under the letter and 3.6:1 on ink: headroom at both ends
      // rather than a colour pinned against one of its own floors.
      return at(floor + (ceiling - floor) * 0.5);
    }
  }
  // Unreachable with any hue in sRGB, and a black orb would be a silent wrong
  // answer, so it fails loudly instead: the contract test covers a thousand seeds.
  throw new Error(`no legible body at hue ${hue}`);
}

/** Everything one identity's avatar is made of. Pure, and the same every time. */
export type Orb = {
  /** The seed it came from, so a caption can say so. */
  readonly seed: string;
  /** 0 to 360. The identity's own hue, and the one every colour here shares. */
  readonly hue: number;
  /** The second hue, used only by the two-hue looks. */
  readonly hue2: number;
  /** The lit pole. */
  readonly lit: Lch;
  /** The bulk of the disc, and what the initial sits on. */
  readonly body: Lch;
  /** The shadow side. */
  readonly deep: Lch;
  /** The initial's colour. */
  readonly ink: Lch;
  /** Where the light source sits, in percent of the disc. */
  readonly light: { readonly x: number; readonly y: number };
  /** The angle the two-hue looks run along. */
  readonly angle: number;
};

/**
 * The generator. Six draws off the stream, and every one of them is a decision:
 * the hue, the chroma, where the light sits (x and y), the second hue's distance,
 * and the angle the two-hue looks run along.
 *
 * ★ THE LIGHT SOURCE IS PLACED, NOT EMERGENT. hashvatar has no light: its six
 * blurred polygons land off-centre and the base colour showing through between them
 * reads as one. That is beautiful at 64px and mud at 24px, where the whole avatar is
 * smaller than one of its blobs. Ours puts the highlight in the upper third, where a
 * light source lives in every other lit object in the product, and keeps it clear of
 * the centre so the letter never sits in the brightest part of its own disc.
 */
export function orbFor(seed: string, mode: PaletteMode = "wheel"): Orb {
  const s = seedsFrom(seed, 6);
  const hue = hueFor(s[0], mode);
  const body = fitBody(hue, 0.13 + s[1] * 0.1);
  return {
    seed,
    hue,
    // Far enough to read as a second colour, near enough to stay one family.
    hue2: (hue + 42 + s[4] * 78) % 360,
    lit: fitChroma({ l: Math.min(0.88, body.l + 0.215), c: body.c * 0.92, h: hue }),
    body,
    // The shadow cools by a few degrees, which is what shadows do.
    deep: fitChroma({
      l: Math.max(0.17, body.l - 0.225),
      c: body.c * 0.78,
      h: (hue + 348) % 360,
    }),
    ink: inkFor(hue),
    light: { x: 22 + s[2] * 34, y: 14 + s[3] * 22 },
    angle: 108 + s[5] * 72,
  };
}

/* ── 5. The picture: one CSS background string ────────────────────────────── */

/**
 * The five shapes a seeded avatar could take. The `look` decision on the
 * board: `mesh` is what round two picked ("the closing sitting's
 * second batch") and what `Avatar` actually draws; `orb`, `diagonal`,
 * `aurora` and `flat` are round one's exploration, kept for the generator's
 * own tests and history rather than deleted with the board.
 */
export type Look = "orb" | "diagonal" | "aurora" | "flat" | "mesh";

/** Keeps a `mesh` layer's own lightness swing inside a paintable window,
 *  exactly hashvatar's own clamp on its four generated colours. */
const clampL = (l: number): number => Math.max(0.1, Math.min(0.95, l));

/**
 * `diagonal`'s own three stops (0%, 58%, 100%), shared by `background()` and
 * `measure.ts`'s comparison figure for the look `mesh` replaced, so the two
 * can never quietly drift apart the way a hand-copied formula would.
 */
export function diagonalStops(orb: Orb): readonly [Lch, Lch, Lch] {
  const { hue2, body, lit, deep } = orb;
  return [lit, fitChroma({ l: body.l, c: body.c, h: hue2 }), deep];
}

/**
 * `mesh`'s three depths of its ONE hue (never rotated), shared by
 * `background()` (which paints them as layered `radial-gradient`s) and
 * `measure.ts` (which composites them the way a browser actually would, for
 * the contract test) — computed once so the two can never quietly drift
 * apart. `primary` is `lit`, a hair dimmer; `secondaryDark` and
 * `secondaryMid` are `body` read darker and less saturated, hashvatar's own
 * two visible secondary tones at this scale.
 */
export function meshDepths(
  orb: Orb,
): { primary: Lch; secondaryDark: Lch; secondaryMid: Lch } {
  const { hue, body, lit } = orb;
  return {
    primary: fitChroma({ l: clampL(lit.l - 0.02), c: lit.c, h: hue }),
    secondaryDark: fitChroma({
      l: clampL(body.l - 0.32),
      c: body.c * 0.5,
      h: hue,
    }),
    secondaryMid: fitChroma({
      l: clampL(body.l - 0.1),
      c: body.c * 0.85,
      h: hue,
    }),
  };
}

/**
 * The avatar's `background-image`, or `background` for the flat one.
 *
 * ★ INTERPOLATED `in oklab`, NEVER IN sRGB. A default CSS gradient walks a straight
 * line through sRGB, and the midpoint between a saturated blue and its own shadow is
 * a grey that belongs to neither. Oklab is the space the palette was reasoned in, so
 * the ramp stays the same colour the whole way down; oklab rather than oklch because
 * the polar form takes a hue ARC between two hues and can swing through a third
 * colour that was never in the palette.
 *
 * ★ `mesh` PAINTS FOUR LAYERS THAT NEED A BLEND MODE TO READ RIGHT: pair this
 * string with `blendMode(look)` on the SAME element's `backgroundBlendMode`
 * (`ui/avatar.tsx` does); every other look composites correctly with the
 * browser's default and needs nothing extra.
 */
export function background(orb: Orb, look: Look): string {
  const { lit, body, deep, light, angle, hue, hue2 } = orb;
  if (look === "flat") return css(body);
  if (look === "diagonal") {
    // Vercel's shape: two hues, one straight ramp, no light source at all.
    const [litAt, far, deepAt] = diagonalStops(orb);
    return `linear-gradient(in oklab ${angle.toFixed(0)}deg, ${css(litAt)} 0%, ${css(far)} 58%, ${css(deepAt)} 100%)`;
  }
  if (look === "aurora") {
    // Two hues thrown across one deep ground with a soft seam between them: the
    // Aurora register, at the only scale an avatar has room for.
    const a = fitChroma({ l: Math.min(0.8, body.l + 0.14), c: body.c, h: hue });
    const b = fitChroma({ l: Math.min(0.8, body.l + 0.08), c: body.c * 0.9, h: hue2 });
    return [
      `radial-gradient(in oklab 120% 96% at ${light.x.toFixed(0)}% ${light.y.toFixed(0)}%, ${css(a)} 0%, transparent 62%)`,
      `radial-gradient(in oklab 108% 104% at ${(100 - light.x).toFixed(0)}% ${(100 - light.y * 0.6).toFixed(0)}%, ${css(b)} 0%, transparent 66%)`,
      `linear-gradient(in oklab ${angle.toFixed(0)}deg, ${css(deep)} 0%, ${css(body)} 100%)`,
    ].join(", ");
  }
  if (look === "mesh") {
    // hashvatar's own register (the header above): one hue read at several
    // depths, diffused and blended. Four layers, first-listed-paints-on-top:
    // the bright primary pool at the light source, a dark secondary pool
    // opposite it, a mid secondary wash low and centred, and a plain linear
    // fill underneath everything else. `blendMode("mesh")` is what actually
    // folds them together; this string alone paints them flat.
    const { primary, secondaryDark, secondaryMid } = meshDepths(orb);
    return [
      `radial-gradient(in oklab 122% 118% at ${light.x.toFixed(0)}% ${light.y.toFixed(0)}%, ${css(primary)} 0%, transparent 58%)`,
      `radial-gradient(in oklab 116% 116% at ${(100 - light.x).toFixed(0)}% ${(100 - light.y).toFixed(0)}%, ${css(secondaryDark)} 0%, transparent 64%)`,
      `radial-gradient(in oklab 150% 150% at 50% 62%, ${css(secondaryMid)} 0%, transparent 72%)`,
      `linear-gradient(in oklab 180deg, ${css(primary)} 0%, ${css(body)} 100%)`,
    ].join(", ");
  }
  // The orb: one hue, one light source, one shadow. hashvatar's gradient mode,
  // redrawn as the lit sphere it was always describing.
  return `radial-gradient(in oklab 118% 118% at ${light.x.toFixed(0)}% ${light.y.toFixed(0)}%, ${css(
    lit,
  )} 0%, ${css(body)} 46%, ${css(deep)} 100%)`;
}

/**
 * `background-blend-mode` to pair with `background()`'s image, for a look
 * that reads as several depths of ONE hue rather than a single ramp or a
 * single lit pole. Only `mesh` needs one: `overlay` folds its bright primary
 * pool into the fill without washing it flat, `soft-light` seats the dark
 * secondary pool without ever turning fully opaque, and the mid secondary
 * wash and the base fill composite with the browser's own default
 * (`normal`) exactly as every other look already does with nothing
 * declared. `undefined` for every other look, so a caller can set the style
 * unconditionally: React drops a `backgroundBlendMode: undefined` the same
 * way it drops any other unset style property.
 */
export function blendMode(look: Look): string | undefined {
  return look === "mesh" ? "overlay, soft-light, normal, normal" : undefined;
}

/** What a caption can honestly say about one orb, without opening the file. */
export function describe(orb: Orb): string {
  return `hue ${Math.round(orb.hue)}, ${hex(orb.body)}, ${contrast(
    orb.ink,
    orb.body,
  ).toFixed(2)}:1 under the letter`;
}
