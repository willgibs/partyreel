/**
 * SOMEBODY ELSE'S TICKET, AT THE GUEST'S OWN DOORS, AND AT SIGN-OUT (the upload-owner lane,
 * 2026-09-23).
 *
 * The rename and attach-address routes refuse a ticket whose row belongs to an account the viewer
 * is not (`session_other_account`), exactly as the upload routes do. What is pinned here is what the
 * two doors that post such a ticket do about it (put it down, never argue with it), and that both
 * sign-outs put down every ticket on the device so the next person on a shared phone starts clean.
 * Plain tests rather than contract lines: the doors' contracts are their own files'.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const refresh = vi.fn();
const signOut = vi.fn(async () => ({ error: null }));
const signOutAction = vi.fn(async () => {});

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("@/app/(app)/account/actions", () => ({
  updateDisplayNameAction: vi.fn(async () => ({ ok: true })),
}));
vi.mock("@/app/(auth)/actions", () => ({
  signOutAction: () => signOutAction(),
}));
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      // Signed IN: the header wears the account menu, whose Sign out is under test.
      getSession: vi.fn().mockResolvedValue({
        data: { session: { user: { email: "partyr33l@example.com" } } },
      }),
      signOut,
    },
  }),
}));

import { UserMenu } from "@/components/app/user-menu";
import { AddEmailDialog } from "@/components/guest/add-email-dialog";
import { GuestHeader } from "@/components/guest/guest-header";
import { GuestNameStep } from "@/components/guest/guest-name-step";

const QR = "tok-1";
const STALE = "s".repeat(64);
const OTHER_ACCOUNT = {
  ok: false,
  code: "session_other_account",
  message:
    "Someone else added photos from this device. Try again to add yours.",
};

/** fetch, answered per URL from a queue of bodies. */
function answer(routes: Record<string, { ok: boolean; body: unknown }[]>) {
  global.fetch = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    const next = routes[url]?.shift();
    if (!next) throw new Error(`unexpected fetch ${url}`);
    return {
      ok: next.ok,
      status: next.ok ? 200 : 403,
      json: async () => next.body,
    } as Response;
  });
}

function calls(url: string) {
  return vi
    .mocked(global.fetch)
    .mock.calls.filter(([u]) => String(u) === url)
    .map(([, init]) => JSON.parse(String((init as RequestInit).body)));
}

function seedDevice() {
  localStorage.setItem(`pr_session_${QR}`, STALE);
  localStorage.setItem(`pr_guest_name_${QR}`, "Hi Will");
  localStorage.setItem("pr_session_tok-2", "t".repeat(64));
  localStorage.setItem("pr_guest_name_tok-2", "Sam");
  localStorage.setItem("pr_guest_email_attached_tok-2", "1");
  localStorage.setItem("pr_guest_name_last", "Hi Will");
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe("the name step, holding somebody else's ticket", () => {
  it("★ puts the ticket down and mints THIS person their own row under the name they typed", async () => {
    seedDevice();
    answer({
      "/api/guests/name": [{ ok: false, body: OTHER_ACCOUNT }],
      "/api/guests/leave": [{ ok: true, body: { ok: true } }],
      "/api/guests": [
        {
          ok: true,
          body: {
            ok: true,
            session_token: "fresh-token",
            display_name: "Priya",
            verified: false,
            email_attached: false,
          },
        },
      ],
    });
    const onNamed = vi.fn();
    render(
      <GuestNameStep
        qrToken={QR}
        mode="join"
        sessionToken={STALE}
        storedName="Hi Will"
        onNamed={onNamed}
      />,
    );
    fireEvent.change(screen.getByLabelText("Your name"), {
      target: { value: "Priya" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    await waitFor(() =>
      expect(onNamed).toHaveBeenCalledWith({
        sessionToken: "fresh-token",
        displayName: "Priya",
        emailAttached: false,
        email: null,
      }),
    );
    // The foreign ticket went down first (its cookie awaited), then the fresh join.
    expect(vi.mocked(global.fetch).mock.calls.map(([u]) => String(u))).toEqual([
      "/api/guests/name",
      "/api/guests/leave",
      "/api/guests",
    ]);
    expect(calls("/api/guests/leave")).toEqual([{ qr_token: QR }]);
    expect(calls("/api/guests")).toEqual([
      { qr_token: QR, display_name: "Priya" },
    ]);
    // The device now names the person holding it, never the ticket's owner.
    expect(localStorage.getItem(`pr_guest_name_${QR}`)).toBe("Priya");
    expect(localStorage.getItem(`pr_session_${QR}`)).toBeNull();
    // And no refusal was ever shown: nothing typed could have fixed it.
    expect(screen.queryByText(OTHER_ACCOUNT.message)).toBeNull();
  });
});

describe("the add-email dialog, holding somebody else's ticket", () => {
  it("★ puts the ticket down and closes, rather than a dead-end sentence under the field", async () => {
    seedDevice();
    answer({
      "/api/guests/email": [{ ok: false, body: OTHER_ACCOUNT }],
      "/api/guests/leave": [{ ok: true, body: { ok: true } }],
    });
    const onOpenChange = vi.fn();
    render(
      <AddEmailDialog
        qrToken={QR}
        sessionToken={STALE}
        open
        onOpenChange={onOpenChange}
        onConfirmInstead={vi.fn()}
      />,
    );
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "priya@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(localStorage.getItem(`pr_session_${QR}`)).toBeNull();
    expect(localStorage.getItem(`pr_guest_name_${QR}`)).toBeNull();
    expect(calls("/api/guests/leave")).toEqual([{ qr_token: QR }]);
    expect(screen.queryByText(OTHER_ACCOUNT.message)).toBeNull();
    // Another event's ticket is somebody's too, and not this refusal's to touch.
    expect(localStorage.getItem("pr_session_tok-2")).toBe("t".repeat(64));
  });
});

describe("the sign-outs put down every ticket on the device", () => {
  it("★ the guest page's account menu: every token, name and flag, every ticket cookie, then the sign-out", async () => {
    seedDevice();
    answer({
      "/api/me/menu?event=evt-1": [
        {
          ok: true,
          body: {
            ok: true,
            email: "partyr33l@example.com",
            displayName: "P",
            avatarUrl: null,
            seed: null,
            ownsThisEvent: false,
          },
        },
      ],
      "/api/guests/leave": [{ ok: true, body: { ok: true } }],
    });
    render(<GuestHeader qrToken={QR} eventId="evt-1" />);
    const trigger = await screen.findByRole("button", { name: "Account menu" });
    fireEvent.pointerDown(trigger, { ctrlKey: false, button: 0 });
    fireEvent.click(await screen.findByRole("menuitem", { name: /sign out/i }));

    await waitFor(() => expect(signOut).toHaveBeenCalled());
    for (const key of [
      `pr_session_${QR}`,
      `pr_guest_name_${QR}`,
      "pr_session_tok-2",
      "pr_guest_name_tok-2",
      "pr_guest_email_attached_tok-2",
      "pr_guest_name_last",
    ]) {
      expect(localStorage.getItem(key), key).toBeNull();
    }
    expect(calls("/api/guests/leave")).toEqual([{ all: true }]);
    await waitFor(() => expect(refresh).toHaveBeenCalled());
  });

  it("★ the app's account menu: the device half is gone before the sign-out action runs", async () => {
    seedDevice();
    const seenAtAction: (string | null)[] = [];
    signOutAction.mockImplementation(async () => {
      seenAtAction.push(localStorage.getItem(`pr_session_${QR}`));
    });
    render(
      <UserMenu
        email="partyr33l@example.com"
        displayName={null}
        avatarUrl={null}
      />,
    );
    fireEvent.pointerDown(
      screen.getByRole("button", { name: "Account menu" }),
      {
        ctrlKey: false,
        button: 0,
      },
    );
    fireEvent.click(await screen.findByRole("menuitem", { name: /sign out/i }));

    await waitFor(() => expect(signOutAction).toHaveBeenCalledTimes(1));
    expect(seenAtAction).toEqual([null]);
    expect(localStorage.getItem("pr_session_tok-2")).toBeNull();
    expect(localStorage.getItem("pr_guest_name_last")).toBeNull();
  });
});
