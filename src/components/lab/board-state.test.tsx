/**
 * THE BOARD'S DECLARED STATE IS THE URL, AND THE URL REACHES NEXT (crumbs-16).
 *
 * `useBoardState` writes a control's option to the address with `history.replaceState`, and the shell's
 * `useSearchParams` (`CopyLink`, the sticky links) reads Next's own copy of that address. Two things had
 * to be true of the write, and neither was checkable until the stand-in was Next's patch and not a
 * listener that fires on every call (`@/lib/test-utils/next-history`):
 *
 *   - it hands Next NOTHING to keep, never the entry's own state: that carries `__NA`, Next then
 *     applies no URL, and a `router.refresh()` writes its stale copy back over the bar (measured on the
 *     real lab: walk two steps, refresh, and the bar returned to the first);
 *   - it does so a microtask late, because a step LANDING on a board sets its controls from a mount
 *     effect, which runs before Next has patched `replaceState` (a child's effect runs before its
 *     parent's): the browser's own function would take the fresh state and empty the entry's `__NA` and
 *     tree, and Next would never hear the address (lab-tides saw the emptied entry, 2026-09-19, and
 *     kept the entry's own state, which is the first failure).
 *
 * The router inside the test tree installs its patch after what it holds has run its mount effects, as
 * Next's does, so the landing case here is the real order.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { useEffect } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  installNextHistory,
  NextRouterStandIn,
  type NextHistory,
} from "@/lib/test-utils/next-history";

import type { BoardSpec } from "./board-spec";
import { ControlKnobs, useBoardState } from "./board-state";

const SPEC = {
  controls: [
    {
      id: "register",
      label: "Register",
      options: [
        { id: "accent", label: "Accent" },
        { id: "identity", label: "Identity" },
      ],
      default: "accent",
    },
    {
      // A control that claims the gate's name is refused, never written.
      id: "key",
      label: "Key",
      options: [{ id: "stolen", label: "Stolen" }],
      default: "x",
    },
  ],
} as unknown as BoardSpec;

const LANDING = { register: "identity" };

function Board({ landOn }: { landOn?: Record<string, string> }) {
  const { state, setState } = useBoardState(SPEC);
  // A step landing: a mount effect, on the page's first commit.
  useEffect(() => {
    if (landOn) setState(landOn);
  }, [landOn, setState]);
  return (
    <div>
      <p data-testid="register">{state.register}</p>
      <button type="button" onClick={() => setState({ register: "identity" })}>
        identity
      </button>
      <button type="button" onClick={() => setState({ register: "accent" })}>
        accent
      </button>
      <button type="button" onClick={() => setState({ key: "stolen" })}>
        steal the key
      </button>
    </div>
  );
}

function board(landOn?: Record<string, string>) {
  return render(
    <NextRouterStandIn>
      <Board landOn={landOn} />
    </NextRouterStandIn>,
  );
}

let next: NextHistory;
beforeEach(() => {
  next = installNextHistory();
  next.land("/design/lab/light?key=k");
});
afterEach(() => {
  next.uninstall();
  window.history.replaceState(null, "", "/");
});

const barParam = (name: string) =>
  new URLSearchParams(window.location.search).get(name);
const routerParam = (name: string) =>
  new URLSearchParams(new URL(next.href, "http://x").search).get(name);
const settle = () => act(async () => {});

describe("the board's controls write the address", () => {
  it("★ a step's landing (a mount effect) reaches the bar AND Next, and leaves the entry Next needs", async () => {
    board(LANDING);
    await settle();
    expect(barParam("register")).toBe("identity");
    expect(routerParam("register")).toBe("identity");
    expect(barParam("key")).toBe("k");
    // Written before the patch, a fresh state would have emptied the entry Back needs.
    expect(window.history.state).toMatchObject({ __NA: true });
    expect(screen.getByTestId("register").textContent).toBe("identity");
  });

  it("★ a click writes the same way, and a control back at its default leaves the address", async () => {
    board();
    fireEvent.click(screen.getByRole("button", { name: "identity" }));
    await settle();
    expect(barParam("register")).toBe("identity");
    expect(routerParam("register")).toBe("identity");
    fireEvent.click(screen.getByRole("button", { name: "accent" }));
    await settle();
    expect(barParam("register")).toBeNull();
    expect(routerParam("register")).toBeNull();
    expect(screen.getByTestId("register").textContent).toBe("accent");
  });

  it("★ stays written through a router refresh: Next's copy heard it", async () => {
    board();
    fireEvent.click(screen.getByRole("button", { name: "identity" }));
    await settle();
    act(() => next.refresh());
    expect(barParam("register")).toBe("identity");
  });

  it("never touches a parameter it does not own: the gate key is refused even when a control claims it", async () => {
    board();
    fireEvent.click(screen.getByRole("button", { name: "steal the key" }));
    await settle();
    expect(barParam("key")).toBe("k");
  });
});

/**
 * A LONG CONTROL IS A SELECT (lab-sitting, from ROADMAP's line: "the dock draws every control as a pill row;
 * above about eight options a select gives the dock back a screen"). A pill row of nine options wraps to two
 * or three rows in the dock and scrolls a long way on the step's one quiet row; a select is one control's
 * width whatever it holds. Eight and under keep their pills, where every option is one press.
 */
describe("a control's knob", () => {
  const control = (id: string, n: number) => ({
    id,
    label: id === "long" ? "A long one" : "A short one",
    options: Array.from({ length: n }, (_, i) => ({
      id: `o${i + 1}`,
      label: `Option ${i + 1}`,
    })),
    default: "o1",
  });

  it("★ draws more than eight options as a select, and a pick through it sets the state", () => {
    const setState = vi.fn();
    render(
      <ControlKnobs
        controls={[control("long", 9), control("short", 8)]}
        state={{ long: "o3", short: "o2" }}
        setState={setState}
      />,
    );
    const select = screen.getByRole("combobox", { name: "A long one" });
    expect(select).toHaveValue("o3");
    expect(
      [...(select as HTMLSelectElement).options].map((o) => o.textContent),
    ).toEqual(Array.from({ length: 9 }, (_, i) => `Option ${i + 1}`));
    fireEvent.change(select, { target: { value: "o7" } });
    expect(setState).toHaveBeenCalledWith({ long: "o7" });
    // Eight is still a row of pills.
    expect(screen.getByRole("tablist", { name: "A short one" })).toBeTruthy();
    expect(screen.queryByRole("combobox", { name: "A short one" })).toBeNull();
  });

  it("draws the step's quiet row the same way", () => {
    render(
      <ControlKnobs
        controls={[control("long", 12)]}
        state={{}}
        setState={() => {}}
        quiet
      />,
    );
    expect(screen.getByRole("combobox", { name: "A long one" })).toHaveValue(
      "o1",
    );
  });
});
