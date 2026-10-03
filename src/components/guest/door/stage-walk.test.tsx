/**
 * THE WALK THROUGH THE DOORWAY (`locked-door` r3, `reveal=through`: "could definitely be more polished to feel like
 * seamless magic"), pinned on its geometry, the one thing that makes it seamless. Every path is solved from the
 * rects the page measures at the press, so the doorway's picture of the cover starts exactly where the doorway
 * shows it and ends exactly on the album's own cover, to the subpixel; the camera ends with the doorway past every
 * edge of the screen; the picture only ever grows toward its place; and a page that is not what the walk lands on
 * (no cover under the stage, nothing measured, reduced motion) is never walked, its caller letting the stage fade.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { setReducedMotion } from "../../../../vitest.setup";
import { cubicBezier, syncCover, walkThrough } from "./stage-walk";

type Rect = { x: number; y: number; w: number; h: number };

/** What each element was asked to animate: its keyframes, and each animation's own cancel. */
const animated = new Map<
  Element,
  { frames: Keyframe[]; cancel: ReturnType<typeof vi.fn> }[]
>();

function place(el: Element, r: Rect) {
  el.getBoundingClientRect = () =>
    ({
      left: r.x,
      top: r.y,
      width: r.w,
      height: r.h,
      right: r.x + r.w,
      bottom: r.y + r.h,
      x: r.x,
      y: r.y,
      toJSON: () => ({}),
    }) as DOMRect;
}

function make(tag: string, attrs: Record<string, string>, parent: Element) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") el.className = v;
    else el.setAttribute(k, v);
  }
  parent.appendChild(el);
  return el;
}

const PHONE = { w: 375, h: 812, header: 56 };

/** A phone's page at the press: the stage under the header, the doorway in it, the album's cover under the stage. */
function page(opts: { cover?: boolean; room?: Rect } = {}) {
  document.body.innerHTML = "";
  const stage = make("div", { "data-door-stage": "" }, document.body);
  const camera = make("div", { "data-door-camera": "" }, stage);
  const way = make("div", { class: "door-way" }, camera);
  const frame = make("div", { class: "door-way-frame" }, way);
  make("span", { class: "door-way-edge" }, frame);
  const room = make("div", { class: "door-way-room" }, frame);
  make("span", { class: "door-way-room-ground" }, room);
  const view = make("div", { "data-door-view": "cover" }, room);
  make("div", { "data-cover-picture": "" }, view);
  make("div", { class: "door-way-leaf" }, frame);
  make("span", { class: "door-way-sill" }, way);
  make("span", { "data-door-leak": "" }, way);
  make("div", { "data-door-words-box": "" }, camera);
  const S = { x: 0, y: PHONE.header, w: PHONE.w, h: PHONE.h - PHONE.header };
  place(stage, S);
  place(camera, S);
  const R0 = opts.room ?? { x: 129.5, y: 129, w: 116, h: 176 };
  place(room, R0);
  // The cover's picture, laid out at the cover's own size (375 by 544) and set into the opening at the
  // scale that fills its height (176 / 544), centred: a little wider than the opening, cropped by it.
  const s0 = 176 / 544;
  const V0 = { x: R0.x + (R0.w - 375 * s0) / 2, y: R0.y, w: 375 * s0, h: 176 };
  place(view, V0);
  Object.defineProperty(view, "offsetWidth", { value: 375 });
  const V1 = { x: 0, y: 0, w: 375, h: 544 };
  if (opts.cover !== false) {
    place(make("section", { "data-event-head": "album" }, document.body), V1);
  }
  return { stage, camera, way, view, R0, V0, V1 };
}

const scaleOf = (t: unknown) =>
  Number(/scale\(([-\d.e]+)\)/.exec(String(t))?.[1]);
const translateOf = (t: unknown) => {
  const m = /translate\(([-\d.e]+)px, ([-\d.e]+)px\)/.exec(String(t));
  return { x: Number(m?.[1] ?? 0), y: Number(m?.[2] ?? 0) };
};
const framesOf = (el: Element | null, n = 0) =>
  (el ? animated.get(el)?.[n]?.frames : undefined) ?? [];

beforeEach(() => {
  animated.clear();
  vi.stubGlobal("innerWidth", PHONE.w);
  vi.stubGlobal("innerHeight", PHONE.h);
  // jsdom has no Web Animations: each `animate` is recorded, and answers as one that ran to its end.
  HTMLElement.prototype.animate = function (
    this: HTMLElement,
    frames: Keyframe[] | PropertyIndexedKeyframes | null,
  ) {
    const cancel = vi.fn();
    const list = animated.get(this) ?? [];
    list.push({ frames: frames as Keyframe[], cancel });
    animated.set(this, list);
    return {
      ready: Promise.resolve(),
      finished: Promise.resolve(),
      startTime: null,
      currentTime: null,
      cancel,
    } as unknown as Animation;
  } as HTMLElement["animate"];
});
afterEach(() => {
  vi.unstubAllGlobals();
  delete (HTMLElement.prototype as Partial<HTMLElement>).animate;
  document.body.innerHTML = "";
});

describe("★ the walk lands the doorway's picture on the album's own cover", () => {
  it("starts where the doorway shows it and ends on the cover's box, to the subpixel, only ever growing", async () => {
    const { stage, camera, view, R0, V0, V1 } = page();
    const run = walkThrough(stage);
    expect(run).not.toBeNull();
    const cam = framesOf(camera);
    const pic = framesOf(view);
    expect(cam.length).toBeGreaterThan(2);
    expect(pic.length).toBe(cam.length);
    // The camera pushes about the opening's centre, in the camera's own box (under the header).
    const C = { x: R0.x + R0.w / 2, y: R0.y + R0.h / 2 };
    expect(camera.style.transformOrigin).toBe(
      `${C.x}px ${C.y - PHONE.header}px`,
    );
    /** The picture's net box at a keyframe: its own transform (origin at the room's corner) inside the camera's. */
    const net = (i: number) => {
      const k = scaleOf(cam[i].transform);
      const t = translateOf(pic[i].transform);
      const m = scaleOf(pic[i].transform);
      return {
        x: C.x + k * (R0.x + t.x - C.x),
        y: C.y + k * (R0.y + t.y - C.y),
        w: k * m * 375,
      };
    };
    const first = net(0);
    expect(first.x).toBeCloseTo(V0.x, 6);
    expect(first.y).toBeCloseTo(V0.y, 6);
    expect(first.w).toBeCloseTo(V0.w, 6);
    const last = net(cam.length - 1);
    expect(last.x).toBeCloseTo(V1.x, 6);
    expect(last.y).toBeCloseTo(V1.y, 6);
    expect(last.w).toBeCloseTo(V1.w, 6);
    let width = first.w;
    for (let i = 1; i < cam.length; i++) {
      const w = net(i).w;
      expect(w).toBeGreaterThanOrEqual(width - 1e-9);
      expect(w).toBeLessThanOrEqual(V1.w + 1e-9);
      width = w;
    }
    await expect(run?.done).resolves.toBeUndefined();
  });

  it("★ a guest who scrolled the stage lands on the cover all the same (every rect is read at the press)", () => {
    const { stage, camera, view, R0, V0 } = page();
    // The page scrolled 40px: the cover's top is above the screen, the doorway higher too.
    const up = 40;
    const room = stage.querySelector(".door-way-room");
    if (!room) throw new Error("no room");
    const R = { ...R0, y: R0.y - up };
    place(room, R);
    place(view, { ...V0, y: V0.y - up });
    place(stage, { x: 0, y: PHONE.header - up, w: 375, h: 756 });
    place(camera, { x: 0, y: PHONE.header - up, w: 375, h: 756 });
    const cover = document.querySelector("[data-event-head]");
    if (!cover) throw new Error("no cover");
    place(cover, { x: 0, y: -up, w: 375, h: 544 });
    walkThrough(stage);
    const cam = framesOf(camera);
    const pic = framesOf(view);
    const n = cam.length - 1;
    const C = { x: R.x + R.w / 2, y: R.y + R.h / 2 };
    const k = scaleOf(cam[n].transform);
    const t = translateOf(pic[n].transform);
    expect(C.y + k * (R.y + t.y - C.y)).toBeCloseTo(-up, 6);
    expect(C.x + k * (R.x + t.x - C.x)).toBeCloseTo(0, 6);
  });

  it("★ the doorway ends past every edge of the screen, and grows faster than the picture (it is nearer)", () => {
    const { stage, camera, R0 } = page();
    walkThrough(stage);
    const cam = framesOf(camera);
    expect(scaleOf(cam[0].transform)).toBe(1);
    const K = scaleOf(cam[cam.length - 1].transform);
    const C = { x: R0.x + R0.w / 2, y: R0.y + R0.h / 2 };
    expect(C.x - (K * R0.w) / 2).toBeLessThan(0);
    expect(C.x + (K * R0.w) / 2).toBeGreaterThan(PHONE.w);
    expect(C.y - (K * R0.h) / 2).toBeLessThan(PHONE.header);
    expect(C.y + (K * R0.h) / 2).toBeGreaterThan(PHONE.h);
    // The picture grows by its own ratio (544 / 176), the doorway by more.
    expect(K).toBeGreaterThan(544 / 176);
  });

  it("what stands before the door goes (the words, the leaf, its edge, the light at its foot), the room's own ground comes", () => {
    const { stage, way } = page();
    walkThrough(stage);
    const to = (sel: string, n = 0) =>
      framesOf(stage.querySelector(sel), n).at(-1)?.opacity;
    expect(to("[data-door-words-box]")).toBe(0);
    expect(to(".door-way-edge")).toBe(0);
    expect(to(".door-way-sill")).toBe(0);
    expect(to("[data-door-leak]")).toBe(0);
    // The leaf swings flat against the jamb, then is gone.
    expect(framesOf(way.querySelector(".door-way-leaf"), 0).at(-1)).toEqual({
      transform: "rotateY(89deg)",
    });
    expect(to(".door-way-leaf", 1)).toBe(0);
    expect(to(".door-way-room-ground")).toBe(1);
    // Running, the stage holds still under her (no scroll while the camera passes).
    expect(stage.hasAttribute("data-door-walking")).toBe(true);
  });

  it("put down mid-way (the stage goes for another reason): every path stops, the stage is its own again", async () => {
    const { stage, camera } = page();
    const run = walkThrough(stage);
    if (!run) throw new Error("not walked");
    run.cancel();
    for (const list of animated.values()) {
      for (const a of list) expect(a.cancel).toHaveBeenCalled();
    }
    expect(stage.hasAttribute("data-door-walking")).toBe(false);
    expect(camera.style.transformOrigin).toBe("");
    await expect(run.done).rejects.toThrow("walk cancelled");
  });
});

describe("never walked where it cannot land (the caller lets the stage fade where it stood)", () => {
  it("no cover under the stage (a gate, a page not yet the album's): null, and nothing moves", () => {
    const { stage } = page({ cover: false });
    expect(walkThrough(stage)).toBeNull();
    expect(animated.size).toBe(0);
    expect(stage.hasAttribute("data-door-walking")).toBe(false);
  });

  it("nothing measured (a stage not laid out): null", () => {
    const { stage } = page({ room: { x: 0, y: 0, w: 0, h: 0 } });
    expect(walkThrough(stage)).toBeNull();
    expect(animated.size).toBe(0);
  });

  it("reduced motion: null", () => {
    setReducedMotion(true);
    const { stage } = page();
    expect(walkThrough(stage)).toBeNull();
    expect(animated.size).toBe(0);
  });
});

describe("the stride and the dissolve", () => {
  it("the stride is a timing curve: from rest, to rest, never back", () => {
    const ease = cubicBezier(0.6, 0.04, 0.34, 1);
    expect(ease(0)).toBe(0);
    expect(ease(1)).toBe(1);
    let last = 0;
    for (let i = 1; i <= 50; i++) {
      const v = ease(i / 50);
      expect(v).toBeGreaterThanOrEqual(last);
      last = v;
    }
    // A straight curve is the identity.
    expect(cubicBezier(0.25, 0.25, 0.75, 0.75)(0.37)).toBeCloseTo(0.37, 4);
  });

  it("★ the doorway's photographs are put in step with the cover's: each slot takes its twin's moment", () => {
    const anim = (target: Element, time: number | null) =>
      ({
        animationName: "head-crossfade",
        currentTime: time,
        effect: { target, pseudoElement: null },
      }) as unknown as CSSAnimation;
    const still = (slot: number) => {
      const img = document.createElement("img");
      img.setAttribute("data-head-still", String(slot));
      return img;
    };
    const cover = document.createElement("section");
    const picture = document.createElement("div");
    const coverAnims = [anim(still(0), 12_000), anim(still(1), 16_600)];
    const pictureAnims = [anim(still(1), 4_900), anim(still(0), 300)];
    cover.getAnimations = () => coverAnims;
    picture.getAnimations = () => pictureAnims;
    syncCover(cover, picture);
    expect(pictureAnims.map((a) => a.currentTime)).toEqual([16_600, 12_000]);
  });
});
