/**
 * THE DOOR MENU SAYS WHAT EACH DOOR WOULD DO TO THE PEOPLE WAITING, THE INVITE LIST'S INCLUDED (crumbs-23,
 * build 26's red-team, NIT-C).
 *
 * Settings > Who can get in opens a quick choice of six doors, each with the line it says before it is
 * chosen. Public said "Lets in the 1 person waiting at the door." and the invite list said nothing, even
 * with the person waiting named on the list and choosing it letting her in (crumbs-17's admit). A line is a
 * promise, so it is said only where the effect would happen: the number is the host's own
 * (`DoorCounts.waitingListed`, the read-only twin of what the list then admits). The words are the pure
 * function's, pinned here; the menu is drawn once over the settings' state to hold that they reach it.
 */
import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { refresh, toast } = vi.hoisted(() => ({
  refresh: vi.fn(),
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("sonner", () => ({ toast }));
vi.mock("@/lib/reel/defaults-action", () => ({ setReelDefaults: vi.fn() }));
vi.mock("@/app/(app)/dashboard/actions", () => ({
  updateEventAction: vi.fn(),
  updateEventSocialSettingsAction: vi.fn(),
  deleteEventAction: vi.fn(),
  setEventPasswordAction: vi.fn(),
  clearEventPasswordAction: vi.fn(),
}));
vi.mock("@/app/(app)/dashboard/[eventId]/actions", () => ({
  setEventDoorAction: vi.fn(),
}));
vi.mock("@/components/app/pricing/pricing-sheet", () => ({
  PricingSheet: () => null,
}));

const { doorConsequence } = await import("./settings-rows");
const { EventSettingsSheet } = await import("./event-settings-sheet");
const { hostEvent, NO_COUNTS, readyFacts } =
  await import("./testing/host-event");

const FACTS = {
  in: 0,
  waiting: 0,
  waitingListed: 0,
  hasPassword: true,
  requireVerifiedEmail: true,
};

describe("doorConsequence: what a door does to people, said before it is chosen", () => {
  it("★ the invite list lets in the people waiting whom it names, said as Public says its own", () => {
    expect(doorConsequence("open", { ...FACTS, waiting: 1 })).toBe(
      "Lets in the 1 person waiting at the door.",
    );
    expect(
      doorConsequence("invite", { ...FACTS, waiting: 3, waitingListed: 1 }),
    ).toBe("Lets in the 1 person waiting at the door who is on your list.");
    expect(
      doorConsequence("invite", { ...FACTS, waiting: 3, waitingListed: 2 }),
    ).toBe("Lets in the 2 people waiting at the door who are on your list.");
  });

  it("★ says nothing of it where the list names nobody waiting: people waiting is not people it lets in", () => {
    expect(doorConsequence("invite", { ...FACTS, waiting: 4 })).toBeNull();
    expect(doorConsequence("invite", FACTS)).toBeNull();
  });

  it("says both where both are true: who comes in, then the email step it turns on", () => {
    expect(
      doorConsequence("invite", {
        ...FACTS,
        waiting: 1,
        waitingListed: 1,
        requireVerifiedEmail: false,
      }),
    ).toBe(
      "Lets in the 1 person waiting at the door who is on your list. Turns An email first on: this gate matches a confirmed address.",
    );
    expect(
      doorConsequence("invite", { ...FACTS, requireVerifiedEmail: false }),
    ).toBe("Turns An email first on: this gate matches a confirmed address.");
  });

  it("leaves every other door's line as it was", () => {
    expect(doorConsequence("private", { ...FACTS, in: 2 })).toBe(
      "Closes out the 2 guests already in.",
    );
    expect(doorConsequence("closed", { ...FACTS, waiting: 1 })).toBe(
      "The 1 person waiting at the door stays out.",
    );
    expect(doorConsequence("closed", { ...FACTS, waiting: 2 })).toBe(
      "The 2 people waiting at the door stay out.",
    );
    expect(doorConsequence("password", { ...FACTS, hasPassword: false })).toBe(
      "Set a password first, on the next screen.",
    );
    expect(
      doorConsequence("approve", { ...FACTS, requireVerifiedEmail: false }),
    ).toBe("Turns An email first on: this gate matches a confirmed address.");
    // A list's numbers are the list's alone: no other door names them.
    expect(
      doorConsequence("approve", { ...FACTS, waiting: 2, waitingListed: 2 }),
    ).toBeNull();
  });
});

describe("the door menu, drawn", () => {
  beforeEach(() => vi.clearAllMocks());

  function menu(counts: Partial<typeof NO_COUNTS>, event = {}) {
    render(
      <EventSettingsSheet
        open
        onOpenChange={vi.fn()}
        page={null}
        onOpenPage={vi.fn()}
        onClosePage={vi.fn()}
        event={hostEvent({
          visibility: "private",
          door: "approve",
          require_verified_email: true,
          ...event,
        })}
        tier="pro"
        counts={{ ...NO_COUNTS, ...counts }}
        pendingCount={0}
        social={{ displayInProfile: false, hostHasSlug: true }}
        reelSample={null}
        ready={readyFacts()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "People you let in" }));
    return screen.getByRole("menu");
  }

  it("★ carries the invite list's line beside Public's, when the list names someone waiting", () => {
    const open = menu({ waiting: 2, waitingListed: 1 });
    expect(
      within(open).getByRole("menuitem", { name: /^Public/ }),
    ).toHaveTextContent("Lets in the 2 people waiting at the door.");
    expect(
      within(open).getByRole("menuitem", { name: /Private: your invite list/ }),
    ).toHaveTextContent(
      "Lets in the 1 person waiting at the door who is on your list.",
    );
  });

  it("keeps the invite list's own line when nobody waiting is named", () => {
    const open = menu({ waiting: 2, waitingListed: 0 });
    const invite = within(open).getByRole("menuitem", {
      name: /Private: your invite list/,
    });
    expect(invite).not.toHaveTextContent(/who (is|are) on your list/);
    // The guest's own line for the door stands in, as it did.
    expect(invite).toHaveTextContent(/invite/i);
  });
});
