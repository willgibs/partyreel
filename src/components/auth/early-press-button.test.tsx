import { StrictMode } from "react";
import { act } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { EarlyPressButton } from "@/components/auth/early-press-button";
import {
  EARLY_PRESS_ATTR,
  EARLY_PRESS_FRESH_MS,
  EARLY_PRESS_RECORDER,
} from "@/lib/early-press";

/**
 * A BUTTON WHOSE WHOLE ANSWER IS ITS HANDLER KEEPS THE TAP MADE BEFORE THE PAGE COULD HEAR IT (crumbs-23,
 * build 26's red-team: "Continue with Google": the first click before hydration did nothing, the second
 * went).
 *
 * The order the browser meets is rebuilt whole: `renderToString` is the server's HTML, the root layout's
 * inline recorder is run against the document as the HTML is parsed, the person clicks the button (no
 * handler exists: nothing answers), and only then does `hydrateRoot` bring the page. What is pinned is what
 * the control does about the tap it missed: answers it once, through its own handler, while it is fresh,
 * and never twice, never stale, never for a tap it did not miss.
 */
let root: ReturnType<typeof hydrateRoot> | null = null;

beforeEach(() => {
  delete (window as unknown as { __earlyPress?: unknown }).__earlyPress;
  // The root layout's inline script, run once as the document is parsed.
  new Function(EARLY_PRESS_RECORDER)();
});
afterEach(() => {
  act(() => root?.unmount());
  root = null;
  document.body.innerHTML = "";
  vi.useRealTimers();
});

/** The server's page: the button, drawn with no handler, in the document. */
function serve(onClick: () => void) {
  const container = document.createElement("div");
  container.innerHTML = renderToString(
    <EarlyPressButton onClick={onClick}>Continue with Google</EarlyPressButton>,
  );
  document.body.append(container);
  return container;
}

async function hydrate(
  container: HTMLElement,
  onClick: () => void,
  strict = false,
) {
  const tree = (
    <EarlyPressButton onClick={onClick}>Continue with Google</EarlyPressButton>
  );
  await act(async () => {
    root = hydrateRoot(
      container,
      strict ? <StrictMode>{tree}</StrictMode> : tree,
    );
  });
}

describe("EarlyPressButton", () => {
  it("carries the attribute that asks the recorder to remember its presses", () => {
    const container = serve(() => {});
    expect(container.querySelector("button")).toHaveAttribute(EARLY_PRESS_ATTR);
  });

  it("★ answers the press it missed, once, through its own handler, the moment it hydrates", async () => {
    const onClick = vi.fn();
    const container = serve(onClick);
    container.querySelector("button")!.click();
    // Nothing is listening yet: the tap reached no handler.
    expect(onClick).not.toHaveBeenCalled();

    await hydrate(container, onClick);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("★ never answers it twice: not on a re-render, not on a remount, not under StrictMode's second pass", async () => {
    const onClick = vi.fn();
    const container = serve(onClick);
    container.querySelector("button")!.click();
    await hydrate(container, onClick, true);
    expect(onClick).toHaveBeenCalledTimes(1);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("★ drops a press that waited longer than the window: the person has moved on", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    const onClick = vi.fn();
    const container = serve(onClick);
    container.querySelector("button")!.click();
    // The page took its time.
    vi.setSystemTime(Date.now() + EARLY_PRESS_FRESH_MS + 1);
    await hydrate(container, onClick);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("answers nothing for a button nobody pressed before its page was live", async () => {
    const onClick = vi.fn();
    const container = serve(onClick);
    await hydrate(container, onClick);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("★ leaves every tap after the page is live exactly as it was: one tap, one answer", async () => {
    const onClick = vi.fn();
    const container = serve(onClick);
    await hydrate(container, onClick);
    await act(async () => container.querySelector("button")!.click());
    expect(onClick).toHaveBeenCalledTimes(1);
    await act(async () => container.querySelector("button")!.click());
    expect(onClick).toHaveBeenCalledTimes(2);
  });
});
