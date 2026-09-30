/**
 * THE BLOCKED LIST AND THE WAY BACK (Will, `blocked=foot`, `restore=ask`): nothing renders while
 * nobody is blocked; each row names who and since when; Let back in confirms, and its "Also restore
 * their uploads" switch appears only while something can come back, off unless the host turns it on.
 */
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { UNVERIFIED_LABEL } from "@/components/shared/unverified-mark";
import type { BlockedPerson } from "@/lib/events/event-blocks";

// Hoisted: the mark's module reaches sonner through the sign-in card, before this file's body runs.
const { refresh, toast, letBackInAction } = vi.hoisted(() => ({
  refresh: vi.fn(),
  toast: { success: vi.fn(), error: vi.fn() },
  letBackInAction: vi.fn(),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("sonner", () => ({ toast }));
vi.mock("@/app/(app)/dashboard/[eventId]/guests/actions", () => ({
  letBackInAction: (...a: unknown[]) => letBackInAction(...a),
}));

const { BlockedSection } = await import("./blocked-section");

const person = (over: Partial<BlockedPerson> = {}): BlockedPerson => ({
  id: "b-sam",
  name: "Sam",
  verified: true,
  email: "sam@example.com",
  avatarUrl: null,
  seed: null,
  since: "Blocked Sep 28",
  restorable: 0,
  restorableUntil: null,
  lands: "in",
  ...over,
});

beforeEach(() => {
  vi.clearAllMocks();
  letBackInAction.mockResolvedValue({ ok: true, restored: 0, noRoom: 0 });
});

describe("BlockedSection", () => {
  it("renders nothing while nobody is blocked", () => {
    const { container } = render(
      <BlockedSection eventName="Party" people={[]} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("names who, since when, and marks a typed name", () => {
    render(
      <BlockedSection
        eventName="Party"
        people={[
          person(),
          person({ id: "b-theo", name: "Theo", verified: false, email: null }),
        ]}
      />,
    );
    const rows = screen.getAllByRole("listitem");
    expect(rows).toHaveLength(2);
    // Who, then since when: two halves, so a hand can set them on two lines and never cut the date.
    expect(within(rows[0]).getByText("sam@example.com")).toBeInTheDocument();
    expect(within(rows[0]).getByText("Blocked Sep 28")).toBeInTheDocument();
    expect(within(rows[1]).getByText("Typed a name")).toBeInTheDocument();
    expect(
      within(rows[1]).getByLabelText(new RegExp(UNVERIFIED_LABEL, "i")),
    ).toBeInTheDocument();
    expect(
      within(rows[0]).queryByLabelText(new RegExp(UNVERIFIED_LABEL, "i")),
    ).toBeNull();
  });

  it("with nothing to bring back, Let back in confirms with no switch and restores nothing", async () => {
    render(<BlockedSection eventName="Party" people={[person()]} />);
    fireEvent.click(screen.getByRole("button", { name: "Let back in" }));
    const dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).getByText("Let Sam back in?")).toBeInTheDocument();
    expect(within(dialog).queryByRole("switch")).toBeNull();
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Let back in" }),
    );
    await waitFor(() =>
      expect(letBackInAction).toHaveBeenCalledWith({
        blockId: "b-sam",
        restore: false,
      }),
    );
    expect(toast.success).toHaveBeenCalledWith("Sam can join again.", {
      description: undefined,
    });
    expect(refresh).toHaveBeenCalled();
  });

  it("★ a newcomer declined at the door hears she goes back there, before and after (build 23's NIT-3)", async () => {
    render(
      <BlockedSection
        eventName="Party"
        people={[person({ id: "b-wren", name: "Wren", lands: "door" })]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Let back in" }));
    const dialog = await screen.findByRole("alertdialog");
    expect(
      within(dialog).getByText(
        "They'll be back at the door, and you can let them in from there.",
      ),
    ).toBeInTheDocument();
    expect(within(dialog).queryByText(/add photos again/)).toBeNull();
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Let back in" }),
    );
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith("Wren is back at the door.", {
        description: undefined,
      }),
    );
    expect(refresh).toHaveBeenCalled();
  });

  it("★ a newcomer whose ask the password ended hears she meets it like anyone new, before and after (crumbs-24)", async () => {
    render(
      <BlockedSection
        eventName="Party"
        people={[person({ id: "b-wren", name: "Wren", lands: "password" })]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Let back in" }));
    const dialog = await screen.findByRole("alertdialog");
    expect(
      within(dialog).getByText(
        "They'll need the password to get in, like anyone new.",
      ),
    ).toBeInTheDocument();
    expect(
      within(dialog).queryByText(/add photos again|back at the door/),
    ).toBeNull();
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Let back in" }),
    );
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        "Wren can come in with the password.",
        { description: undefined },
      ),
    );
  });

  it("★ someone who was in, while the album is Only me, is told it stays closed until the host opens it, before and after (crumbs-27)", async () => {
    letBackInAction.mockResolvedValue({ ok: true, restored: 1, noRoom: 0 });
    render(
      <BlockedSection
        eventName="Party"
        people={[person({ name: "Sam", lands: "only_me", restorable: 1 })]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Let back in" }));
    const dialog = await screen.findByRole("alertdialog");
    expect(
      within(dialog).getByText(
        "Party is Only me right now, so they'll meet a closed album until you open it. Then they can add photos again.",
      ),
    ).toBeInTheDocument();
    // The old line, true only once the album opens, is not said now.
    expect(
      within(dialog).queryByText(/be able to open Party and add photos again/),
    ).toBeNull();
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Let back in" }),
    );
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith("Sam is no longer blocked.", {
        description: "1 upload is back where it was.",
      }),
    );
  });

  it("★ the restore is offered while something waits in Deleted, OFF by default", async () => {
    render(
      <BlockedSection
        eventName="Party"
        people={[person({ restorable: 2, restorableUntil: "October 28" })]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Let back in" }));
    const dialog = await screen.findByRole("alertdialog");
    const offer = within(dialog).getByRole("switch", {
      name: /Also restore their uploads/,
    });
    expect(offer).toHaveAttribute("aria-checked", "false");
    expect(
      within(dialog).getByText("2 uploads wait in Deleted until October 28."),
    ).toBeInTheDocument();
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Let back in" }),
    );
    await waitFor(() =>
      expect(letBackInAction).toHaveBeenCalledWith({
        blockId: "b-sam",
        restore: false,
      }),
    );
  });

  it("turning the restore on brings them back, and the toast says what could not", async () => {
    letBackInAction.mockResolvedValue({ ok: true, restored: 1, noRoom: 1 });
    render(
      <BlockedSection eventName="Party" people={[person({ restorable: 2 })]} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Let back in" }));
    const dialog = await screen.findByRole("alertdialog");
    fireEvent.click(within(dialog).getByRole("switch"));
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Let back in" }),
    );
    await waitFor(() =>
      expect(letBackInAction).toHaveBeenCalledWith({
        blockId: "b-sam",
        restore: true,
      }),
    );
    expect(toast.success).toHaveBeenCalledWith("Sam can join again.", {
      description:
        "1 upload is back where it was. 1 stayed in Deleted: the album is full.",
    });
  });

  it("a refusal keeps the confirm open and says why", async () => {
    letBackInAction.mockResolvedValue({
      ok: false,
      message: "That person or event is no longer available.",
    });
    render(<BlockedSection eventName="Party" people={[person()]} />);
    fireEvent.click(screen.getByRole("button", { name: "Let back in" }));
    const dialog = await screen.findByRole("alertdialog");
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Let back in" }),
    );
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "That person or event is no longer available.",
      ),
    );
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(refresh).not.toHaveBeenCalled();
  });
});
