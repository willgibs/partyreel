import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  isPageInviteDismissed,
  PAGE_CHOICES_PATH,
  pageChoicesHref,
  PROFILE_SETUP_PATH,
  shouldInviteToPage,
} from "./invite";

/**
 * WHEN THE APP INVITES THE PAGE SETUP, AND WHERE EVERY DOOR POINTS (`identity-profile` r1,
 * `prompt=claim`; `identity-claims` r1, `after=profile`). Pure facts over server state: each case is
 * one condition failing alone, so a refactor that drops one is named by the case it breaks.
 */

const READY = {
  hasHandle: false,
  claimsWaiting: 0,
  showableEvents: 2,
  dismissed: false,
};

describe("the dashboard's invitation", () => {
  it("appears once no claim is waiting and there is something to show", () => {
    expect(shouldInviteToPage(READY)).toBe(true);
  });

  it("is gone once the page exists (a handle means the setup finished)", () => {
    expect(shouldInviteToPage({ ...READY, hasHandle: true })).toBe(false);
  });

  it("waits while a claim is still on the ticket, so the two never compete", () => {
    expect(shouldInviteToPage({ ...READY, claimsWaiting: 1 })).toBe(false);
  });

  it("never invites a page with nothing it could show (and so never an unconfirmed account)", () => {
    expect(shouldInviteToPage({ ...READY, showableEvents: 0 })).toBe(false);
  });

  it("stays gone after Not now", () => {
    expect(shouldInviteToPage({ ...READY, dismissed: true })).toBe(false);
  });
});

describe("Not now is this account's, on this device", () => {
  it("holds for the account that dismissed it", () => {
    expect(isPageInviteDismissed("seed-a", "seed-a")).toBe(true);
  });

  it("does not hide a second account's invitation on the same browser", () => {
    expect(isPageInviteDismissed("seed-a", "seed-b")).toBe(false);
  });

  it("is off when nothing was ever dismissed", () => {
    expect(isPageInviteDismissed(undefined, "seed-a")).toBe(false);
    expect(isPageInviteDismissed("", "")).toBe(false);
  });
});

describe("where the claims toast and the owner's empty page point", () => {
  it("the setup, while there is no page", () => {
    expect(pageChoicesHref(false)).toBe(PROFILE_SETUP_PATH);
    expect(PROFILE_SETUP_PATH).toBe("/account/profile");
  });

  it("the page's choices on Account, once there is one", () => {
    expect(pageChoicesHref(true)).toBe(PAGE_CHOICES_PATH);
    expect(PAGE_CHOICES_PATH).toBe("/account#public-profile");
  });
});

/**
 * THE HANDLE-LESS DOORS OPEN THE SETUP ITSELF (crumbs-44, from `profile-setup`). Event settings'
 * "Claim your handle to publish the page" and the dashboard's invitation pointed at Account's Public
 * profile card, which before a handle exists is one line and the setup's button: a tap more on every
 * door. Each names the setup's one address now, never the card's anchor.
 *
 * ★ RESHAPED ON PURPOSE (crumbs-46; the scar is kept, the user menu's name is dropped). The menu's
 * "Your profile" was a third of these doors, and it opens /me now (Will's answer A to crumbs-44's
 * question; `user-menu.test.tsx` holds it), the account's own page before it has a handle. The setup's
 * door there is the invitation that /me wears as its head, so the invitation takes the menu's place in
 * this list: a door that still names the setup's one address.
 */
describe("the doors a handle-less account meets", () => {
  const read = (rel: string) => readFileSync(join(process.cwd(), rel), "utf8");

  it.each([
    "src/components/app/dashboard/page-invite-card.tsx",
    "src/components/app/event-settings/event-page.tsx",
  ])("%s opens the setup, never Account's card", (rel) => {
    const source = read(rel);
    expect(source).toMatch(/\bPROFILE_SETUP_PATH\b/);
    expect(source).not.toContain(`"${PAGE_CHOICES_PATH}"`);
  });
});
