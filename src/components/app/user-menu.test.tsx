/**
 * EVERY ACCOUNT MENU CARRIES ONE STANDING DOOR INTO HELP (help-center r1, Will: "Let's also include
 * the help center entry in the menu too. That way it's globally accessible for general questions as
 * well, not only when encountering trouble"). The host's menu already had its row, so it keeps
 * exactly one; the signed-in guest's account menu gains the same one. Both open the help center in
 * a new tab, so the app or the album stays where it is. (The name-only guest's menu is pinned in
 * guest-name-menu.test.tsx.)
 *
 * AND A MENU'S SIGN OUT IS THIS DEVICE'S. People keep one account open on a desk and a phone for
 * different jobs, so the menu's Sign out posts the device sign-out (`signOutAction`, its `local`
 * scope pinned in actions.test.ts), and ending every device is /account's, never a menu row. A
 * refused one is said (`signOutHere`), never left for /login as if it had worked.
 */
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const actions = vi.hoisted(() => ({
  // The device sign-out leaves for /login, or comes back refused (crumbs-14).
  signOutAction: vi.fn(
    async (): Promise<{ ok: false; message: string } | undefined> => undefined,
  ),
  signOutEverywhereAction: vi.fn(async () => ({ ok: false, message: "" })),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/app/(auth)/actions", () => ({
  signOutAction: () => actions.signOutAction(),
  signOutEverywhereAction: () => actions.signOutEverywhereAction(),
}));

const { UserMenu } = await import("@/components/app/user-menu");
const { GuestAccountMenu } =
  await import("@/components/guest/guest-account-menu");

beforeEach(() => {
  actions.signOutAction.mockClear();
  actions.signOutEverywhereAction.mockClear();
});

afterEach(() => cleanup());

function openMenu() {
  fireEvent.pointerDown(screen.getByRole("button", { name: "Account menu" }), {
    ctrlKey: false,
    button: 0,
  });
}

function helpRows() {
  return screen.getAllByRole("menuitem", { name: /help center/i });
}

describe("the host's account menu", () => {
  it("keeps exactly one Help center row, to the help center in a new tab", async () => {
    render(
      <UserMenu email="host@example.com" displayName="Maya" avatarUrl={null} />,
    );
    openMenu();
    await screen.findByRole("menuitem", { name: /your profile/i });
    const rows = helpRows();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toHaveAttribute("href", "/help");
    expect(rows[0]).toHaveAttribute("target", "_blank");
  });

  // crumbs-44 (from `profile-setup`): a handle-less account's Your profile opens the page's setup
  // itself; it opened Account's Public profile card, whose one button was the same door, a tap later.
  it("opens a page that exists, and the setup itself for an account with no handle", async () => {
    const { unmount } = render(
      <UserMenu email="host@example.com" displayName="Maya" avatarUrl={null} />,
    );
    openMenu();
    expect(
      await screen.findByRole("menuitem", { name: /your profile/i }),
    ).toHaveAttribute("href", "/account/profile");
    unmount();

    render(
      <UserMenu
        email="host@example.com"
        displayName="Maya"
        avatarUrl={null}
        slug="maya"
      />,
    );
    openMenu();
    expect(
      await screen.findByRole("menuitem", { name: /your profile/i }),
    ).toHaveAttribute("href", "/u/maya");
  });

  it("★ signs out this device: its one sign-out row posts the device sign-out, never everywhere", async () => {
    render(
      <UserMenu email="host@example.com" displayName="Maya" avatarUrl={null} />,
    );
    openMenu();
    const rows = await screen.findAllByRole("menuitem", { name: /sign out/i });
    expect(rows).toHaveLength(1);
    fireEvent.click(rows[0]);
    await waitFor(() => expect(actions.signOutAction).toHaveBeenCalledTimes(1));
    expect(actions.signOutEverywhereAction).not.toHaveBeenCalled();
  });

  it("★ says a refused sign-out rather than acting as if it had worked (crumbs-14)", async () => {
    actions.signOutAction.mockResolvedValueOnce({
      ok: false,
      message: "Couldn't sign out. Check your connection and try again.",
    });
    render(
      <UserMenu email="host@example.com" displayName="Maya" avatarUrl={null} />,
    );
    openMenu();
    fireEvent.click(await screen.findByRole("menuitem", { name: /sign out/i }));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Couldn't sign out. Check your connection and try again.",
      ),
    );
  });
});

describe("the signed-in guest's account menu", () => {
  it("carries the same one row, to the help center in a new tab", async () => {
    render(
      <GuestAccountMenu
        email="priya@example.com"
        displayName="Priya"
        avatarUrl={null}
        ownsThisEvent={false}
        eventId="evt-1"
        onSignOut={() => {}}
      />,
    );
    openMenu();
    await screen.findByRole("menuitem", { name: /dashboard/i });
    const rows = helpRows();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toHaveAttribute("href", "/help");
    expect(rows[0]).toHaveAttribute("target", "_blank");
  });

  it("carries one sign-out row too, and nothing that reaches every device", async () => {
    // Its sign-out is GuestHeader's, which ends this device's session alone
    // (foreign-ticket.test.tsx pins the scope).
    const onSignOut = vi.fn();
    render(
      <GuestAccountMenu
        email="priya@example.com"
        displayName="Priya"
        avatarUrl={null}
        ownsThisEvent={false}
        eventId="evt-1"
        onSignOut={onSignOut}
      />,
    );
    openMenu();
    const rows = await screen.findAllByRole("menuitem", { name: /sign out/i });
    expect(rows).toHaveLength(1);
    fireEvent.click(rows[0]);
    await waitFor(() => expect(onSignOut).toHaveBeenCalledTimes(1));
    expect(actions.signOutEverywhereAction).not.toHaveBeenCalled();
  });
});
