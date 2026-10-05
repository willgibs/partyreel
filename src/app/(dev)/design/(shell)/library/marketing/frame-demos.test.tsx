import type { ReactNode } from "react";

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { LOOP_STEP_COUNT, loopSteps } from "@/lib/constants/how-it-works";

import { ContactReceiptDemo, HowItWorksStepperDemo } from "./marketing-demos";

/**
 * THE MARKETING SECTIONS THAT ANSWER TO THE SCREEN ARE DRAWN AT BOTH (`marketing-demos.tsx`): the how-it-works stepper in its
 * section, and the contact page's receipt on the page's card. The frame is the lab's (its own test's); what is pinned is
 * that each stands as the production piece it names, with one step at a time and the receipt reading back what was sent.
 */

vi.mock("@/components/lab", () => ({
  Frame: (props: { id: string; children: ReactNode }) => (
    <figure data-testid={props.id}>{props.children}</figure>
  ),
  Measured: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

beforeAll(() => {
  // The stepper's <Reveal> observes itself into view; the honest stand-in is a viewport that holds it already.
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
  document.body.inert = false;
});

describe("the how-it-works stepper, in its section, at both screens", () => {
  it("★ draws one step per frame, the walkthrough's own, with the rail's six numbers", () => {
    render(<HowItWorksStepperDemo />);
    const frames = [
      "how-it-works-stepper-host-desk",
      "how-it-works-stepper-host-hand",
    ];
    const steps = loopSteps("host");
    for (const id of frames) {
      const frame = within(screen.getByTestId(id));
      expect(frame.getAllByRole("button", { name: /^step \d/i })).toHaveLength(
        LOOP_STEP_COUNT,
      );
      // One step is in the page: the first, by the steps' own words, and none of the other five.
      expect(
        frame.getByRole("heading", { name: steps[0].title }),
      ).toBeInTheDocument();
      expect(frame.queryByText(steps[1].title)).toBeNull();
    }
  });

  it("★ a press on a number swaps the step in its own frame only", async () => {
    render(<HowItWorksStepperDemo />);
    const steps = loopSteps("host");
    const desk = within(screen.getByTestId("how-it-works-stepper-host-desk"));
    const hand = within(screen.getByTestId("how-it-works-stepper-host-hand"));
    await userEvent.click(
      desk.getByRole("button", { name: new RegExp(`^step 3`, "i") }),
    );
    expect(
      desk.getByRole("heading", { name: steps[2].title }),
    ).toBeInTheDocument();
    expect(
      hand.getByRole("heading", { name: steps[0].title }),
    ).toBeInTheDocument();
  });

  it("tells the guest's side with one prop: the same six numbers, other words", () => {
    render(<HowItWorksStepperDemo perspective="guest" />);
    const guest = loopSteps("guest");
    expect(
      within(screen.getByTestId("how-it-works-stepper-guest-desk")).getByRole(
        "heading",
        { name: guest[0].title },
      ),
    ).toBeInTheDocument();
  });
});

describe("the contact receipt, on the page's card, at both screens", () => {
  it("★ a first name and a subject: the greeting, the topic with its mark, the subject, the address", () => {
    render(<ContactReceiptDemo kind="named" />);
    for (const id of [
      "contact-receipt-named-desk",
      "contact-receipt-named-hand",
    ]) {
      const frame = within(screen.getByTestId(id));
      expect(
        frame.getByRole("heading", { name: /on its way, sam/i }),
      ).toBeInTheDocument();
      expect(frame.getByText("Plans & billing")).toBeInTheDocument();
      expect(
        frame.getByText("Storage for a 300-guest wedding"),
      ).toBeInTheDocument();
      expect(frame.getByText("sam@example.com")).toBeInTheDocument();
    }
  });

  it("★ a title and no subject: the plain line, and the message's own opening in the subject's place", () => {
    render(<ContactReceiptDemo kind="plain" />);
    const frame = within(screen.getByTestId("contact-receipt-plain-desk"));
    const heading = frame.getByRole("heading", { name: /on its way/i });
    // "Dr." is no first name: nothing is greeted.
    expect(heading).not.toHaveTextContent(/dr/i);
    expect(
      frame.getByText(/^My daughter is in three of the photographs/),
    ).toBeInTheDocument();
  });

  it("★ the stamp is postmarked on the card, and Send another plays the receipt's arrival again", async () => {
    render(<ContactReceiptDemo kind="named" />);
    const frame = within(screen.getByTestId("contact-receipt-named-desk"));
    expect(frame.getAllByText("OCT").length).toBeGreaterThan(0);
    await userEvent.click(frame.getByRole("button", { name: /send another/i }));
    // The receipt is back (a fresh mount), not gone: the specimen has no form to return to.
    expect(
      frame.getByRole("heading", { name: /on its way, sam/i }),
    ).toBeInTheDocument();
  });
});
