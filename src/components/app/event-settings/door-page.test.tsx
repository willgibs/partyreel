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
  waitFor,
} from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { DoorCounts } from "@/lib/db/queries/event-doors";

const { toast, updateEventAction, setEventDoorAction, setEventPasswordAction } =
  vi.hoisted(() => ({
    toast: { success: vi.fn(), error: vi.fn() },
    updateEventAction: vi.fn(),
    setEventDoorAction: vi.fn(),
    setEventPasswordAction: vi.fn(),
  }));

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("sonner", () => ({ toast }));
vi.mock("@/lib/reel/defaults-action", () => ({ setReelDefaults: vi.fn() }));
vi.mock("@/app/(app)/dashboard/actions", () => ({
  updateEventAction: (...a: unknown[]) => updateEventAction(...a),
  updateEventSocialSettingsAction: vi.fn(),
  setEventPasswordAction: (...a: unknown[]) => setEventPasswordAction(...a),
  clearEventPasswordAction: vi.fn(),
}));
vi.mock("@/app/(app)/dashboard/[eventId]/actions", () => ({
  setEventDoorAction: (...a: unknown[]) => setEventDoorAction(...a),
}));
vi.mock("@/components/app/pricing/pricing-sheet", () => ({
  PricingSheet: () => null,
}));

const { DoorPage, consequenceOf, insideNote, passwordGroups } =
  await import("./door-page");
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

/* ★ A MOVE ONTO AN ADDRESS GATE SAYS WHAT IT DOES TO THE GUESTS IN BY NAME (crumbs-89, the second Immediate line;
   crumbs-87's walk: a guest on a phone). Letting each person in and the invite list turn An email first on for everyone,
   so a guest already in on a name alone meets "Confirm your email to see everything" and adds nothing until she does,
   while the page said nothing of it before the move and its note under the gates said "everyone in keeps adding". */
describe("an address gate and the guests in by name", () => {
  it("★ letting each person in, from names only with guests in by name, says what it asks of them and writes nothing until confirmed", async () => {
    page(
      { visibility: "private", door: "closed", require_verified_email: false },
      { in: 5, inByName: 2 },
    );
    fireEvent.click(choice("You let each person in"));
    expect(
      screen.getByText(
        "2 guests are in on a name alone. Letting each person in asks them to confirm an email too, before they see everything or add more.",
      ),
    ).toBeTruthy();
    expect(setEventDoorAction).not.toHaveBeenCalled();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Ask for an email" }));
    });
    expect(setEventDoorAction).toHaveBeenCalledWith(EVENT_ID, "approve");
  });

  it("the invite list says it in its own words, and Keep it as it is writes nothing", () => {
    page(
      { visibility: "private", door: "closed", require_verified_email: false },
      { in: 1, inByName: 1 },
    );
    fireEvent.click(choice("Your invite list"));
    expect(
      screen.getByText(
        "1 guest is in on a name alone. Your invite list asks them to confirm an email too, before they see everything or add more.",
      ),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Keep it as it is" }));
    expect(screen.queryByText(/in on a name alone/)).toBeNull();
    expect(setEventDoorAction).not.toHaveBeenCalled();
  });

  it("★ says nothing where it reaches nobody: the step already on (her own), or nobody in by name", async () => {
    expect(
      consequenceOf("approve", { in: 5, inByName: 2, waiting: 0 }, true),
    ).toBeNull();
    expect(
      consequenceOf("invite", { in: 5, inByName: 0, waiting: 0 }, false),
    ).toBeNull();
    // Only the two gates that match an address: the others keep their own lines.
    expect(
      consequenceOf("closed", { in: 5, inByName: 2, waiting: 0 }, false),
    ).toBeNull();
    expect(
      consequenceOf("open", { in: 5, inByName: 2, waiting: 0 }, false),
    ).toBeNull();
    page(
      { visibility: "private", door: "closed", require_verified_email: true },
      { in: 5, inByName: 2 },
    );
    await act(async () => {
      fireEvent.click(choice("You let each person in"));
    });
    expect(setEventDoorAction).toHaveBeenCalledWith(EVENT_ID, "approve");
  });

  it("★ the note under the gates says when the guests in by name keep adding, while the step is on", () => {
    page(
      { visibility: "private", door: "approve", require_verified_email: true },
      { in: 5, inByName: 2 },
    );
    expect(document.querySelector("[data-door-inside]")?.textContent).toBe(
      "5 guests are already in. A gate stops newcomers; everyone in keeps adding, the 2 in by name once they confirm an email.",
    );
    expect(insideNote(2, false)).toBe(
      "A gate stops newcomers; everyone in keeps adding.",
    );
    expect(insideNote(0, true)).toBe(
      "A gate stops newcomers; everyone in keeps adding.",
    );
  });
});

/* ★ THE PASSWORD'S FIRST SET, WHILE A GATE HELD THE STEP FROM OFF (crumbs-89): `set_event_password` clears the gate as it
   opens the password door, and the event gives her names only back (20261007140000). Its control answers success alone,
   so the page lays what that did at once, and says it as the door's own save does, never waiting on the hub's row. */
describe("the password's first set, held", () => {
  it("★ the door turns to the password, the step goes off, and she is told", async () => {
    setEventPasswordAction.mockResolvedValue({ ok: true });
    page(
      {
        visibility: "private",
        door: "approve",
        require_verified_email: true,
        email_held: true,
      } as Parameters<typeof hostEvent>[0],
      { in: 2, inByName: 1 },
    );
    fireEvent.click(choice("A password"));
    fireEvent.change(screen.getByLabelText("Album password"), {
      target: { value: "garden-party" },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Set password" }));
    });
    expect(setEventPasswordAction).toHaveBeenCalledWith(
      EVENT_ID,
      "garden-party",
    );
    expect(choice("A password").getAttribute("aria-checked")).toBe("true");
    const email = screen.getByRole("switch", { name: /An email first/ });
    expect(email).not.toBeChecked();
    expect(email).not.toBeDisabled();
    expect(toast.success).toHaveBeenCalledWith("An email first is off again.", {
      description: "It was only on while you let each person in.",
    });
  });
});

/* ★ THE GATES ARE ONE RADIO GROUP (crumbs-91, red-team 57b's NIT: every gate was a Tab stop of its own and the arrows did
   nothing). One stop for the four, the arrows between them choosing as a press does, so a gate that asks first only asks;
   and each (i) keeps a stop of its own both ways (`radio-cards.tsx`: Radix's own group stop handed Shift+Tab from the
   first (i) forward to the chosen gate again, a loop, and Tab skipped the (i)s before it). */
describe("★ the gates from the keyboard: one stop, the arrows between them", () => {
  /** A stop as the walk records it: a radio by its name, a control by its name or words. */
  const stopOf = (el: Element | null) =>
    el?.getAttribute("role") === "radio"
      ? `radio ${el.textContent}`
      : (el?.getAttribute("aria-label") ?? el?.textContent ?? "");

  /** Every stop Tab (Shift+Tab, `back`) meets between two controls, in order. */
  async function walk(
    user: UserEvent,
    from: HTMLElement,
    to: HTMLElement,
    back = false,
  ) {
    act(() => from.focus());
    const met: string[] = [];
    // Bounded: a stop that hands focus back never reaches `to`.
    for (let i = 0; i < 20 && document.activeElement !== to; i++) {
      await user.tab({ shift: back });
      if (document.activeElement !== to)
        met.push(stopOf(document.activeElement));
    }
    expect(document.activeElement, `stuck after: ${met.join(" | ")}`).toBe(to);
    return met;
  }

  /**
   * An arrow held down, as a finger holds a key (`add-step.test.tsx`'s): the group moves focus a tick after the keydown,
   * and a gate is chosen by a focus that arrives while an arrow is down.
   */
  async function arrow(user: UserEvent, key: string, lands: () => HTMLElement) {
    await user.keyboard(`{${key}>}`);
    await waitFor(() => expect(lands()).toHaveFocus());
    await user.keyboard(`{/${key}}`);
  }

  it("★ Tab reaches the chosen gate, one stop for the four, and every (i) keeps its own, met in order both ways", async () => {
    const user = userEvent.setup();
    page({ visibility: "private", door: "closed" });
    const from = choice("Private");
    const to = screen.getByRole("switch", { name: /An email first/ });
    const forward = await walk(user, from, to);
    expect(forward).toEqual([
      "What a password is for",
      "What you let each person in is for",
      "What your invite list is for",
      "radio Only people already in",
      "What only people already in is for",
    ]);
    expect(await walk(user, to, from, true)).toEqual([...forward].reverse());
  });

  it("★ an arrow chooses as a press does: a gate that reaches nobody applies at once", async () => {
    const user = userEvent.setup();
    page({ visibility: "private", door: "approve" });
    act(() => choice("You let each person in").focus());
    await arrow(user, "ArrowDown", () => choice("Your invite list"));
    await waitFor(() =>
      expect(setEventDoorAction).toHaveBeenCalledWith(EVENT_ID, "invite"),
    );
    await waitFor(() =>
      expect(choice("Your invite list")).toHaveAttribute(
        "aria-checked",
        "true",
      ),
    );
  });

  it("★ a gate that asks first only asks when an arrow lands on it, and the saved gate picked back lets its line go", async () => {
    const user = userEvent.setup();
    page(
      { visibility: "private", door: "approve", has_password: true },
      { waiting: 2 },
    );
    act(() => choice("You let each person in").focus());
    await arrow(user, "ArrowUp", () => choice("A password"));
    expect(
      screen.getByText(
        "2 people are waiting at the door. A password asks them for it too.",
      ),
    ).toBeInTheDocument();
    expect(choice("A password")).toHaveAttribute("aria-checked", "false");
    // The line is said, never focused: the arrows go on from the gate she is on.
    expect(choice("A password")).toHaveFocus();
    await arrow(user, "ArrowDown", () => choice("You let each person in"));
    expect(screen.queryByText(/A password asks them for it too/)).toBeNull();
    expect(setEventDoorAction).not.toHaveBeenCalled();
  });

  it("an arrow onto A password with none set opens its field and no door; the saved gate picked back takes it away", async () => {
    const user = userEvent.setup();
    page({ visibility: "private", door: "closed" });
    act(() => choice("Only people already in").focus());
    // Round from the last gate to the first.
    await arrow(user, "ArrowDown", () => choice("A password"));
    expect(screen.getByLabelText("Album password")).toBeInTheDocument();
    expect(choice("A password")).toHaveAttribute("aria-checked", "true");
    await arrow(user, "ArrowUp", () => choice("Only people already in"));
    expect(screen.queryByLabelText("Album password")).toBeNull();
    expect(setEventDoorAction).not.toHaveBeenCalled();
  });

  it("an (i) keeps its own keys: its arrows never move the gates", async () => {
    const user = userEvent.setup();
    page({ visibility: "private", door: "approve" });
    const help = screen.getByRole("button", {
      name: "What you let each person in is for",
    });
    act(() => help.focus());
    for (const key of ["ArrowDown", "ArrowUp"]) {
      await user.keyboard(`{${key}>}`);
      // Past the tick the group would move on.
      await new Promise((r) => setTimeout(r, 30));
      await user.keyboard(`{/${key}}`);
      expect(help).toHaveFocus();
    }
    expect(setEventDoorAction).not.toHaveBeenCalled();
    expect(choice("You let each person in")).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });
});
