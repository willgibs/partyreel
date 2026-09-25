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

import {
  EntryModal,
  type EntryModalHandle,
} from "@/components/guest/entry-modal";
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
const seeWelcome = () => localStorage.setItem(`pr_welcome_${QR}`, "1");
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

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  profileName.value = null;
  sent.gates.length = 0;
  global.fetch = vi.fn();
});

// Radix's FocusScope restores focus on unmount from a `setTimeout(0)` that dispatches on its
// container. Unmount here and let that timer run while the document still exists: left pending, a
// loaded run can reach it after jsdom is torn down, where `dispatchEvent` throws as an unhandled
// error. (After hooks run in reverse order, so the setup file's own cleanup would come too late.)
afterEach(async () => {
  cleanup();
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
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
    expect(localStorage.getItem(`pr_welcome_${QR}`)).toBe("1");
  });

  it("offers his three ways in, in his order, Continue as guest first", () => {
    seeWelcome();
    const { baseElement } = renderModal();
    const chooser = baseElement.querySelector<HTMLElement>(
      "[data-door-chooser]",
    )!;
    expect(
      within(chooser)
        .getAllByRole("button")
        .map((b) => b.textContent),
    ).toEqual(["Continue as guest", "Create account", "Log in"]);
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

describe("a verification event: one path, identify", () => {
  it("the welcome hands straight to identify, with no chooser", () => {
    renderModal(VERIFY_EVENT);
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(
      screen.queryByRole("button", { name: "Continue as guest" }),
    ).toBeNull();
    expect(screen.getByLabelText("Your name")).toBeInTheDocument();
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

  it("says whose name wins before they confirm, and goes back to the welcome", () => {
    seeWelcome();
    renderModal(VERIFY_EVENT);
    expect(
      screen.getByText(
        "If you already have a Partyreel account, its name is the one that shows.",
      ),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Back to the welcome" }),
    );
    expect(screen.getByText("You’re invited to")).toBeInTheDocument();
  });

  it("refuses a bad name in place, and sends nothing", () => {
    seeWelcome();
    renderModal(VERIFY_EVENT);
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
    expect(localStorage.getItem(`pr_welcome_${QR}`)).toBeNull();

    // The first instance already advanced past its own role step (Continue, then Look around),
    // so this fresh instance is the ONLY thing that can show it now.
    renderModal({ isDemo: true });
    expect(screen.getByText("A live demo")).toBeInTheDocument();
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
    expect(
      screen.getByRole("button", { name: "Try again" }),
    ).toBeInTheDocument();
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
    // The name's own hint is untouched: each refusal sits under its question.
    expect(
      screen.getByText("Just a name. Nobody has to prove a name."),
    ).toBeInTheDocument();
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

  it("the four writes: claims, then joins nameless, then writes the typed name, then refreshes", async () => {
    verifiedJoin();
    seeWelcome();
    const onNamed = vi.fn();
    renderModal({ ...VERIFY_EVENT, onNamed });
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
    renderModal(VERIFY_EVENT);
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
