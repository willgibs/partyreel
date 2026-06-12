/**
 * Behavior pins for the entry surface's HONEST-AFFORDANCE table (Phase 4.5
 * S2) + the flow wiring that must survive the shell swap. Pins run the
 * DESKTOP Dialog branch (the setup's matchMedia mock defaults to a 1024px
 * viewport): vaul's drawer needs real layout/pointer machinery jsdom lacks,
 * so sheet physics are device-verified, never pinned. Behaviors only - no
 * classes, no animation timings.
 */
import { createRef } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  EntryModal,
  type EntryModalHandle,
} from "@/components/guest/entry-modal";

// The gate steps' forms pull the router + supabase client; the pins here
// never submit them, so inert stand-ins keep the tree shallow.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));
vi.mock("@/components/auth/email-sign-in", () => ({
  // The stub exposes the verify trigger so the hold pins can complete the
  // account gate without the real OTP machinery.
  EmailSignIn: ({ onVerified }: { onVerified: () => void }) => (
    <div data-testid="email-sign-in">
      <button type="button" data-testid="stub-verify" onClick={onVerified}>
        verify
      </button>
    </div>
  ),
}));
vi.mock("@/lib/guest/claim-uploads", () => ({
  claimAnonymousUploads: vi.fn().mockResolvedValue(undefined),
}));
// The arrival BEAT (its own pins in use-arrival-beat.test.ts) just delays the
// auto-open; here it must resolve instantly so the surface renders for the
// affordance/flow assertions.
vi.mock("@/lib/guest/use-arrival-beat", async (orig) => ({
  ...(await orig<typeof import("@/lib/guest/use-arrival-beat")>()),
  useArrivalBeat: () => true,
}));

const QR = "testtoken1234";

function renderModal(
  props: Partial<React.ComponentProps<typeof EntryModal>> = {},
) {
  const ref = createRef<EntryModalHandle>();
  const utils = render(
    <EntryModal
      ref={ref}
      qrToken={QR}
      eventName="Test Wedding"
      gateSteps={[]}
      isOwner={false}
      isDemo={false}
      {...props}
    />,
  );
  return { ref, ...utils };
}

const closeButton = () => screen.queryByRole("button", { name: "Close" });

describe("the honest-affordance table", () => {
  it("HOLDS the welcome before a password gate (no X; Continue is the path)", () => {
    renderModal({ gateSteps: ["password"] });
    expect(
      screen.getByText(/You(’|')re invited to/),
    ).toBeInTheDocument();
    expect(closeButton()).toBeNull();
    // No "Just browsing" either: a password gate has nothing to browse.
    expect(screen.queryByText("Just browsing")).toBeNull();
  });

  it("HOLDS the password step (no X, Escape inert)", () => {
    renderModal({ gateSteps: ["password"] });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByLabelText("Event password")).toBeInTheDocument();
    expect(closeButton()).toBeNull();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.getByLabelText("Event password")).toBeInTheDocument();
  });

  it("frees the welcome before an account gate (X + Just browsing)", () => {
    renderModal({ gateSteps: ["account"] });
    expect(closeButton()).not.toBeNull();
    expect(screen.getByText("Just browsing")).toBeInTheDocument();
  });

  it("dismissing a free welcome marks it seen and closes to the teaser", () => {
    renderModal({ gateSteps: ["account"] });
    fireEvent.click(closeButton()!);
    expect(localStorage.getItem(`pr_welcome_${QR}`)).toBe("1");
    // The account gate does NOT auto-open on its own (the pinned
    // entry-steps semantics) - the surface is gone until "See all".
    expect(screen.queryByTestId("email-sign-in")).toBeNull();
  });

  it("frees the account step: X closes to the teaser, openToGate reopens", () => {
    const { ref } = renderModal({ gateSteps: ["account"] });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByTestId("email-sign-in")).toBeInTheDocument();
    fireEvent.click(closeButton()!);
    expect(screen.queryByTestId("email-sign-in")).toBeNull();
    act(() => ref.current!.openToGate());
    expect(screen.getByTestId("email-sign-in")).toBeInTheDocument();
  });
});

describe("flow wiring", () => {
  it("Continue advances welcome -> password and marks the welcome seen", () => {
    renderModal({ gateSteps: ["password"] });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(localStorage.getItem(`pr_welcome_${QR}`)).toBe("1");
    expect(screen.getByLabelText("Event password")).toBeInTheDocument();
  });

  it("a returning guest (welcome seen) lands straight on the password gate", () => {
    localStorage.setItem(`pr_welcome_${QR}`, "1");
    renderModal({ gateSteps: ["password"] });
    expect(screen.getByLabelText("Event password")).toBeInTheDocument();
    expect(screen.queryByText(/You(’|')re invited/)).toBeNull();
  });

  it("owner and demo never see the surface", () => {
    renderModal({ gateSteps: ["password"], isOwner: true });
    expect(screen.queryByText(/invited/)).toBeNull();
    renderModal({ gateSteps: ["password"], isDemo: true });
    expect(screen.queryByText(/invited/)).toBeNull();
  });

  it("a public event's welcome dismisses to the gallery (no gate behind)", () => {
    renderModal({ gateSteps: [] });
    expect(
      screen.getByRole("button", { name: "View the gallery" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "View the gallery" }));
    expect(localStorage.getItem(`pr_welcome_${QR}`)).toBe("1");
    expect(screen.queryByText(/invited/)).toBeNull();
  });
});

describe("the back affordance (reviewing the welcome)", () => {
  it("the gate's chevron re-shows the welcome and returns without touching the machine", () => {
    renderModal({ gateSteps: ["password"] });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByLabelText("Event password")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Back to the welcome" }),
    );
    expect(
      screen.getByText(/You(’|')re invited to/),
    ).toBeInTheDocument();
    // The review is a VIEW, not a step: no browse path, the primary returns.
    expect(screen.queryByText("Just browsing")).toBeNull();

    fireEvent.click(
      screen.getByRole("button", { name: "Back to the password" }),
    );
    expect(screen.getByLabelText("Event password")).toBeInTheDocument();
  });

  it("no chevron on the welcome itself", () => {
    renderModal({ gateSteps: ["password"] });
    expect(
      screen.queryByRole("button", { name: "Back to the welcome" }),
    ).toBeNull();
  });

  it("the success hold is dismissal-proof, even on a free step", async () => {
    const { ref } = renderModal({ gateSteps: ["account"] });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(screen.getByTestId("stub-verify"));
    expect(
      await screen.findByText("Welcome to the party"),
    ).toBeInTheDocument();
    // The account step is normally "free", but the HOLD is held: no X, the
    // Escape is inert, and openToGate is a no-op until the beat resolves.
    expect(closeButton()).toBeNull();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.getByText("Welcome to the party")).toBeInTheDocument();
    act(() => ref.current!.openToGate());
    expect(screen.getByText("Welcome to the party")).toBeInTheDocument();
  });

  it("the lighter path hands a RETURNING guest forward to the account step", async () => {
    // Welcome already seen -> the guest lands straight on the password gate
    // with `proceeded` false. The unlock must still hand forward (the audit's
    // dead-end finding: without setProceeded in handleUnlocked, the sheet
    // closed to the teaser after "You're in").
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true } as Response));
    localStorage.setItem(`pr_welcome_${QR}`, "1");
    const { rerender } = renderModal({ gateSteps: ["password"] });
    const input = screen.getByLabelText("Event password");
    fireEvent.change(input, { target: { value: "pw" } });
    fireEvent.submit(input.closest("form")!);
    // Let the unlock promise resolve under fake timers. The PLANTED gate's
    // morph subtext is the unique marker (the sr-only a11y title also says
    // "You're in").
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10);
    });
    expect(screen.getByText("Opening the gallery")).toBeInTheDocument();
    expect(screen.getByLabelText("Event password")).toBeInTheDocument();
    // The refresh lands: the password gate drops, the account gate surfaces.
    rerender(
      <EntryModal
        qrToken={QR}
        eventName="Test Wedding"
        gateSteps={["account"]}
        isOwner={false}
        isDemo={false}
      />,
    );
    // The beat resolves -> the held view hands FORWARD, no exit.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(900);
    });
    expect(screen.getByTestId("email-sign-in")).toBeInTheDocument();
    vi.useRealTimers();
  });

  it("the surface closes mid-review when the flow resolves server-side", () => {
    const { rerender, ref } = (() => {
      const r = renderModal({ gateSteps: ["password"] });
      return r;
    })();
    void ref;
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Back to the welcome" }),
    );
    expect(screen.getByText(/You(’|')re invited/)).toBeInTheDocument();
    // The unlock landed: the RSC re-derives and the password gate vanishes.
    rerender(
      <EntryModal
        qrToken={QR}
        eventName="Test Wedding"
        gateSteps={[]}
        isOwner={false}
        isDemo={false}
      />,
    );
    expect(screen.queryByLabelText("Event password")).toBeNull();
    expect(screen.queryByText(/You(’|')re invited/)).toBeNull();
  });
});
