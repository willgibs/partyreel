import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { holdAlbum } from "@/lib/guest/album-return";
import type { ClaimResult } from "@/lib/guest/claim-uploads";
import {
  onConfirmBeat,
  recordMomentPlayed,
  type ConfirmBeat,
} from "@/lib/guest/confirm-beat";

import { ConfirmEmailDialog } from "./confirm-email-dialog";

/**
 * THE ONE CONFIRM DOOR ON AN ALBUM (guest by upload, 2026-09-22). The offer card, the Unverified
 * mark and the name menu all open this, and what is pinned is the ORDER it runs in: the claim
 * first, awaited, then the opener's follow-through, so nothing redraws a credit before the uploads
 * are the account's. The door's own machinery is its own contract (account-door.test.tsx); here it
 * is a stub that reports what it was handed and fires `onVerified`.
 */
const { order, doorProps, claimed } = vi.hoisted(() => ({
  order: [] as string[],
  doorProps: { current: null as null | Record<string, unknown> },
  // What the claim carried, and whether it played the follow moment (the album's listener's call).
  claimed: {
    result: null as null | { album: string; here: number; elsewhere: number },
    moment: false,
  },
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
  CLAIMED_TOAST: "We added your uploads to your account.",
  claimAnonymousUploads: vi.fn(async (): Promise<ClaimResult | null> => {
    order.push("claim");
    // The album's listener runs INSIDE the claim; this stands in for its record (read lazily, at
    // call time, never while the mock is being built).
    if (claimed.result) {
      recordMomentPlayed(claimed.result.album, claimed.moment);
    }
    return claimed.result;
  }),
}));

const beats: ConfirmBeat[] = [];
let stopBeats: () => void = () => {};
let releaseAlbum: () => void = () => {};

beforeEach(() => {
  order.length = 0;
  doorProps.current = null;
  claimed.result = null;
  claimed.moment = false;
  beats.length = 0;
  stopBeats();
  stopBeats = onConfirmBeat((b) => beats.push(b));
  releaseAlbum();
  releaseAlbum = () => {};
  recordMomentPlayed("album-1", false);
});

describe("ConfirmEmailDialog", () => {
  it("claims first, awaited, then hands over to the opener", async () => {
    const onConfirmed = vi.fn(() => {
      order.push("opener");
    });
    render(
      <ConfirmEmailDialog
        open
        onOpenChange={vi.fn()}
        onConfirmed={onConfirmed}
      />,
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
      <ConfirmEmailDialog
        open
        onOpenChange={vi.fn()}
        hintEmail="priya@example.com"
      />,
    );
    expect(doorProps.current?.hintEmail).toBe("priya@example.com");
    unmount();
    render(<ConfirmEmailDialog open onOpenChange={vi.fn()} hintEmail={null} />);
    expect(doorProps.current?.hintEmail).toBeUndefined();
  });
});

/**
 * THE ONE BEAT (`guest-capture` r1, `confirm-beat.ts`). A confirmation says what it carried once:
 * when its claim plays the follow moment the card says everything, so the door reports nothing;
 * otherwise the door reports the other events, before the opener's own follow-through, and asks
 * the album page to settle the name her photographs now carry (`settle`) before it says both once.
 */
describe("ConfirmEmailDialog: the one beat", () => {
  it("no moment: reports one beat for the page to settle and say, before the opener's follow-through", async () => {
    releaseAlbum = holdAlbum("album-1");
    claimed.result = { album: "album-1", here: 0, elsewhere: 2 };
    const onConfirmed = vi.fn(() => {
      order.push("opener");
    });
    render(
      <ConfirmEmailDialog
        open
        onOpenChange={vi.fn()}
        onConfirmed={onConfirmed}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Finish confirming" }));
    await waitFor(() => expect(order).toEqual(["claim", "opener"]));
    expect(beats).toEqual([
      { album: "album-1", name: null, elsewhere: 2, settle: true },
    ]);
  });

  it("a claim that played the follow moment reports nothing: its card says it all", async () => {
    releaseAlbum = holdAlbum("album-1");
    claimed.result = { album: "album-1", here: 2, elsewhere: 1 };
    claimed.moment = true;
    const onConfirmed = vi.fn(() => {
      order.push("opener");
    });
    render(
      <ConfirmEmailDialog
        open
        onOpenChange={vi.fn()}
        onConfirmed={onConfirmed}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Finish confirming" }));
    await waitFor(() => expect(order).toEqual(["claim", "opener"]));
    expect(beats).toEqual([]);
  });

  it("wears the door's light: the lit scrim and the album's lamp", () => {
    render(<ConfirmEmailDialog open onOpenChange={vi.fn()} />);
    expect(document.querySelector("[data-door-lamp]")).not.toBeNull();
    expect(
      document.querySelector('[data-slot="sheet-overlay"]')?.className,
    ).toMatch(/backdrop-blur-\[28px\]/);
  });
});
