/**
 * WHO CAN GET IN, THE DOOR IN STEPS (event-settings r1, `join=steps`, `inside=count`, `editor=both`'s
 * pointer), against the real page over the settings' state; the writes are stand-ins.
 *
 * What is held is the rule for everyone already in, said before it acts: Only me with guests inside
 * says it closes them out and writes nothing until the host says so; Public with people at the door
 * says it lets them in; a gate that reaches nobody applies at once. And the rest: an address gate
 * holds the email step on and says why; a password with none set asks for one rather than opening a
 * door with nothing behind it; the invite list's step points to Guests; what does nothing right now is
 * dormant, never gone.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { DoorCounts } from "@/lib/db/queries/event-doors";

const { toast, updateEventAction, setEventDoorAction } = vi.hoisted(() => ({
  toast: { success: vi.fn(), error: vi.fn() },
  updateEventAction: vi.fn(),
  setEventDoorAction: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("sonner", () => ({ toast }));
vi.mock("@/lib/reel/defaults-action", () => ({ setReelDefaults: vi.fn() }));
vi.mock("@/app/(app)/dashboard/actions", () => ({
  updateEventAction: (...a: unknown[]) => updateEventAction(...a),
  updateEventSocialSettingsAction: vi.fn(),
  setEventPasswordAction: vi.fn(),
  clearEventPasswordAction: vi.fn(),
}));
vi.mock("@/app/(app)/dashboard/[eventId]/actions", () => ({
  setEventDoorAction: (...a: unknown[]) => setEventDoorAction(...a),
}));
vi.mock("@/components/app/pricing/pricing-sheet", () => ({
  PricingSheet: () => null,
}));

const { DoorPage } = await import("./door-page");
const { SettingsProvider } = await import("./settings-state");
const { hostEvent, NO_COUNTS } = await import("./testing/host-event");

const EVENT_ID = "11111111-2222-4333-8444-555555555555";

function page(
  event: Parameters<typeof hostEvent>[0] = {},
  counts: Partial<DoorCounts> = {},
) {
  return render(
    <SettingsProvider
      event={hostEvent(event)}
      tier="pro"
      counts={{ ...NO_COUNTS, ...counts }}
      pendingCount={0}
      social={null}
      reelSample={null}
    >
      <DoorPage guestsHref={`/dashboard/${EVENT_ID}/guests`} />
    </SettingsProvider>,
  );
}

const choice = (name: string) =>
  screen.getByRole("radio", { name: new RegExp(`^${name}$`) });

beforeEach(() => {
  vi.clearAllMocks();
  updateEventAction.mockResolvedValue({ ok: true });
  setEventDoorAction.mockResolvedValue({
    ok: true,
    emailHeld: false,
    admitted: 0,
  });
});

describe("step one, and the rule for everyone already in", () => {
  it("★ Only me with guests inside says it closes them out, and writes nothing until confirmed", async () => {
    page({}, { in: 31 });
    fireEvent.click(choice("Only me"));
    expect(
      screen.getByText(
        /31 guests are already in\. Only me closes them out completely/,
      ),
    ).toBeTruthy();
    expect(setEventDoorAction).not.toHaveBeenCalled();
    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: "Close it to everyone" }),
      );
    });
    expect(setEventDoorAction).toHaveBeenCalledWith(EVENT_ID, "private");
  });

  it("keeping it as it is writes nothing and clears the line", () => {
    page({}, { in: 3 });
    fireEvent.click(choice("Only me"));
    fireEvent.click(screen.getByRole("button", { name: "Keep it as it is" }));
    expect(screen.queryByText(/closes them out/)).toBeNull();
    expect(setEventDoorAction).not.toHaveBeenCalled();
  });

  it("Only me with nobody inside applies at once", async () => {
    page();
    await act(async () => {
      fireEvent.click(choice("Only me"));
    });
    expect(setEventDoorAction).toHaveBeenCalledWith(EVENT_ID, "private");
  });

  it("★ Public with people at the door says it lets them in, and the toast counts who came", async () => {
    setEventDoorAction.mockResolvedValue({
      ok: true,
      emailHeld: false,
      admitted: 2,
    });
    page({ visibility: "private", door: "approve" }, { waiting: 2, in: 4 });
    fireEvent.click(choice("Public"));
    expect(
      screen.getByText(
        /2 people are waiting at the door\. Public lets them straight in/,
      ),
    ).toBeTruthy();
    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: "Let them in, and open it" }),
      );
    });
    expect(setEventDoorAction).toHaveBeenCalledWith(EVENT_ID, "open");
    expect(toast.success).toHaveBeenCalledWith(
      "2 people waiting at the door came in.",
    );
  });
});

describe("the gates, under Private", () => {
  it("a gate that reaches nobody applies at once", async () => {
    page({ visibility: "private", door: "approve" });
    await act(async () => {
      fireEvent.click(
        screen.getByRole("radio", { name: "Only people already in" }),
      );
    });
    expect(setEventDoorAction).toHaveBeenCalledWith(EVENT_ID, "closed");
  });

  it("★ a password with none set asks for one, and opens no door yet", () => {
    page({ visibility: "private", door: "closed" });
    fireEvent.click(screen.getByRole("radio", { name: "A password" }));
    expect(screen.getByLabelText("Album password")).toBeTruthy();
    expect(setEventDoorAction).not.toHaveBeenCalled();
  });

  it("under a gate, says how many are already in", () => {
    page({ visibility: "private", door: "closed" }, { in: 31 });
    expect(document.querySelector("[data-door-inside]")?.textContent).toMatch(
      /31 guests are already in\./,
    );
  });

  it("the invite list's step points to Guests, with its count", () => {
    page({ visibility: "private", door: "invite" }, { invited: 24 });
    expect(
      screen.getByText(/Only people you invite · 24 invited ·/),
    ).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: "Manage in Guests" })
        .getAttribute("href"),
    ).toBe(`/dashboard/${EVENT_ID}/guests#invited`);
  });

  it("every gate's purpose is one tap away, behind its (i)", () => {
    page({ visibility: "private", door: "approve" });
    expect(
      screen.getByRole("button", {
        name: "What you let each person in is for",
      }),
    ).toBeTruthy();
    expect(
      screen.getAllByRole("button", { name: /^What .* is for$/ }),
    ).toHaveLength(4);
  });
});

describe("the email and the photo", () => {
  it("★ an address gate holds the email step on, and says why", () => {
    page({
      visibility: "private",
      door: "approve",
      require_verified_email: true,
    });
    const email = screen.getByRole("switch", { name: /An email first/ });
    expect(email).toBeChecked();
    expect(email).toBeDisabled();
    expect(screen.getByText(/On while you let each person in/)).toBeTruthy();
  });

  it("A photo first rests dormant while uploads are paused", () => {
    page({ accepting_uploads: false });
    const summaries = [
      ...document.querySelectorAll("[data-dormant-summary]"),
    ].map((el) => el.textContent);
    expect(summaries.some((t) => /uploads are paused/.test(t ?? ""))).toBe(
      true,
    );
  });

  it("★ under Only me, every step after the first is dormant, never gone", () => {
    page({ visibility: "private", door: "private" });
    const outer = document.querySelector("[data-slot='dormant']");
    expect(outer?.hasAttribute("data-awake")).toBe(false);
    expect(outer?.textContent).toMatch(
      /Nobody reaches them while only you can get in/,
    );
    expect(
      document.querySelector("[data-door-step='3']")?.closest("[inert]"),
    ).not.toBeNull();
  });
});
