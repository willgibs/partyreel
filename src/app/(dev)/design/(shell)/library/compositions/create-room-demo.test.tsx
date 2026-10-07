import type { ReactNode } from "react";

import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  CREATE_MS,
  CREATE_SCREENS,
  CreateRoomDemo,
  standInCreate,
} from "./create-room-demo";

/**
 * CREATE'S SPECIMEN IS THE REAL ROOM, PRESSED THROUGH WITH NOTHING BEHIND IT (`create-room-demo.tsx`): every screen
 * stands (the name, the album's style, the code's look, the beat and the door), Create event answers from the stand-in
 * after its wait and calls no Server Action, the two presses that would leave the room are held, and Start again plays it
 * from its name. The room's own behavior is `create-event-wizard.test.tsx`'s and `room.test.tsx`'s; this holds the
 * specimen to what the Library says it is, so a stand-in that stops answering, or a press that starts leaving the lab,
 * fails here and not only to a look.
 */

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh: vi.fn() }),
}));

// The real Server Action: the specimen must never reach it.
const createEventInWizard = vi.hoisted(() => vi.fn());
vi.mock("@/app/(app)/dashboard/actions", () => ({ createEventInWizard }));

// The code is a picture here: which link it encodes and which look it wears are the facts.
vi.mock("@/components/app/styled-qr", () => ({
  StyledQr: ({
    value,
    style,
  }: {
    value: string;
    style: { dotsOptions: { type: string } };
  }) => (
    <div
      data-testid="styled-qr"
      data-value={value}
      data-dots={style.dotsOptions.type}
    />
  ),
}));
// The plans' sheet is a real Checkout door: the specimen must never open it.
const pricing = vi.hoisted(() => vi.fn());
vi.mock("@/components/app/pricing/pricing-sheet", () => ({
  PricingSheet: (props: { open: boolean }) => {
    pricing(props);
    return null;
  },
}));
vi.mock("@/components/shared/glow", () => ({ Glow: () => null }));

// The frame is the lab's own and a jsdom has no viewport to give it: the scene stands where the frame would put it.
const frame = vi.hoisted(() => vi.fn());
vi.mock("@/components/lab", () => ({
  Frame: (props: { children: ReactNode }) => {
    frame(props);
    return <div data-testid="frame">{props.children}</div>;
  },
}));

const SAMPLE = /\/e\/0{32}$/;
const LIVE = /\/e\/(?!0{32}$)[0-9a-f]{32}$/;

const beat = () => document.querySelector<HTMLElement>("[data-beat]")!;
const codes = () =>
  within(beat())
    .getAllByTestId("styled-qr")
    .map((n) => ({ value: n.dataset.value!, dots: n.dataset.dots }));
const go = (name: RegExp) =>
  userEvent.click(screen.getByRole("button", { name }));
/** The beat's foot once the event exists: Go to your event, a link into it (create-wizard r5's `close=enter`). */
const GO_IN = { name: /^go to your event$/i };

/** The name given and the album's style left as it opens: the look stands, and she picks Rounded. */
async function toTheLook() {
  await userEvent.type(screen.getByRole("textbox"), "Maya's 30th");
  await go(/^continue$/i);
  await screen.findByRole("radiogroup", { name: /album style/i });
  await go(/^continue$/i);
  await userEvent.click(await screen.findByRole("radio", { name: /rounded/i }));
}

async function toTheBeat() {
  render(<CreateRoomDemo />);
  await toTheLook();
  await go(/^create event$/i);
  await screen.findByRole("link", GO_IN, { timeout: 5000 });
}

beforeEach(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  push.mockClear();
  pricing.mockClear();
  frame.mockClear();
  createEventInWizard.mockReset();
  window.sessionStorage.clear();
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe("the stand-in's Create", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("★ answers after a round trip's wait with the event her name and look make, and writes nothing", async () => {
    const answer = standInCreate({
      name: "Maya's 30th",
      qr_style: "rounded",
    } as Parameters<typeof standInCreate>[0]);
    let settled = false;
    void answer.then(() => (settled = true));
    await vi.advanceTimersByTimeAsync(CREATE_MS - 1);
    expect(settled).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    const result = await answer;
    expect(result).toEqual({
      ok: true,
      event: expect.objectContaining({
        name: "Maya's 30th",
        qr_style: "rounded",
        qr_token: expect.stringMatching(/^[0-9a-f]{32}$/),
      }),
    });
    expect(createEventInWizard).not.toHaveBeenCalled();
  });
});

describe("Create's room, pressed through with no session", () => {
  it("★ stands every screen in turn and ends on her own code, the sample developing first, and calls no Server Action", async () => {
    render(<CreateRoomDemo />);
    // The name: the room's one question and one field.
    expect(
      screen.getByRole("heading", { name: /name your event/i }),
    ).toBeInTheDocument();
    await toTheLook();
    expect(
      screen.getByRole("heading", { name: /pick the code's look/i }),
    ).toBeInTheDocument();

    await go(/^create event$/i);
    // The beat lands at once: the sample she styled, in her look, while the stand-in is on its round trip.
    expect(beat().dataset.beat).toBe("developing");
    expect(codes()).toEqual([
      { value: expect.stringMatching(SAMPLE), dots: "rounded" },
    ]);
    expect(screen.queryByRole("link", GO_IN)).toBeNull();

    // Then her own code, where the sample stood, in the same look.
    await screen.findByRole("link", GO_IN, { timeout: CREATE_MS + 3000 });
    expect(beat().dataset.beat).toBe("arrived");
    expect(codes()).toContainEqual({
      value: expect.stringMatching(LIVE),
      dots: "rounded",
    });
    expect(screen.getByRole("status")).toHaveTextContent("Maya's 30th is live");
    // The real Server Action was never reached: the stand-in made the event.
    expect(createEventInWizard).not.toHaveBeenCalled();
  });

  it("★ holds Go to your event: the press that would push the lab into a hub goes nowhere", async () => {
    await toTheBeat();
    await userEvent.click(screen.getByRole("link", GO_IN));
    expect(push).not.toHaveBeenCalled();
    // Still on the beat, still hers.
    expect(beat().dataset.beat).toBe("arrived");
  });

  it("takes back the flag Create leaves for a dashboard's lamp when the room goes", async () => {
    const { unmount } = render(<CreateRoomDemo />);
    await toTheLook();
    await go(/^create event$/i);
    await screen.findByRole("link", GO_IN, { timeout: 5000 });
    expect(window.sessionStorage.getItem("pr-just-made-event")).toBe(
      "library-create-room",
    );
    unmount();
    expect(window.sessionStorage.getItem("pr-just-made-event")).toBeNull();
  });

  it("Start again plays the room from its name, with the field empty", async () => {
    await toTheBeat();
    await go(/^start again$/i);
    expect(
      screen.getByRole("heading", { name: /name your event/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toHaveValue("");
    expect(document.querySelector("[data-beat]")).toBeNull();
  });
});

describe("the door at the plan's limit", () => {
  it("★ stands before the work, naming the event holding the slot, and holds See Pro: the plans' sheet never opens", async () => {
    render(<CreateRoomDemo atCap />);
    expect(
      screen.getByRole("heading", { name: /free holds one event/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /maya & jay's wedding/i }),
    ).toHaveAttribute("href", "/dashboard/library-maya-jay");
    // A refusal is not a step: no steppers, no field.
    expect(document.querySelector("[data-room-step]")).toBeNull();
    expect(screen.queryByRole("textbox")).toBeNull();

    await go(/^see pro$/i);
    expect(pricing).not.toHaveBeenCalledWith(
      expect.objectContaining({ open: true }),
    );
    expect(push).not.toHaveBeenCalled();
  });
});

describe("the frame", () => {
  it("★ is a real viewport at the device's own size, loaded as the reader nears it", () => {
    const { unmount } = render(<CreateRoomDemo screen="phone" />);
    expect(frame).toHaveBeenLastCalledWith(
      expect.objectContaining({ w: 375, h: 812, onApproach: true }),
    );
    unmount();
    render(<CreateRoomDemo screen="desk" />);
    expect(frame).toHaveBeenLastCalledWith(
      expect.objectContaining({ w: 1440, h: 900, onApproach: true }),
    );
    expect(CREATE_SCREENS.phone).toEqual({ w: 375, h: 812 });
  });

  it("★ opens with nothing taking the page's focus: the room stands inert for its first commit, then live; Start again is not held", async () => {
    const { container } = render(<CreateRoomDemo />);
    expect(container.querySelector("[inert]")).not.toBeNull();
    await waitFor(() => expect(container.querySelector("[inert]")).toBeNull());
    await go(/^start again$/i);
    expect(container.querySelector("[inert]")).toBeNull();
  });
});
