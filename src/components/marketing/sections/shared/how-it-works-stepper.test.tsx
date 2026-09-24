import { readFileSync } from "node:fs";
import { join } from "node:path";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { HowItWorksStepper } from "./how-it-works-stepper";

import { LOOP_STEP_COUNT, loopSteps } from "@/lib/constants/how-it-works";

/**
 * The stepper carries its own <Reveal>, which observes itself into view;
 * jsdom has no IntersectionObserver, and the shared setup deliberately
 * polyfills only what its own pins need. A stub that reports the element
 * visible immediately is the honest stand-in: what is under test here is the
 * stepper, and in a browser this section is on screen when it is read.
 */
beforeAll(() => {
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(private cb: IntersectionObserverCallback) {}
      observe(target: Element) {
        this.cb(
          [{ isIntersecting: true, target } as IntersectionObserverEntry],
          this as unknown as IntersectionObserver,
        );
      }
      unobserve() {}
      disconnect() {}
    },
  );
});

/**
 * THE OVERVIEW STEPPER'S FUNCTION, never its look (a contract guards what the
 * component is FOR; Will retunes the rest without asking a test).
 *
 * Three things have to hold or the section stops being the thing Will ruled
 * ("a numbered stepper... where we can present the full flow within a regular
 * height section", 2026-09-19):
 *
 *  1. ONE step is on screen. If all six render, this is the walkthrough again
 *     and the whole point of the shape is gone. It is also the accessibility
 *     claim: a reader hears one step, and the numbers say which.
 *  2. The numbers are BUTTONS carrying `aria-pressed`, and pressing one swaps
 *     the step. They are not a tablist over six panels, because five of the
 *     panels do not exist.
 *  3. The step story is the SINGLE SOURCE's, not a copy. The whole reason this
 *     component exists beside /how-it-works is that neither can drift.
 *
 * The motion is pinned only as far as "reduced motion is honoured", and that
 * is a source pin on purpose: the entrance is `@starting-style`, which jsdom
 * does not implement, so a behavioural assertion here would pass on a
 * component that had quietly dropped the gate.
 */
const STEPS = loopSteps("host");

describe("the how-it-works overview stepper", () => {
  it("shows exactly one step, with the count beside it", () => {
    render(<HowItWorksStepper />);
    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent(
      STEPS[0].title,
    );
    expect(screen.getByText(STEPS[0].body)).toBeInTheDocument();
    for (const other of STEPS.slice(1)) {
      expect(screen.queryByText(other.body)).not.toBeInTheDocument();
    }
    expect(screen.getByText(`01 of ${LOOP_STEP_COUNT}`)).toBeInTheDocument();
  });

  it("gives every step a pressed-state button, and pressing one swaps the step", async () => {
    const user = userEvent.setup();
    render(<HowItWorksStepper />);

    const tabs = STEPS.map((step, i) =>
      screen.getByRole("button", { name: `Step ${i + 1}: ${step.title}` }),
    );
    expect(tabs).toHaveLength(LOOP_STEP_COUNT);
    expect(tabs[0]).toHaveAttribute("aria-pressed", "true");
    for (const tab of tabs.slice(1)) {
      expect(tab).toHaveAttribute("aria-pressed", "false");
    }

    await user.click(tabs[3]);
    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent(
      STEPS[3].title,
    );
    expect(screen.getByText(STEPS[3].body)).toBeInTheDocument();
    expect(screen.queryByText(STEPS[0].body)).not.toBeInTheDocument();
    expect(tabs[3]).toHaveAttribute("aria-pressed", "true");
    expect(tabs[0]).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText(`04 of ${LOOP_STEP_COUNT}`)).toBeInTheDocument();
  });

  it("tells the guest's story when asked for it, from the same single source", () => {
    render(<HowItWorksStepper perspective="guest" />);
    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent(
      loopSteps("guest")[0].title,
    );
    expect(screen.queryByText(STEPS[0].body)).not.toBeInTheDocument();
  });

  it("carries the door into the full walkthrough", () => {
    render(<HowItWorksStepper />);
    expect(
      screen.getByRole("link", { name: /The full walkthrough, both sides/ }),
    ).toHaveAttribute("href", "/how-it-works");
  });

  it("gates its entrance on the motion preference, and writes no story of its own", () => {
    const src = readFileSync(
      join(
        process.cwd(),
        "src/components/marketing/sections/shared/how-it-works-stepper.tsx",
      ),
      "utf8",
    );
    // Every starting style is behind motion-safe, so `prefers-reduced-motion:
    // reduce` has nothing to transition FROM and the step simply appears.
    const startingStyles = [...src.matchAll(/starting:/g)];
    expect(startingStyles.length).toBeGreaterThan(0);
    expect(src.match(/motion-safe:starting:/g)).toHaveLength(
      startingStyles.length,
    );
    // The steps come from the constant. A literal step title in here is the
    // drift this component exists to make impossible.
    expect(src).toContain("loopSteps");
    for (const step of STEPS) expect(src).not.toContain(step.title);
  });
});
