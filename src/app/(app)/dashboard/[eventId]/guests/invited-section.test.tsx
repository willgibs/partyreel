/**
 * INVITED (event-settings r1, `editor=both`): one field takes one address or a paste of two hundred.
 * Held: the readable addresses are saved, counted by the database; the entries that held none stay in
 * the field as flagged chips to fix or drop, never silently lost; each address on the list says
 * whether it joined; and a removal that fails puts the address back.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { toast, addInvitesAction, removeInviteAction } = vi.hoisted(() => ({
  toast: { success: vi.fn(), error: vi.fn() },
  addInvitesAction: vi.fn(),
  removeInviteAction: vi.fn(),
}));
vi.mock("sonner", () => ({ toast }));
vi.mock("@/app/(app)/dashboard/[eventId]/guests/actions", () => ({
  addInvitesAction: (...a: unknown[]) => addInvitesAction(...a),
  removeInviteAction: (...a: unknown[]) => removeInviteAction(...a),
}));

const { InvitedSection } = await import("./invited-section");
const { settingsPageHref } =
  await import("@/components/app/event-settings/settings-pages");

const EVENT = "11111111-2222-4333-8444-555555555555";

function mount(
  invited = [
    { email: "maya@example.com", joined: true },
    { email: "jay@example.com", joined: false },
  ],
) {
  render(<InvitedSection eventId={EVENT} invited={invited} listIsTheDoor />);
  return screen.getByLabelText("Add or paste addresses");
}

beforeEach(() => {
  vi.clearAllMocks();
  addInvitesAction.mockResolvedValue({
    ok: true,
    result: { added: 2, already: 0, invalid: 0, overCap: 0, total: 4 },
  });
});

describe("the invite list", () => {
  it("says whether each address joined", () => {
    mount();
    const maya = document.querySelector("[data-invited='maya@example.com']");
    const jay = document.querySelector("[data-invited='jay@example.com']");
    expect(maya?.textContent).toContain("Joined");
    expect(jay?.textContent).toContain("Not yet");
  });

  it("★ a paste saves what it can read, and flags what it cannot", async () => {
    const field = mount();
    await act(async () => {
      fireEvent.paste(field, {
        clipboardData: {
          getData: () =>
            "Sam Lee <sam@example.com>\nnot an address\nkim@example.org",
        },
      });
    });
    expect(addInvitesAction).toHaveBeenCalledWith({
      eventId: EVENT,
      emails: ["sam@example.com", "kim@example.org"],
    });
    expect(
      document.querySelector("[data-invite-flagged]")?.textContent,
    ).toContain("not an address");
    expect(screen.getByRole("status").textContent).toMatch(/2 added/);
    expect(screen.getByRole("status").textContent).toMatch(/1 needs a look/);
  });

  it("typing one address and pressing Enter adds it", async () => {
    const field = mount();
    fireEvent.change(field, { target: { value: "Ana@Example.com" } });
    await act(async () => {
      fireEvent.keyDown(field, { key: "Enter" });
    });
    expect(addInvitesAction).toHaveBeenCalledWith({
      eventId: EVENT,
      emails: ["ana@example.com"],
    });
  });

  it("★ listing someone who waits at the door says she came in (build 23's BUG-2)", async () => {
    addInvitesAction.mockResolvedValue({
      ok: true,
      result: {
        added: 1,
        already: 0,
        invalid: 0,
        overCap: 0,
        total: 3,
        admitted: 1,
      },
    });
    const field = mount();
    fireEvent.change(field, { target: { value: "wren@example.com" } });
    await act(async () => {
      fireEvent.keyDown(field, { key: "Enter" });
    });
    expect(screen.getByRole("status").textContent).toContain(
      "1 added. 1 person waiting at the door came in.",
    );
  });

  it("★ an address removed and added again comes back with the page's next read (build 23's NIT-4, the same shape)", async () => {
    removeInviteAction.mockResolvedValue({ ok: true });
    const maya = { email: "maya@example.com", joined: true };
    const jay = { email: "jay@example.com", joined: false };
    const view = render(
      <InvitedSection eventId={EVENT} invited={[maya, jay]} listIsTheDoor />,
    );
    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: "Remove jay@example.com" }),
      );
    });
    expect(
      document.querySelector("[data-invited='jay@example.com']"),
    ).toBeNull();
    // The removal's own revalidation: the list without her.
    view.rerender(
      <InvitedSection eventId={EVENT} invited={[maya]} listIsTheDoor />,
    );
    // Added again, and read again: the read is the truth, so she is back.
    view.rerender(
      <InvitedSection
        eventId={EVENT}
        invited={[maya, { ...jay }]}
        listIsTheDoor
      />,
    );
    expect(
      document.querySelector("[data-invited='jay@example.com']"),
    ).not.toBeNull();
  });

  it("a removal that fails puts the address back, with a sentence", async () => {
    removeInviteAction.mockResolvedValue({
      ok: false,
      message: "That didn't go through.",
    });
    mount();
    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: "Remove jay@example.com" }),
      );
    });
    expect(
      document.querySelector("[data-invited='jay@example.com']"),
    ).not.toBeNull();
    expect(toast.error).toHaveBeenCalled();
  });
});

describe("★ a list nobody is on, under a door that is not the list, sleeps (crumbs-87, the gap audit)", () => {
  const maya = { email: "maya@example.com", joined: true };

  it("says what the list does and what wakes it, with the way there, and draws no field to type into", () => {
    render(
      <InvitedSection eventId={EVENT} invited={[]} listIsTheDoor={false} />,
    );
    const section = document.querySelector("[data-invited-section]");
    expect(section?.hasAttribute("data-invited-asleep")).toBe(true);
    const line = document.querySelector("[data-dormant-summary]");
    // What it does when awake, and that it sends nothing: the paste box read as the way to invite her guests.
    expect(line?.textContent).toContain("does nothing yet");
    expect(line?.textContent).toContain("come straight in once they confirm");
    expect(line?.textContent).toContain("sends nothing");
    expect(
      screen.getByRole("link", { name: "Change who can get in" }),
    ).toHaveAttribute("href", settingsPageHref(EVENT, "door"));
    expect(screen.queryByLabelText("Add or paste addresses")).toBeNull();
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("is the whole section where the list is the way in, even with nobody on it yet", () => {
    render(<InvitedSection eventId={EVENT} invited={[]} listIsTheDoor />);
    expect(document.querySelector("[data-invited-asleep]")).toBeNull();
    expect(screen.getByLabelText("Add or paste addresses")).toBeEnabled();
  });

  it("keeps a list that already holds addresses awake under any door: they are hers to see and to remove", () => {
    render(
      <InvitedSection eventId={EVENT} invited={[maya]} listIsTheDoor={false} />,
    );
    expect(document.querySelector("[data-invited-asleep]")).toBeNull();
    expect(screen.getByLabelText("Add or paste addresses")).toBeEnabled();
    expect(
      screen.getByRole("button", { name: "Remove maya@example.com" }),
    ).toBeInTheDocument();
    // The note it always wore there, with its way to the door: nothing here says the list does something it does not.
    expect(
      screen.getByRole("link", { name: "Change who can get in" }),
    ).toHaveAttribute("href", settingsPageHref(EVENT, "door"));
  });

  it("does not fold under her hand when she removes the last address: the room's next read decides", async () => {
    removeInviteAction.mockResolvedValue({ ok: true });
    const view = render(
      <InvitedSection eventId={EVENT} invited={[maya]} listIsTheDoor={false} />,
    );
    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: "Remove maya@example.com" }),
      );
    });
    expect(document.querySelector("[data-invited-asleep]")).toBeNull();
    expect(screen.getByLabelText("Add or paste addresses")).toBeInTheDocument();
    // The removal's own revalidation brings the empty list: now the section is the sleeping one.
    view.rerender(
      <InvitedSection eventId={EVENT} invited={[]} listIsTheDoor={false} />,
    );
    expect(document.querySelector("[data-invited-asleep]")).not.toBeNull();
  });
});
