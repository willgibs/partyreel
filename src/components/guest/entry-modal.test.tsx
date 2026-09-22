// @contract-for: src/components/guest/guest-name-step.tsx
/**
 * Behavior pins for the entry surface's HONEST-AFFORDANCE table (Phase 4.5
 * S2) + the flow wiring that must survive the shell swap. Pins run the
 * DESKTOP Dialog branch (the setup's matchMedia mock defaults to a 1024px
 * viewport): vaul's drawer needs real layout/pointer machinery jsdom lacks,
 * so sheet physics are device-verified, never pinned. Behaviors only - no
 * classes, no animation timings.
 */
import { createRef } from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

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

  it("the owner never sees the surface, gate or no", () => {
    renderModal({ gateSteps: ["password"], isOwner: true });
    expect(screen.queryByText(/invited/)).toBeNull();
    expect(screen.queryByText(/A live demo/)).toBeNull();
  });

  it("a public event's welcome dismisses to the album (no gate behind)", () => {
    renderModal({ gateSteps: [] });
    expect(
      screen.getByRole("button", { name: "View the album" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "View the album" }));
    expect(localStorage.getItem(`pr_welcome_${QR}`)).toBe("1");
    expect(screen.queryByText(/invited/)).toBeNull();
  });
});

// `arrival=role` (docs/design/rulings.md, the sixth batch, 2026-09-20): the
// demo is no longer the one visitor entry-steps.ts skips. It is a guest like
// any other (gateSteps is always [] for it in production — resolveGalleryAccess
// resolves `full` — so this is the true production shape, not a stand-in).
describe("the demo's own arrival (arrival=role)", () => {
  it("sees a surface of its own, never the guest's invitation copy", () => {
    renderModal({ gateSteps: [], isDemo: true, eventName: "Nora & Sam's Wedding" });
    expect(
      screen.getByText("You’re a guest at Nora & Sam's Wedding"),
    ).toBeInTheDocument();
    expect(screen.queryByText(/You(’|')re invited to/)).toBeNull();
  });

  it("names the host in its own words when one is set", () => {
    renderModal({ gateSteps: [], isDemo: true, hostName: "Nora" });
    expect(screen.getByText(/exactly as Nora’s guests see it/)).toBeInTheDocument();
  });

  it("degrades to a hostless line when the event has no host name", () => {
    renderModal({ gateSteps: [], isDemo: true, hostName: null });
    expect(
      screen.getByText(/exactly as the host’s guests see it/),
    ).toBeInTheDocument();
  });

  it('"Look around" dismisses it to the album, exactly like a real welcome', () => {
    renderModal({ gateSteps: [], isDemo: true });
    fireEvent.click(screen.getByRole("button", { name: "Look around" }));
    expect(localStorage.getItem(`pr_welcome_${QR}`)).toBe("1");
    expect(screen.queryByText(/A live demo/)).toBeNull();
  });

  it('offers "Start your own" as a real link out, never a dead end', () => {
    renderModal({ gateSteps: [], isDemo: true });
    const link = screen.getByRole("link", { name: "Start your own" });
    expect(link).toHaveAttribute("href", "/");
  });

  it("never shows the legal consent line (looking around agrees to nothing)", () => {
    renderModal({ gateSteps: [], isDemo: true });
    expect(screen.queryByText(/Terms/)).toBeNull();
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
    expect(screen.getByText("Opening the album")).toBeInTheDocument();
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

/**
 * THE NAME STEP'S PINS (the identity reshape, 2026-09-21).
 *
 * The step is a SECOND door through the same shell rather than a step in the
 * server-driven machine, and every pin here is about that difference: it never
 * arrives on its own, closing it costs nothing, and the one thing it does send
 * is the pair the route needs. Copy is precedent; `guest-capture` (wave 2)
 * refines this surface.
 */
describe("the name step (address=none)", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it("NEVER auto-opens: a guest looking at an album is asked nothing", () => {
    renderModal({ gateSteps: [] });
    fireEvent.click(screen.getByRole("button", { name: "View the album" }));
    expect(screen.queryByLabelText(/what should we call you/i)).toBeNull();
  });

  it("opens on the handle, and dismissing it POSTs nothing", () => {
    const { ref } = renderModal({ gateSteps: [] });
    act(() => ref.current!.openToName("join"));
    expect(
      screen.getByLabelText(/what should we call you/i),
    ).toBeInTheDocument();
    // Free, even though it is a door: the album behind it is already open.
    fireEvent.click(closeButton()!);
    expect(screen.queryByLabelText(/what should we call you/i)).toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("Add photos POSTs the qr_token AND the name, and hands the token up", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          ok: true,
          session_token: "tok-9",
          display_name: "Sam",
          verified: false,
        }),
    } as Response);
    const onNamed = vi.fn();
    const { ref } = renderModal({ gateSteps: [], onNamed });
    act(() => ref.current!.openToName("join"));
    fireEvent.change(screen.getByLabelText(/what should we call you/i), {
      target: { value: "Sam" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add photos" }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith(
      "/api/guests",
      expect.objectContaining({
        body: JSON.stringify({ qr_token: QR, display_name: "Sam" }),
      }),
    ));
    await waitFor(() =>
      expect(onNamed).toHaveBeenCalledWith({
        sessionToken: "tok-9",
        displayName: "Sam",
      }),
    );
    // The name is this device's now, beside the session it belongs to.
    expect(localStorage.getItem(`pr_guest_name_${QR}`)).toBe("Sam");
  });

  it("refuses a reserved name IN PLACE, before anything is sent", async () => {
    const { ref } = renderModal({ gateSteps: [] });
    act(() => ref.current!.openToName("join"));
    fireEvent.change(screen.getByLabelText(/what should we call you/i), {
      target: { value: "Partyreel" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add photos" }));
    expect(
      await screen.findByText(/that name isn't available/i),
    ).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("edit mode renames the row this device holds, and never mints a second one", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ok: true, display_name: "Samantha" }),
    } as Response);
    const { ref } = renderModal({
      gateSteps: [],
      sessionToken: "tok-1",
      storedName: "Sam",
    });
    act(() => ref.current!.openToName("edit"));
    const field = screen.getByLabelText(/what should we call you/i);
    expect(field).toHaveValue("Sam");
    fireEvent.change(field, { target: { value: "Samantha" } });
    fireEvent.click(screen.getByRole("button", { name: "Save name" }));
    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/guests/name",
        expect.anything(),
      ),
    );
    expect(global.fetch).not.toHaveBeenCalledWith(
      "/api/guests",
      expect.anything(),
    );
  });

  /* ── DEFECT 2 (the alias red-team, 2026-09-21): a nameless session names
     its OWN row rather than re-minting a second one. A live session_token
     whose row has no display_name (a row minted before the reshape, or by
     the queue's own silent join) used to open this step in `mode="join"`
     (see event-experience.tsx's `needsNameDoor`: `!sessionToken ||
     !storedName`), which called joinEvent and minted a fresh row, stranding
     the first one's photographs under "A guest". The fix reads the HELD
     TOKEN, not the mode. ── */

  it("join mode ALSO renames when a session token is already held, and never mints a second row", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({ ok: true, display_name: "Rt Legacy" }),
    } as Response);
    const onNamed = vi.fn();
    const { ref } = renderModal({
      gateSteps: [],
      sessionToken: "legacy-tok",
      storedName: null,
      onNamed,
    });
    act(() => ref.current!.openToName("join"));
    fireEvent.change(screen.getByLabelText(/what should we call you/i), {
      target: { value: "Rt Legacy" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add photos" }));

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/guests/name",
        expect.objectContaining({
          body: JSON.stringify({
            qr_token: QR,
            session_token: "legacy-tok",
            display_name: "Rt Legacy",
          }),
        }),
      ),
    );
    expect(global.fetch).not.toHaveBeenCalledWith(
      "/api/guests",
      expect.anything(),
    );
    await waitFor(() =>
      expect(onNamed).toHaveBeenCalledWith({
        sessionToken: "legacy-tok",
        displayName: "Rt Legacy",
      }),
    );
  });

  it("a dead token (the rename route's invalid_session) falls back to a fresh join", async () => {
    vi.mocked(global.fetch).mockImplementation((url) => {
      if (url === "/api/guests/name") {
        return Promise.resolve({
          ok: false,
          json: () =>
            Promise.resolve({
              ok: false,
              code: "invalid_session",
              message: "Your guest session has expired. Refresh and rejoin.",
            }),
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            ok: true,
            session_token: "fresh-tok",
            display_name: "Sam",
            verified: false,
          }),
      } as Response);
    });
    const onNamed = vi.fn();
    const { ref } = renderModal({
      gateSteps: [],
      sessionToken: "dead-tok",
      storedName: null,
      onNamed,
    });
    act(() => ref.current!.openToName("join"));
    fireEvent.change(screen.getByLabelText(/what should we call you/i), {
      target: { value: "Sam" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add photos" }));

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/guests/name",
        expect.anything(),
      ),
    );
    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/guests",
        expect.objectContaining({
          body: JSON.stringify({ qr_token: QR, display_name: "Sam" }),
        }),
      ),
    );
    await waitFor(() =>
      expect(onNamed).toHaveBeenCalledWith({
        sessionToken: "fresh-tok",
        displayName: "Sam",
      }),
    );
  });

  it("the demo never opens it: nothing it adds is real", () => {
    const { ref } = renderModal({ gateSteps: [], isDemo: true });
    act(() => ref.current!.openToName("join"));
    expect(screen.queryByLabelText(/what should we call you/i)).toBeNull();
  });
});
