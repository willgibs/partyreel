/**
 * WHAT EACH FRAME'S CAPTION READS, OFF THE FRAME ITSELF (round four,
 * 2026-09-29): the kit's `Measured` hands this the portalled root and the
 * frame's own window, and every number below comes from the rendered
 * document, never from `veils.ts` (docs/PROGRAM.md: measure every tile before
 * it ships; if a caption and the words above a frame disagree, the caption is
 * the truth).
 *
 *  - sizes from the elements' own boxes;
 *  - the veil's material from the filter the browser resolved;
 *  - timings from the running animations (their durations, delays and
 *    keyframe offsets), so a reduced-motion reader's caption says so;
 *  - how far the nearest settled clearing sits from the words, measured to
 *    the words' own line boxes (a Range over each text), not to the lockup's
 *    column.
 */

type Box = { x0: number; y0: number; x1: number; y1: number };

const s = (ms: number) => `${+(ms / 1000).toFixed(1)}s`;

/** "an 860px", "a 480px": the article a number is read aloud with. */
const article = (n: number) =>
  /^(8|11|18)/.test(String(Math.round(n))) ? "an" : "a";

/** The words' line boxes in frame px: eyebrow, headline, subhead, actions. */
function wordBoxes(root: HTMLElement): Box[] {
  const h1 = root.querySelector("section h1");
  const lockup = h1?.parentElement;
  if (!lockup) return [];
  const doc = root.ownerDocument;
  const out: Box[] = [];
  for (const el of Array.from(lockup.children)) {
    const range = doc.createRange();
    range.selectNodeContents(el);
    for (const r of Array.from(range.getClientRects())) {
      if (r.width < 1 || r.height < 1) continue;
      out.push({ x0: r.left, y0: r.top, x1: r.right, y1: r.bottom });
    }
    // The buttons' own boxes, not only their labels.
    for (const a of Array.from(el.querySelectorAll("a"))) {
      const r = a.getBoundingClientRect();
      out.push({ x0: r.left, y0: r.top, x1: r.right, y1: r.bottom });
    }
  }
  return out;
}

const gap = (cx: number, cy: number, radius: number, boxes: Box[]) =>
  Math.min(
    ...boxes.map((b) => {
      const dx = Math.max(b.x0 - cx, 0, cx - b.x1);
      const dy = Math.max(b.y0 - cy, 0, cy - b.y1);
      return Math.hypot(dx, dy) - radius;
    }),
  );

/** The first running animation on an element, if motion is allowed. */
function running(el: Element | null): CSSAnimation | null {
  const a = el?.getAnimations?.()[0];
  return (a as CSSAnimation | undefined) ?? null;
}

const durationOf = (a: Animation) =>
  Number(a.effect?.getTiming().duration ?? 0);

/** The translate a keyframe's transform carries, px. */
function translateOf(transform: string): [number, number] | null {
  const m = /translate(?:X)?\(\s*(-?[\d.]+)px(?:,\s*(-?[\d.]+)px)?/.exec(
    transform,
  );
  return m ? [Number(m[1]), Number(m[2] ?? 0)] : null;
}

function readDrift(layer: HTMLElement, win: Window): string {
  const wash = layer.querySelector<HTMLElement>(".vl-wash");
  const blur = layer.querySelector<HTMLElement>(".vl-blur");
  const clear = layer.querySelector<HTMLElement>(".vl-clear");
  if (!wash || !blur || !clear) return "measuring";
  const f = win.getComputedStyle(blur);
  const size = win.getComputedStyle(clear).maskSize.split(" ")[0];
  const a = running(clear);
  return [
    `1 photograph in ${article(wash.offsetWidth)} ${Math.round(wash.offsetWidth)}px disc, ${f.filter.replace(/[()]/g, " ").trim()} at ${Math.round(Number(f.opacity) * 100)}%`,
    `a ${size} window of clarity`,
    a
      ? `one drift every ${s(durationOf(a))}, never resting`
      : "reduced motion: parked",
  ].join(" · ");
}

function readLens(root: HTMLElement, layer: HTMLElement, win: Window): string {
  const lens = layer.querySelector<HTMLElement>("[data-lens]");
  const ground = layer.querySelector<HTMLElement>(".lns-ground");
  if (!lens || !ground) return "measuring";
  const d = lens.offsetWidth;
  const bf = win.getComputedStyle(ground).backdropFilter;
  const blur = /blur\(([\d.]+)px\)/.exec(bf)?.[1];
  const bright = /brightness\(([\d.]+)\)/.exec(bf)?.[1];
  const a = running(lens);
  const boxes = wordBoxes(root);
  const frame = layer.getBoundingClientRect();
  const parts = [
    `the lightbox's ground (blur ${blur}px, brightness ${bright})`,
    `${article(d)} ${d}px clear pane`,
  ];
  if (!a) {
    const r = lens.getBoundingClientRect();
    const g = gap(r.left + d / 2, r.top + d / 2, d / 2, boxes);
    return [
      ...parts,
      "reduced motion: settled",
      `${Math.round(g)}px from the words`,
    ].join(" · ");
  }
  // The rests are the keyframes that hold: two in a row at one place.
  const frames = (a.effect as KeyframeEffect).getKeyframes();
  const rests: { x: number; y: number; ms: number }[] = [];
  const cycle = durationOf(a);
  for (let i = 0; i + 1 < frames.length; i++) {
    const p = translateOf(String(frames[i].transform));
    const q = translateOf(String(frames[i + 1].transform));
    if (p && q && p[0] === q[0] && p[1] === q[1])
      rests.push({
        x: p[0] + d / 2 + frame.left,
        y: p[1] + d / 2 + frame.top,
        ms:
          ((frames[i + 1].computedOffset as number) -
            (frames[i].computedOffset as number)) *
          cycle,
      });
  }
  const nearest = Math.min(...rests.map((r) => gap(r.x, r.y, d / 2, boxes)));
  return [
    ...parts,
    `${rests.length} rests of ${s(rests[0]?.ms ?? 0)}`,
    `a loop of ${s(cycle)}`,
    `every rest at least ${Math.floor(nearest)}px from the words`,
  ].join(" · ");
}

function readBeam(layer: HTMLElement, win: Window): string {
  const beam = layer.querySelector<HTMLElement>("[data-beam]");
  const dim = layer.querySelector<HTMLElement>(".bm-dim");
  const grain = layer.querySelector<HTMLElement>(".bm-grain");
  if (!beam || !dim || !grain) return "measuring";
  const f = win.getComputedStyle(dim).filter;
  const bright = /brightness\(([\d.]+)\)/.exec(f)?.[1];
  const shots = layer.querySelectorAll(".bm-view .bm-shot").length;
  const a = running(beam);
  const parts = [
    `${shots} photographs, each at ${Math.round(Number(bright) * 100)}% brightness under grain (${Math.round(Number(win.getComputedStyle(grain).opacity) * 100)}%)`,
    `${article(beam.offsetWidth)} ${beam.offsetWidth}px beam of clarity`,
  ];
  if (!a) return [...parts, "reduced motion: parked on the first"].join(" · ");
  const slot = durationOf(a);
  const frames = (a.effect as KeyframeEffect).getKeyframes();
  const pass = (frames[1]?.computedOffset as number) * slot;
  return [
    ...parts,
    `one crossing in ${s(pass)}, then ${s(slot - pass)} while the next comes in`,
    `all ${shots} in ${s(slot * shots)}`,
  ].join(" · ");
}

function readGlimpse(
  root: HTMLElement,
  layer: HTMLElement,
  win: Window,
): string {
  const veil = layer.querySelector<HTMLElement>(".glm-veil");
  const spots = Array.from(layer.querySelectorAll<HTMLElement>("[data-spot]"));
  if (!veil || spots.length === 0) return "measuring";
  const f = win.getComputedStyle(veil);
  const sizes = spots.map((el) => el.offsetWidth);
  const boxes = wordBoxes(root);
  const nearest = Math.min(
    ...spots.map((el) => {
      const r = el.getBoundingClientRect();
      return gap(
        r.left + r.width / 2,
        r.top + r.height / 2,
        r.width / 2,
        boxes,
      );
    }),
  );
  const parts = [
    `1 photograph, ${f.filter.replace(/[()]/g, " ").trim()} at ${Math.round(Number(f.opacity) * 100)}%`,
    `${spots.length} spots, ${Math.min(...sizes)} to ${Math.max(...sizes)}px`,
  ];
  const a0 = running(spots[0]);
  const a1 = running(spots[1] ?? null);
  const tail = `every spot at least ${Math.floor(nearest)}px from the words`;
  if (!a0 || !a1)
    return [...parts, "reduced motion: the first open", tail].join(" · ");
  const step =
    Number(a1.effect?.getTiming().delay ?? 0) -
    Number(a0.effect?.getTiming().delay ?? 0);
  const frames = (a0.effect as KeyframeEffect).getKeyframes();
  const life = (frames[3]?.computedOffset as number) * durationOf(a0);
  return [
    ...parts,
    `one opens every ${s(step)}, each open ${s(life)}`,
    tail,
  ].join(" · ");
}

/** The probe `Measured` runs: `null` until the veil has painted. */
export function readVeil(root: HTMLElement, win: Window): string | null {
  const layer = root.querySelector<HTMLElement>("[data-veil]");
  if (!layer) return null;
  const veil = layer.dataset.veil;
  if (veil === "drift") return readDrift(layer, win);
  if (veil === "lens") return readLens(root, layer, win);
  if (veil === "beam") return readBeam(layer, win);
  if (veil === "glimpse") return readGlimpse(root, layer, win);
  return null;
}
