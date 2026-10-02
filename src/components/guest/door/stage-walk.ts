"use client";

/**
 * THE WALK THROUGH THE DOORWAY (`locked-door` r3, Will's `reveal=through`: "I think this feels so much cooler
 * than the single image alone, really feels like you're entering this door into the world of the album. The
 * animation/transition has some bugs and could definitely be more polished to feel like seamless magic").
 *
 * Through the open door stands the album's own cover, small and lit (`CoverPicture`, set into the opening by
 * `doorway.css`'s `.door-way-view`). Walking through, the door's page is a camera pushing into the doorway:
 * the frame rushes past her and off the screen, while the cover beyond it grows more slowly (it is further
 * away, so it is parallax, the way a real doorway passes), and settles exactly where the album's own cover
 * stands under the stage. The stage is then the very picture the album shows under it, and goes in a breath.
 *
 * ★ SEAMLESS BY CONSTRUCTION, NOT BY TIMING. Nothing lands near its place: every rect is measured off the
 * page at the press (the opening, the cover's picture in it, the album's cover under the stage, a stage the
 * guest scrolled included), and the camera's and the picture's paths are each a similarity solved from those
 * rects, sampled into one compositor animation apiece and started on one clock, so the picture's NET box is
 * the cover's box on the last frame to the subpixel. The cover's photographs in the doorway are put in step
 * with the cover's own before the walk (the same dissolve, at the same moment of it), so the photograph she
 * walks toward is the one she lands on.
 *
 * ★ THE PAGE'S WORK IS NONE WHILE IT PLAYS. Transform and opacity only, on the compositor; a phone four
 * times slower draws the same frames (the lane's captures at 4x CPU).
 *
 * ★ NEVER UNDER REDUCED MOTION, and never where the page is not what it measured (no cover laid out under the
 * stage, no picture in the doorway): the caller then lets the stage fade where it stood, the party's light
 * fading off the album (the brief's failsafe).
 */

/**
 * The walk's length: the door is met once, so it may take a little more than a beat (the arrival's own
 * exception), and no more: "Everything should feel as immediate/responsive/snappy" (Will, 2026-10-02).
 */
export const WALK_MS = 1000;

/** How finely each path is sampled into its keyframes (a frame's worth of travel between two). */
const SAMPLES = 48;

type Rect = { x: number; y: number; w: number; h: number };

function rectOf(el: Element): Rect {
  const r = el.getBoundingClientRect();
  return { x: r.left, y: r.top, w: r.width, h: r.height };
}

/**
 * A cubic Bézier timing curve (`cubic-bezier(x1, y1, x2, y2)`), solved for y at x: the walk's own ease, a
 * stride that starts at once (her press already moved), carries through the doorway and settles onto the
 * cover. Newton's method with a bisection fallback, as browsers solve it.
 */
export function cubicBezier(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): (t: number) => number {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const sampleX = (s: number) => ((ax * s + bx) * s + cx) * s;
  const sampleY = (s: number) => ((ay * s + by) * s + cy) * s;
  const slopeX = (s: number) => (3 * ax * s + 2 * bx) * s + cx;
  const solve = (x: number) => {
    let s = x;
    for (let i = 0; i < 8; i++) {
      const dx = sampleX(s) - x;
      if (Math.abs(dx) < 1e-6) return s;
      const d = slopeX(s);
      if (Math.abs(d) < 1e-6) break;
      s -= dx / d;
    }
    let lo = 0;
    let hi = 1;
    s = x;
    while (lo < hi) {
      const v = sampleX(s);
      if (Math.abs(v - x) < 1e-6) return s;
      if (x > v) lo = s;
      else hi = s;
      s = (lo + hi) / 2;
      if (hi - lo < 1e-7) break;
    }
    return s;
  };
  return (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : sampleY(solve(t)));
}

/**
 * The camera's stride: off the mark at once (her press already moved), through the doorway at pace, and a
 * short settle onto the cover rather than a long glide into it (the tail of a curve that ends flat is time
 * in which nothing seems to happen).
 */
const STRIDE = cubicBezier(0.6, 0.04, 0.34, 1);

/**
 * PUT THE DOORWAY'S COVER IN STEP WITH THE ALBUM'S (the same dissolve, the same moment of it), so the
 * photograph the walk lands is the photograph the cover shows. Each running animation in the picture takes
 * the current time of its twin on the cover: the same keyframes, on the same still slot or the same piece.
 */
export function syncCover(cover: Element, picture: Element) {
  const keyOf = (a: Animation) => {
    const effect = a.effect as KeyframeEffect | null;
    const target = (effect?.target ?? null) as Element | null;
    const name = "animationName" in a ? (a as CSSAnimation).animationName : "";
    const slot =
      target?.getAttribute("data-head-still") ??
      target?.getAttribute("class") ??
      "";
    return `${name}|${effect?.pseudoElement ?? ""}|${slot}`;
  };
  const theirs = new Map<string, Animation>();
  for (const a of cover.getAnimations({ subtree: true })) {
    if ("animationName" in a) theirs.set(keyOf(a), a);
  }
  for (const a of picture.getAnimations({ subtree: true })) {
    if (!("animationName" in a)) continue;
    const twin = theirs.get(keyOf(a));
    if (twin && twin.currentTime !== null) a.currentTime = twin.currentTime;
  }
}

export type Walk = {
  /** Resolves on the walk's first frame: the compositor has it, and the page may do its own work. */
  started: Promise<void>;
  /** Resolves when she has arrived (the last frame drawn). */
  done: Promise<void>;
  /** Stop where it is (the stage is going for another reason). */
  cancel: () => void;
};

/**
 * WALK THROUGH `stage`'s open door onto the album's cover. Null where it cannot be walked (reduced motion,
 * or a page that is not what the walk lands on), and the caller lets the stage fade instead.
 */
export function walkThrough(stage: HTMLElement): Walk | null {
  const win = stage.ownerDocument.defaultView;
  if (!win || typeof stage.animate !== "function") return null;
  if (win.matchMedia("(prefers-reduced-motion: reduce)").matches) return null;
  const doc = stage.ownerDocument;
  const camera = stage.querySelector<HTMLElement>("[data-door-camera]");
  const way = stage.querySelector<HTMLElement>(".door-way");
  const room = way?.querySelector<HTMLElement>(".door-way-room");
  const view = way?.querySelector<HTMLElement>("[data-door-view]");
  const cover = doc.querySelector<HTMLElement>('[data-event-head="album"]');
  if (!camera || !way || !room || !view || !cover) return null;

  const R0 = rectOf(room);
  const V0 = rectOf(view);
  const V1 = rectOf(cover);
  const S = rectOf(stage);
  const viewW = view.offsetWidth;
  if (R0.w < 1 || V0.w < 1 || V1.w < 1 || viewW < 1 || S.h < 1) return null;

  // THE CAMERA: a push into the doorway about the opening's centre, far enough that the frame has left
  // the stage's visible screen (with room to spare, so its edge is never the last thing seen).
  const vis = {
    top: Math.max(S.y, 0),
    bottom: Math.min(S.y + S.h, win.innerHeight),
    left: Math.max(S.x, 0),
    right: Math.min(S.x + S.w, win.innerWidth),
  };
  const C = { x: R0.x + R0.w / 2, y: R0.y + R0.h / 2 };
  const reach = Math.max(
    (C.x - vis.left) / (R0.w / 2),
    (vis.right - C.x) / (R0.w / 2),
    (C.y - vis.top) / (R0.h / 2),
    (vis.bottom - C.y) / (R0.h / 2),
  );
  const K = Math.max(reach * 1.18, 2);
  const cam = rectOf(camera);
  const origin = { x: C.x - cam.x, y: C.y - cam.y };

  // THE PICTURE: from its box in the doorway to the cover's own box, as one similarity (a scale about the
  // one point both boxes share), so it grows like a thing coming nearer, never sliding past its place.
  const sigma = V1.w / V0.w;
  const fixed =
    Math.abs(1 - sigma) < 1e-6
      ? { x: V0.x, y: V0.y }
      : {
          x: (V1.x - sigma * V0.x) / (1 - sigma),
          y: (V1.y - sigma * V0.y) / (1 - sigma),
        };
  // The picture's own box, untransformed: the room's top-left (`.door-way-view` is set at 0, 0 in it).
  const L = { x: R0.x, y: R0.y };

  const cameraFrames: Keyframe[] = [];
  const viewFrames: Keyframe[] = [];
  for (let i = 0; i <= SAMPLES; i++) {
    const t = i / SAMPLES;
    const e = STRIDE(t);
    const k = Math.pow(K, e);
    const s = Math.pow(sigma, e);
    // Where the picture's net box stands now.
    const nx = fixed.x + s * (V0.x - fixed.x);
    const ny = fixed.y + s * (V0.y - fixed.y);
    const nw = s * V0.w;
    // Undo the camera: the picture's own transform inside it (origin 0 0, at the room's corner).
    const a = (nx - C.x) / k + C.x - L.x;
    const b = (ny - C.y) / k + C.y - L.y;
    const m = nw / (k * viewW);
    cameraFrames.push({ offset: t, transform: `scale(${k})` });
    viewFrames.push({
      offset: t,
      transform: `translate(${a}px, ${b}px) scale(${m})`,
    });
  }

  // The doorway's picture in step with the cover's before the first frame moves.
  const picture = view.firstElementChild ?? view;
  try {
    syncCover(cover, picture);
  } catch {
    // An engine with no `getAnimations`: the dissolve may cross a beat apart, never the boxes.
  }

  stage.setAttribute("data-door-walking", "");
  camera.style.transformOrigin = `${origin.x}px ${origin.y}px`;

  const timing = (start: number, end: number, easing = "linear") => ({
    duration: WALK_MS * (end - start),
    delay: WALK_MS * start,
    easing,
    fill: "both" as FillMode,
  });
  const fade = (el: Element | null, start: number, end: number, to = 0) => {
    if (!el) return null;
    const from = Number.parseFloat(win.getComputedStyle(el).opacity) || 0;
    return el.animate(
      [{ opacity: from }, { opacity: to }],
      timing(start, end, "cubic-bezier(0.3, 0, 0.6, 1)"),
    );
  };

  const leaf = way.querySelector<HTMLElement>(".door-way-leaf");
  const leafFrom = leaf ? win.getComputedStyle(leaf).transform : "none";
  const anims: (Animation | null)[] = [
    camera.animate(cameraFrames, {
      duration: WALK_MS,
      easing: "linear",
      fill: "forwards",
    }),
    view.animate(viewFrames, {
      duration: WALK_MS,
      easing: "linear",
      fill: "forwards",
    }),
    // What stands in front of the door passes her and is gone: the words first, then the leaf swung
    // flat against the jamb, the frame's edge and the light on the floor.
    fade(stage.querySelector("[data-door-words-box]"), 0, 0.2),
    fade(stage.querySelector("[data-door-stage-back]"), 0, 0.2),
    leaf
      ? leaf.animate(
          [
            { transform: leafFrom === "none" ? "rotateY(74deg)" : leafFrom },
            { transform: "rotateY(89deg)" },
          ],
          timing(0, 0.42, "cubic-bezier(0.4, 0, 0.7, 1)"),
        )
      : null,
    fade(leaf, 0.14, 0.42),
    fade(way.querySelector(".door-way-edge"), 0.05, 0.32),
    fade(way.querySelector(".door-way-sill"), 0, 0.3),
    fade(way.querySelector(".door-way-floor"), 0.04, 0.4),
    fade(way.querySelector(".door-way-ground"), 0, 0.3),
    ...Array.from(way.querySelectorAll("[data-door-leak]"), (el) =>
      fade(el, 0.04, 0.42),
    ),
    // And the room beyond the door is the album's page: its own ground stands round the photographs the
    // moment the doorway opens wider than they are (the room's coloured light was only ever the light
    // spilling through the door, never a place), and the light that lit the photographs lifts off them
    // as she reaches them.
    fade(way.querySelector(".door-way-room-ground"), 0, 0.16, 1),
    fade(way.querySelector(".door-way-tint"), 0, 0.16),
    ...Array.from(way.querySelectorAll(".door-way-glow"), (el) =>
      fade(el, 0, 0.16),
    ),
    fade(way.querySelector(".door-way-core"), 0.04, 0.34),
    fade(way.querySelector(".door-way-jamb"), 0.04, 0.34),
    // The veil rides the photograph (`.door-way-view`'s own), and lifts off it as she reaches it.
    fade(view.querySelector(".door-way-veil"), 0.3, 0.86),
  ];
  const all = anims.filter((a): a is Animation => a !== null);

  // ONE CLOCK: every path starts on the same frame, so the picture and the camera never drift apart.
  const start = doc.timeline?.currentTime ?? null;
  if (start !== null) for (const a of all) a.startTime = start;

  let cancelled = false;
  const done = Promise.all(all.map((a) => a.finished.catch(() => null))).then(
    () => undefined,
  );
  const started = all[0].ready.then(
    () => undefined,
    () => undefined,
  );
  return {
    started,
    done: done.then(() => {
      if (cancelled) throw new Error("walk cancelled");
    }),
    cancel: () => {
      cancelled = true;
      for (const a of all) a.cancel();
      stage.removeAttribute("data-door-walking");
      camera.style.transformOrigin = "";
    },
  };
}
