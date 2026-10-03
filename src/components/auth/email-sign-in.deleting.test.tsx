import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * ★ A DELETED ACCOUNT'S ADDRESS AT THE CODE SCREEN (lp/account-exit). GoTrue refuses it at the
 * verify, whatever six digits were typed, until the nightly purge: `AuthApiError("User is banned",
 * 403, "user_banned")` through auth-js (GoTrue v2.197's `verifyUserAndToken`, which checks the ban
 * BEFORE the code). That is no wrong code, so the door does not say one: it goes back to the email
 * step, names the address, says when it can start fresh, and offers the one way out a hold leaves
 * (contact). The guest doors share this component, so they say it too.
 */

const auth = vi.hoisted(() => ({
  signInWithOtp: vi.fn(),
  verifyOtp: vi.fn(),
}));
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { signInWithOtp: auth.signInWithOtp, verifyOtp: auth.verifyOtp },
  }),
}));
vi.mock("@/app/(auth)/actions", () => ({ checkExistingAccount: vi.fn() }));

const { EmailSignIn } = await import("./email-sign-in");

const BANNED = { message: "User is banned", code: "user_banned", status: 403 };

beforeEach(() => {
  // input-otp probes for a password manager's badge with elementFromPoint, which jsdom lacks.
  document.elementFromPoint = vi.fn(() => null);
  auth.signInWithOtp.mockReset().mockResolvedValue({ error: null });
  auth.verifyOtp.mockReset().mockResolvedValue({ error: null });
});

afterEach(async () => {
  cleanup();
  // input-otp arms timers of its own (its password-manager probe): let them run out.
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 80));
  });
});

function mount() {
  const onVerified = vi.fn();
  const sentAt = vi.fn();
  render(
    <EmailSignIn
      emailRedirectTo="https://partyreel.test/auth/callback"
      onVerified={onVerified}
      sentAt={sentAt}
    />,
  );
  return { onVerified, sentAt };
}

async function sendAndType(code: string) {
  fireEvent.change(screen.getByLabelText("Email"), {
    target: { value: "maya@example.com" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Email me a code" }));
  const field = await screen.findByLabelText("Your code");
  fireEvent.change(field, { target: { value: code } });
}

describe("the code screen meets a deleted account's ban", () => {
  it("★ goes back to the email step with the address, the time it can start fresh, and a contact line", async () => {
    auth.verifyOtp.mockResolvedValue({ error: BANNED });
    const { onVerified, sentAt } = mount();
    await sendAndType("123456");

    const notice = await screen.findByRole("alert");
    expect(notice).toHaveAttribute("data-account-deleting");
    expect(notice).toHaveTextContent(
      "The old account for maya@example.com is still being erased.",
    );
    // The time is the reader's own: a time on the hour or the half hour, with its day.
    expect(notice.textContent).toMatch(
      /start fresh with this email after (\d{1,2}:\d{2}\u00a0[AP]M|midnight|noon) (today|tonight|tomorrow)\./,
    );
    expect(screen.getByRole("link", { name: "contact us" })).toHaveAttribute(
      "href",
      "/contact",
    );
    // No wrong code, no code screen: the field is the way on, empty for another address.
    expect(screen.queryByText("That code didn't work.")).toBeNull();
    expect(screen.queryByLabelText("Your code")).toBeNull();
    expect(screen.getByLabelText("Email")).toHaveValue("");
    // The door's code heading goes with the code screen.
    expect(sentAt).toHaveBeenLastCalledWith(null);
    expect(onVerified).not.toHaveBeenCalled();
  });

  it("a new address sent from there clears it", async () => {
    auth.verifyOtp.mockResolvedValue({ error: BANNED });
    mount();
    await sendAndType("123456");
    await screen.findByRole("alert");
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "maya.new@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Email me a code" }));
    await screen.findByLabelText("Your code");
    await waitFor(() =>
      expect(document.querySelector("[data-account-deleting]")).toBeNull(),
    );
  });

  it("reads the ban by its message when GoTrue sends no code", async () => {
    auth.verifyOtp.mockResolvedValue({
      error: { message: "User is banned", status: 403 },
    });
    mount();
    await sendAndType("123456");
    expect(await screen.findByRole("alert")).toHaveAttribute(
      "data-account-deleting",
    );
  });

  it("a wrong code is still a wrong code", async () => {
    auth.verifyOtp.mockResolvedValue({
      error: {
        message: "Token has expired or is invalid",
        code: "otp_expired",
        status: 403,
      },
    });
    mount();
    await sendAndType("000000");
    expect(
      await screen.findByText("That code didn't work."),
    ).toBeInTheDocument();
    expect(document.querySelector("[data-account-deleting]")).toBeNull();
    expect(screen.getByLabelText("Your code")).toBeInTheDocument();
  });
});
