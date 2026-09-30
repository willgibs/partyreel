import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  EARLY_PRESS_ATTR,
  EARLY_PRESS_FRESH_MS,
  EARLY_PRESS_RECORDER,
  takeEarlyPress,
} from "@/lib/early-press";

/**
 * A TAP BEFORE THE PAGE'S SCRIPTS HAVE RUN IS REMEMBERED, FOR THE CONTROLS THAT ASK (crumbs-23).
 *
 * The recorder is the inline script the sign-in pages' layout runs as the HTML is parsed; it is run here the way the
 * browser runs it (evaluated against the document), then clicked, and `takeEarlyPress` is what a control
 * reads when its handler has arrived. What is pinned is what is remembered and what is not: only a click
 * on a control that carries the attribute, only for a few seconds, only once.
 */
type Ledger = WeakMap<Element, number>;
const ledger = () =>
  (window as unknown as { __earlyPress?: Ledger }).__earlyPress;

function install() {
  // The auth layout's own inline script, run once against this document.
  new Function(EARLY_PRESS_RECORDER)();
}

let button: HTMLButtonElement;
let plain: HTMLButtonElement;

beforeEach(() => {
  delete (window as unknown as { __earlyPress?: Ledger }).__earlyPress;
  document.body.innerHTML = `<button id="early" ${EARLY_PRESS_ATTR}=""><span id="inner">Continue with Google</span></button><button id="plain">Other</button>`;
  button = document.getElementById("early") as HTMLButtonElement;
  plain = document.getElementById("plain") as HTMLButtonElement;
});
afterEach(() => {
  document.body.innerHTML = "";
});

describe("the recorder", () => {
  it("★ remembers a click on a control that asks, even one on a child of it", () => {
    install();
    expect(ledger()).toBeInstanceOf(WeakMap);
    document.getElementById("inner")!.click();
    expect(ledger()!.has(button)).toBe(true);
  });

  it("remembers nothing about any other control", () => {
    install();
    plain.click();
    document.body.click();
    expect(ledger()!.has(plain)).toBe(false);
  });

  it("is one small inline script, with no dependency and nothing to fetch", () => {
    // ~200 bytes, run before anything else: it must stay a few lines a browser can run as it parses.
    expect(EARLY_PRESS_RECORDER.length).toBeLessThan(400);
    expect(EARLY_PRESS_RECORDER).not.toMatch(
      /import|require|fetch|XMLHttpRequest/,
    );
  });
});

describe("takeEarlyPress", () => {
  it("★ answers true for a fresh press, once, then forgets it", () => {
    install();
    button.click();
    expect(takeEarlyPress(button)).toBe(true);
    expect(takeEarlyPress(button)).toBe(false);
  });

  it("★ drops a press that waited longer than the freshness window: the person has moved on", () => {
    install();
    button.click();
    expect(takeEarlyPress(button, Date.now() + EARLY_PRESS_FRESH_MS + 1)).toBe(
      false,
    );
    // ...and it is forgotten either way, so a later mount cannot resurrect it.
    expect(takeEarlyPress(button)).toBe(false);
  });

  it("answers false for a control nobody pressed, and where no recorder ran", () => {
    expect(takeEarlyPress(button)).toBe(false); // no ledger at all
    install();
    expect(takeEarlyPress(button)).toBe(false);
  });
});
