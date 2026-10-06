/**
 * A HIDDEN OPTION HOLDS STILL INSIDE ITS FRAMES TOO (lab-kit-2, from ROADMAP's line on the stage's pause). The step
 * marks every option but the shown one `data-paused` on its view and `design.css` freezes what is inside it, which stops
 * at a frame's own document: a hidden option's CSS loops and videos ran on behind the shown one (identity's Working
 * step: four arcs turning in each hidden option's frames). Each test here draws the real frame inside a real view and
 * reads what the frame's own document is told, then what it is told when the option is shown.
 *
 * jsdom runs no animation and no media, so what is held is the mechanism: the mark on the frame's root, the stylesheet
 * keyed on it (a real Chrome reads the animations themselves: `pnpm lab:demo` on identity's Working step, with
 * `getAnimations()` of every frame), and the media element's `pause` and `play`, stood in for.
 */
import { act, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Frame } from "./frame";
import { FRAME_PAUSED } from "./frame-pause";

let committed: Document;
/** The media elements that are playing: jsdom's own `paused` is a constant, and `play` and `pause` are not implemented. */
let playing: WeakSet<HTMLMediaElement>;

beforeEach(() => {
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  committed = document.implementation.createHTMLDocument("committed");
  Object.defineProperty(committed, "URL", { value: "about:srcdoc" });
  vi.spyOn(
    HTMLIFrameElement.prototype,
    "contentDocument",
    "get",
  ).mockImplementation(() => committed);

  playing = new WeakSet();
  vi.spyOn(HTMLMediaElement.prototype, "paused", "get").mockImplementation(
    function (this: HTMLMediaElement) {
      return !playing.has(this);
    },
  );
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(function (
    this: HTMLMediaElement,
  ) {
    playing.delete(this);
  });
  vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(function (
    this: HTMLMediaElement,
  ) {
    playing.add(this);
    // `play` does not bubble, as the browser's does not.
    this.dispatchEvent(new Event("play"));
    return Promise.resolve();
  });
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const marked = () => committed.documentElement.hasAttribute(FRAME_PAUSED);
const rules = () => committed.querySelectorAll("#lab-frame-paused");
const video = () => committed.querySelector("video") as HTMLVideoElement;

/** A view as the step draws it, holding a portalled frame (or a routed one, with `src`). */
function Option({
  paused = true,
  src,
  children,
}: {
  paused?: boolean;
  src?: string;
  children?: React.ReactNode;
}) {
  return (
    <div data-lab-view="" data-paused={paused ? "true" : undefined}>
      <Frame id="f" w={400} h={300} title="Frame" src={src}>
        {src ? undefined : (children ?? <p>the scene</p>)}
      </Frame>
    </div>
  );
}

/** Sets or clears the step's mark on the view, as the step does when another option is shown. */
async function mark(container: HTMLElement, paused: boolean) {
  const view = container.querySelector("[data-lab-view]")!;
  await act(async () => {
    if (paused) view.setAttribute("data-paused", "true");
    else view.removeAttribute("data-paused");
  });
}

describe("Frame: a hidden option's frame holds still", () => {
  it("★ marks the frame's root and holds its CSS loops while its view is paused, and lets go when it is shown", async () => {
    const { container } = render(<Option />);
    await act(async () => {});
    expect(marked()).toBe(true);
    // The rule is keyed on the mark and freezes every animation of the document, its pseudo-elements included.
    const rule = rules()[0].textContent!;
    expect(rule).toContain(`:root[${FRAME_PAUSED}] *`);
    expect(rule).toContain("::before");
    expect(rule).toContain("::after");
    expect(rule).toContain("animation-play-state:paused!important");

    await mark(container, false);
    expect(marked()).toBe(false);

    // Hidden again: held again, and the rule is not written twice.
    await mark(container, true);
    expect(marked()).toBe(true);
    expect(rules()).toHaveLength(1);
  });

  it("★ holds a routed frame's document too (a scene served as its own route, where a board's loops would live)", async () => {
    const { container } = render(
      <Option src="/design/sandbox/example/scene" />,
    );
    await act(async () => {});
    expect(container.querySelector("iframe")!.getAttribute("src")).toBe(
      "/design/sandbox/example/scene",
    );
    expect(marked()).toBe(true);
    expect(rules()).toHaveLength(1);

    await mark(container, false);
    expect(marked()).toBe(false);
  });

  it("★ stops a playing video and starts it again when the option is shown", async () => {
    const { container } = render(
      <Option paused={false}>
        <video muted loop />
      </Option>,
    );
    await act(async () => {});
    // The option on the stage: a video playing as it plays on a page.
    await act(async () => {
      void video().play();
    });
    expect(video().paused).toBe(false);

    await mark(container, true);
    expect(video().paused).toBe(true);

    await mark(container, false);
    expect(video().paused).toBe(false);
  });

  it("★ starts again only what it stopped: a video the page paused itself stays paused", async () => {
    const { container } = render(
      <Option>
        <video muted />
      </Option>,
    );
    await act(async () => {});
    // Never played (a reduced-motion setting, a scene's own control): not the bridge's to start.
    await mark(container, false);
    expect(video().paused).toBe(true);
    expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
  });

  it("★ stops a video that starts while its option is hidden (an autoplay finishing its load)", async () => {
    render(
      <Option>
        <video autoPlay muted loop />
      </Option>,
    );
    await act(async () => {});
    expect(video().paused).toBe(true);
    await act(async () => {
      void video().play();
    });
    expect(video().paused).toBe(true);
  });

  it("★ holds the next document a frame loads: a navigation is a new page", async () => {
    const { container } = render(
      <Option src="/design/sandbox/example/scene" />,
    );
    await act(async () => {});
    const first = committed;
    expect(first.documentElement.hasAttribute(FRAME_PAUSED)).toBe(true);

    // The frame loads another document: the old one is let go and the new one held.
    committed = document.implementation.createHTMLDocument("next");
    Object.defineProperty(committed, "URL", { value: "about:srcdoc" });
    await act(async () => {
      fireEvent.load(container.querySelector("iframe")!);
    });
    expect(first.documentElement.hasAttribute(FRAME_PAUSED)).toBe(false);
    expect(marked()).toBe(true);
    expect(rules()).toHaveLength(1);
  });

  it("holds a new document that arrives before the frame's load is heard, whatever mark wakes it", async () => {
    const { container } = render(
      <Option src="/design/sandbox/example/scene" />,
    );
    await act(async () => {});
    const first = committed;
    committed = document.implementation.createHTMLDocument("next");
    Object.defineProperty(committed, "URL", { value: "about:srcdoc" });
    // The view's mark changes (still paused) while the iframe already holds another document, with no load yet.
    await act(async () => {
      container
        .querySelector("[data-lab-view]")!
        .setAttribute("data-paused", "again");
    });
    expect(first.documentElement.hasAttribute(FRAME_PAUSED)).toBe(false);
    expect(marked()).toBe(true);
    expect(rules()).toHaveLength(1);
  });

  it("leaves a frame that stands in no view alone", async () => {
    render(
      <Frame id="f" w={400} h={300} title="Frame">
        <p>the scene</p>
      </Frame>,
    );
    await act(async () => {});
    expect(marked()).toBe(false);
    expect(rules()).toHaveLength(0);
  });

  it("leaves a view that is not paused alone", async () => {
    render(<Option paused={false} />);
    await act(async () => {});
    expect(marked()).toBe(false);
    expect(rules()).toHaveLength(0);
  });

  it("lets go of the document when the frame leaves", async () => {
    const { unmount } = render(<Option />);
    await act(async () => {});
    expect(marked()).toBe(true);
    unmount();
    expect(marked()).toBe(false);
  });
});
