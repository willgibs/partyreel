/**
 * THE ONE RESPONSIVE SHEET, UNDER A KEYBOARD (door-flow).
 *
 * jsdom has no visual viewport, so a fake one stands in: an iPhone SE's 667px layout viewport
 * whose visual viewport shrinks to 360px when the keyboard rises. What is pinned is the mechanism
 * the posture reads, never a look: the two variables and the attribute the sheet writes on itself,
 * only while a text field inside it holds focus and only at the phone half, and where focus lands
 * when a phone sheet opens. The inset arithmetic has its own pure pins
 * (`src/lib/use-keyboard-inset.test.ts`).
 */
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { setViewportWidth } from "../../../vitest.setup";

type FakeViewport = EventTarget & { height: number; offsetTop: number; width: number };
let vv: FakeViewport;

beforeEach(() => {
  vv = Object.assign(new EventTarget(), { height: 667, offsetTop: 0, width: 375 });
  Object.defineProperty(window, "visualViewport", { value: vv, configurable: true });
  Object.defineProperty(window, "innerHeight", { value: 667, configurable: true });
});

afterEach(async () => {
  cleanup();
  // Radix restores focus on unmount from a setTimeout(0); let it run inside the test's document.
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  setViewportWidth(1024);
});

/** Let the hook's one-per-frame update run. */
async function frame() {
  await act(async () => {
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
  });
}

function mount(props: Partial<React.ComponentProps<typeof SheetContent>> = {}) {
  render(
    <Sheet open>
      <SheetContent responsive {...props}>
        <SheetTitle>Report this event</SheetTitle>
        <textarea aria-label="Reason" />
        <button type="button">Submit report</button>
      </SheetContent>
    </Sheet>,
  );
  return document.querySelector<HTMLElement>('[data-slot="sheet-content"]')!;
}

describe("the phone half stands on the keyboard", () => {
  it("does NOTHING while no field is focused: every phone sheet stays exactly as it was", async () => {
    setViewportWidth(375);
    const panel = mount();
    await frame();
    vv.height = 360; // even a shrunken viewport (a pinch-zoom) moves nothing
    vv.dispatchEvent(new Event("resize"));
    await frame();
    expect(panel.style.getPropertyValue("--kb-inset")).toBe("");
    expect(panel.style.getPropertyValue("--vv-h")).toBe("");
    expect(panel.hasAttribute("data-keyboard")).toBe(false);
  });

  it("lifts by exactly what the keyboard hides once a field inside holds focus", async () => {
    setViewportWidth(375);
    const panel = mount();
    await frame();
    act(() => screen.getByLabelText("Reason").focus());
    vv.height = 360;
    vv.dispatchEvent(new Event("resize"));
    await frame();
    expect(panel.style.getPropertyValue("--kb-inset")).toBe("307px");
    expect(panel.style.getPropertyValue("--vv-h")).toBe("360px");
    expect(panel.getAttribute("data-keyboard")).toBe("open");
  });

  it("follows iOS's own pan rather than stacking on it", async () => {
    setViewportWidth(375);
    const panel = mount();
    act(() => screen.getByLabelText("Reason").focus());
    vv.height = 360;
    vv.dispatchEvent(new Event("resize"));
    await frame();
    vv.offsetTop = 120;
    vv.dispatchEvent(new Event("scroll"));
    await frame();
    expect(panel.style.getPropertyValue("--kb-inset")).toBe("187px");
  });

  it("returns to rest the moment the field lets go of focus", async () => {
    setViewportWidth(375);
    const panel = mount();
    const field = screen.getByLabelText("Reason");
    act(() => field.focus());
    vv.height = 360;
    vv.dispatchEvent(new Event("resize"));
    await frame();
    expect(panel.getAttribute("data-keyboard")).toBe("open");
    act(() => field.blur());
    // iOS 26 can leave a stale pan behind after the keyboard closes: it must not matter.
    vv.height = 667;
    vv.offsetTop = 180;
    await frame();
    expect(panel.style.getPropertyValue("--kb-inset")).toBe("");
    expect(panel.style.getPropertyValue("--vv-h")).toBe("");
    expect(panel.hasAttribute("data-keyboard")).toBe(false);
  });

  it("a button taking focus is not typing: nothing is lifted", async () => {
    setViewportWidth(375);
    const panel = mount();
    act(() => screen.getByRole("button", { name: "Submit report" }).focus());
    vv.height = 360;
    vv.dispatchEvent(new Event("resize"));
    await frame();
    expect(panel.hasAttribute("data-keyboard")).toBe(false);
  });

  it("writes nothing on a laptop's desk half (a fine pointer: no software keyboard)", async () => {
    setViewportWidth(1024);
    const panel = mount();
    act(() => screen.getByLabelText("Reason").focus());
    vv.height = 360;
    vv.dispatchEvent(new Event("resize"));
    await frame();
    expect(panel.style.getPropertyValue("--kb-inset")).toBe("");
    expect(panel.hasAttribute("data-keyboard")).toBe(false);
  });

  it("a phone turned to landscape crosses the desk width and still stands on the keyboard", async () => {
    // 667 wide is past the desk breakpoint, and the pointer is a finger.
    setViewportWidth(667);
    Object.defineProperty(window, "innerHeight", { value: 375, configurable: true });
    const matchMedia = window.matchMedia;
    window.matchMedia = ((query: string) => {
      const real = matchMedia(query);
      return query.includes("pointer: coarse")
        ? { ...real, matches: true }
        : real;
    }) as typeof window.matchMedia;
    try {
      const panel = mount();
      act(() => screen.getByLabelText("Reason").focus());
      // iOS panned 120px down to reveal the field; 131px stay visible above the keyboard.
      vv.height = 131;
      vv.offsetTop = 120;
      vv.dispatchEvent(new Event("resize"));
      await frame();
      expect(panel.style.getPropertyValue("--kb-inset")).toBe("124px");
      expect(panel.style.getPropertyValue("--vv-top")).toBe("120px");
      expect(panel.style.getPropertyValue("--vv-h")).toBe("131px");
      // 131px is too thin a band for a sticky foot over the field: the sheet reads `tight`.
      expect(panel.getAttribute("data-keyboard")).toBe("tight");
    } finally {
      window.matchMedia = matchMedia;
    }
  });

  it("never touches a fixed-side sheet (the marketing menu, the design shell)", async () => {
    setViewportWidth(375);
    render(
      <Sheet open>
        <SheetContent side="left">
          <SheetTitle>Menu</SheetTitle>
          <input aria-label="Search" />
        </SheetContent>
      </Sheet>,
    );
    const panel = document.querySelector<HTMLElement>('[data-slot="sheet-content"]')!;
    act(() => screen.getByLabelText("Search").focus());
    vv.height = 360;
    vv.dispatchEvent(new Event("resize"));
    await frame();
    expect(panel.hasAttribute("data-keyboard")).toBe(false);
  });
});

describe("where focus lands when a sheet opens", () => {
  it("a phone sheet focuses the panel, never its first field (no keyboard mid-slide)", () => {
    setViewportWidth(375);
    const panel = mount();
    expect(screen.getByLabelText("Reason")).not.toHaveFocus();
    expect(panel).toHaveFocus();
  });

  it("a desk keeps Radix's own choice, the first tabbable", () => {
    setViewportWidth(1024);
    mount();
    expect(screen.getByLabelText("Reason")).toHaveFocus();
  });

  it("a consumer that prevents it at the desk still gets focus inside the panel", () => {
    setViewportWidth(1024);
    const panel = mount({ onOpenAutoFocus: (e) => e.preventDefault() });
    expect(screen.getByLabelText("Reason")).not.toHaveFocus();
    expect(panel).toHaveFocus();
  });
});

describe("the scrim", () => {
  it("takes a sheet's own classes (the door's scrim is its own look)", () => {
    mount({ overlayClassName: "door-scrim" });
    expect(
      document.querySelector('[data-slot="sheet-overlay"]')?.className,
    ).toContain("door-scrim");
  });

  it("keeps Escape closing a free sheet, as before", () => {
    let open = true;
    const { rerender } = render(
      <Sheet open={open} onOpenChange={(o) => (open = o)}>
        <SheetContent responsive>
          <SheetTitle>Invite</SheetTitle>
        </SheetContent>
      </Sheet>,
    );
    fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" });
    rerender(<></>);
    expect(open).toBe(false);
  });
});
