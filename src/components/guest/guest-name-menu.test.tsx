/**
 * THE GUEST'S OWN MENU, AS HE AMENDED IT (`identity-door` r1 `menu=card`): her name over one
 * status word, a card that sells saving the event, then Change name and Log in. What is pinned is
 * the rule set, never the look: "Unverified" said exactly once; the card's one act per state; a
 * pending address changed (it overwrites) or removed (`null` through the same route, the device
 * flag cleared) behind `PENDING_EMAIL_REMOVABLE`; no sign-out row. The doors' own claim-and-refresh
 * pins live in guest-header.test.tsx.
 */
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";

import {
  PENDING_EMAIL_REMOVABLE,
  REMOVE_CONSEQUENCE,
} from "@/components/guest/add-email-dialog";
import { GuestNameMenu } from "@/components/guest/guest-name-menu";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/components/auth/account-door", () => ({
  DOOR_WEAR: {
    keep: { heading: "Keep your photos", reason: "Confirm it." },
    signin: { heading: "Log in", reason: "Log in." },
  },
  AccountDoor: () => <div data-testid="account-door" />,
}));
vi.mock("@/lib/guest/claim-uploads", () => ({
  claimAnonymousUploads: vi.fn(async () => null),
}));

const QR = "tok-menu";
const FLAG = `pr_guest_email_attached_${QR}`;

function open(props: Partial<React.ComponentProps<typeof GuestNameMenu>> = {}) {
  render(
    <GuestNameMenu
      name="Priya"
      qrToken={QR}
      sessionToken="sess-1"
      {...props}
    />,
  );
  fireEvent.pointerDown(
    screen.getByRole("button", { name: /your name on this album/i }),
    { ctrlKey: false, button: 0 },
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  global.fetch = vi.fn();
});

afterEach(async () => {
  cleanup();
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
});

describe("name only", () => {
  it("says 'Unverified' exactly once, then sells saving the event", async () => {
    open();
    await screen.findByText("Save this event for later");
    expect(screen.getAllByText(/unverified/i)).toHaveLength(1);
    expect(screen.queryByText(/anyone can type a name/i)).toBeNull();
    expect(
      screen.getByRole("menuitem", { name: "Add your email" }),
    ).toBeInTheDocument();
  });

  it("then Change name and Log in, and no sign-out row", async () => {
    open();
    expect(
      await screen.findByRole("menuitem", { name: /change name/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: /^log in$/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("menuitem", { name: /sign (in|out)/i }),
    ).toBeNull();
  });
});

describe("an address added, not yet confirmed", () => {
  it("says so in place of 'Unverified', and offers to confirm it or change it", async () => {
    open({ emailAttached: true });
    await screen.findByText("Email not confirmed");
    expect(screen.queryByText(/unverified/i)).toBeNull();
    expect(
      screen.getByRole("menuitem", { name: "Confirm your email" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", {
        name: PENDING_EMAIL_REMOVABLE ? "Change or remove it" : "Change it",
      }),
    ).toBeInTheDocument();
  });

  it("changing overwrites the pending address through the same route, and keeps the flag", async () => {
    localStorage.setItem(FLAG, "1");
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, email_attached: true }),
    } as Response);
    open({ emailAttached: true });
    fireEvent.click(
      await screen.findByRole("menuitem", {
        name: /^change (or remove )?it$/i,
      }),
    );
    // Nothing kept the old address, so the field opens empty.
    const field = await screen.findByLabelText("Email");
    expect(field).toHaveValue("");
    fireEvent.change(field, { target: { value: "priya.new@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    const [url, init] = vi.mocked(global.fetch).mock.calls[0];
    expect(url).toBe("/api/guests/email");
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({
      qr_token: QR,
      session_token: "sess-1",
      email: "priya.new@example.com",
    });
    await waitFor(() => expect(localStorage.getItem(FLAG)).toBe("1"));
  });

  it.runIf(PENDING_EMAIL_REMOVABLE)(
    "removing says what it costs first, posts null, and clears the device flag",
    async () => {
      localStorage.setItem(FLAG, "1");
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ ok: true, email_attached: false }),
      } as Response);
      open({ emailAttached: true });
      fireEvent.click(
        await screen.findByRole("menuitem", { name: "Change or remove it" }),
      );
      expect(await screen.findByText(REMOVE_CONSEQUENCE)).toBeInTheDocument();
      expect(REMOVE_CONSEQUENCE).toBe(
        "Your photos stay. Only the email you added is removed.",
      );
      fireEvent.click(
        screen.getByRole("button", { name: "Remove this email" }),
      );
      await waitFor(() => expect(localStorage.getItem(FLAG)).toBeNull());
      const [url, init] = vi.mocked(global.fetch).mock.calls[0];
      expect(url).toBe("/api/guests/email");
      expect(JSON.parse((init as RequestInit).body as string)).toEqual({
        qr_token: QR,
        session_token: "sess-1",
        email: null,
      });
      expect(toast.success).toHaveBeenCalled();
    },
  );

  it.runIf(PENDING_EMAIL_REMOVABLE)(
    "a refused removal says so under the control and keeps the flag",
    async () => {
      localStorage.setItem(FLAG, "1");
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({
          ok: false,
          code: "rate_limited",
          message: "Too many changes right now. Try again in a bit.",
        }),
      } as Response);
      open({ emailAttached: true });
      fireEvent.click(
        await screen.findByRole("menuitem", { name: "Change or remove it" }),
      );
      fireEvent.click(
        await screen.findByRole("button", { name: "Remove this email" }),
      );
      expect(
        await screen.findByText(
          "Too many changes right now. Try again in a bit.",
        ),
      ).toBeInTheDocument();
      expect(localStorage.getItem(FLAG)).toBe("1");
    },
  );
});
