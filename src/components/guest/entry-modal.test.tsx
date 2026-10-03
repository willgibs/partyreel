/**
 * Behavior pins for the guest DOOR and the flow wiring that must survive the next shell swap.
 * Pins run at the desk width by default (the setup's matchMedia mock defaults to 1024px); the
 * shell is the same responsive Sheet at both widths, and its keyboard mechanics have their own
 * pins (`src/components/ui/sheet.test.tsx`). Behaviors only - no classes, no animation timings.
 *
 * ★ THE AFFORDANCE TABLE IS ONE ROW: no exit. Every step of the door is held, and the one free
 * surface is the album menu's "Change name".
 *
 * ★ WHO THE GUEST IS, TWO WAYS (Will, `identity-door` r1 `nudge`): a name-only event's chooser
 * (Continue as guest, Create account, Log in), and a verification event's one name-and-email
 * screen. The identify screen's own code request and hold have their pins beside it
 * (`identify-step.test.tsx`), against the real door.
 */
import { createRef } from "react";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { askCopy } from "@/components/guest/door/ask-step";
import { waitingCopy } from "@/components/guest/door/waiting-step";
import {
  EntryModal,
  type EntryModalHandle,
} from "@/components/guest/entry-modal";
import {
  onConfirmBeat,
  recordMomentPlayed,
  type ConfirmBeat,
} from "@/lib/guest/confirm-beat";
import {
  HOUSE_HUES,
  publishDoorHues,
  resetDoorLightForTests,
} from "@/lib/guest/door-light";
import { resetKeepAskForTests } from "@/lib/guest/keep-ask";
import type { QueueItem } from "@/lib/guest/use-upload-queue";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: (...args: unknown[]) => refresh(...args) }),
}));
// The code machinery is stubbed: it renders the surface's own field (`leading`), and exposes the
// send (`beforeSend`, which carries the name) and the verify, so the flow pins can run identify
// and Log in end to end without Supabase.
const sent = vi.hoisted(() => ({ gates: [] as unknown[] }));
vi.mock("@/components/auth/email-sign-in", () => ({
  EmailSignIn: ({
    onVerified,
    leading,
    beforeSend,
  }: {
    onVerified: (r: { existing: boolean; email: string }) => void;
    leading?: React.ReactNode;
    beforeSend?: () => unknown;
  }) => (
    <div data-testid="email-sign-in">
      {leading}
      <button
        type="button"
        data-testid="stub-send"
        onClick={() => sent.gates.push(beforeSend ? beforeSend() : {})}
      >
        send
      </button>
      <button
        type="button"
        data-testid="stub-verify"
        onClick={() =>
          onVerified({ existing: false, email: "priya@example.com" })
        }
      >
        verify
      </button>
    </div>
  ),
}));
const claimAnonymousUploads = vi.fn().mockResolvedValue(undefined);
vi.mock("@/lib/guest/claim-uploads", () => ({
  claimAnonymousUploads: (...args: unknown[]) => claimAnonymousUploads(...args),
}));
const updateDisplayNameAction = vi.fn().mockResolvedValue({ ok: true });
vi.mock("@/app/(app)/account/actions", () => ({
  updateDisplayNameAction: (...args: unknown[]) =>
    updateDisplayNameAction(...args),
}));
// The confirmation sequence reads this account's OWN profile row for a display name. Returns none
// by default, which is the case that makes the door's typed name matter.
const profileName = { value: null as string | null };
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { getUser: async () => ({ data: { user: { id: "u1" } } }) },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: { display_name: profileName.value },
          }),
        }),
      }),
    }),
  }),
}));
// The arrival BEAT (its own pins in use-arrival-beat.test.ts) just delays the
// auto-open; here it must resolve instantly so the surface renders for the
// affordance/flow assertions.
vi.mock("@/lib/guest/use-arrival-beat", async (orig) => ({
  ...(await orig<typeof import("@/lib/guest/use-arrival-beat")>()),
  useArrivalBeat: () => true,
}));

const QR = "testtoken1234";

/** A first-time guest at a plain, name-only, upload-open event with no switch on. */
function renderModal(
  props: Partial<React.ComponentProps<typeof EntryModal>> = {},
) {
  const ref = createRef<EntryModalHandle>();
  const utils = render(
    <EntryModal
      ref={ref}
      qrToken={QR}
      eventName="Test Wedding"
      access="full"
      gate={null}
      hasContributed={false}
      contributed={false}
      returning={false}
      uploadsOpen
      requireUpload={false}
      albumEmpty={false}
      isOwner={false}
      isDemo={false}
      isVerified={false}
      hasProfileName={false}
      queue={[]}
      onSend={vi.fn()}
      onRetry={vi.fn()}
      onDismissFailures={vi.fn()}
      {...props}
    />,
  );
  return { ref, ...utils };
}

const closeButton = () => screen.queryByRole("button", { name: "Close" });
/** The welcome's flag is a cookie (the page's server reads it): this device has met the welcome. */
const seeWelcome = () => {
  document.cookie = `pr_welcome_${QR}=1; path=/`;
};
const welcomeCookie = () =>
  document.cookie
    .split(";")
    .map((part) => part.trim())
    .includes(`pr_welcome_${QR}=1`);
const pick = (name: "Continue as guest" | "Create account" | "Log in") =>
  fireEvent.click(screen.getByRole("button", { name }));
/** A welcomed guest at a name-only event, past the chooser on the guest path. */
function atNameStep(
  props: Partial<React.ComponentProps<typeof EntryModal>> = {},
) {
  seeWelcome();
  const utils = renderModal(props);
  pick("Continue as guest");
  return utils;
}
const VERIFY_EVENT = { access: "teaser", gate: "account" } as const;

const beats: ConfirmBeat[] = [];
let stopBeats: () => void = () => {};

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  document.cookie = `pr_welcome_${QR}=; path=/; max-age=0`;
  profileName.value = null;
  sent.gates.length = 0;
  global.fetch = vi.fn();
  resetKeepAskForTests();
  recordMomentPlayed(QR, false);
  beats.length = 0;
  stopBeats();
  stopBeats = onConfirmBeat((beat) => beats.push(beat));
});

describe("no exit: the affordance table is one row", () => {
  it("HOLDS the welcome, whatever follows it", () => {
    renderModal({ access: "none", gate: "password" });
    expect(screen.getByText("Test Wedding")).toBeInTheDocument();
    expect(closeButton()).not.toBeInTheDocument();
  });

  it("HOLDS the welcome of a plain event too (there is always a step behind it)", () => {
    renderModal();
    expect(closeButton()).not.toBeInTheDocument();
  });

  it("★ a photos-only album's invitation promises photos, never videos (build 23's NIT-9)", () => {
    renderModal({ acceptsVideo: false });
    expect(
      screen.getByText("Add your photos in seconds. No app required."),
    ).toBeInTheDocument();
    expect(screen.queryByText(/photos and videos/)).not.toBeInTheDocument();
  });

  it("an album that takes videos says so", () => {
    renderModal({ acceptsVideo: true });
    expect(
      screen.getByText(
        "Add your photos and videos in seconds. No app required.",
      ),
    ).toBeInTheDocument();
  });

  it("never offers 'Just browsing' or 'View the album': Continue is the only way on", () => {
    renderModal();
    expect(
      screen.queryByRole("button", { name: "Just browsing" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "View the album" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Continue" }),
    ).toBeInTheDocument();
  });

  it("HOLDS the password step (no X, Escape inert)", () => {
    seeWelcome();
    renderModal({ access: "none", gate: "password" });
    expect(screen.getByLabelText("Event password")).toBeInTheDocument();
    expect(closeButton()).not.toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.getByLabelText("Event password")).toBeInTheDocument();
  });

  // Build 14's red-team: the sheet still described the gate in words it no longer shows ("Enter
  // the event password to view it.") under voice-guest's `ask=warm` line. The door announces what
  // the step shows, so a screen reader hears one door.
  it("names and describes the password step in its own heading's words", () => {
    seeWelcome();
    renderModal({ access: "none", gate: "password" });
    const door = screen.getByRole("dialog");
    const heading = door.querySelector("[data-door-heading]");
    const title = heading?.querySelector("h1")?.textContent ?? "";
    const reason = heading?.querySelector("h1 + p")?.textContent ?? "";
    expect(reason).not.toBe("");
    expect(door).toHaveAccessibleName(title);
    expect(door).toHaveAccessibleDescription(reason);
  });

  it("HOLDS identify: no close, and Escape leaves it standing", () => {
    seeWelcome();
    renderModal({ ...VERIFY_EVENT, storedName: "Priya" });
    expect(screen.getByTestId("email-sign-in")).toBeInTheDocument();
    expect(closeButton()).not.toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.getByTestId("email-sign-in")).toBeInTheDocument();
  });

  it("HOLDS the chooser and the name step", () => {
    seeWelcome();
    renderModal();
    expect(
      screen.getByRole("button", { name: "Continue as guest" }),
    ).toBeInTheDocument();
    expect(closeButton()).not.toBeInTheDocument();
    pick("Continue as guest");
    expect(screen.getByLabelText("Your name")).toBeInTheDocument();
    expect(closeButton()).not.toBeInTheDocument();
  });

  it("frees the album menu's Change name, the one door with something behind it", () => {
    seeWelcome();
    const { ref } = renderModal({ storedName: "Priya", returning: true });
    act(() => ref.current!.openToName("edit"));
    expect(screen.getAllByText("Change your name").length).toBeGreaterThan(0);
    expect(closeButton()).toBeInTheDocument();
  });

  it("the owner never sees the surface, gate or no", () => {
    renderModal({ isOwner: true, access: "none", gate: "password" });
    expect(screen.queryByText("Test Wedding")).not.toBeInTheDocument();
    renderModal({ isOwner: true, ...VERIFY_EVENT });
    expect(screen.queryByTestId("email-sign-in")).not.toBeInTheDocument();
  });
});

describe("the chooser: how a guest comes in on a name-only event", () => {
  it("Continue advances welcome -> the chooser and marks the welcome seen", () => {
    renderModal();
    expect(screen.getByText("You’re invited to")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(
      screen.getByRole("button", { name: "Continue as guest" }),
    ).toBeInTheDocument();
    expect(welcomeCookie()).toBe(true);
  });

  it("offers his three ways in, in his order, Continue as guest first", () => {
    seeWelcome();
    const { baseElement } = renderModal();
    const chooser = baseElement.querySelector<HTMLElement>(
      "[data-door-chooser]",
    )!;
    // By their accessible names: each button's small line is its description, not its name.
    expect(
      within(chooser)
        .getAllByRole("button")
        .map((b) => b.getAttribute("aria-label")),
    ).toEqual(["Continue as guest", "Create account", "Log in"]);
  });

  /* ★ EACH WAY IN SAYS WHAT IT GIVES (`identity-door` r3, Will's `chooser=told`): the sentence over
     the three is gone, and each button carries its own small line, read after its name. */
  it("each way in carries its own line, and the sentence over them is gone", () => {
    seeWelcome();
    const { baseElement } = renderModal();
    const chooser = baseElement.querySelector<HTMLElement>(
      "[data-door-chooser]",
    )!;
    const way = (name: string) => within(chooser).getByRole("button", { name });
    expect(way("Continue as guest")).toHaveAccessibleDescription(
      "Just your name",
    );
    expect(way("Create account")).toHaveAccessibleDescription(
      "Every photo you add stays with you",
    );
    expect(way("Log in")).toHaveAccessibleDescription(
      "The photos you add join your account",
    );
    expect(
      within(chooser).queryByText(
        "A name is all it takes. With an account, every photo you add stays with you.",
      ),
    ).toBeNull();
  });

  it("Continue as guest is the name step, the email a closed ghost line under it", () => {
    atNameStep();
    expect(screen.getByLabelText("Your name")).toBeInTheDocument();
    expect(screen.queryByLabelText("Email (optional)")).toBeNull();
    expect(
      screen.getByRole("button", { name: "Add an email to come back anytime" }),
    ).toBeInTheDocument();
  });

  it("Create account is identify: a name and an email, with no host's gate line", () => {
    seeWelcome();
    renderModal();
    pick("Create account");
    expect(screen.getAllByText("Create your account")[0]).toBeInTheDocument();
    expect(screen.getByLabelText("Your name")).toBeInTheDocument();
    expect(screen.getByTestId("email-sign-in")).toBeInTheDocument();
    expect(
      screen.queryByText(
        "The host has asked guests to confirm an email for safety. One tap and you're in.",
      ),
    ).toBeNull();
    // Google lives under Log in, not here.
    expect(screen.queryByRole("button", { name: /google/i })).toBeNull();
  });

  it("Log in is the account door with every member's way in, Google included", () => {
    seeWelcome();
    renderModal();
    pick("Log in");
    expect(screen.getAllByText("Log in").length).toBeGreaterThan(0);
    expect(screen.getByTestId("email-sign-in")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /continue with google/i }),
    ).toBeInTheDocument();
    // Its line is true before a single photo: nothing speaks of photos already added.
    expect(screen.queryByText(/photos you added/i)).toBeNull();
  });

  it("each way in goes back to the chooser, which forgets the pick", () => {
    seeWelcome();
    renderModal();
    for (const way of [
      "Continue as guest",
      "Create account",
      "Log in",
    ] as const) {
      pick(way);
      fireEvent.click(
        screen.getByRole("button", { name: "Back to how you join" }),
      );
      expect(
        screen.getByRole("button", { name: "Continue as guest" }),
      ).toBeInTheDocument();
    }
    // Nothing about the pick was ever persisted.
    expect(JSON.stringify(localStorage)).not.toMatch(/guest|create|login/i);
  });

  it("the chooser goes back to the welcome", () => {
    seeWelcome();
    renderModal();
    fireEvent.click(
      screen.getByRole("button", { name: "Back to the welcome" }),
    );
    expect(screen.getByText("You’re invited to")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(
      screen.getByRole("button", { name: "Continue as guest" }),
    ).toBeInTheDocument();
  });

  it("a returning guest with a name and nothing owed meets nothing at all", () => {
    seeWelcome();
    renderModal({ storedName: "Priya", returning: true });
    expect(screen.queryByText("Test Wedding")).not.toBeInTheDocument();
  });

  it("a confirmed account never meets the chooser: named, the upload; nameless, its name", () => {
    seeWelcome();
    renderModal({ isVerified: true, hasProfileName: true });
    expect(
      screen.queryByRole("button", { name: "Continue as guest" }),
    ).toBeNull();
    expect(screen.getAllByText("Add your photos").length).toBeGreaterThan(0);
    cleanup();
    renderModal({ isVerified: true, hasProfileName: false });
    expect(
      screen.queryByRole("button", { name: "Continue as guest" }),
    ).toBeNull();
    expect(
      screen.getAllByText(
        "Your name goes on the photos you add. It becomes your Partyreel name too.",
      )[0],
    ).toBeInTheDocument();
  });
});

/**
 * ★ WHERE VERIFICATION IS REQUIRED, THE EMAIL COMES FIRST AND THE NAME AFTER (Will, 2026-10-02, on his live
 * walk, where "Will Test Mobile" typed at the door was credited "Will Gibson" with no word: "where verification
 * is required i think it makes more sense to handle name after so we aren't handling two different versions for
 * every new event on that account"). Reshaped on purpose: these pins held a name and an email on one screen.
 */
describe("a verification event: one path, identify, the email first", () => {
  it("the welcome hands straight to identify, with no chooser: the email alone", () => {
    renderModal(VERIFY_EVENT);
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(
      screen.queryByRole("button", { name: "Continue as guest" }),
    ).toBeNull();
    expect(screen.queryByLabelText("Your name")).toBeNull();
    expect(screen.getByTestId("email-sign-in")).toBeInTheDocument();
  });

  it("sells the album with the host's ruled reason, under 'Almost in'", () => {
    seeWelcome();
    renderModal({ ...VERIFY_EVENT, mediaTotal: 12 });
    expect(screen.getByText("Almost in")).toBeInTheDocument();
    expect(
      screen.getAllByText("12 photos & videos are waiting")[0],
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(
        "The host has asked guests to confirm an email for safety. One tap and you're in.",
      )[0],
    ).toBeInTheDocument();
    // The code alone: Google and the password link live under Log in.
    expect(screen.queryByRole("button", { name: /google/i })).toBeNull();
  });

  it("asks no name before the code (nothing for an account's own name to overrule), and goes back to the welcome", () => {
    seeWelcome();
    renderModal(VERIFY_EVENT);
    expect(
      screen.queryByText(
        "If you already have a Partyreel account, its name is the one that shows.",
      ),
    ).toBeNull();
    // The code request carries no name either.
    fireEvent.click(screen.getByTestId("stub-send"));
    expect(sent.gates).toEqual([{}]);
    fireEvent.click(
      screen.getByRole("button", { name: "Back to the welcome" }),
    );
    expect(screen.getByText("You’re invited to")).toBeInTheDocument();
  });

  it("★ a confirmed account with no name is asked its name next, as its own (the name after the email)", () => {
    seeWelcome();
    renderModal({ isVerified: true, hasProfileName: false });
    expect(screen.getByLabelText("Your name")).toBeInTheDocument();
    expect(
      screen.getAllByText(
        "Your name goes on the photos you add. It becomes your Partyreel name too.",
      )[0],
    ).toBeInTheDocument();
  });

  it("★ a confirmed account with a name is never asked one, whatever this device typed at an earlier door", () => {
    seeWelcome();
    renderModal({
      isVerified: true,
      hasProfileName: true,
      storedName: "Will Test Mobile",
      uploadsOpen: false,
    });
    expect(screen.queryByLabelText("Your name")).toBeNull();
    expect(document.querySelector("[data-door-stage]")).toBeNull();
  });

  it("★ a name this device typed at an earlier door never stands in for a nameless account's own", () => {
    seeWelcome();
    renderModal({
      isVerified: true,
      hasProfileName: false,
      storedName: "Old Guest Name",
    });
    expect(screen.getByLabelText("Your name")).toBeInTheDocument();
  });

  it("Create account on a name-only event still carries the name, and refuses a bad one in place", () => {
    seeWelcome();
    renderModal();
    pick("Create account");
    expect(
      screen.getByText(
        "If you already have a Partyreel account, its name is the one that shows.",
      ),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Your name"), {
      target: { value: "admin" },
    });
    fireEvent.click(screen.getByTestId("stub-send"));
    expect(screen.getByText("That name isn't available.")).toBeInTheDocument();
    expect(sent.gates).toEqual([false]);
  });
});

describe("the demo", () => {
  it("sees a role step of its own, never the guest's invitation copy", () => {
    renderModal({ isDemo: true });
    expect(screen.getByText("A live demo")).toBeInTheDocument();
    expect(screen.queryByText("You’re invited to")).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Start your own" }),
    ).toBeInTheDocument();
  });

  it("asks no name and meets no chooser: Continue goes straight to the upload step", () => {
    renderModal({ isDemo: true });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.queryByLabelText("Your name")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Continue as guest" }),
    ).toBeNull();
    expect(
      screen.getByRole("button", { name: "Take a photo" }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(
        "Add a photo the way a guest would. Nothing you add is saved.",
      )[0],
    ).toBeInTheDocument();
  });

  it('"Look around" is its skip, and it closes the door', () => {
    renderModal({ isDemo: true });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(screen.getByRole("button", { name: "Look around" }));
    expect(
      screen.queryByRole("button", { name: "Take a photo" }),
    ).not.toBeInTheDocument();
  });

  it("never opens the name door, even on the handle", () => {
    const { ref } = renderModal({ isDemo: true });
    act(() => ref.current!.openToName("edit"));
    expect(screen.queryAllByText("Change your name")).toHaveLength(0);
  });

  /* ── A demo treats every visit as a fresh one, even a returning one, so every demo runs end to
     end. Two halves: the welcome never trusts an old "seen" flag, and nothing along the way
     writes a new one. ── */

  it("shows the role welcome even when this browser's flag already says seen", () => {
    seeWelcome();
    renderModal({ isDemo: true });
    expect(screen.getByText("A live demo")).toBeInTheDocument();
  });

  it("Continue, then Look around, persists nothing: the NEXT mount is fresh too", () => {
    renderModal({ isDemo: true });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    // The skip must never call markSeen() for the demo: that flag is exactly the "returning"
    // state a demo must never reach.
    fireEvent.click(screen.getByRole("button", { name: "Look around" }));
    expect(welcomeCookie()).toBe(false);

    // The first instance already advanced past its own role step (Continue, then Look around);
    // the fresh instance shows it again. ★ Read inside the fresh one alone: the first's stage, the
    // doorway the role step stands at, stays drawn for the length of its fade as it leaves
    // (`STAGE_EXIT_MS`), so the page as a whole cannot tell the two instances apart for that moment.
    const fresh = renderModal({ isDemo: true });
    expect(
      within(fresh.container).getByText("A live demo"),
    ).toBeInTheDocument();
  });
});

describe("the upload step", () => {
  it("OFF: offers the ghost skip, which drops the step", () => {
    seeWelcome();
    renderModal({ storedName: "Priya" });
    fireEvent.click(screen.getByRole("button", { name: "Skip for now" }));
    expect(
      screen.queryByRole("button", { name: "Take a photo" }),
    ).not.toBeInTheDocument();
  });

  it("ON: there is no skip at all, and the line leaves the host unnamed", () => {
    seeWelcome();
    // hostName is passed on purpose: even with a real name available, the ON line must not use it
    // (a long host name breaks the design) - a regression here would still pass if the prop were
    // simply missing.
    renderModal({
      storedName: "Priya",
      requireUpload: true,
      access: "teaser",
      gate: "upload",
      hostName: "Maya",
    });
    expect(
      screen.queryByRole("button", { name: "Skip for now" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getAllByText(
        "The host has asked everyone to add a photo before the album opens.",
      )[0],
    ).toBeInTheDocument();
    expect(screen.queryByText(/Maya/)).not.toBeInTheDocument();
  });

  it("an empty album says so instead of counting a queue", () => {
    seeWelcome();
    renderModal({
      storedName: "Priya",
      requireUpload: true,
      access: "teaser",
      gate: "upload",
      albumEmpty: true,
    });
    expect(
      screen.getAllByText(
        "Nothing here yet. Add the first photo and the album opens.",
      )[0],
    ).toBeInTheDocument();
  });

  it("the inputs live INSIDE the open sheet, so Safari's synchronous click reaches them", () => {
    seeWelcome();
    const { baseElement } = renderModal({ storedName: "Priya" });
    const dialog = baseElement.querySelector('[role="dialog"]');
    expect(dialog?.querySelector('input[type="file"][multiple]')).toBeTruthy();
    expect(dialog?.querySelector('input[type="file"][capture]')).toBeTruthy();
  });

  it("Send hands the picks to the page's queue, never to a queue of its own", () => {
    seeWelcome();
    const onSend = vi.fn();
    const { baseElement } = renderModal({ storedName: "Priya", onSend });
    const album = baseElement.querySelector(
      'input[type="file"][multiple]',
    ) as HTMLInputElement;
    const file = new File([new Uint8Array([1])], "p.jpg", {
      type: "image/jpeg",
    });
    fireEvent.change(album, { target: { files: [file] } });
    fireEvent.click(screen.getByRole("button", { name: "Send 1" }));
    expect(onSend).toHaveBeenCalledWith([file]);
  });

  it("THE FAIL-OPEN is the server's: an unfixable run offers a refresh, never a local skip", () => {
    seeWelcome();
    const queue: QueueItem[] = [
      {
        id: "q1",
        file: new File([new Uint8Array([1])], "p.jpg", { type: "image/jpeg" }),
        kind: "photo",
        status: "error",
        progress: 0,
        error: "This album is full right now.",
        errorCode: "cap_reached",
      },
    ];
    renderModal({
      storedName: "Priya",
      requireUpload: true,
      access: "teaser",
      gate: "upload",
      queue,
    });
    expect(
      screen.getByText("This album is full right now."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Skip for now" }),
    ).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Continue without adding" }),
    );
    expect(refresh).toHaveBeenCalled();
  });

  it("a fixable run keeps its Retry and never offers the fail-open", () => {
    seeWelcome();
    const queue: QueueItem[] = [
      {
        id: "q1",
        file: new File([new Uint8Array([1])], "p.jpg", { type: "image/jpeg" }),
        kind: "photo",
        status: "error",
        progress: 0,
        error: "That upload did not finish.",
      },
    ];
    renderModal({ storedName: "Priya", queue });
    expect(
      screen.queryByRole("button", { name: "Continue without adding" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });
});

describe("the name step (Continue as guest)", () => {
  it("join mode POSTs the qr_token AND the name, and hands the token up", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        session_token: "sess-new",
        event_id: "evt-1",
        display_name: "Priya",
        verified: false,
      }),
    } as Response);
    const onNamed = vi.fn();
    atNameStep({ onNamed });
    fireEvent.change(screen.getByLabelText("Your name"), {
      target: { value: "Priya" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    await waitFor(() => expect(onNamed).toHaveBeenCalled());
    const [url, init] = vi.mocked(global.fetch).mock.calls[0];
    expect(url).toBe("/api/guests");
    expect(JSON.parse((init as RequestInit).body as string)).toMatchObject({
      qr_token: QR,
      display_name: "Priya",
    });
    expect(onNamed).toHaveBeenCalledWith({
      sessionToken: "sess-new",
      displayName: "Priya",
      source: "step",
      emailAttached: false,
      email: null,
    });
  });

  it("autofocuses nothing: the keyboard waits for the guest's own tap", () => {
    atNameStep();
    expect(screen.getByLabelText("Your name")).not.toHaveFocus();
  });

  /* ────────────────────────────────────────────────────────────────────────
     THE OPTIONAL ADDRESS, AS A GHOST LINE (his `field=ghost`). The pins are
     rules, not a look: closed by default; a tap opens the labelled field and
     puts focus inside it; genuinely optional; a typed address rides the SAME
     post as the name; and what the door believes afterwards is the ROW's
     answer, never the form's.
     ──────────────────────────────────────────────────────────────────────── */
  it("the ghost line opens into the labelled field, with focus inside the tap", () => {
    atNameStep();
    fireEvent.click(
      screen.getByRole("button", { name: "Add an email to come back anytime" }),
    );
    const field = screen.getByLabelText("Email (optional)");
    expect(field).toHaveAttribute("type", "email");
    expect(field).toHaveAttribute("autocomplete", "email");
    expect(field).toHaveFocus();
    expect(
      screen.getByText(
        "Come back to this album anytime, with every photo you add.",
      ),
    ).toBeInTheDocument();
    // Return on the name moves on to the address now that it is open.
    expect(screen.getByLabelText("Your name")).toHaveAttribute(
      "enterkeyhint",
      "next",
    );
  });

  it("is skippable: Continue with the line closed sends no `email` key at all", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        session_token: "s",
        display_name: "Priya",
      }),
    } as Response);
    const onNamed = vi.fn();
    atNameStep({ onNamed });
    fireEvent.change(screen.getByLabelText("Your name"), {
      target: { value: "Priya" },
    });
    expect(screen.getByLabelText("Your name")).toHaveAttribute(
      "enterkeyhint",
      "go",
    );
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    await waitFor(() => expect(onNamed).toHaveBeenCalled());
    expect(
      JSON.parse(
        (vi.mocked(global.fetch).mock.calls[0][1] as RequestInit)
          .body as string,
      ),
    ).toEqual({ qr_token: QR, display_name: "Priya" });
  });

  it("carries a typed address in the SAME post, and hands the flag up", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        session_token: "sess-new",
        display_name: "Priya",
        email_attached: true,
      }),
    } as Response);
    const onNamed = vi.fn();
    atNameStep({ onNamed });
    fireEvent.change(screen.getByLabelText("Your name"), {
      target: { value: "Priya" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Add an email to come back anytime" }),
    );
    fireEvent.change(screen.getByLabelText("Email (optional)"), {
      target: { value: "Priya@Example.com " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    await waitFor(() => expect(onNamed).toHaveBeenCalled());
    expect(vi.mocked(global.fetch).mock.calls).toHaveLength(1);
    expect(
      JSON.parse(
        (vi.mocked(global.fetch).mock.calls[0][1] as RequestInit)
          .body as string,
      ),
    ).toMatchObject({
      qr_token: QR,
      display_name: "Priya",
      email: "priya@example.com",
    });
    expect(onNamed).toHaveBeenCalledWith(
      expect.objectContaining({
        emailAttached: true,
        email: "priya@example.com",
      }),
    );
  });

  it("refuses a junk address IN PLACE, under its own field, before anything is sent", async () => {
    atNameStep();
    fireEvent.change(screen.getByLabelText("Your name"), {
      target: { value: "Priya" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Add an email to come back anytime" }),
    );
    fireEvent.change(screen.getByLabelText("Email (optional)"), {
      target: { value: "priya@@example" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    await waitFor(() =>
      expect(screen.getByText("Check that email address.")).toBeInTheDocument(),
    );
    expect(global.fetch).not.toHaveBeenCalled();
    // The name's own hint is untouched: each refusal sits under its question. (The hint's words
    // moved with `hint=change`, identity-door r3; the pin is the untouched slot, as it was.)
    expect(screen.getByText("You can change it anytime.")).toBeInTheDocument();
  });

  // The row is the truth: a verified-required event and a confirmed session
  // both null the field before the insert, so a door that trusted its own form
  // would light the guest's menu up about an address no row carries.
  it("believes the ROW's email_attached, never the form's memory", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        session_token: "s",
        display_name: "Priya",
      }),
    } as Response);
    const onNamed = vi.fn();
    atNameStep({ onNamed });
    fireEvent.change(screen.getByLabelText("Your name"), {
      target: { value: "Priya" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Add an email to come back anytime" }),
    );
    fireEvent.change(screen.getByLabelText("Email (optional)"), {
      target: { value: "priya@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    await waitFor(() => expect(onNamed).toHaveBeenCalled());
    expect(onNamed).toHaveBeenCalledWith(
      expect.objectContaining({ emailAttached: false, email: null }),
    );
  });

  it("says 'the host', whoever the host is", () => {
    atNameStep({ hostName: "Will Gibson" });
    expect(
      screen.getAllByText(
        "Your name goes on the photos you add, so the host knows who to thank.",
      )[0],
    ).toBeInTheDocument();
    expect(screen.queryByText(/Will Gibson knows who to thank/)).toBeNull();
  });

  it("PROFILE mode writes the account's own name, not a guest row", async () => {
    seeWelcome();
    const onNamed = vi.fn();
    renderModal({ isVerified: true, hasProfileName: false, onNamed });
    // No address: a confirmed account already has the only one that counts.
    expect(
      screen.queryByRole("button", {
        name: "Add an email to come back anytime",
      }),
    ).toBeNull();
    fireEvent.change(screen.getByLabelText("Your name"), {
      target: { value: "Priya" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    await waitFor(() =>
      expect(updateDisplayNameAction).toHaveBeenCalledWith("Priya"),
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("refuses a reserved name IN PLACE, before anything is sent", async () => {
    atNameStep();
    fireEvent.change(screen.getByLabelText("Your name"), {
      target: { value: "admin" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    await waitFor(() =>
      expect(
        screen.getByText("That name isn't available."),
      ).toBeInTheDocument(),
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("edit mode renames the row this device holds, and never mints a second one", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, display_name: "Priya S" }),
    } as Response);
    seeWelcome();
    const { ref } = renderModal({
      storedName: "Priya",
      sessionToken: "sess-1",
      returning: true,
    });
    act(() => ref.current!.openToName("edit"));
    fireEvent.change(screen.getByLabelText("Your name"), {
      target: { value: "Priya S" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save name" }));
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    expect(vi.mocked(global.fetch).mock.calls[0][0]).toBe("/api/guests/name");
  });
});

describe("the confirmation sequence (identify and Log in share it)", () => {
  const verifiedJoin = () =>
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        session_token: "sess-verified",
        event_id: "evt-1",
        display_name: null,
        verified: true,
      }),
    } as Response);

  it("★ an email-first event's writes: claims, then joins nameless, and writes no name (one is asked after, where the account has none)", async () => {
    verifiedJoin();
    seeWelcome();
    const onNamed = vi.fn();
    renderModal({ ...VERIFY_EVENT, onNamed });
    fireEvent.click(screen.getByTestId("stub-send"));
    expect(sent.gates).toEqual([{}]);
    fireEvent.click(screen.getByTestId("stub-verify"));
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(claimAnonymousUploads).toHaveBeenCalled();
    const joinCall = vi
      .mocked(global.fetch)
      .mock.calls.find((c) => c[0] === "/api/guests");
    expect(
      JSON.parse((joinCall![1] as RequestInit).body as string).display_name,
    ).toBeUndefined();
    // Nothing was typed, so nothing is written; the door asks the name next where the account has none.
    expect(updateDisplayNameAction).not.toHaveBeenCalled();
    expect(onNamed).toHaveBeenCalledWith(
      expect.objectContaining({ source: "verified" }),
    );
  });

  it("the four writes on Create account: claims, then joins nameless, then writes the typed name, then refreshes", async () => {
    verifiedJoin();
    seeWelcome();
    const onNamed = vi.fn();
    renderModal({ onNamed });
    pick("Create account");
    fireEvent.change(screen.getByLabelText("Your name"), {
      target: { value: "Priya" },
    });
    // The code request carries the name as the new user's metadata.
    fireEvent.click(screen.getByTestId("stub-send"));
    expect(sent.gates).toEqual([{ data: { door_name: "Priya" } }]);
    // Nothing is posted to Partyreel before the code confirms.
    expect(global.fetch).not.toHaveBeenCalled();
    expect(localStorage.getItem("pr_guest_name_last")).toBe("Priya");
    expect(localStorage.getItem(`pr_guest_name_${QR}`)).toBeNull();

    fireEvent.click(screen.getByTestId("stub-verify"));
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(claimAnonymousUploads).toHaveBeenCalled();
    // The join carries NO name: create_guest nulls one beside a confirmed account.
    const joinCall = vi
      .mocked(global.fetch)
      .mock.calls.find((c) => c[0] === "/api/guests");
    expect(joinCall).toBeTruthy();
    expect(
      JSON.parse((joinCall![1] as RequestInit).body as string).display_name,
    ).toBeUndefined();
    // The account had no name, so the typed one becomes it.
    expect(updateDisplayNameAction).toHaveBeenCalledWith("Priya");
    expect(localStorage.getItem(`pr_guest_name_${QR}`)).toBe("Priya");
    expect(onNamed).toHaveBeenCalledWith(
      expect.objectContaining({ source: "verified" }),
    );
    // The order is the point: the claim lands before the join.
    expect(claimAnonymousUploads.mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(global.fetch).mock.invocationCallOrder[0],
    );
  });

  it("an account that already has a name keeps it: the typed one is not written", async () => {
    profileName.value = "Priyanka";
    verifiedJoin();
    seeWelcome();
    renderModal();
    pick("Create account");
    fireEvent.change(screen.getByLabelText("Your name"), {
      target: { value: "Priya" },
    });
    fireEvent.click(screen.getByTestId("stub-send"));
    fireEvent.click(screen.getByTestId("stub-verify"));
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(updateDisplayNameAction).not.toHaveBeenCalled();
    expect(localStorage.getItem(`pr_guest_name_${QR}`)).toBe("Priyanka");
  });

  it("Log in runs the same writes, with no typed name to write", async () => {
    verifiedJoin();
    seeWelcome();
    renderModal();
    pick("Log in");
    fireEvent.click(screen.getByTestId("stub-verify"));
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(claimAnonymousUploads).toHaveBeenCalled();
    expect(
      vi.mocked(global.fetch).mock.calls.some((c) => c[0] === "/api/guests"),
    ).toBe(true);
    expect(updateDisplayNameAction).not.toHaveBeenCalled();
  });

  it("the success hold is dismissal-proof and plays the beat", async () => {
    seeWelcome();
    renderModal({ ...VERIFY_EVENT, storedName: "Priya" });
    fireEvent.click(screen.getByTestId("stub-verify"));
    await waitFor(() =>
      expect(screen.getByText("You’re in")).toBeInTheDocument(),
    );
    expect(closeButton()).not.toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.getByText("You’re in")).toBeInTheDocument();
  });
});

describe("the back affordance", () => {
  it('a step\'s chevron re-shows the welcome, whose own primary always reads "Continue", and returns without touching the machine', () => {
    // ★ Back is never bidirectional. The re-shown welcome keeps "Continue" as its primary so going
    // forward again reads clearly, and back/continue works the way everyone already reads
    // prev/next. The CHEVRON that brought the guest here keeps saying "Back to X" (its own
    // affordance, pinned here and below); only the re-shown sheet's own primary button is a flat
    // "Continue", never "Back" or "Back to the password".
    seeWelcome();
    renderModal({ access: "none", gate: "password" });
    fireEvent.click(
      screen.getByRole("button", { name: "Back to the welcome" }),
    );
    expect(screen.getByText("You’re invited to")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^Back/ }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByLabelText("Event password")).toBeInTheDocument();
  });

  it("the upload step goes back to the NAME, the step it followed", () => {
    seeWelcome();
    renderModal({ storedName: "Priya" });
    fireEvent.click(screen.getByRole("button", { name: "Back to your name" }));
    expect(screen.getByLabelText("Your name")).toBeInTheDocument();
  });

  it("no chevron on the welcome itself", () => {
    renderModal({ access: "none", gate: "password" });
    expect(
      screen.queryByRole("button", { name: "Back to the welcome" }),
    ).not.toBeInTheDocument();
  });

  it("a focused field lets go before its step leaves (the keyboard never loses its field)", () => {
    atNameStep();
    const field = screen.getByLabelText("Your name");
    act(() => field.focus());
    expect(field).toHaveFocus();
    fireEvent.click(
      screen.getByRole("button", { name: "Back to how you join" }),
    );
    expect(document.activeElement).not.toBe(field);
    expect(
      screen.getByRole("button", { name: "Continue as guest" }),
    ).toBeInTheDocument();
  });
});

/**
 * THE KEEP, THE DOOR'S LAST SCREEN (`guest-capture` r1, `moment=first` and `shape=sheet-step`: "I
 * like bubbling it up front and center, so its clearly visible to either input email or
 * dismissed"). The page says when it is due; the door asks: what went, the offer, Confirm your
 * email in this same sheet, or Maybe later.
 */
describe("the keep: the door's last screen", () => {
  /** A named guest back on the album, her first photos just landed. */
  function atKeep(
    props: Partial<React.ComponentProps<typeof EntryModal>> = {},
  ) {
    seeWelcome();
    return renderModal({
      storedName: "Priya",
      returning: true,
      keepDue: true,
      keepCount: 2,
      hostName: "Maya",
      ...props,
    });
  }

  it("says what went, then asks to keep it, counting what landed", () => {
    atKeep();
    expect(screen.getByText("Sent")).toBeInTheDocument();
    expect(
      screen.getByText("Your 2 photos joined Maya\u2019s album."),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Keep this event").length).toBeGreaterThan(0);
    // The event she is keeping, by name, and hers counted inside it.
    expect(
      screen.getAllByText(
        "Confirm your email and Test Wedding stays in your account with your 2 photos, to come back to anytime.",
      ).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByRole("button", { name: /confirm your email/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Maybe later" }),
    ).toBeInTheDocument();
  });

  it("on an event that holds uploads, never says it joined the album", () => {
    atKeep({ keepHeld: true, keepCount: 1 });
    expect(
      screen.getByText("Your photo is waiting for approval."),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Keep this event").length).toBeGreaterThan(0);
  });

  // ★ Red-team 44's NIT: "Your 5 photos" with a video among them. The page says what went; the door hands it to the
  // offer it draws and to the words it names the sheet with, so the eye and the ear say the same.
  it("names what she sent, on the Sent line and in the sheet's own name alike", () => {
    atKeep({
      keepCount: 2,
      keepSent: { kinds: ["photo", "video"], camera: false },
    });
    expect(
      screen.getByText("Your 2 uploads joined Maya’s album."),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(
        "Confirm your email and Test Wedding stays in your account with your 2 uploads, to come back to anytime.",
      ).length,
    ).toBeGreaterThan(0);
    expect(screen.queryAllByText(/with your 2 photos/)).toHaveLength(0);
  });

  it("is HELD like every step: no X, Escape inert, and no chevron back into a finished upload", () => {
    atKeep();
    expect(closeButton()).not.toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(
      screen.getByRole("button", { name: "Maybe later" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^Back/ }),
    ).not.toBeInTheDocument();
  });

  it("Maybe later puts it down for this event on this device", () => {
    atKeep();
    fireEvent.click(screen.getByRole("button", { name: "Maybe later" }));
    expect(localStorage.getItem(`pr_save_prompt_${QR}`)).toBe("1");
  });

  it("Confirm writes the album's return marker BEFORE the account door shows, and claims nothing yet", () => {
    atKeep();
    expect(localStorage.getItem(`pr_pending_offer_${QR}`)).toBeNull();
    fireEvent.click(
      screen.getByRole("button", { name: /confirm your email/i }),
    );
    expect(localStorage.getItem(`pr_pending_offer_${QR}`)).toBe("1");
    expect(screen.getAllByText("Keep your photos").length).toBeGreaterThan(0);
    expect(screen.getByTestId("email-sign-in")).toBeInTheDocument();
    expect(claimAnonymousUploads).not.toHaveBeenCalled();
  });

  it("★ the keep rests the lamp, offer and confirm alike: its words stand at the sheet's top, where a bloom reads 2:1 in dark", () => {
    atKeep();
    const lamp = () =>
      document
        .querySelector("[data-door-lamp]")
        ?.getAttribute("data-door-lamp");
    expect(lamp()).toBe("base");
    fireEvent.click(
      screen.getByRole("button", { name: /confirm your email/i }),
    );
    expect(lamp()).toBe("base");
  });

  it("the account door's chevron goes back to the offer", () => {
    atKeep();
    fireEvent.click(
      screen.getByRole("button", { name: /confirm your email/i }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Back to keeping your photos" }),
    );
    expect(
      screen.getByRole("button", { name: "Maybe later" }),
    ).toBeInTheDocument();
  });

  it("a verified code: the claim, awaited, then the page stops asking and refreshes", async () => {
    const onKeepAnswered = vi.fn();
    atKeep({ onKeepAnswered, sessionToken: "sess-1" });
    fireEvent.click(
      screen.getByRole("button", { name: /confirm your email/i }),
    );
    fireEvent.click(screen.getByTestId("stub-verify"));
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(claimAnonymousUploads).toHaveBeenCalledWith({ silent: true });
    expect(onKeepAnswered).toHaveBeenCalled();
    expect(claimAnonymousUploads.mock.invocationCallOrder[0]).toBeLessThan(
      onKeepAnswered.mock.invocationCallOrder[0],
    );
    // The newsletter switch was off, so nothing was written for it.
    expect(
      vi
        .mocked(global.fetch)
        .mock.calls.some((c) => c[0] === "/api/guests/capture-email"),
    ).toBe(false);
  });

  it("writes the newsletter only when she turned it on", async () => {
    atKeep({ sessionToken: "sess-1" });
    fireEvent.click(
      screen.getByRole("button", { name: /confirm your email/i }),
    );
    fireEvent.click(
      screen.getByRole("switch", {
        name: /send me occasional partyreel updates/i,
      }),
    );
    fireEvent.click(screen.getByTestId("stub-verify"));
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    const call = vi
      .mocked(global.fetch)
      .mock.calls.find((c) => c[0] === "/api/guests/capture-email");
    expect(call).toBeTruthy();
    expect(JSON.parse((call![1] as RequestInit).body as string)).toEqual({
      session_token: "sess-1",
      newsletter_opt_in: true,
    });
  });

  it("★ one beat: a claim that played the follow moment reports nothing (its card says it all)", async () => {
    claimAnonymousUploads.mockImplementationOnce(async () => {
      recordMomentPlayed(QR, true);
      return { album: QR, here: 2, elsewhere: 1 };
    });
    atKeep();
    fireEvent.click(
      screen.getByRole("button", { name: /confirm your email/i }),
    );
    fireEvent.click(screen.getByTestId("stub-verify"));
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(beats).toEqual([]);
  });

  it("★ one beat: a claim that played none reports the other events once, the name for the page to settle", async () => {
    claimAnonymousUploads.mockImplementationOnce(async () => ({
      album: QR,
      here: 0,
      elsewhere: 2,
    }));
    atKeep();
    fireEvent.click(
      screen.getByRole("button", { name: /confirm your email/i }),
    );
    fireEvent.click(screen.getByTestId("stub-verify"));
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(beats).toEqual([
      { album: QR, name: null, elsewhere: 2, settle: true },
    ]);
  });
});

/**
 * NAME=TOLD AT THE DOOR (`guest-capture` r1): a confirmation at the door that wrote the typed name
 * as the account's reports it as the beat, for the page to say once the door has closed; Log in
 * types no name and tells none.
 */
describe("the confirmation's one beat", () => {
  const verifiedJoin = () =>
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        session_token: "sess-verified",
        event_id: "evt-1",
        display_name: null,
        verified: true,
      }),
    } as Response);

  it("Create account with a typed name: the name her photos now carry is reported", async () => {
    verifiedJoin();
    seeWelcome();
    renderModal();
    pick("Create account");
    fireEvent.change(screen.getByLabelText("Your name"), {
      target: { value: "Priya" },
    });
    fireEvent.click(screen.getByTestId("stub-send"));
    fireEvent.click(screen.getByTestId("stub-verify"));
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(beats).toEqual([{ album: QR, name: "Priya", elsewhere: 0 }]);
  });

  it("the account's own name wins, and that is the name told", async () => {
    profileName.value = "Priyanka";
    verifiedJoin();
    seeWelcome();
    renderModal();
    pick("Create account");
    fireEvent.change(screen.getByLabelText("Your name"), {
      target: { value: "Priya" },
    });
    fireEvent.click(screen.getByTestId("stub-send"));
    fireEvent.click(screen.getByTestId("stub-verify"));
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(beats).toEqual([{ album: QR, name: "Priyanka", elsewhere: 0 }]);
  });

  it("★ an email-first event types no name and tells none: nothing was typed for the account's to overrule", async () => {
    profileName.value = "Will Gibson";
    verifiedJoin();
    seeWelcome();
    renderModal(VERIFY_EVENT);
    fireEvent.click(screen.getByTestId("stub-send"));
    fireEvent.click(screen.getByTestId("stub-verify"));
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(beats).toEqual([]);
    // The account's name is the device's name for this album now.
    expect(localStorage.getItem(`pr_guest_name_${QR}`)).toBe("Will Gibson");
  });

  it("Log in types no name and tells none; the other events it carried are still said once", async () => {
    verifiedJoin();
    claimAnonymousUploads.mockImplementationOnce(async () => ({
      album: QR,
      here: 0,
      elsewhere: 3,
    }));
    seeWelcome();
    renderModal();
    pick("Log in");
    fireEvent.click(screen.getByTestId("stub-verify"));
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(beats).toEqual([{ album: QR, name: null, elsewhere: 3 }]);
  });
});

/** The account's Change (`name=told`'s): the free name door, writing the profile's own name. */
describe("the told name's Change: the account's edit door", () => {
  it("opens free, prefilled with the account's name, and writes the profile", async () => {
    const onNamed = vi.fn();
    seeWelcome();
    const { ref } = renderModal({
      isVerified: true,
      hasProfileName: true,
      storedName: "Priya",
      returning: true,
      onNamed,
    });
    act(() => ref.current?.openToName("account", "Priya Shah"));
    expect(screen.getAllByText("Change your name").length).toBeGreaterThan(0);
    const field = screen.getByLabelText("Your name") as HTMLInputElement;
    expect(field.value).toBe("Priya Shah");
    expect(closeButton()).toBeInTheDocument();
    fireEvent.change(field, { target: { value: "Priya S." } });
    fireEvent.click(screen.getByRole("button", { name: "Save name" }));
    await waitFor(() =>
      expect(updateDisplayNameAction).toHaveBeenCalledWith("Priya S."),
    );
    expect(global.fetch).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(onNamed).toHaveBeenCalledWith(
        expect.objectContaining({ displayName: "Priya S.", source: "edit" }),
      ),
    );
  });
});

/**
 * THE DOOR IS LIT (`identity-door` r2, `look=lit`): the lamp on every step of the sheet, blooming on
 * "You're in". ★ And the welcome stands at the doorway (`locked-door` r2, `family=doorway` and
 * `shape=shared`): the door is the page, so its light is the doorway's own, not a sheet's lamp.
 */
describe("the door's light", () => {
  it("the welcome stands at the doorway, its count the page's live number; every sheet step stands in the lamp", () => {
    renderModal({ mediaTotal: 48 });
    expect(
      document.querySelector("[data-door-stage] [data-door-way]"),
    ).not.toBeNull();
    expect(
      document.querySelector("[data-door-count-settled]")?.textContent,
    ).toBe("48");
    // No sheet has risen for the welcome: the door is the page.
    expect(document.querySelector("[data-door-lamp]")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(
      document
        .querySelector("[data-door-lamp]")
        ?.getAttribute("data-door-lamp"),
    ).toBe("base");
  });

  it("the lamp blooms on the success beat", async () => {
    seeWelcome();
    renderModal({ ...VERIFY_EVENT, storedName: "Priya" });
    fireEvent.click(screen.getByTestId("stub-verify"));
    await waitFor(() =>
      expect(screen.getByText("You’re in")).toBeInTheDocument(),
    );
    expect(
      document
        .querySelector("[data-door-lamp]")
        ?.getAttribute("data-door-lamp"),
    ).toBe("bloom");
  });

  /* ★ THE BEAT IN THE ALBUM'S LIGHT (`identity-door` r3, Will's `beat=lit`, overruling `hers`):
     "You're in" leads with the lit check, never the success green's disc, and it arrives IN PLACE
     (its own check and words are its entrance, so no side-by-side slide stacks on them). */
  it("'You're in' leads with the lit check and arrives in place", async () => {
    seeWelcome();
    renderModal({ ...VERIFY_EVENT, storedName: "Priya" });
    fireEvent.click(screen.getByTestId("stub-verify"));
    await waitFor(() =>
      expect(screen.getByText("You’re in")).toBeInTheDocument(),
    );
    const beat = document.querySelector('[data-door-beat="in"]');
    expect(beat?.querySelector('[data-door-check="mark"]')).not.toBeNull();
    expect(beat?.closest("[data-entry-step]")).toHaveAttribute(
      "data-dir",
      "place",
    );
  });

  /* ★ THE LIGHT IS THE DOOR'S NOW (`locked-door` r2's doorway, which drew the welcome's promises as its
     own lines, retiring `icons=lit`'s pools on the welcome): an open door wears the album's own hues and
     shows the album's own cover through its opening (r3's `reveal=through`, the page's `CoverPicture`),
     where she may see the album; a gate's door is shut, in the house five, and shows nothing of it, even
     handed the cover (Will, 2026-10-02: the door shows only what is shown today). */
  it("an open door wears the album's light and shows the album's cover through it; a gate's shows nothing", () => {
    publishDoorHues([12, 140, 222]);
    const cover = <p data-testid="cover">the cover</p>;
    try {
      const open = renderModal({ mediaTotal: 48, view: cover });
      const way = open.container.querySelector("[data-door-way]");
      expect(way?.getAttribute("data-door-way")).toBe("open");
      expect(way?.getAttribute("data-door-hues")).toBe("12,140,222");
      expect(
        way?.querySelector('[data-door-view="cover"] [data-testid="cover"]'),
      ).not.toBeNull();
      expect(open.container.querySelector("[data-door-pool]")).toBeNull();
      cleanup();

      const gate = renderModal({
        access: "none",
        gate: "password",
        view: cover,
      });
      const shut = gate.container.querySelector("[data-door-way]");
      expect(shut?.getAttribute("data-door-way")).toBe("shut");
      expect(shut?.getAttribute("data-door-hues")).toBe(
        HOUSE_HUES.slice(0, 3).join(","),
      );
      expect(shut?.querySelector('[data-testid="cover"]')).toBeNull();
      expect(shut?.querySelector("[data-door-view]")).toBeNull();
    } finally {
      resetDoorLightForTests();
    }
  });
});

/**
 * ★ THE DOOR AS THE PAGE (`locked-door` r2, Will's `family=doorway` and `shape=shared`): the steps a guest
 * reads AT the door stand on the stage as the doorway's own page (the welcome, the ask, the wait, the
 * moment she is let in), and the steps that ask something of her rise as the sheet: over the album she
 * has walked into at a Public album, over the door itself at a gate she is still outside.
 */
describe("the door as the page", () => {
  const stage = () => document.querySelector("[data-door-stage]");
  const stageWay = () =>
    document
      .querySelector("[data-door-stage] [data-door-way]")
      ?.getAttribute("data-door-way");
  const photo = () =>
    new File([new Uint8Array([1])], "a.jpg", { type: "image/jpeg" });
  /** The sheet, whose rising is what the stage's own steps never need. */
  const sheet = () => document.querySelector("[data-entry-sheet]");

  it("★ the held door stands on the stage, ajar, with no sheet, and her choice goes to the page's queue to hold", () => {
    seeWelcome();
    const onHold = vi.fn();
    renderModal({ access: "none", gate: "waiting", onHold });
    expect(stage()?.getAttribute("data-state")).toBe("open");
    // The door holds her as the sheet did: a modal layer, named by its own headline.
    expect(stage()?.getAttribute("role")).toBe("dialog");
    expect(screen.getByRole("dialog", { name: waitingCopy(null).title })).toBe(
      stage(),
    );
    expect(stageWay()).toBe("ajar");
    expect(sheet()).toBeNull();
    expect(screen.getByText("Waiting at the door")).toBeInTheDocument();
    const input = stage()!.querySelector<HTMLInputElement>(
      "[data-door-picks] input[type=file]",
    )!;
    const files = [photo()];
    fireEvent.change(input, { target: { files } });
    expect(onHold).toHaveBeenCalledWith(files);
  });

  it("★ let in: the door she waited at swings open on the stage, and what she chose goes in", async () => {
    seeWelcome();
    global.fetch = vi.fn(async (url: RequestInfo | URL) =>
      String(url).includes("/api/guests/door")
        ? ({ ok: true, json: async () => ({ standing: "in" }) } as Response)
        : ({ ok: false, json: async () => ({}) } as Response),
    );
    renderModal({
      access: "none",
      gate: "waiting",
      queue: [
        {
          id: "q1",
          file: photo(),
          kind: "photo",
          status: "queued",
          progress: 0,
        },
      ],
    });
    await waitFor(() =>
      expect(document.querySelector('[data-door-beat="in"]')).not.toBeNull(),
    );
    expect(stageWay()).toBe("open");
    expect(
      document
        .querySelector("[data-door-stage] [data-door-way]")
        ?.getAttribute("data-door-way-from"),
    ).toBe("ajar");
    expect(screen.getByText("You’re in")).toBeInTheDocument();
    expect(screen.getByText("Sending your 1 photo")).toBeInTheDocument();
    // The beat is the door's own: no sheet rises for it, and the page refreshes onto the album.
    expect(sheet()).toBeNull();
    expect(refresh).toHaveBeenCalled();
  });

  it("the ask stands on the stage, shut, with its way back to the welcome", () => {
    seeWelcome();
    renderModal({ access: "none", gate: "ask", isVerified: true });
    expect(stageWay()).toBe("shut");
    expect(sheet()).toBeNull();
    expect(
      screen.getByRole("button", { name: askCopy(null).primary }),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Back to the welcome" }),
    );
    expect(screen.getByText("You’re invited to")).toBeInTheDocument();
    expect(stageWay()).toBe("shut");
  });

  it("★ at a gate, the password's sheet rises over the door at rest: shut above it, with no words of its own", () => {
    seeWelcome();
    renderModal({ access: "none", gate: "password" });
    expect(stage()?.getAttribute("data-state")).toBe("open");
    expect(stageWay()).toBe("shut");
    expect(stage()?.querySelector("h1")).toBeNull();
    expect(sheet()).not.toBeNull();
    expect(screen.getByLabelText("Event password")).toBeInTheDocument();
  });

  it("at a Public album she walks through the open door: the stage leaves, the sheet rises over the album", () => {
    const onStageChange = vi.fn();
    renderModal({ onStageChange });
    expect(stageWay()).toBe("open");
    expect(onStageChange).toHaveBeenLastCalledWith(true);
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(stage()?.getAttribute("data-state")).toBe("closed");
    expect(onStageChange).toHaveBeenLastCalledWith(false);
    expect(
      screen.getByRole("button", { name: "Continue as guest" }),
    ).toBeInTheDocument();
  });

  /* ★ THE WALK THROUGH (locked-door r3's `reveal=through`, `door/stage-walk.ts`), run here on a recorded
     stand-in for the browser's animations (jsdom has none): her Continue is the walk, the stage holds her
     (taking no press, no sheet over it) until she has arrived on the album's cover, then goes, and the step
     the door still owes rises once the album has stood a moment. */
  describe("the walk through the open door", () => {
    let finish: () => void = () => {};
    let restore: () => void = () => {};
    afterEach(() => restore());
    beforeEach(() => {
      const arrive = Promise.withResolvers<void>();
      finish = () => arrive.resolve();
      const proto = HTMLElement.prototype as Partial<HTMLElement>;
      const width = Object.getOwnPropertyDescriptor(
        HTMLElement.prototype,
        "offsetWidth",
      );
      proto.animate = function () {
        return {
          ready: Promise.resolve(),
          finished: arrive.promise,
          startTime: null,
          currentTime: null,
          cancel: vi.fn(),
        } as unknown as Animation;
      };
      // The doorway's picture is laid out at the cover's own width (jsdom lays out nothing).
      Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
        configurable: true,
        get: () => 375,
      });
      const cover = document.createElement("section");
      cover.setAttribute("data-event-head", "album");
      document.body.appendChild(cover);
      vi.useFakeTimers();
      restore = () => {
        vi.useRealTimers();
        cover.remove();
        delete proto.animate;
        if (width) {
          Object.defineProperty(HTMLElement.prototype, "offsetWidth", width);
        }
      };
    });
    const afterFrames = (ms: number) =>
      act(async () => {
        await vi.advanceTimersByTimeAsync(ms);
      });
    const view = <div data-cover-picture="" />;

    it("★ her Continue walks her through: the stage holds until she arrives, then goes, and the sheet rises after a moment", async () => {
      renderModal({ view });
      fireEvent.click(screen.getByRole("button", { name: "Continue" }));
      // The walk is the compositor's from her press, before the page does any work of its own.
      expect(stage()?.hasAttribute("data-door-walking")).toBe(true);
      expect(welcomeCookie()).toBe(false);
      // A second press before her first stride is the same press.
      fireEvent.click(screen.getByRole("button", { name: "Continue" }));
      expect(welcomeCookie()).toBe(false);
      await afterFrames(40);
      // Its first frame drawn, the page's own work: the welcome is seen, and the stage holds her.
      expect(welcomeCookie()).toBe(true);
      expect(stage()?.getAttribute("data-state")).toBe("open");
      expect(stage()?.hasAttribute("inert")).toBe(true);
      expect(sheet()).toBeNull();

      await act(async () => finish());
      expect(stage()?.getAttribute("data-state")).toBe("closed");
      expect(stage()?.hasAttribute("data-door-walked")).toBe(true);
      expect(
        screen.queryByRole("button", { name: "Continue as guest" }),
      ).toBeNull();
      await afterFrames(500);
      expect(
        screen.getByRole("button", { name: "Continue as guest" }),
      ).toBeInTheDocument();
    });

    it("★ a walk that arrives before its first frame is drawn (a tab put away mid-walk) never leaves the door standing", async () => {
      renderModal({ view });
      fireEvent.click(screen.getByRole("button", { name: "Continue" }));
      await act(async () => finish());
      await afterFrames(40);
      expect(welcomeCookie()).toBe(true);
      expect(stage()?.getAttribute("data-state")).toBe("closed");
      await afterFrames(500);
      expect(
        screen.getByRole("button", { name: "Continue as guest" }),
      ).toBeInTheDocument();
    });
  });

  it("a stage that has left is gone once its fade has played", () => {
    vi.useFakeTimers();
    try {
      renderModal();
      fireEvent.click(screen.getByRole("button", { name: "Continue" }));
      expect(stage()).not.toBeNull();
      act(() => vi.advanceTimersByTime(1000));
      expect(stage()).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
});

/* ★ THE LINE UNDER HER NAME (`identity-door` r3, Will's `hint=change`): "You can change it
   anytime." where she is asked for a name, and nothing on the door that changes one. */
describe("the line under her name", () => {
  it("joining says she can change it anytime; Change name says nothing", () => {
    atNameStep();
    expect(screen.getByLabelText("Your name")).toHaveAccessibleDescription(
      "You can change it anytime.",
    );
    cleanup();
    seeWelcome();
    const { ref } = renderModal({ storedName: "Priya", returning: true });
    act(() => ref.current!.openToName("edit"));
    expect(
      screen.getByLabelText("Your name"),
    ).not.toHaveAccessibleDescription();
    expect(screen.queryByText("You can change it anytime.")).toBeNull();
  });
});
