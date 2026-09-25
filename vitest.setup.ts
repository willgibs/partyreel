/**
 * Component-project setup (jsdom): polyfills + global mocks for the browser
 * APIs the pinned components touch but jsdom lacks. Loaded only by the
 * `component` vitest project (see vitest.config.ts); the node `unit` project
 * never sees this file.
 */
import { afterEach, beforeEach, vi } from "vitest";
import { act, cleanup, configure } from "@testing-library/react";

// Entry-step EXIT CLONES (entry-step-transition.tsx) are inert pixels that
// linger ~320ms during a step handoff; exclude them from text queries the
// same way aria-hidden already excludes them from role queries.
configure({
  defaultIgnore: "script, style, [data-entry-exit], [data-entry-exit] *",
});

// src/lib/env.ts validates the public vars EAGERLY on import; components that
// transitively import the supabase client need these to exist. Dummies only -
// component pins never hit a network.
process.env.NEXT_PUBLIC_SUPABASE_URL ??= "https://test.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??= "test-publishable-key";

// RTL auto-cleanup hooks into globals (off here); register it explicitly so
// each test starts from an empty document. Radix's FocusScope restores focus
// on unmount from a `setTimeout(0)` that dispatches on its container: flush
// that timer here, in the SAME hook as the unmount, while the document still
// exists. Left pending, a loaded run can reach it after jsdom is torn down,
// where `dispatchEvent` throws as an unhandled error - and splitting the
// flush into its own afterEach wouldn't help (after hooks run in reverse
// registration order, so a later-registered flush would fire BEFORE this
// cleanup ever unmounts anything, and one registered earlier would run after
// every other file's hooks, too late to catch what this cleanup schedules).
afterEach(async () => {
  cleanup();
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
});

// React 19 + RTL act() integration.
(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

/* ── matchMedia, with reduced-motion + viewport knobs ────────────────────
   Default = no-preference so the lightbox runs its ANIMATED settle path;
   tests opt into the reduced-motion instant path via setReducedMotion(true).
   (min-width: Npx) queries resolve against a mocked viewport width
   (default 1024 = DESKTOP, so entry-shell pins run the Dialog branch -
   vaul's drawer needs real layout/pointer machinery jsdom lacks). */
let reducedMotion = false;
let viewportWidth = 1024;

/** Flip the (prefers-reduced-motion) media result for the current test. */
export function setReducedMotion(value: boolean) {
  reducedMotion = value;
}

/** Set the mocked viewport width for (min-width: Npx) queries. */
export function setViewportWidth(px: number) {
  viewportWidth = px;
}

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => {
    const minWidth = query.match(/\(min-width:\s*([\d.]+)px\)/);
    return {
      matches: query.includes("prefers-reduced-motion")
        ? reducedMotion
        : minWidth
          ? viewportWidth >= parseFloat(minWidth[1])
          : false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    };
  },
});

/* ── Layout + geometry (jsdom has no layout engine) ────────────────────── */
const RECT = {
  x: 0,
  y: 0,
  width: 800,
  height: 600,
  top: 0,
  left: 0,
  bottom: 600,
  right: 800,
  toJSON: () => ({}),
};
Element.prototype.getBoundingClientRect = vi.fn(() => ({ ...RECT }));

/* ── DOMMatrixReadOnly: the lightbox reads m41 (translateX) off the live
   transform when a drag interrupts a settle. Parse the two forms jsdom's
   getComputedStyle can return. ───────────────────────────────────────── */
if (!("DOMMatrixReadOnly" in globalThis)) {
  class DOMMatrixReadOnlyPolyfill {
    m41 = 0;
    constructor(transform?: string) {
      if (!transform) return;
      // jsdom's getComputedStyle returns the UNRESOLVED inline string, so the
      // lightbox's `translateX(calc(-100% + Npx))` must be resolved here
      // against the mocked 800px stage (see the RECT mock above) - a real
      // browser would hand back a resolved matrix instead.
      const calc = transform.match(
        /translateX\(calc\(-100% \+ (-?[\d.]+)px\)\)/,
      );
      if (calc) {
        this.m41 = -800 + parseFloat(calc[1]);
        return;
      }
      const tx = transform.match(/translateX\((-?[\d.]+)px\)/);
      if (tx) {
        this.m41 = parseFloat(tx[1]);
        return;
      }
      const matrix = transform.match(/matrix\(([^)]+)\)/);
      if (matrix) {
        const parts = matrix[1].split(",").map((s) => parseFloat(s.trim()));
        if (parts.length === 6) this.m41 = parts[4];
      }
    }
  }
  (globalThis as Record<string, unknown>).DOMMatrixReadOnly =
    DOMMatrixReadOnlyPolyfill;
}

/* ── Pointer events: jsdom lacks the constructor + capture methods (radix
   and the lightbox call them inside try/catch, but the stubs keep paths
   deterministic). ──────────────────────────────────────────────────────── */
if (typeof window.PointerEvent === "undefined") {
  class PointerEventPolyfill extends MouseEvent {
    pointerId: number;
    pointerType: string;
    constructor(type: string, init: PointerEventInit = {}) {
      super(type, init);
      this.pointerId = init.pointerId ?? 0;
      this.pointerType = init.pointerType ?? "mouse";
    }
  }
  (window as unknown as Record<string, unknown>).PointerEvent =
    PointerEventPolyfill;
}
Element.prototype.setPointerCapture = vi.fn();
Element.prototype.releasePointerCapture = vi.fn();
Element.prototype.hasPointerCapture = vi.fn(() => false);
Element.prototype.scrollIntoView = vi.fn();

// jsdom has no blob URL support; thumbnails/measure paths just need a string.
if (typeof URL.createObjectURL === "undefined") {
  URL.createObjectURL = vi.fn(() => "blob:vitest-mock");
  URL.revokeObjectURL = vi.fn();
}

if (!("ResizeObserver" in globalThis)) {
  (globalThis as Record<string, unknown>).ResizeObserver = class {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  };
}

/* ── Sonner: spy on toasts everywhere; stub the Toaster so trees that render
   components/ui/sonner.tsx don't crash. vi.unmock("sonner") per-file if a
   test ever needs the real thing. ─────────────────────────────────────── */
vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  }),
  Toaster: () => null,
}));

beforeEach(() => {
  localStorage.clear();
  reducedMotion = false;
  viewportWidth = 1024;
});

// jest-dom matchers (toHaveTextContent, toBeInTheDocument, ...) for vitest.
import "@testing-library/jest-dom/vitest";
