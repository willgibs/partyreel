/**
 * Behavior pins for the reveal ACT MACHINE (R3). The composite reveal's timing is
 * RATIFIED, and every beat of it is a `data-act` string this hook emits at a
 * scripted moment — so these pins are the tripwire for the choreography itself:
 * order, hold arithmetic, the reduced-motion substitution, and timer hygiene
 * (a stray timer after reset/unmount would fire a beat into a stage that has
 * already left, which is exactly the class of bug that is invisible in review).
 *
 * Fake timers throughout: real waits would make these flaky AND slow.
 */
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { setReducedMotion } from "../../../vitest.setup";
import { type ActScript, useRevealActs } from "./use-reveal-acts";

type TestAct = "one" | "two" | "three";

const SCRIPT: ActScript<TestAct> = [
  { act: "one", holdMs: 100 },
  { act: "two", holdMs: 250 },
  { act: "three", holdMs: 0 },
];

const REDUCED: ActScript<TestAct> = [
  { act: "two", holdMs: 60 },
  { act: "three", holdMs: 0 },
];

/** A probe that renders the current act and exposes the controls imperatively. */
function makeProbe(
  script: ActScript<TestAct> | (() => ActScript<TestAct>),
  reducedScript?: ActScript<TestAct>,
) {
  const api: {
    run?: () => void;
    reset?: () => void;
    replay?: () => void;
    running?: boolean;
  } = {};
  function Probe() {
    const acts = useRevealActs(script, reducedScript);
    api.run = acts.run;
    api.reset = acts.reset;
    api.replay = acts.replay;
    api.running = acts.running;
    return <div data-testid="act">{acts.act}</div>;
  }
  return { api, Probe };
}

function advance(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

describe("useRevealActs", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("rests at idle until run(), then walks the script in order on its holds", () => {
    const { api, Probe } = makeProbe(SCRIPT);
    const { getByTestId } = render(<Probe />);
    expect(getByTestId("act")).toHaveTextContent("idle");
    expect(api.running).toBe(false);

    act(() => api.run!());
    // The FIRST act lands synchronously (it must: the CSS state has to change in
    // the same commit as the FLIP measure or the flight has no start pose).
    expect(getByTestId("act")).toHaveTextContent("one");

    advance(99);
    expect(getByTestId("act")).toHaveTextContent("one");
    advance(1);
    expect(getByTestId("act")).toHaveTextContent("two");

    advance(249);
    expect(getByTestId("act")).toHaveTextContent("two");
    advance(1);
    expect(getByTestId("act")).toHaveTextContent("three");
  });

  it("holds the FINAL act indefinitely (a settled stage never self-clears)", () => {
    const { api, Probe } = makeProbe(SCRIPT);
    const { getByTestId } = render(<Probe />);
    act(() => api.run!());
    advance(100 + 250);
    expect(getByTestId("act")).toHaveTextContent("three");
    advance(60_000);
    expect(getByTestId("act")).toHaveTextContent("three");
  });

  it("resolves a FACTORY script fresh on every run (so a retune takes effect)", () => {
    let hold = 100;
    const factory = (): ActScript<TestAct> => [
      { act: "one", holdMs: hold },
      { act: "two", holdMs: 0 },
    ];
    const { api, Probe } = makeProbe(factory);
    const { getByTestId } = render(<Probe />);

    act(() => api.run!());
    advance(100);
    expect(getByTestId("act")).toHaveTextContent("two");

    // Retune, then re-run: the NEW hold must drive the next play.
    hold = 400;
    act(() => api.reset!());
    act(() => api.run!());
    advance(100);
    expect(getByTestId("act")).toHaveTextContent("one");
    advance(300);
    expect(getByTestId("act")).toHaveTextContent("two");
  });

  it("reduced motion PLAYS a supplied reducedScript (narrative kept, movement dropped)", () => {
    setReducedMotion(true);
    const { api, Probe } = makeProbe(SCRIPT, REDUCED);
    const { getByTestId } = render(<Probe />);

    act(() => api.run!());
    expect(getByTestId("act")).toHaveTextContent("two");
    advance(60);
    expect(getByTestId("act")).toHaveTextContent("three");
  });

  it("reduced motion with NO reducedScript jumps straight to the final act", () => {
    setReducedMotion(true);
    const { api, Probe } = makeProbe(SCRIPT);
    const { getByTestId } = render(<Probe />);

    act(() => api.run!());
    expect(getByTestId("act")).toHaveTextContent("three");
    // Nothing was scheduled: the jump is the whole playback.
    expect(vi.getTimerCount()).toBe(0);
  });

  it("reset() returns to idle AND drops the pending beats", () => {
    const { api, Probe } = makeProbe(SCRIPT);
    const { getByTestId } = render(<Probe />);

    act(() => api.run!());
    expect(vi.getTimerCount()).toBeGreaterThan(0);
    act(() => api.reset!());
    expect(getByTestId("act")).toHaveTextContent("idle");
    expect(vi.getTimerCount()).toBe(0);

    // The dropped beats must not resurrect the stage later.
    advance(10_000);
    expect(getByTestId("act")).toHaveTextContent("idle");
  });

  it("a second run() cancels the first script's remaining beats", () => {
    const { api, Probe } = makeProbe(SCRIPT);
    const { getByTestId } = render(<Probe />);

    act(() => api.run!());
    advance(50); // mid-"one"
    act(() => api.run!()); // restart
    expect(getByTestId("act")).toHaveTextContent("one");
    // Had the first run's timers survived, this 50ms would land "two" early.
    advance(50);
    expect(getByTestId("act")).toHaveTextContent("one");
    advance(50);
    expect(getByTestId("act")).toHaveTextContent("two");
  });

  it("replay() rests at idle for a breather, then plays again", () => {
    const { api, Probe } = makeProbe(SCRIPT);
    const { getByTestId } = render(<Probe />);

    act(() => api.run!());
    advance(100);
    expect(getByTestId("act")).toHaveTextContent("two");

    act(() => api.replay!());
    expect(getByTestId("act")).toHaveTextContent("idle");
    advance(699);
    expect(getByTestId("act")).toHaveTextContent("idle");
    advance(1);
    expect(getByTestId("act")).toHaveTextContent("one");
  });

  it("unmount clears every pending timer (no setState after teardown)", () => {
    const { api, Probe } = makeProbe(SCRIPT);
    const { unmount } = render(<Probe />);

    act(() => api.run!());
    expect(vi.getTimerCount()).toBeGreaterThan(0);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
