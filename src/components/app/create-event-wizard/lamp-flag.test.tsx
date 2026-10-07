/**
 * CREATE TELLS THE DASHBOARD SHE JUST MADE THE EVENT (crumbs-70): the moment the event exists, its id is left in the tab
 * for the lit stage's lamp (`just-made.ts`), and a refused Create leaves nothing, since nothing was made. Create's two
 * exits lead to the event itself, so the flag cannot ride a link: it waits in the tab for her next visit home.
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CreateEventWizard } from "@/components/app/create-event-wizard";
import { isJustMade } from "@/components/app/create-event-wizard/just-made";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));
const createEventInWizard = vi.hoisted(() => vi.fn());
vi.mock("@/app/(app)/dashboard/actions", () => ({ createEventInWizard }));
// The code and the sheet are not this file's subject.
vi.mock("@/components/app/styled-qr", () => ({
  StyledQr: () => <div data-testid="styled-qr" />,
}));
vi.mock("@/components/app/pricing/pricing-sheet", () => ({
  PricingSheet: () => null,
}));
vi.mock("@/components/shared/glow", () => ({ Glow: () => null }));

const EVENT = {
  id: "evt_new",
  name: "Maya & Sam's Wedding",
  qr_token: "tok_abc",
  qr_style: "classic",
};

async function pressCreate() {
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
  await screen.findByRole("radiogroup", { name: /album style/i });
  await userEvent.click(screen.getByRole("button", { name: /continue/i }));
  await userEvent.click(
    await screen.findByRole("button", { name: /create event/i }),
  );
}

beforeEach(() => {
  window.sessionStorage.clear();
  createEventInWizard.mockReset();
});

describe("the flag for the lit stage's lamp", () => {
  it("names the event the moment it exists, and not before", async () => {
    let finish!: (v: unknown) => void;
    createEventInWizard.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    await pressCreate();
    // The beat is up and the event is still being made: nothing is true yet.
    expect(isJustMade(EVENT.id)).toBe(false);
    finish({ ok: true, event: EVENT });
    await waitFor(() => expect(isJustMade(EVENT.id)).toBe(true));
  });

  it("is left by nothing a refused Create did", async () => {
    createEventInWizard.mockResolvedValue({
      ok: false,
      code: "unknown",
      message: "Nope.",
    });
    await pressCreate();
    // Held on the beat, Try again at the foot (create-wizard r4's `failed=held`): nothing was made, so nothing is just
    // made. ★ RESHAPED ON PURPOSE (scar kept: no flag without an event); the failure no longer returns to the look.
    await screen.findByRole("button", { name: /^try again$/i });
    expect(isJustMade(EVENT.id)).toBe(false);
    expect(window.sessionStorage.length).toBe(0);
  });
});
