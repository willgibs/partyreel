import { readFileSync } from "node:fs";
import { join } from "node:path";

import { act, render, renderHook, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * THE PUBLISH LIGHT: a shared reel rests lit, and only a share that happened
 * HERE swells.
 *
 * Nothing below pins how the light looks (its register, its shape, its
 * geometry are tuned by eye). What is pinned is what fails SILENTLY: a swell
 * that replays on every open, a lamp left mounted on a draft, a light that
 * paints over the header or the card because the stack went back to static, a
 * fence hook that would hide the Share button, and motion under reduced motion.
 *
 * Three halves. The hook and the two mounts run under jsdom. The Studio cannot
 * (it needs a signed-in reel, a canvas engine and a router), so its wiring is
 * held by source-text pins, the house pattern for a silent failure
 * (glow-contract.test.ts, section-light.test.ts). The stylesheet is read as text.
 */

// The hook's only collaborator. Mocked because the real module re-exports a
// server action, and because every case here is decided by what it ANSWERS.
const setReelGuestVisible = vi.fn();
vi.mock("./publish-action", () => ({
  setReelGuestVisible: (...args: unknown[]) => setReelGuestVisible(...args),
  PUBLISH_FALLBACK_MESSAGE: "Couldn't update sharing. Please try again.",
}));

import {
  ShareCardPublishLight,
  StudioPublishLight,
} from "@/components/reel/publish-light";
import {
  ReelShareCard,
  useReelPublish,
  type ReelPublishController,
} from "@/components/reel/reel-share-card";

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");
const stripComments = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

/** A promise the test settles by hand, to look at the optimistic render. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

type Answer =
  | { ok: true; guestVisible: boolean }
  | { ok: false; reason: "error"; message: string };

// jsdom has no IntersectionObserver and the engine arms a bloom through one.
// Inert on purpose: these cases are about what is MOUNTED and what it is told,
// never about the engine's arming (glow-contract.test.ts owns that).
class InertObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

let filterHost: HTMLElement;

beforeEach(() => {
  setReelGuestVisible.mockReset();
  vi.stubGlobal("IntersectionObserver", InertObserver);
  // The engine's dev tripwire logs when #glw-warp is missing (the root layout
  // mounts it in the app). Stand one in so a real failure is not lost in noise.
  filterHost = document.createElement("div");
  filterHost.id = "glw-warp";
  document.body.append(filterHost);
});

afterEach(() => {
  filterHost.remove();
  vi.unstubAllGlobals();
});

const lamp = (root: ParentNode) =>
  root.querySelector<HTMLElement>("[data-glw]");
const strength = (el: HTMLElement) =>
  parseFloat(el.style.getPropertyValue("--glw-strength"));

describe("the swell is owed to the tap, the base to the state", () => {
  it("opens an already-shared reel shared, and not shared HERE", () => {
    const { result } = renderHook(() => useReelPublish("evt", true));
    expect(result.current.shared).toBe(true);
    expect(result.current.sharedHere).toBe(false);
  });

  it("marks a Share tap in the same render that mounts the light", async () => {
    // One render, not two: a light that mounted a frame before it learned the
    // share was local would arm at rest and never swell.
    const answer = deferred<Answer>();
    setReelGuestVisible.mockReturnValueOnce(answer.promise);
    const { result } = renderHook(() => useReelPublish("evt", false));

    act(() => result.current.flip(true));
    expect(result.current.shared).toBe(true);
    expect(result.current.sharedHere).toBe(true);

    await act(async () => answer.resolve({ ok: true, guestVisible: true }));
    expect(result.current.shared).toBe(true);
    expect(result.current.sharedHere).toBe(true);
  });

  it("clears both on Unshare", async () => {
    setReelGuestVisible.mockResolvedValue({ ok: true, guestVisible: true });
    const { result } = renderHook(() => useReelPublish("evt", false));
    await act(async () => result.current.flip(true));

    setReelGuestVisible.mockResolvedValue({ ok: true, guestVisible: false });
    await act(async () => result.current.flip(false));
    expect(result.current.shared).toBe(false);
    expect(result.current.sharedHere).toBe(false);
  });

  it("never celebrates a Share the server refused", async () => {
    setReelGuestVisible.mockResolvedValue({
      ok: false,
      reason: "error",
      message: "no",
    });
    const { result } = renderHook(() => useReelPublish("evt", false));
    await act(async () => result.current.flip(true));
    expect(result.current.shared).toBe(false);
    expect(result.current.sharedHere).toBe(false);
  });

  it("comes back from a refused Unshare resting, not swelling", async () => {
    // The light remounts here (shared went false and back to true), so this is
    // the one road where a stale flag would fire a swell at a FAILURE.
    setReelGuestVisible.mockResolvedValue({ ok: true, guestVisible: true });
    const { result } = renderHook(() => useReelPublish("evt", false));
    await act(async () => result.current.flip(true));
    expect(result.current.sharedHere).toBe(true);

    setReelGuestVisible.mockResolvedValue({
      ok: false,
      reason: "error",
      message: "no",
    });
    await act(async () => result.current.flip(false));
    expect(result.current.shared).toBe(true);
    expect(result.current.sharedHere).toBe(false);
  });

  it("follows the server's echo when it disagrees with the tap", async () => {
    setReelGuestVisible.mockResolvedValue({ ok: true, guestVisible: false });
    const { result } = renderHook(() => useReelPublish("evt", false));
    await act(async () => result.current.flip(true));
    expect(result.current.shared).toBe(false);
    expect(result.current.sharedHere).toBe(false);
  });
});

/**
 * Both lamps answer to every case below, so each case walks both. Looped INSIDE
 * the case rather than with describe.each: the Library prints these titles on
 * the component's block, and a "%s" suite reads as noise there.
 */
const LIGHTS = [
  ["the Studio's light", StudioPublishLight],
  ["the share card's light", ShareCardPublishLight],
] as const;

describe("the two lights, each of them", () => {
  it("mounts nothing while the reel is a draft", () => {
    for (const [name, Light] of LIGHTS) {
      const draft = render(<Light shared={false} sharedHere={false} />);
      expect(draft.container, name).toBeEmptyDOMElement();
      // Not even when the flag is stale: `shared` alone decides.
      const stale = render(<Light shared={false} sharedHere />);
      expect(stale.container, name).toBeEmptyDOMElement();
    }
  });

  it("mounts one lamp of the engine while the reel is shared", () => {
    for (const [name, Light] of LIGHTS) {
      const { container } = render(<Light shared sharedHere={false} />);
      expect(container.querySelectorAll("[data-glw]"), name).toHaveLength(1);
    }
  });

  it("is decoration: hidden from assistive tech, on the light's own box", () => {
    for (const [name, Light] of LIGHTS) {
      const { container } = render(<Light shared sharedHere={false} />);
      const box = container.firstElementChild;
      expect(box, name).toHaveAttribute("aria-hidden", "true");
      expect(box, name).toContainElement(lamp(container));
    }
  });

  it("holds the swell at nothing unless the share happened here", () => {
    for (const [name, Light] of LIGHTS) {
      const rest = render(<Light shared sharedHere={false} />);
      expect(strength(lamp(rest.container)!), name).toBe(0);
      const tap = render(<Light shared sharedHere />);
      expect(strength(lamp(tap.container)!), name).toBeGreaterThan(0);
    }
  });

  it("rests at the same base on both roads", () => {
    for (const [name, Light] of LIGHTS) {
      const base = (sharedHere: boolean) => {
        const view = render(<Light shared sharedHere={sharedHere} />);
        return lamp(view.container)!.style.getPropertyValue("--glw-base");
      };
      expect(base(true), name).not.toBe("");
      expect(base(true), name).toBe(base(false));
    }
  });
});

describe("the share card", () => {
  const controller = (
    over: Partial<ReelPublishController>,
  ): ReelPublishController => ({
    shared: false,
    sharedHere: false,
    pending: false,
    flip: vi.fn(),
    ...over,
  });

  it("carries no light while Share is still the question", () => {
    const { container } = render(<ReelShareCard publish={controller({})} />);
    expect(
      screen.getByRole("button", { name: /share with guests/i }),
    ).toBeInTheDocument();
    expect(lamp(container)).toBeNull();
  });

  it("puts the light first and the card after it, in a positioned wrapper", () => {
    // DOM order IS the stack: no z-index anywhere, so the card must come after
    // the lamp and be positioned, inside a wrapper that isolates, or the light
    // paints over the card.
    const { container } = render(
      <ReelShareCard publish={controller({ shared: true })} />,
    );
    const wrapper = container.firstElementChild!;
    const [light, card] = [...wrapper.children];
    expect(light).toContainElement(lamp(container));
    expect(card).toHaveAttribute("data-rxp-share");
    expect(card).toHaveAttribute("data-state", "on");
    expect(wrapper.classList.contains("relative")).toBe(true);
    expect(wrapper.classList.contains("isolate")).toBe(true);
    expect(card.classList.contains("relative")).toBe(true);
  });

  it("keeps the fence's hook on the light, never on the card", () => {
    // `display: none` takes what it names: on the card it would take the Share
    // button with it on every light-mode page.
    const { container } = render(
      <ReelShareCard publish={controller({ shared: true })} />,
    );
    const hook = container.querySelector("[data-rxp-cardlight]")!;
    expect(hook).toHaveAttribute("aria-hidden", "true");
    expect(hook).not.toContainElement(
      screen.getByRole("button", { name: /unshare/i }),
    );
  });

  it("hands the light both halves of the share state", () => {
    const rest = render(
      <ReelShareCard publish={controller({ shared: true })} />,
    );
    expect(strength(lamp(rest.container)!)).toBe(0);
    rest.unmount();
    const tap = render(
      <ReelShareCard
        publish={controller({ shared: true, sharedHere: true })}
      />,
    );
    expect(strength(lamp(tap.container)!)).toBeGreaterThan(0);
  });
});

describe("the Studio", () => {
  const studio = stripComments(read("src/components/reel/reel-studio.tsx"));
  const mountAt = studio.indexOf("<StudioPublishLight");
  const playerAt = studio.indexOf("<CanvasReelPlayer");

  /** The nth-from-last `className="..."` literal before a marker. */
  const classBefore = (marker: string, nth = 1) => {
    const at = studio.indexOf(marker);
    expect(at, `marker not found: ${marker}`).toBeGreaterThan(-1);
    const all = [...studio.slice(0, at).matchAll(/className="([^"]*)"/g)];
    const hit = all.at(-nth);
    expect(hit, `no className before ${marker}`).toBeTruthy();
    return hit![1];
  };

  it("mounts the light from the share state, once", () => {
    expect(mountAt, "the Studio no longer mounts its light").toBeGreaterThan(
      -1,
    );
    expect(studio.split("<StudioPublishLight")).toHaveLength(2);
    const tag = studio.slice(mountAt, studio.indexOf("/>", mountAt));
    expect(tag).toContain("shared={publish.shared}");
    expect(tag).toContain("sharedHere={publish.sharedHere}");
  });

  it("puts the light before the reel, in a positioned wrapper", () => {
    expect(playerAt).toBeGreaterThan(mountAt);
    // The wrapper is the last string before the mount that isolates.
    const wrapper = [
      ...studio.slice(0, mountAt).matchAll(/"([^"]*\bisolate\b[^"]*)"/g),
    ].at(-1)?.[1];
    expect(wrapper, "the lit frame has no isolating wrapper").toBeTruthy();
    expect(wrapper).toMatch(/\brelative\b/);
    // And the reel, which comes after it, is positioned: that is the stack.
    const between = studio.slice(mountAt, playerAt);
    const frame = /className="([^"]*)"/.exec(between)?.[1] ?? "";
    expect(frame).toMatch(/\brelative\b/);
  });

  it("lifts the header, the dock and the tray above the light", () => {
    // A positioned lamp paints over every unpositioned box whatever the DOM
    // order. Left static, these three sit UNDER the light: the title washed,
    // the dock's thumbnails tinted. It reads as "too strong", not as a bug.
    for (const [name, cls] of [
      ["header", classBefore('aria-label="Close the studio"')],
      ["dock", classBefore("<StudioFilmstrip")],
      ["tray", classBefore("SHEETS.map(", 2)],
    ] as const) {
      expect(cls, `${name} is not positioned`).toMatch(/\brelative\b/);
      expect(cls, `${name} is not lifted`).toMatch(/\bz-10\b/);
    }
  });

  it("skips the theater under reduced motion, and the state still lands", () => {
    const share = studio.slice(studio.indexOf("function share()"));
    const branch = share.slice(share.indexOf("if (reduced)"));
    const body = branch.slice(0, branch.indexOf("}"));
    expect(body).toContain("publish.flip(true)");
    expect(body).toContain("return");
    expect(body).not.toContain("setPublishing");
  });
});

describe("nothing of its own moves", () => {
  const globals = read("src/app/globals.css");

  it("adds no motion of its own, so reduced motion is the base and no swell", () => {
    // The swell is the ENGINE's, and the engine declares every animation inside
    // its no-preference block with the bloom's band resting at nothing outside
    // it. So a reduced-motion host gets the base alone, on both roads, as long
    // as this module never grows a clock of its own.
    const mounts = stripComments(read("src/components/reel/publish-light.tsx"));
    expect(mounts).not.toMatch(/\banimate-|\btransition\b|@keyframes/);

    const engine = stripComments(
      globals.slice(globals.indexOf("SPILL: the light engine")),
    );
    const noPref = engine.indexOf(
      "@media (prefers-reduced-motion: no-preference)",
    );
    expect(noPref, "no-preference block not found").toBeGreaterThan(-1);
    expect(engine.indexOf("animation: glw-bloom")).toBeGreaterThan(noPref);
    expect(engine.slice(0, noPref)).toMatch(
      /\[data-glw-shape="bloom"\]\s+\[data-glw-band\]\s*\{[^}]*opacity:\s*0;/,
    );
  });
});
