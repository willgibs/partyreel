// @contract-for: src/components/auth/account-door.tsx
import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  AccountDoor,
  DOOR_WEAR,
  type DoorWear,
} from "@/components/auth/account-door";
import { rememberDoor, rememberPasskey } from "@/lib/auth/remembered-email";

/**
 * ONE OBJECT, WORN FOUR WAYS (Will, 2026-09-20, `app-door` r1 `surfaces=one`):
 * behavior pins, never looks.
 *
 * What is pinned is the three things that were wrong before this round and
 * would be easy to get wrong again:
 *
 *  1. THE TERMS LINE. Two of the four account surfaces created accounts with
 *     NO consent line at all. It rides the door now, so the only way to lose it
 *     is to pass `consent={false}` — which exactly one wear does, because the
 *     welcome step above it already carries the line.
 *  2. "YOU ALREADY HAD AN ACCOUNT" IS ONLY SAYABLE AFTER A VERIFIED CODE, and
 *     only under a CREATE intent. Before the code it would be an enumeration
 *     oracle (auth-accounts.md); on a plain sign-in it would fire for every
 *     returning host, which is noise rather than the warning Will asked for.
 *  3. THE PASSKEY BUTTON IS ABSENT UNTIL THREE THINGS ARE TRUE. The flag, a
 *     browser that carries `PublicKeyCredential`, and a hint saying a passkey
 *     was actually registered here. Drawing it on any less is a one-press that
 *     can only fail.
 *
 * `EmailSignIn` is stubbed on the guest lane's pattern (entry-modal.test.tsx):
 * the real one holds live Supabase handlers, and the stub exposes the verify
 * trigger so a pin can complete a sign-in without the OTP machinery.
 */

const flags = vi.hoisted(() => ({ passkeys: false }));
const signInWithPasskey = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/client", () => ({
  get PASSKEYS_ENABLED() {
    return flags.passkeys;
  },
  createClient: () => ({
    auth: {
      signOut: vi.fn().mockResolvedValue({ error: null }),
      signInWithOAuth: vi.fn().mockResolvedValue({ error: null }),
      signInWithPasskey,
      registerPasskey: vi.fn().mockResolvedValue({ error: null }),
    },
  }),
}));

vi.mock("@/components/auth/email-sign-in", () => ({
  EmailSignIn: ({
    onVerified,
    hintEmail,
  }: {
    onVerified: (r: { existing: boolean; email: string }) => void;
    hintEmail?: string;
  }) => (
    <div data-testid="email-sign-in" data-hint={hintEmail ?? ""}>
      <button
        type="button"
        data-testid="stub-verify-existing"
        onClick={() =>
          onVerified({ existing: true, email: "nadia@example.com" })
        }
      >
        verify existing
      </button>
      <button
        type="button"
        data-testid="stub-verify-new"
        onClick={() => onVerified({ existing: false, email: "new@example.com" })}
      >
        verify new
      </button>
    </div>
  ),
}));

const CONSENT = "By continuing you agree to our";

beforeEach(() => {
  flags.passkeys = false;
  localStorage.clear();
  signInWithPasskey.mockReset();
});

afterEach(() => {
  localStorage.clear();
});

describe("the wears", () => {
  /**
   * ★ EVERY WEAR HAS BOTH HALVES, AND THEY DIFFER (the identity reshape,
   * 2026-09-21, which added `signin` as the fifth). The table exists so a
   * surface cannot drift from the door it stands over; two wears sharing a
   * sentence would mean one of them is not really a reason.
   */
  it("gives every wear a heading and a reason of its own", () => {
    const wears = Object.keys(DOOR_WEAR) as DoorWear[];
    expect(wears.length).toBeGreaterThanOrEqual(5);
    const reasons = new Set<string>();
    for (const wear of wears) {
      expect(DOOR_WEAR[wear].heading.trim().length).toBeGreaterThan(0);
      expect(DOOR_WEAR[wear].reason.trim().length).toBeGreaterThan(0);
      reasons.add(DOOR_WEAR[wear].reason);
    }
    expect(reasons.size).toBe(wears.length);
  });

  it("draws the login wear's own heading and reason", () => {
    render(
      <AccountDoor
        wear="login"
        methods={{ code: true, google: true, password: true }}
        emailRedirectTo="/auth/callback"
        onVerified={vi.fn()}
      />,
    );
    expect(screen.getByText(DOOR_WEAR.login.heading)).toBeTruthy();
    expect(screen.getByText(DOOR_WEAR.login.reason)).toBeTruthy();
  });

  it("leaves heading and reason to the surface when it owns them", () => {
    // The gate, the confirm door and Likes each carry a semantic title of their own (the
    // gate's ruled framing, a DialogTitle), so the door must not draw a second.
    for (const wear of ["gate", "keep", "like", "signin"] as const) {
      const { unmount } = render(
        <AccountDoor
          wear={wear}
          methods={{ code: true }}
          emailRedirectTo="/auth/callback"
          chrome="none"
          onVerified={vi.fn()}
        />,
      );
      expect(screen.queryByText(DOOR_WEAR[wear].heading)).toBeNull();
      unmount();
    }
  });

  it("carries the Terms line on every wear that asks for it", () => {
    for (const wear of ["login", "keep", "like", "signin"] as DoorWear[]) {
      const { unmount } = render(
        <AccountDoor
          wear={wear}
          methods={{ code: true }}
          emailRedirectTo="/auth/callback"
          chrome={wear === "login" ? "full" : "none"}
          onVerified={vi.fn()}
        />,
      );
      expect(screen.getByText(CONSENT, { exact: false }), wear).toBeTruthy();
      unmount();
    }
  });

  it("drops it only where the surface above already said it", () => {
    render(
      <AccountDoor
        wear="gate"
        methods={{ code: true }}
        emailRedirectTo="/auth/callback"
        chrome="none"
        consent={false}
        onVerified={vi.fn()}
      />,
    );
    expect(screen.queryByText(CONSENT, { exact: false })).toBeNull();
  });

  it("offers a password only where the surface says there is one", () => {
    const { unmount } = render(
      <AccountDoor
        wear="keep"
        methods={{ code: true, google: true }}
        emailRedirectTo="/auth/callback"
        chrome="none"
        onVerified={vi.fn()}
      />,
    );
    expect(screen.queryByText(/Have a password/i)).toBeNull();
    unmount();

    render(
      <AccountDoor
        wear="login"
        methods={{ code: true, google: true, password: true }}
        emailRedirectTo="/auth/callback"
        onVerified={vi.fn()}
      />,
    );
    expect(screen.getByText(/Have a password/i)).toBeTruthy();
  });
});

describe("the account the address already had", () => {
  function renderDoor(intent: "signin" | "create") {
    const onVerified = vi.fn();
    render(
      <AccountDoor
        wear="keep"
        methods={{ code: true }}
        emailRedirectTo="/auth/callback"
        chrome="none"
        intent={intent}
        onVerified={onVerified}
      />,
    );
    return onVerified;
  }

  it("says nothing before a code is verified", () => {
    renderDoor("create");
    expect(screen.queryByText(/already had/i)).toBeNull();
  });

  it("names the account after a verified code, under a create intent", () => {
    const onVerified = renderDoor("create");
    act(() => {
      screen.getByTestId("stub-verify-existing").click();
    });
    expect(screen.getByText(/already had/i)).toBeTruthy();
    expect(screen.getByText("nadia@example.com")).toBeTruthy();
    // The door HOLDS: the caller's work (a claim) waits for a choice.
    expect(onVerified).not.toHaveBeenCalled();
  });

  it("offers a way out when it was a mistake", () => {
    renderDoor("create");
    act(() => {
      screen.getByTestId("stub-verify-existing").click();
    });
    expect(screen.getByText(/Not you\?/i)).toBeTruthy();
  });

  it("stays silent for a brand-new account", () => {
    const onVerified = renderDoor("create");
    act(() => {
      screen.getByTestId("stub-verify-new").click();
    });
    expect(screen.queryByText(/already had/i)).toBeNull();
    expect(onVerified).toHaveBeenCalledWith({
      existing: false,
      email: "new@example.com",
    });
  });

  it("stays silent on a plain sign-in, where every host already had one", () => {
    const onVerified = renderDoor("signin");
    act(() => {
      screen.getByTestId("stub-verify-existing").click();
    });
    expect(screen.queryByText(/already had/i)).toBeNull();
    expect(onVerified).toHaveBeenCalledWith({
      existing: true,
      email: "nadia@example.com",
    });
  });
});

describe("the one press", () => {
  function renderLogin() {
    render(
      <AccountDoor
        wear="login"
        methods={{ code: true, google: true, password: true }}
        emailRedirectTo="/auth/callback"
        remember
        onVerified={vi.fn()}
      />,
    );
  }

  it("is absent with the flag off, even with a hint and a browser that can", async () => {
    (window as unknown as Record<string, unknown>).PublicKeyCredential =
      function () {};
    rememberDoor({ email: "nadia@example.com", method: "passkey" });
    rememberPasskey();
    renderLogin();
    await act(async () => {});
    expect(screen.queryByText(/Sign in with a passkey/i)).toBeNull();
  });

  it("is absent with the flag on but nothing registered here", async () => {
    flags.passkeys = true;
    (window as unknown as Record<string, unknown>).PublicKeyCredential =
      function () {};
    rememberDoor({ email: "nadia@example.com", method: "code" });
    renderLogin();
    await act(async () => {});
    expect(screen.queryByText(/Sign in with a passkey/i)).toBeNull();
  });

  it("is absent on a browser with no WebAuthn at all", async () => {
    flags.passkeys = true;
    delete (window as unknown as Record<string, unknown>).PublicKeyCredential;
    rememberDoor({ email: "nadia@example.com", method: "passkey" });
    rememberPasskey();
    renderLogin();
    await act(async () => {});
    expect(screen.queryByText(/Sign in with a passkey/i)).toBeNull();
  });

  it("appears with the flag, the hint and a browser that can", async () => {
    flags.passkeys = true;
    (window as unknown as Record<string, unknown>).PublicKeyCredential =
      function () {};
    rememberDoor({ email: "nadia@example.com", method: "passkey" });
    rememberPasskey();
    renderLogin();
    await act(async () => {});
    expect(screen.getByText(/Sign in with a passkey/i)).toBeTruthy();
    // Recognition, never disclosure: the address is masked on a signed-out page.
    expect(screen.queryByText(/nadia@example\.com/)).toBeNull();
  });

  it("never remembers an address on a surface a stranger's phone can reach", async () => {
    rememberDoor({ email: "nadia@example.com", method: "code" });
    render(
      <AccountDoor
        wear="gate"
        methods={{ code: true }}
        emailRedirectTo="/auth/callback"
        chrome="none"
        consent={false}
        onVerified={vi.fn()}
      />,
    );
    await act(async () => {});
    expect(screen.getByTestId("email-sign-in").getAttribute("data-hint")).toBe(
      "",
    );
  });

  it("prefills the remembered address on /login", async () => {
    renderLogin();
    await act(async () => {});
    expect(screen.getByTestId("email-sign-in").getAttribute("data-hint")).toBe(
      "",
    );
    rememberDoor({ email: "nadia@example.com", method: "code" });
    const { rerender } = render(<div />);
    rerender(<div />);
    render(
      <AccountDoor
        wear="login"
        methods={{ code: true }}
        emailRedirectTo="/auth/callback"
        remember
        onVerified={vi.fn()}
      />,
    );
    await act(async () => {});
    expect(
      screen
        .getAllByTestId("email-sign-in")
        .some((el) => el.getAttribute("data-hint") === "nadia@example.com"),
    ).toBe(true);
  });
});
