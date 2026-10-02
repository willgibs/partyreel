import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CreateEventWizard } from "@/components/app/create-event-wizard";

/**
 * CREATE HANDS OVER (Will, event-ready `create=hand`, 2026-10-02): the beat keeps the code first and
 * whole, then says what is left before guests arrive, from the one function the hub's checklist and
 * Settings' steps read, and its way on is Get it ready, into Settings' first step. The rest of the flow
 * (one field, the door at the cap, the beat once) is `create-flow.test.tsx`'s.
 *
 * What fails silently: a list that is not the checklist's (Create telling a host something the hub then
 * contradicts), and a Get it ready that lands anywhere but the first step. No word or class is pinned.
 */

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh: vi.fn() }),
}));

const createEventInWizard = vi.hoisted(() => vi.fn());
vi.mock("@/app/(app)/dashboard/actions", () => ({ createEventInWizard }));

// The code is a picture here; the hand-off is about what stands under it.
vi.mock("@/components/app/styled-qr", () => ({
  StyledQr: ({ value }: { value: string }) => (
    <div data-testid="styled-qr" data-value={value} />
  ),
}));
vi.mock("@/components/app/pricing/pricing-sheet", () => ({
  PricingSheet: () => null,
}));

const EVENT = {
  id: "evt_1",
  name: "Maya's 30th",
  qr_token: "tok_abc",
  qr_style: "classic",
};

async function createIt() {
  render(
    <CreateEventWizard
      siteUrl="https://partyreel.com"
      planName="Free"
      tier="free"
      atCap={false}
      maxEvents={1}
      cappedEvents={[]}
    />,
  );
  await userEvent.type(screen.getByRole("textbox"), EVENT.name);
  await userEvent.click(screen.getByRole("button", { name: /continue/i }));
  await userEvent.click(
    await screen.findByRole("button", { name: /create event/i }),
  );
  await screen.findByRole("button", { name: /get it ready/i });
}

beforeEach(() => {
  push.mockClear();
  createEventInWizard.mockReset();
  createEventInWizard.mockResolvedValue({ ok: true, event: EVENT });
});

describe("the beat, handing over", () => {
  it("★ lists what is left on the new event, what a guest needs first, from the checklist's own items", async () => {
    await createIt();
    const left = [
      ...document.querySelectorAll<HTMLElement>("[data-handoff-item]"),
    ].map((el) => el.dataset.handoffItem);
    // Create sets the name alone: the door is Public and uploads open, and the code was never opened.
    expect(left).toEqual(["code", "photos", "welcome"]);
  });

  it("keeps the code first: the list stands under it", async () => {
    await createIt();
    const code = screen.getByTestId("styled-qr");
    const handoff = document.querySelector("[data-handoff]")!;
    expect(
      code.compareDocumentPosition(handoff) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("★ Get it ready opens Settings on its first step, over the new event", async () => {
    await createIt();
    expect(push).not.toHaveBeenCalled();
    await userEvent.click(
      screen.getByRole("button", { name: /get it ready/i }),
    );
    expect(push).toHaveBeenCalledWith(
      `/dashboard/${EVENT.id}?room=settings&setting=door`,
    );
  });

  it("still offers the event itself, one quieter press beside it", async () => {
    await createIt();
    await userEvent.click(
      screen.getByRole("button", { name: /go to your event/i }),
    );
    expect(push).toHaveBeenCalledWith(`/dashboard/${EVENT.id}`);
  });
});
