import type { ReactNode } from "react";

import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  POPUP_KINDS,
  shapeFor,
  type PopupKind,
} from "@/components/ui/popup-kinds";

import { setViewportWidth } from "../../../../../../../vitest.setup";
import {
  ArrivalGuardDemo,
  KEYBOARD_KINDS,
  PopupKindDemo,
  PopupSizeSample,
} from "./popup-demos";

/**
 * THE POPUP SPECIMENS SAY WHAT THE TABLE SAYS (`popup-demos.tsx`): every kind stands where its row puts it at a desk and in
 * a hand, the kinds with a field are the ones offered a keyboard, and the arrival guard is played with a finger's events.
 *
 * The frame is the lab's (its own test's); the popups stand inline in the document, where a media query answers for the
 * mocked window (a laptop's, then a phone's). What is pinned is that the Library draws each row of the one table and nothing
 * else: a row moved in `popup-kinds.ts` moves the shape the specimen draws, a kind added without a specimen fails, and the
 * keyboard switch stays on the kinds that hold a field.
 */

/**
 * Which screen's frame draws, in a test that looks at one: the real frames are documents of their own, so a menu in one never
 * hears a focus move in the other, and two popovers in the one jsdom document would dismiss each other.
 */
let screenDrawn: "desk" | "hand" | null = null;
vi.mock("@/components/lab", () => ({
  Frame: (props: { id: string; children: ReactNode }) =>
    screenDrawn && !props.id.endsWith(`-${screenDrawn}`) ? null : (
      <figure data-testid={props.id}>{props.children}</figure>
    ),
  Measured: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
// The code is a picture here; which link it encodes is not what this pins.
vi.mock("@/components/app/styled-qr", () => ({
  StyledQr: () => <div data-testid="styled-qr" />,
}));
// The plans' sheet is the pricing specimen's own, over inert doors (pricing-demos.test.tsx).
vi.mock("../compositions/pricing-demos", () => ({
  PricingSheetScene: () => <div data-popup="plan-scene" />,
}));
// The look's two links and its follow are not drawn; the folder under it is the real one.
vi.mock("@/components/social/follow-button", () => ({
  FollowButton: () => null,
}));
// The card's own Follow runs the one relation contract (`useRelation`), whose module reaches the profile's server
// actions (server-only): stood in, as the guest list's test stands them in (guests-room r1, `card=standing`).
vi.mock("@/app/(guest)/u/[slug]/actions", () => ({
  followProfileAction: vi.fn(),
  unfollowProfileAction: vi.fn(),
}));

const KINDS = Object.keys(POPUP_KINDS) as PopupKind[];

beforeEach(() => {
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
  vi.unstubAllGlobals();
  vi.useRealTimers();
  setViewportWidth(1024);
  screenDrawn = null;
  document.body.inert = false;
});

/** A kind at one screen: the frame of that screen is the one drawn, at that screen's width. */
function draw(kind: PopupKind, at: "desk" | "hand") {
  screenDrawn = at;
  setViewportWidth(at === "desk" ? 1280 : 375);
  return render(<PopupKindDemo kind={kind} />);
}

/** The shapes the popups standing in the document wear, whichever primitive drew them. */
function shapes(): string[] {
  const layers = document.querySelectorAll<HTMLElement>(
    "[data-slot=popup-content], [data-slot=guest-peek][data-shape], [data-slot=code-card]",
  );
  return [...layers].map((el) => el.getAttribute("data-shape") ?? "");
}

describe("every kind of the one table is drawn where its row puts it", () => {
  const OWN: PopupKind[] = ["choice", "plan", "peek"];
  const DIALOG_KINDS = KINDS.filter((kind) => !OWN.includes(kind));

  it.each(DIALOG_KINDS)(
    "★ %s: its desk shape at a laptop's width and its hand shape at a phone's",
    (kind) => {
      const desk = draw(kind, "desk");
      expect(new Set(shapes())).toEqual(new Set([shapeFor(kind, true)]));
      desk.unmount();
      draw(kind, "hand");
      expect(new Set(shapes())).toEqual(new Set([shapeFor(kind, false)]));
    },
  );

  it("★ the choice is the real responsive menu: a menu at a desk, its rows at the thumb", () => {
    const desk = draw("choice", "desk");
    expect(document.querySelector("[data-slot=responsive-menu]")).toBeTruthy();
    expect(
      document.querySelector("[data-slot=responsive-menu-rows]"),
    ).toBeNull();
    desk.unmount();
    draw("choice", "hand");
    expect(
      document.querySelector("[data-slot=responsive-menu-rows]"),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("★ the plan is the plans' sheet over its own specimen's scene, in a frame per screen", () => {
    render(<PopupKindDemo kind="plan" />);
    expect(document.querySelectorAll("[data-popup=plan-scene]")).toHaveLength(
      2,
    );
    expect(screen.getByTestId("popup-plan-desk")).toBeInTheDocument();
    expect(screen.getByTestId("popup-plan-hand")).toBeInTheDocument();
  });

  it("★ the peek opens as a press does, a card beside the name at a desk and the sheet in a hand", async () => {
    vi.useFakeTimers();
    const desk = draw("peek", "desk");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });
    expect(document.querySelector("[data-slot=guest-peek]")).toBeTruthy();
    expect(shapes().filter(Boolean)).toEqual([]);
    desk.unmount();
    draw("peek", "hand");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });
    expect(new Set(shapes())).toEqual(new Set(["sheet"]));
  });
});

describe("the keyboard goes with the field", () => {
  it.each(KINDS)(
    "★ %s offers the keyboard exactly when it holds a text field",
    (kind) => {
      render(<PopupKindDemo kind={kind} />);
      const field = document.querySelector(
        "input:not([type=checkbox]), textarea",
      );
      // The switch is Radix's `role=switch`, as the keyboard's own is; a settings switch is a switch too, so read the label.
      const keyboard = screen.queryByText(/keyboard up, in the hand/i);
      expect(Boolean(keyboard)).toBe(KEYBOARD_KINDS.includes(kind));
      if (KEYBOARD_KINDS.includes(kind)) expect(field).toBeTruthy();
      // A kind with no field is never offered one: nothing on its popup takes typing (the look's and the code's included).
      if (!KEYBOARD_KINDS.includes(kind)) expect(field).toBeNull();
    },
  );
});

describe("a tap that lands while the layer arrives", () => {
  /**
   * jsdom runs no CSS animation, so the arrival is the entrance's clock made by hand: a running animation on the layer
   * for the 300 ms after it stands, which is what `PopupContent`'s guard reads (`getAnimations`).
   */
  let until = 0;
  let watch: MutationObserver;
  const original = (HTMLElement.prototype as { getAnimations?: unknown })
    .getAnimations;

  beforeEach(() => {
    until = 0;
    (
      HTMLElement.prototype as unknown as { getAnimations: () => unknown[] }
    ).getAnimations = function (this: HTMLElement) {
      return this.hasAttribute("data-arrival-layer") && Date.now() < until
        ? [
            {
              animationName: "enter",
              playState: "running",
              effect: { getComputedTiming: () => ({ iterations: 1 }) },
            },
          ]
        : [];
    };
    watch = new MutationObserver(() => {
      if (until === 0 && document.querySelector("[data-arrival-layer]"))
        until = Date.now() + 300;
    });
    watch.observe(document.body, { childList: true, subtree: true });
  });
  afterEach(() => {
    watch.disconnect();
    (HTMLElement.prototype as { getAnimations?: unknown }).getAnimations =
      original;
  });

  // The open popup hides what stands outside it from the accessibility tree, the status line included.
  const status = () => screen.getByRole("status", { hidden: true });
  const count = () =>
    document.querySelector("[data-arrival-count]")?.textContent;

  it("★ is swallowed 60 ms after the layer stands: Delete hears nothing", async () => {
    render(<ArrivalGuardDemo />);
    await userEvent.click(
      screen.getByRole("button", { name: /tap delete 60 ms later/i }),
    );
    await waitFor(() => expect(status()).toHaveTextContent(/still arriving/i), {
      timeout: 2000,
    });
    expect(count()).toBe("0");
  });

  it("★ is heard 700 ms after: the layer has settled, and Delete hears the tap once", async () => {
    render(<ArrivalGuardDemo />);
    await userEvent.click(
      screen.getByRole("button", { name: /tap delete 700 ms later/i }),
    );
    await waitFor(() => expect(status()).toHaveTextContent(/had settled/i), {
      timeout: 3000,
    });
    expect(count()).toBe("1");
  });

  it("plays again afresh: closed and pressed again, the layer arrives anew and the early tap is swallowed again", async () => {
    render(<ArrivalGuardDemo />);
    const early = () =>
      screen.getByRole("button", { name: /tap delete 60 ms later/i });
    await userEvent.click(early());
    await waitFor(() => expect(status()).toHaveTextContent(/still arriving/i), {
      timeout: 2000,
    });
    // The layer covers the page while it is up: it goes out (Escape), and the arrival clock starts again with the next.
    await userEvent.keyboard("{Escape}");
    await waitFor(() =>
      expect(document.querySelector("[data-arrival-layer]")).toBeNull(),
    );
    until = 0;
    await userEvent.click(early());
    await waitFor(() => expect(status()).toHaveTextContent(/still arriving/i), {
      timeout: 3000,
    });
    expect(count()).toBe("0");
  });
});

describe("a popup's size, opened in the page", () => {
  it.each(["sm", "md", "lg"] as const)(
    "%s opens a confirmation of that size",
    async (size) => {
      render(<PopupSizeSample size={size} />);
      await userEvent.click(
        screen.getByRole("button", { name: `Open ${size}` }),
      );
      expect(await screen.findByRole("alertdialog")).toHaveAttribute(
        "data-size",
        size,
      );
    },
  );
});
