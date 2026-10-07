/**
 * WHO CAN GET IN, THE DOOR IN STEPS (event-settings r1, `join=steps`, `inside=count`, `editor=both`'s
 * pointer), against the real page over the settings' state; the writes are stand-ins.
 *
 * What is held is the rule for everyone already in, said before it acts: Only me with guests inside
 * says it closes them out and writes nothing until the host says so; Public with people at the door
 * says it lets them in; a password with people at the door says it asks them for it too (their asks end
 * there); a gate that reaches nobody applies at once. And the rest: an address gate
 * holds the email step on and says why; a password with none set asks for one rather than opening a
 * door with nothing behind it; the invite list's step points to Guests; what does nothing right now is
 * dormant, never gone.
 */
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
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

const { DoorPage, passwordGroups } = await import("./door-page");
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

describe("★ each choice of step one sits on one line (red-team 46's NIT)", () => {
  // "Only me" wrapped onto two lines beside "Public" and "Private" at 375, where a card gives the control 279 px (224 at
  // 320). Layout is the browser's, and the captures at both widths hold it; what is pinned is the cause that would bring
  // it back: a choice's words may wrap, or a choice's icon take the room the words need.
  it("★ the words are the three the door has always had, none of them allowed to wrap", () => {
    const { container } = page();
    const choices = [
      ...container.querySelectorAll<HTMLElement>("[data-door-choice]"),
    ];
    expect(choices.map((c) => c.textContent)).toEqual([
      "Public",
      "Private",
      "Only me",
    ]);
    for (const c of choices) expect(c.className).toContain("whitespace-nowrap");
  });

  it("★ the icons are drawn for the screen only where the control has the room for them", () => {
    const { container } = page();
    for (const icon of container.querySelectorAll("[data-door-choice] > svg")) {
      expect(icon).toHaveAttribute("aria-hidden", "true");
      // Hidden until the control itself (a container query, not the window) is wide enough for icon and words.
      expect(icon.getAttribute("class")).toMatch(/\bhidden\b/);
      expect(icon.getAttribute("class")).toMatch(/@min-\[[\d.]+rem\]:block/);
    }
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
    // Nobody in and nobody waiting, so nothing more is said beside the field.
    expect(document.querySelector("[data-door-password-groups]")).toBeNull();
  });

  it("★ a password with people at the door says it asks them for it too, and writes nothing until confirmed", async () => {
    // crumbs-21: a password ends every ask at the door (migration 20260929230000), so the move reaches
    // the people waiting, and says so before it acts, as Public and closing the door do.
    page(
      { visibility: "private", door: "approve", has_password: true },
      { waiting: 2 },
    );
    fireEvent.click(screen.getByRole("radio", { name: "A password" }));
    expect(
      screen.getByText(
        "2 people are waiting at the door. A password asks them for it too.",
      ),
    ).toBeTruthy();
    expect(setEventDoorAction).not.toHaveBeenCalled();
    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: "Ask for the password" }),
      );
    });
    expect(setEventDoorAction).toHaveBeenCalledWith(EVENT_ID, "password");
  });

  it("★ the saved door picks back after a password was picked and never set (build 27's NIT)", () => {
    // The page showed "A password" chosen over a door that was never saved until a reload: picking
    // the saved gate again cleared its consequence line and left the password's field standing.
    page({ visibility: "private", door: "approve" });
    fireEvent.click(choice("A password"));
    expect(screen.getByLabelText("Album password")).toBeTruthy();
    expect(choice("A password").getAttribute("aria-checked")).toBe("true");

    fireEvent.click(choice("You let each person in"));
    expect(choice("You let each person in").getAttribute("aria-checked")).toBe(
      "true",
    );
    expect(choice("A password").getAttribute("aria-checked")).toBe("false");
    expect(screen.queryByLabelText("Album password")).toBeNull();
    // The door it shows is the door it has: nothing was written.
    expect(setEventDoorAction).not.toHaveBeenCalled();
  });

  // ★ RESHAPED ON PURPOSE (host-moments r1, `password=both`; scar kept: the first password, set as it opens the door,
  // says what it does to the people waiting beside its field, before anything is written). The expired reason: "says
  // the same beside its field", the waiting line alone: both groups are said there now, the guests in first.
  it("★ a first password with guests in and people waiting says both groups where she types it, and only there", () => {
    page({ visibility: "private", door: "approve" }, { in: 31, waiting: 3 });
    // Before: the gates' note says who is in.
    expect(document.querySelector("[data-door-inside]")).not.toBeNull();
    fireEvent.click(screen.getByRole("radio", { name: "A password" }));
    const groups = document.querySelector<HTMLElement>(
      "[data-door-password-groups]",
    );
    expect(
      [...groups!.querySelectorAll("[data-door-password-group]")].map(
        (line) => [
          line.getAttribute("data-door-password-group"),
          line.textContent,
        ],
      ),
    ).toEqual(
      passwordGroups({ in: 31, waiting: 3 }).map((line) => [
        line.group,
        `${line.lead} ${line.rest}`,
      ]),
    );
    // Read before she types: the lines stand above the field, in the same panel.
    const field = screen.getByLabelText("Album password");
    expect(
      groups!.compareDocumentPosition(field) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    // ★ In place of today's two: the field's waiting line and the gates' inside note are never said beside them.
    expect(document.querySelector("[data-door-password-waiting]")).toBeNull();
    expect(document.querySelector("[data-door-inside]")).toBeNull();
    expect(screen.queryByText(/A password asks them for it too/)).toBeNull();
    expect(setEventDoorAction).not.toHaveBeenCalled();
    // Picking the saved gate back takes the lines with the field, and the inside note returns.
    fireEvent.click(choice("You let each person in"));
    expect(document.querySelector("[data-door-password-groups]")).toBeNull();
    expect(document.querySelector("[data-door-inside]")).not.toBeNull();
  });

  it("each group has its line only while someone is in it", () => {
    page({ visibility: "private", door: "approve" }, { in: 31 });
    fireEvent.click(choice("A password"));
    expect(
      [...document.querySelectorAll("[data-door-password-group]")].map((l) =>
        l.getAttribute("data-door-password-group"),
      ),
    ).toEqual(["in"]);
    cleanup();
    page({ visibility: "private", door: "approve" }, { waiting: 1 });
    fireEvent.click(choice("A password"));
    expect(
      [...document.querySelectorAll("[data-door-password-group]")].map((l) =>
        l.getAttribute("data-door-password-group"),
      ),
    ).toEqual(["waiting"]);
  });

  it("the groups' words: who stays in, and who stops waiting on her, counted and agreeing with the count", () => {
    expect(passwordGroups({ in: 31, waiting: 3 })).toEqual([
      {
        group: "in",
        lead: "31 guests are in, and stay in",
        rest: "on every phone they used. Nobody inside is asked for it.",
      },
      {
        group: "waiting",
        lead: "3 people wait at the door",
        rest: "and stop waiting on you: they get in with the password, like anyone new.",
      },
    ]);
    // Each verb agrees with its count.
    expect(
      passwordGroups({ in: 1, waiting: 1 }).map((l) => `${l.lead} ${l.rest}`),
    ).toEqual([
      "1 guest is in, and stays in on every phone they used. Nobody inside is asked for it.",
      "1 person waits at the door and stops waiting on you: they get in with the password, like anyone new.",
    ]);
    expect(passwordGroups({ in: 0, waiting: 0 })).toEqual([]);
    expect(passwordGroups({ in: 1234, waiting: 0 })[0]!.lead).toBe(
      "1,234 guests are in, and stay in",
    );
  });

  it("★ a password already set, picked with people waiting, still asks first in its consequence line", () => {
    // The groups are the field's: a password already set has no field to type, and keeps its consequence line.
    page(
      { visibility: "private", door: "approve", has_password: true },
      { waiting: 2, in: 4 },
    );
    fireEvent.click(choice("A password"));
    expect(document.querySelector("[data-door-password-groups]")).toBeNull();
    expect(document.querySelector("[data-door-inside]")).not.toBeNull();
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

describe("the invite list's row says who it would let in, before it is chosen (crumbs-23, NIT-C)", () => {
  const inviteRow = () =>
    document.querySelector<HTMLElement>('[data-door-gate="invite"]')!;

  it("★ with people waiting whom it names, in the words the door menu says it in", () => {
    page(
      { visibility: "private", door: "approve" },
      { waiting: 3, waitingListed: 2 },
    );
    expect(inviteRow().querySelector("[data-door-listed]")?.textContent).toBe(
      "Lets in the 2 people waiting at the door who are on your list.",
    );
    // Only its row: no other gate says it, and it lets in no more than the list names.
    expect(document.querySelectorAll("[data-door-listed]")).toHaveLength(1);
  });

  it("says nothing where it would let in nobody, and nothing once it is the door", () => {
    page(
      { visibility: "private", door: "approve" },
      { waiting: 3, waitingListed: 0 },
    );
    expect(inviteRow().querySelector("[data-door-listed]")).toBeNull();
    cleanup();
    page(
      { visibility: "private", door: "invite" },
      { waiting: 0, waitingListed: 2 },
    );
    expect(inviteRow().querySelector("[data-door-listed]")).toBeNull();
  });
});
