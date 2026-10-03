import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CreateEventWizard } from "@/components/app/create-event-wizard";

/**
 * THE BEAT, DEVELOPED (create-wizard r2 `beat=develop`, Will 2026-10-03: "This is a beautiful screen and
 * allows everything to breathe, with lots of our aurora identity infused. The steps beneath could be
 * designed better, while remaining somewhat minimal"), still handing over as event-ready's `create=hand`
 * made it: the code first and whole, then what is left, then Get it ready into Settings' first step.
 * The room around it (the question in one place, Back, the carry, the close) is `room.test.tsx`'s; one
 * field, the looks and the door at the cap are `create-flow.test.tsx`'s.
 *
 * What fails silently: a beat that shows the real code before the event exists (or the sample after),
 * a list that is not Settings' own (Create telling a host something Settings then contradicts), a Get it
 * ready that lands anywhere but the first step, and a refused Create that strands her on a screen that
 * says her event is live. No word or class is pinned but where the word is the fact.
 */

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh: vi.fn() }),
}));

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
const pricing = vi.hoisted(() => vi.fn());
vi.mock("@/components/app/pricing/pricing-sheet", () => ({
  PricingSheet: (props: { open: boolean; trigger: { kind: string } }) => {
    pricing(props);
    return null;
  },
}));
vi.mock("@/components/shared/glow", () => ({ Glow: () => null }));

const EVENT = {
  id: "evt_1",
  name: "Maya's 30th",
  qr_token: "7f3a9c2e5b8d4f1a9e6c3b7d2a5f8e1c",
  qr_style: "rounded",
};
const REAL = `https://partyreel.com/e/${EVENT.qr_token}`;
const SAMPLE = /\/e\/0{32}$/;

function renderWizard(storagePct = 10) {
  return render(
    <CreateEventWizard
      siteUrl="https://partyreel.com"
      planName="Free"
      tier="free"
      atCap={false}
      maxEvents={1}
      cappedEvents={[]}
      storagePct={storagePct}
    />,
  );
}

async function toTheLook() {
  await userEvent.type(screen.getByRole("textbox"), EVENT.name);
  await userEvent.click(screen.getByRole("button", { name: /^continue$/i }));
  await userEvent.click(await screen.findByRole("radio", { name: /rounded/i }));
}

async function createIt(storagePct?: number) {
  renderWizard(storagePct);
  await toTheLook();
  await userEvent.click(
    screen.getByRole("button", { name: /^create event$/i }),
  );
  await screen.findByRole("button", { name: /^get it ready$/i });
}

const beat = () => document.querySelector<HTMLElement>("[data-beat]")!;
const codes = () =>
  within(beat())
    .getAllByTestId("styled-qr")
    .map((n) => ({ value: n.dataset.value!, dots: n.dataset.dots }));

beforeEach(() => {
  push.mockClear();
  pricing.mockClear();
  vi.mocked(toast.error).mockClear();
  createEventInWizard.mockReset();
  createEventInWizard.mockResolvedValue({ ok: true, event: EVENT });
});

describe("the code develops (beat=develop)", () => {
  it("★ stands the sample she styled while Create runs, saying it is a sample and nothing else yet", async () => {
    let answer!: (v: unknown) => void;
    createEventInWizard.mockReturnValue(
      new Promise((resolve) => (answer = resolve)),
    );
    renderWizard();
    await toTheLook();
    await userEvent.click(
      screen.getByRole("button", { name: /^create event$/i }),
    );

    // The sample, in the look she picked, and only it: the event and its link do not exist yet.
    expect(beat().dataset.beat).toBe("developing");
    expect(codes()).toEqual([
      { value: expect.stringMatching(SAMPLE), dots: "rounded" },
    ]);
    expect(within(beat()).getByText(/^sample$/i)).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(/creating/i);
    // Nothing that needs the event yet: no doors out, no way on.
    expect(screen.queryByRole("link", { name: /print/i })).toBeNull();
    expect(
      screen.queryByRole("button", { name: /^get it ready$/i }),
    ).toBeNull();

    await act(async () => answer({ ok: true, event: EVENT }));

    // Her own code, where the sample stood, in the same look.
    expect(beat().dataset.beat).toBe("arrived");
    expect(codes()).toContainEqual({ value: REAL, dots: "rounded" });
    expect(screen.getByRole("status")).toHaveTextContent(
      `${EVENT.name} is live`,
    );
    expect(createEventInWizard).toHaveBeenCalledTimes(1);
    expect(createEventInWizard).toHaveBeenCalledWith(
      expect.objectContaining({ name: EVENT.name, qr_style: "rounded" }),
    );
  });

  it("puts the word Sample away once the code is hers", async () => {
    await createIt();
    expect(
      beat()
        .querySelector("[data-beat-sample-word]")
        ?.getAttribute("data-state"),
    ).toBe("gone");
  });
});

describe("Print and Share stand as rounds", () => {
  const realClipboard = navigator.clipboard;
  afterEach(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: realClipboard,
      configurable: true,
    });
  });

  it("opens the table cards in a tab of their own", async () => {
    await createIt();
    const print = within(beat()).getByRole("link", { name: /^print$/i });
    expect(print).toHaveAttribute("href", `/dashboard/${EVENT.id}/print`);
    expect(print).toHaveAttribute("target", "_blank");
  });

  it("hands the link on, copying it where the browser has no share sheet of its own", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
    await createIt();
    const share = within(beat()).getByRole("button", {
      name: /^(share|copy link)$/i,
    });
    await userEvent.click(share);
    expect(writeText).toHaveBeenCalledWith(REAL);
  });
});

describe("Settings' steps beneath, kept minimal (his note on develop)", () => {
  it("★ stands Settings' five in its rail's order, ticked from the checklist's own function", async () => {
    await createIt();
    const steps = [
      ...beat().querySelectorAll<HTMLElement>("[data-beat-steps] li"),
    ];
    expect(steps.map((s) => s.dataset.stepItem)).toEqual([
      "door",
      "adds",
      "photos",
      "welcome",
      "code",
    ]);
    // Create sets the name alone: the door is Public and uploads open; the rest waits in Settings.
    expect(steps.map((s) => s.dataset.done)).toEqual([
      "true",
      "true",
      "false",
      "false",
      "false",
    ]);
    expect(steps[0]).toHaveTextContent(/who can get in/i);
    expect(steps[4]).toHaveTextContent(/the code/i);
    expect(beat()).toHaveTextContent(/guests still need one more thing/i);
  });

  it("keeps the code first: the steps stand under it", async () => {
    await createIt();
    const code = within(beat()).getAllByTestId("styled-qr")[0];
    const steps = beat().querySelector("[data-beat-steps]")!;
    expect(
      code.compareDocumentPosition(steps) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("★ says room beside the steps once the account runs short (the carried `room`), never as a step", async () => {
    await createIt(92);
    const room = beat().querySelector<HTMLElement>("[data-beat-room]");
    expect(room).toHaveTextContent(/92% of your storage is used/i);
    expect(beat().querySelectorAll("[data-beat-steps] li")).toHaveLength(5);
    await userEvent.click(
      within(room!).getByRole("button", { name: /plans/i }),
    );
    expect(pricing).toHaveBeenLastCalledWith(
      expect.objectContaining({ open: true, trigger: { kind: "room" } }),
    );
  });

  it("says nothing of room while the account has plenty", async () => {
    await createIt(40);
    expect(beat().querySelector("[data-beat-room]")).toBeNull();
  });
});

describe("the way on", () => {
  it("★ Get it ready opens Settings on its first step, over the new event", async () => {
    await createIt();
    expect(push).not.toHaveBeenCalled();
    await userEvent.click(
      screen.getByRole("button", { name: /^get it ready$/i }),
    );
    expect(push).toHaveBeenCalledWith(
      `/dashboard/${EVENT.id}?room=settings&setting=door`,
    );
  });

  it("★ a refused Create brings her back to the look, her name and her look kept, and says why", async () => {
    createEventInWizard.mockResolvedValue({
      ok: false,
      code: "unknown",
      message: "The network dropped.",
    });
    renderWizard();
    await toTheLook();
    await userEvent.click(
      screen.getByRole("button", { name: /^create event$/i }),
    );
    expect(
      await screen.findByRole("button", { name: /^create event$/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /rounded/i })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(document.querySelector("[data-beat]")).toBeNull();
    expect(toast.error).toHaveBeenCalledWith(
      expect.stringMatching(/couldn.t create/i),
      expect.objectContaining({ description: "The network dropped." }),
    );
    expect(push).not.toHaveBeenCalled();
  });

  it("★ never develops for ever over a dropped connection: a rejected Create reads as the failure it is", async () => {
    createEventInWizard.mockRejectedValue(new TypeError("Failed to fetch"));
    renderWizard();
    await toTheLook();
    await userEvent.click(
      screen.getByRole("button", { name: /^create event$/i }),
    );
    expect(
      await screen.findByRole("button", { name: /^create event$/i }),
    ).toBeInTheDocument();
    expect(document.querySelector("[data-beat]")).toBeNull();
    expect(toast.error).toHaveBeenCalledWith(
      expect.stringMatching(/couldn.t create/i),
      expect.objectContaining({ description: expect.any(String) }),
    );
    // And she can press it again: the one-create guard let go with the failure.
    createEventInWizard.mockResolvedValue({ ok: true, event: EVENT });
    await userEvent.click(
      screen.getByRole("button", { name: /^create event$/i }),
    );
    expect(
      await screen.findByRole("button", { name: /^get it ready$/i }),
    ).toBeInTheDocument();
  });

  it("sends her to her events with the plan's sentence when a slot was spent elsewhere (the guard behind the door)", async () => {
    createEventInWizard.mockResolvedValue({
      ok: false,
      code: "limit_reached",
      message: "Event limit reached.",
    });
    renderWizard();
    await toTheLook();
    await userEvent.click(
      screen.getByRole("button", { name: /^create event$/i }),
    );
    await vi.waitFor(() => expect(push).toHaveBeenCalledWith("/dashboard"));
    expect(toast.error).toHaveBeenCalledWith(
      expect.stringMatching(/free plan/i),
      expect.anything(),
    );
  });
});
