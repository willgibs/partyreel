/**
 * THE ROOM OPENS INTO HER EVENT (`entry.ts`, create-wizard r5's carried `entry`): the beat's plate takes the code's morph
 * name and a view transition carries it into the hub's code. What fails silently: a press that goes nowhere (no API, a
 * hidden tab, reduced motion must still navigate), a transition that freezes the screen past its ceiling, a plate named
 * something the hub's code never wears, and a transition held open after her event already stands.
 *
 * The unit world has no DOM: the document, the window and the observer are stand-ins the test owns.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CODE_MORPH_NAME } from "@/components/app/share/event-share-provider";

import { ENTRY_CEILING_MS, enterEvent } from "./entry";

type Observer = { cb: () => void; disconnected: boolean };

let observers: Observer[];
let present: { room: boolean; code: boolean };
let started: Array<() => Promise<void>>;
let reduced: boolean;
let visibility: "visible" | "hidden";
let api: boolean;

function plate() {
  const props = new Map<string, string>();
  return {
    style: {
      setProperty: (k: string, v: string) => void props.set(k, v),
      getPropertyValue: (k: string) => props.get(k) ?? "",
    },
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  observers = [];
  present = { room: true, code: false };
  started = [];
  reduced = false;
  visibility = "visible";
  api = true;
  vi.stubGlobal(
    "MutationObserver",
    class {
      o: Observer;
      constructor(cb: () => void) {
        this.o = { cb, disconnected: false };
        observers.push(this.o);
      }
      observe() {}
      disconnect() {
        this.o.disconnected = true;
      }
    },
  );
  vi.stubGlobal("document", {
    get visibilityState() {
      return visibility;
    },
    get startViewTransition() {
      return api
        ? (cb: () => Promise<void>) => {
            started.push(cb);
            return {
              ready: Promise.resolve(),
              finished: Promise.resolve(),
            };
          }
        : undefined;
    },
    body: {},
    querySelector: (sel: string) =>
      sel === "[data-app-room]"
        ? present.room
          ? {}
          : null
        : sel === "[data-code-door]"
          ? present.code
            ? {}
            : null
          : null,
  });
  vi.stubGlobal("window", {
    matchMedia: () => ({ matches: reduced }),
    setTimeout: (fn: () => void, ms: number) => setTimeout(fn, ms),
    clearTimeout: (t: ReturnType<typeof setTimeout>) => clearTimeout(t),
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("Go to your event", () => {
  it("★ names the plate the hub's own code name and carries the change of page in a view transition", async () => {
    const go = vi.fn();
    const p = plate();
    enterEvent("/dashboard/e1", go, p as unknown as HTMLElement);
    expect(p.style.getPropertyValue("view-transition-name")).toBe(
      CODE_MORPH_NAME,
    );
    expect(started).toHaveLength(1);
    // The change is the transition's own: the page is pushed inside it.
    const settled = vi.fn();
    void started[0]!().then(settled);
    expect(go).toHaveBeenCalledWith("/dashboard/e1");
    // Her event stands (the room gone, the cover's code in): the transition is let go at once.
    present = { room: false, code: true };
    observers[0]!.cb();
    await Promise.resolve();
    expect(settled).toHaveBeenCalled();
    expect(observers[0]!.disconnected).toBe(true);
  });

  it("★ never holds the screen past its ceiling: a slow page arrives as a plain change", async () => {
    const go = vi.fn();
    enterEvent("/dashboard/e1", go, plate() as unknown as HTMLElement);
    const settled = vi.fn();
    void started[0]!().then(settled);
    // The hub's skeleton stands, its code not yet: still waiting.
    present = { room: false, code: false };
    observers[0]!.cb();
    await Promise.resolve();
    expect(settled).not.toHaveBeenCalled();
    vi.advanceTimersByTime(ENTRY_CEILING_MS);
    await Promise.resolve();
    expect(settled).toHaveBeenCalled();
  });

  it.each([
    ["reduced motion (a cut)", () => (reduced = true)],
    ["a tab nobody is looking at", () => (visibility = "hidden")],
    ["a browser with no view transitions", () => (api = false)],
  ])("goes straight in under %s, never a broken press", (_, set) => {
    set();
    const go = vi.fn();
    enterEvent("/dashboard/e1", go, plate() as unknown as HTMLElement);
    expect(go).toHaveBeenCalledWith("/dashboard/e1");
    expect(started).toHaveLength(0);
  });

  it("goes straight in with no plate to fly", () => {
    const go = vi.fn();
    enterEvent("/dashboard/e1", go, null);
    expect(go).toHaveBeenCalledWith("/dashboard/e1");
    expect(started).toHaveLength(0);
  });
});
