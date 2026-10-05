import { useEffect, type ReactNode } from "react";

import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  DEVICES,
  DevicePair,
  FitToWell,
  KEYBOARD_PX,
  KeyboardStandIn,
  QuietArrival,
  readLayer,
} from "./device-frames";

/**
 * THE LIBRARY'S REAL VIEWPORTS (`device-frames.tsx`): what a specimen that answers to the screen is drawn in, and the three
 * things each frame does for it that nothing else would.
 *
 * The frame itself is the lab's and a jsdom has no viewport to give it (`Frame` is the lab kit's own test's), so the scene
 * stands inline where the frame would put it, and `Measured` runs its probe once. What is pinned is this file's own
 * contract: a scene never takes the Library's focus as it arrives (the body stands inert for the arrival, then lets go), a
 * keyboard is written the way the hook writes one and held against the hook's own clearing, the laptop is zoomed down to
 * the well and never up, a pair draws both screens (one when it is asked for one), and a caption is read off what is in the
 * frame.
 */

const frames = vi.hoisted(() => vi.fn());
vi.mock("@/components/lab", () => ({
  Frame: (props: {
    id: string;
    w: number;
    h: number;
    title: string;
    caption?: ReactNode;
    children: ReactNode;
  }) => {
    frames(props);
    return (
      <figure data-testid={props.id} data-w={props.w} data-h={props.h}>
        <figcaption data-testid={`${props.id}-caption`}>
          {props.caption}
        </figcaption>
        {props.children}
      </figure>
    );
  },
  Measured: ({
    probe,
    onMeasure,
    children,
  }: {
    probe: (root: HTMLElement, win: Window) => string | null;
    onMeasure: (line: string) => void;
    children: ReactNode;
  }) => {
    useEffect(() => {
      const said = probe(document.body, window);
      if (said) onMeasure(said);
    }, [probe, onMeasure]);
    return <div>{children}</div>;
  },
}));

/** The setup's own box (800 by 600 for everything): put back after a test that measured a well of its own. */
const baseRect = Element.prototype.getBoundingClientRect;

beforeEach(() => {
  frames.mockClear();
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});
afterEach(() => {
  Element.prototype.getBoundingClientRect = baseRect;
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
  document.body.inert = false;
  document.body.innerHTML = "";
});

describe("a scene arrives quietly", () => {
  it("★ stands the body inert for the arrival, so nothing it opens can take the page's focus, then lets go", () => {
    vi.useFakeTimers();
    render(<QuietArrival ms={700} />);
    expect(document.body.inert).toBe(true);
    act(() => {
      vi.advanceTimersByTime(699);
    });
    expect(document.body.inert).toBe(true);
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(document.body.inert).toBe(false);
  });

  it("lets go at once when the scene goes (a Replay), never leaving a frame dead", () => {
    vi.useFakeTimers();
    const { unmount } = render(<QuietArrival />);
    expect(document.body.inert).toBe(true);
    unmount();
    expect(document.body.inert).toBe(false);
  });
});

describe("the keyboard stand-in", () => {
  function layer() {
    const el = document.createElement("div");
    el.setAttribute("data-slot", "popup-content");
    document.body.appendChild(el);
    return el;
  }

  it("★ writes what useKeyboardInset writes on a popup standing in the frame, and draws the keys", () => {
    const popup = layer();
    const { container } = render(<KeyboardStandIn up />);
    expect(popup.style.getPropertyValue("--kb-inset")).toBe(`${KEYBOARD_PX}px`);
    expect(popup.style.getPropertyValue("--vv-top")).toBe("0px");
    expect(popup.style.getPropertyValue("--vv-h")).toBe(
      `${window.innerHeight - KEYBOARD_PX}px`,
    );
    expect(popup.getAttribute("data-keyboard")).toBe("open");
    expect(
      container.querySelector("[data-keyboard-stand-in]"),
    ).toBeInTheDocument();
  });

  it("★ holds them against the hook's own clearing (it clears whenever no field of the lab's window holds focus)", async () => {
    const popup = layer();
    render(<KeyboardStandIn up />);
    popup.style.removeProperty("--kb-inset");
    popup.removeAttribute("data-keyboard");
    // The observer runs as a microtask after the mutation.
    await act(async () => {
      await Promise.resolve();
    });
    expect(popup.style.getPropertyValue("--kb-inset")).toBe(`${KEYBOARD_PX}px`);
    expect(popup.getAttribute("data-keyboard")).toBe("open");
  });

  it("stands on a popup that mounts after it (Radix draws its content a commit late)", async () => {
    render(<KeyboardStandIn up />);
    const late = layer();
    await act(async () => {
      await Promise.resolve();
    });
    expect(late.getAttribute("data-keyboard")).toBe("open");
  });

  it("takes everything back when the keyboard goes down, and draws nothing while it is down", () => {
    const popup = layer();
    const { container, rerender } = render(<KeyboardStandIn up />);
    rerender(<KeyboardStandIn up={false} />);
    expect(popup.style.getPropertyValue("--kb-inset")).toBe("");
    expect(popup.style.getPropertyValue("--vv-h")).toBe("");
    expect(popup.hasAttribute("data-keyboard")).toBe(false);
    expect(container.querySelector("[data-keyboard-stand-in]")).toBeNull();
  });
});

describe("the laptop is zoomed to the well, never past its own size", () => {
  /** Every box measures `width` wide inside the marked well, and as the setup's own 800 anywhere else. */
  function well(width: number) {
    Element.prototype.getBoundingClientRect = vi.fn(function (this: Element) {
      return this.parentElement?.hasAttribute("data-well")
        ? ({ width, height: 100 } as DOMRect)
        : baseRect.call(this);
    });
  }

  it("zooms a 1440 frame down to a 720 well by half", () => {
    well(720);
    const { container } = render(
      <div data-well="">
        <FitToWell w={1440}>
          <span>frame</span>
        </FitToWell>
      </div>,
    );
    const inner = container.querySelector<HTMLElement>("[style*='zoom']");
    expect(inner?.style.zoom).toBe("0.5");
    expect(inner?.style.width).toBe("1440px");
  });

  it("leaves a phone whole in a well wider than it", () => {
    well(900);
    const { container } = render(
      <div data-well="">
        <FitToWell w={375}>
          <span>frame</span>
        </FitToWell>
      </div>,
    );
    expect(
      container.querySelector<HTMLElement>("[style*='width']")?.style.zoom,
    ).toBe("1");
  });
});

describe("a pair draws a scene at both screens", () => {
  it("★ a frame per screen at the screen's own size, named by the pair", () => {
    render(<DevicePair id="pair" scene={({ device }) => <p>{device}</p>} />);
    const desk = screen.getByTestId("pair-desk");
    const hand = screen.getByTestId("pair-hand");
    expect([desk.dataset.w, desk.dataset.h]).toEqual(["1440", "900"]);
    expect([hand.dataset.w, hand.dataset.h]).toEqual(["375", "812"]);
    expect(DEVICES.desk).toEqual({ w: 1440, h: 900 });
    // Each frame carries the quiet arrival: the body is inert from its first commit.
    expect(document.body.inert).toBe(true);
  });

  it("draws one screen when asked for one, at the height it is given", () => {
    render(
      <DevicePair
        id="band"
        only="desk"
        heights={{ desk: 480 }}
        scene={() => <p>band</p>}
      />,
    );
    expect(screen.queryByTestId("band-hand")).toBeNull();
    expect(screen.getByTestId("band-desk").dataset.h).toBe("480");
  });

  it("★ Replay draws the scene again, afresh, in both frames", async () => {
    let mounts = 0;
    function Counted() {
      useEffect(() => {
        mounts += 1;
      }, []);
      return <p>scene</p>;
    }
    render(<DevicePair id="again" scene={() => <Counted />} />);
    expect(mounts).toBe(2);
    await userEvent.click(screen.getByRole("button", { name: /replay/i }));
    expect(mounts).toBe(4);
  });

  it("★ the keyboard switch is the phone's alone, and only for a scene with a field", async () => {
    const seen: string[] = [];
    const { rerender } = render(
      <DevicePair
        id="field"
        keyboard
        scene={({ device, keyboard }) => {
          seen.push(`${device}:${keyboard}`);
          return <p>{device}</p>;
        }}
      />,
    );
    await userEvent.click(screen.getByRole("switch"));
    expect(seen.slice(-2).sort()).toEqual(["desk:false", "hand:true"]);
    rerender(<DevicePair id="field" scene={() => <p>none</p>} />);
    expect(screen.queryByRole("switch")).toBeNull();
  });

  it("★ a caption is read off what stands in the frame, and the pair's own words stand until it answers", () => {
    render(
      <DevicePair
        id="read"
        read={() => "read off the frame"}
        captions={{ desk: "waiting" }}
        scene={() => <p>x</p>}
      />,
    );
    expect(screen.getByTestId("read-desk-caption")).toHaveTextContent(
      "read off the frame",
    );
  });
});

describe("the caption a popup's frame reads", () => {
  function stand(attrs: Record<string, string>, width = 448, height = 292) {
    const el = document.createElement("div");
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    vi.spyOn(el, "getBoundingClientRect").mockReturnValue({
      width,
      height,
    } as DOMRect);
    document.body.appendChild(el);
    return el;
  }
  const read = () => readLayer(document.body, window);

  it("says the kind, the shape and the room a popup takes", () => {
    stand({
      "data-slot": "popup-content",
      "data-kind": "confirm",
      "data-shape": "dialog",
    });
    expect(read()).toBe("confirm → dialog, 448 × 292");
  });

  it("★ names the two menus by what they are, not by the edge Radix opened one on", () => {
    stand({ "data-slot": "responsive-menu", "data-side": "bottom" }, 288, 142);
    expect(read()).toBe("menu, 288 × 142");
    document.body.innerHTML = "";
    stand(
      { "data-slot": "responsive-menu-rows", "data-side": "bottom" },
      359,
      270,
    );
    expect(read()).toBe("rows, 359 × 270");
  });

  it("calls a dialog that wears no shape the takeover, and the look at a desk anchored", () => {
    stand({ "data-slot": "dialog-content" }, 1440, 899);
    expect(read()).toBe("takeover, 1440 × 899");
    document.body.innerHTML = "";
    stand({ "data-slot": "guest-peek" }, 320, 124);
    expect(read()).toBe("anchored, 320 × 124");
  });

  it("answers nothing until a layer stands and has a box", () => {
    expect(read()).toBeNull();
    stand({ "data-slot": "popup-content", "data-shape": "sheet" }, 0, 0);
    expect(read()).toBeNull();
  });
});
