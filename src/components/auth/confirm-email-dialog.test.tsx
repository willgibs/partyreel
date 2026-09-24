import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ConfirmEmailDialog } from "./confirm-email-dialog";

/**
 * THE ONE CONFIRM DOOR ON AN ALBUM (guest by upload, 2026-09-22). The offer card, the Unverified
 * mark and the name menu all open this, and what is pinned is the ORDER it runs in: the claim
 * first, awaited, then the opener's follow-through, so nothing redraws a credit before the uploads
 * are the account's. The door's own machinery is its own contract (account-door.test.tsx); here it
 * is a stub that reports what it was handed and fires `onVerified`.
 */
const { order, doorProps } = vi.hoisted(() => ({
  order: [] as string[],
  doorProps: { current: null as null | Record<string, unknown> },
}));
vi.mock("@/components/auth/account-door", () => ({
  DOOR_WEAR: {
    keep: { heading: "Keep your photos", reason: "The keep reason." },
    signin: { heading: "Sign in", reason: "The sign-in reason." },
  },
  AccountDoor: (props: {
    onVerified: () => Promise<void>;
    children?: React.ReactNode;
  }) => {
    doorProps.current = props as unknown as Record<string, unknown>;
    return (
      <div>
        {props.children}
        <button type="button" onClick={() => void props.onVerified()}>
          Finish confirming
        </button>
      </div>
    );
  },
}));
vi.mock("@/lib/guest/claim-uploads", () => ({
  claimAnonymousUploads: vi.fn(async () => {
    order.push("claim");
    return null;
  }),
}));

beforeEach(() => {
  order.length = 0;
  doorProps.current = null;
});

describe("ConfirmEmailDialog", () => {
  it("claims first, awaited, then hands over to the opener", async () => {
    const onConfirmed = vi.fn(() => {
      order.push("opener");
    });
    render(
      <ConfirmEmailDialog open onOpenChange={vi.fn()} onConfirmed={onConfirmed} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Finish confirming" }));
    await waitFor(() => expect(order).toEqual(["claim", "opener"]));
  });

  it("wears keep by default: its heading and reason, a create intent and no password", () => {
    render(<ConfirmEmailDialog open onOpenChange={vi.fn()} />);
    expect(screen.getByText("Keep your photos")).toBeInTheDocument();
    expect(screen.getByText("The keep reason.")).toBeInTheDocument();
    expect(doorProps.current).toMatchObject({
      wear: "keep",
      intent: "create",
      methods: { code: true, google: true, password: false },
    });
  });

  it("as Sign in: a sign-in intent, and the password link for someone who has one", () => {
    render(<ConfirmEmailDialog open onOpenChange={vi.fn()} wear="signin" />);
    expect(doorProps.current).toMatchObject({
      wear: "signin",
      intent: "signin",
      methods: { code: true, google: true, password: true },
    });
  });

  it("lets an opener replace the reason with a fact only it knows, and carries its extra control", () => {
    render(
      <ConfirmEmailDialog
        open
        onOpenChange={vi.fn()}
        description="Enter the email you added and we will send a code."
      >
        <span>Newsletter switch</span>
      </ConfirmEmailDialog>,
    );
    expect(
      screen.getByText("Enter the email you added and we will send a code."),
    ).toBeInTheDocument();
    expect(screen.queryByText("The keep reason.")).toBeNull();
    expect(screen.getByText("Newsletter switch")).toBeInTheDocument();
  });

  it("hands the door the typed address as a hint, and no hint at all rather than an empty one", () => {
    const { unmount } = render(
      <ConfirmEmailDialog open onOpenChange={vi.fn()} hintEmail="priya@example.com" />,
    );
    expect(doorProps.current?.hintEmail).toBe("priya@example.com");
    unmount();
    render(<ConfirmEmailDialog open onOpenChange={vi.fn()} hintEmail={null} />);
    expect(doorProps.current?.hintEmail).toBeUndefined();
  });
});
