/**
 * EVERY ACCOUNT MENU CARRIES ONE STANDING DOOR INTO HELP (help-center r1, Will: "Let's also include
 * the help center entry in the menu too. That way it's globally accessible for general questions as
 * well, not only when encountering trouble"). The host's menu already had its row, so it keeps
 * exactly one; the signed-in guest's account menu gains the same one. Both open the help center in
 * a new tab, so the app or the album stays where it is. (The name-only guest's menu is pinned in
 * guest-name-menu.test.tsx.)
 */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/app/(auth)/actions", () => ({ signOutAction: vi.fn() }));

const { UserMenu } = await import("@/components/app/user-menu");
const { GuestAccountMenu } =
  await import("@/components/guest/guest-account-menu");

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
});
