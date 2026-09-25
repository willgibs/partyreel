/**
 * IDENTIFY, AGAINST THE REAL DOOR: a name and an email on one screen, one code request that
 * carries the name, the keyboard handed from the email field to the code field only when it was
 * already up, and "the account you already had" speaking only when this device holds something a
 * claim would move. Supabase and the server action are stand-ins; `AccountDoor` and `EmailSignIn`
 * are the shipped ones.
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

import { identifyCopy, IdentifyStep } from "@/components/guest/identify-step";

const auth = vi.hoisted(() => ({
  signInWithOtp: vi.fn(),
  verifyOtp: vi.fn(),
  existing: false,
}));
vi.mock("@/lib/supabase/client", () => ({
  PASSKEYS_ENABLED: false,
  createClient: () => ({
    auth: {
      signInWithOtp: auth.signInWithOtp,
      verifyOtp: auth.verifyOtp,
      signOut: vi.fn().mockResolvedValue({ error: null }),
      signInWithOAuth: vi.fn().mockResolvedValue({ error: null }),
    },
  }),
}));
vi.mock("@/app/(auth)/actions", () => ({
  checkExistingAccount: async () => ({
    existing: auth.existing,
    email: "priya@example.com",
  }),
}));

const QR = "tok-identify";

function mount(props: Partial<React.ComponentProps<typeof IdentifyStep>> = {}) {
  const onTypedName = vi.fn();
  const onVerified = vi.fn();
  render(
    <IdentifyStep
      qrToken={QR}
      verification
      onTypedName={onTypedName}
      onVerified={onVerified}
      {...props}
    />,
  );
  return { onTypedName, onVerified };
}

const nameField = () => screen.getByLabelText("Your name");
const emailField = () => screen.getByLabelText("Email");
const send = () =>
  fireEvent.click(screen.getByRole("button", { name: "Email me a code" }));

beforeEach(() => {
  // input-otp probes for a password manager's badge with elementFromPoint, which jsdom lacks.
  document.elementFromPoint = vi.fn(() => null);
  localStorage.clear();
  auth.signInWithOtp.mockReset().mockResolvedValue({ error: null });
  auth.verifyOtp.mockReset().mockResolvedValue({ error: null });
  auth.existing = false;
});

afterEach(async () => {
  cleanup();
  // Radix restores focus from a setTimeout(0), and input-otp arms 10ms and 50ms timers of its own
  // (its password-manager probe): let them all run while the document still exists.
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 80));
  });
});

async function typeCode(code = "123456") {
  const input = await screen.findByLabelText("Your code");
  fireEvent.change(input, { target: { value: code } });
}

describe("one screen, one code request", () => {
  it("sends ONE code request, carrying the name as the new account's door_name", async () => {
    const { onTypedName } = mount();
    fireEvent.change(nameField(), { target: { value: "  Priya " } });
    fireEvent.change(emailField(), { target: { value: "priya@example.com" } });
    send();
    await screen.findByText("Enter your code");
    expect(auth.signInWithOtp).toHaveBeenCalledTimes(1);
    expect(auth.signInWithOtp).toHaveBeenCalledWith({
      email: "priya@example.com",
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/e/${QR}`,
        data: { door_name: "Priya" },
      },
    });
    // The modal keeps it for the four writes, and the browser keeps it as the fallback prefill.
    expect(onTypedName).toHaveBeenCalledWith("Priya");
    expect(localStorage.getItem("pr_guest_name_last")).toBe("Priya");
  });

  it("refuses a bad name in place and sends nothing, the address's own check beside it", async () => {
    mount();
    fireEvent.change(nameField(), { target: { value: "admin" } });
    fireEvent.change(emailField(), { target: { value: "not-an-address" } });
    send();
    await screen.findByText("That name isn't available.");
    expect(
      await screen.findByText("Enter a valid email address."),
    ).toBeInTheDocument();
    expect(auth.signInWithOtp).not.toHaveBeenCalled();
  });

  it("prefills the name this device typed last, and asks for the code alone (no Google here)", () => {
    localStorage.setItem("pr_guest_name_last", "Priya");
    mount();
    expect(nameField()).toHaveValue("Priya");
    expect(screen.queryByRole("button", { name: /google/i })).toBeNull();
    expect(screen.queryByText(/have a password/i)).toBeNull();
  });

  it("gives each field its phone keyboard: a name, then an email that sends", () => {
    mount();
    expect(nameField()).toHaveAttribute("autocomplete", "name");
    expect(nameField()).toHaveAttribute("enterkeyhint", "next");
    expect(emailField()).toHaveAttribute("inputmode", "email");
    expect(emailField()).toHaveAttribute("autocomplete", "email");
    expect(emailField()).toHaveAttribute("enterkeyhint", "send");
    // Return on the name moves to the address, never sends half a form.
    act(() => nameField().focus());
    fireEvent.keyDown(nameField(), { key: "Enter" });
    expect(emailField()).toHaveFocus();
    expect(auth.signInWithOtp).not.toHaveBeenCalled();
  });
});

describe("the keyboard is handed over, never dropped", () => {
  it("the code field takes focus when the email field held it at submit", async () => {
    mount();
    fireEvent.change(nameField(), { target: { value: "Priya" } });
    fireEvent.change(emailField(), { target: { value: "priya@example.com" } });
    act(() => emailField().focus());
    send();
    const code = await screen.findByLabelText("Your code");
    await waitFor(() => expect(code).toHaveFocus());
    expect(code).toHaveAttribute("autocomplete", "one-time-code");
    expect(code).toHaveAttribute("inputmode", "numeric");
  });

  it("a wrong code keeps the field focused, so the keyboard stays up for the retry", async () => {
    auth.verifyOtp.mockResolvedValue({
      error: { message: "Token has expired or is invalid" },
    });
    mount();
    fireEvent.change(nameField(), { target: { value: "Priya" } });
    fireEvent.change(emailField(), { target: { value: "priya@example.com" } });
    act(() => emailField().focus());
    send();
    const code = await screen.findByLabelText("Your code");
    await waitFor(() => expect(code).toHaveFocus());
    await typeCode("000000");
    expect(
      await screen.findByText("That code didn't work."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Your code")).toHaveFocus();
    expect(screen.getByLabelText("Your code")).not.toBeDisabled();
  });

  it("and stays unfocused when nothing held focus (a keyboard the guest put away stays away)", async () => {
    mount();
    fireEvent.change(nameField(), { target: { value: "Priya" } });
    fireEvent.change(emailField(), { target: { value: "priya@example.com" } });
    act(() => (document.activeElement as HTMLElement | null)?.blur());
    send();
    const code = await screen.findByLabelText("Your code");
    expect(code).not.toHaveFocus();
  });
});

describe("'the account you already had' speaks only when it guards something", () => {
  it("with guest tickets on this device: the line shows and the writes wait for it", async () => {
    localStorage.setItem("pr_session_other-event", "t".repeat(64));
    auth.existing = true;
    const { onVerified } = mount();
    fireEvent.change(nameField(), { target: { value: "Priya" } });
    fireEvent.change(emailField(), { target: { value: "priya@example.com" } });
    send();
    await typeCode();
    expect(await screen.findByText(/already had\./)).toBeInTheDocument();
    expect(onVerified).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    await waitFor(() => expect(onVerified).toHaveBeenCalled());
  });

  it("with nothing to claim: a member lands exactly as a newcomer does, at once", async () => {
    auth.existing = true;
    const { onVerified } = mount();
    fireEvent.change(nameField(), { target: { value: "Priya" } });
    fireEvent.change(emailField(), { target: { value: "priya@example.com" } });
    send();
    await typeCode();
    await waitFor(() => expect(onVerified).toHaveBeenCalled());
    expect(screen.queryByText(/already had\./)).toBeNull();
  });
});

describe("identifyCopy: the door's title says the true count, worded like the album's own", () => {
  it("reads a lone item as 'photo or video', never a lying 'photo' (build 9 and 10's red-teams)", () => {
    expect(
      identifyCopy({ verification: true, mediaTotal: 1 }),
    ).toMatchObject({ title: "1 photo or video is waiting" });
  });

  it("reads several as 'photos & videos', grouped, and agrees the plural", () => {
    expect(
      identifyCopy({ verification: true, mediaTotal: 1249 }),
    ).toMatchObject({ title: "1,249 photos & videos are waiting" });
  });

  it("falls back with nothing to count", () => {
    expect(
      identifyCopy({ verification: true, mediaTotal: 0 }),
    ).toMatchObject({ title: "See all the photos" });
    expect(identifyCopy({ verification: true })).toMatchObject({
      title: "See all the photos",
    });
  });
});
