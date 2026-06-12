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
  EmailSignIn: () => <div data-testid="email-sign-in" />,
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
      screen.getByText(/You(’|')re invited to Test Wedding/),
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
      screen.getByRole("button", { name: "View event" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "View event" }));
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
      screen.getByText(/You(’|')re invited to Test Wedding/),
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
