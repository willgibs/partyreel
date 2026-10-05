import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CrumbsBar, CrumbsProvider } from "@/components/shared/crumbs";

/**
 * ACCOUNT NAMES ITS PLACE IN THE BAR (crumbs-82). Every other page one level into the host app declares its trail
 * (`SetCrumbs`) and a route that declares none draws none, so Account was the one page whose bar read empty while
 * `/account/profile`, a step deeper, read `Partyreel > Account > Your page`. The trail is Partyreel (walkable, back to
 * the dashboard) and then the page itself, which is never a link to itself.
 *
 * The page is drawn for real inside the bar's own provider, and every card under its heading is stood in for: what is
 * pinned is what the bar says, not what the cards draw.
 */

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  headers: async () => ({ get: () => null }),
}));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`redirect ${url}`);
  },
}));

const profile = {
  id: "host-1",
  display_name: "Maya",
  email: "maya@example.com",
  bio: null,
  tier: "pro",
  storage_cap_bytes: null,
  tier_expires_at: null,
  stripe_customer_id: null,
  event_slots: null,
  avatar_updated_at: null,
};

vi.mock("@/lib/db/queries/profile", () => ({
  getProfile: async () => profile,
}));
vi.mock("@/lib/db/queries/account", () => ({ hasPassword: async () => true }));
vi.mock("@/lib/db/mutations/account", () => ({
  countMyLiveEvents: async () => 2,
  isOnNewsletterList: async () => false,
}));
vi.mock("@/lib/db/queries/storage", () => ({
  getHostStorageSummary: async () => ({
    activeBytes: 0,
    deletedBytes: 0,
    systemBytes: 0,
    storedBytes: 0,
  }),
}));
vi.mock("@/lib/db/queries/social", () => ({
  getMyAttendedEventPicks: async () => [],
  getMyBlocks: async () => [],
  getMyFollowCounts: async () => ({ followers: 0, following: 0 }),
  getMyFollowing: async () => [],
  getMyProfileSlug: async () => null,
  getNotificationPrefs: async () => ({}),
}));
vi.mock("@/lib/social/cards", () => ({ withAvatarUrls: async () => [] }));
vi.mock("@/lib/supabase/avatar-storage", () => ({
  getAvatarUrl: async () => null,
}));
vi.mock("@/lib/site-url", () => ({
  getSiteUrl: async () => "https://partyreel.com",
}));
vi.mock("@/lib/avatar/seed", () => ({ seedFor: () => "seed" }));
vi.mock("@/app/(app)/account/email-state", () => ({
  getAccountEmailState: async () => ({
    email: "maya@example.com",
    pending: null,
  }),
}));

// The cards: client forms and server components with reads of their own, none of which is this file's subject.
const part = vi.hoisted(() => () => null);
vi.mock("@/components/app/account-avatar-form", () => ({
  AccountAvatarForm: part,
}));
vi.mock("@/components/app/account-delete-card", () => ({
  AccountDeleteCard: part,
}));
vi.mock("@/components/app/drive/drive-account-card", () => ({
  DriveAccountCard: part,
}));
vi.mock("@/app/(app)/account/email-section", () => ({ EmailSection: part }));
vi.mock("@/app/(app)/account/passkeys-card", () => ({ PasskeysCard: part }));
vi.mock("@/app/(app)/account/sign-out-everywhere-card", () => ({
  SignOutEverywhereCard: part,
}));
vi.mock("@/components/app/account-security-form", () => ({
  AccountSecurityForm: part,
}));
vi.mock("@/components/app/display-name-form", () => ({
  DisplayNameForm: part,
}));
vi.mock("@/components/app/notification-prefs-form", () => ({
  NotificationPrefsForm: part,
}));
vi.mock("@/components/social/relation-toggle", () => ({
  RelationToggle: part,
}));
vi.mock("@/components/social/attended-events-visibility", () => ({
  AttendedEventsVisibility: part,
}));
vi.mock("@/components/social/profile-bio-form", () => ({
  ProfileBioForm: part,
}));
vi.mock("@/components/social/profile-slug-control", () => ({
  ProfileSlugControl: part,
}));
vi.mock("@/components/app/checkout-button", () => ({ CheckoutButton: part }));
vi.mock("@/components/app/manage-billing-button", () => ({
  ManageBillingButton: part,
}));
vi.mock("@/components/app/pricing/pricing-sheet", () => ({
  PricingSheet: part,
}));
vi.mock("@/components/app/pricing/welcome-to-pro", () => ({
  WelcomeToPro: part,
}));

const { default: AccountPage } = await import("./page");

async function drawn() {
  const page = await AccountPage({ searchParams: Promise.resolve({}) });
  render(
    <CrumbsProvider>
      <CrumbsBar />
      {page}
    </CrumbsProvider>,
  );
  return within(screen.getByRole("navigation", { name: /breadcrumb/i }));
}

describe("Account in the bar", () => {
  it("★ reads Partyreel > Account: a walkable way back, then the page itself", async () => {
    const bar = await drawn();
    const steps = bar.getAllByRole("listitem");
    expect(steps.map((li) => li.textContent?.trim())).toEqual([
      "Partyreel",
      "Account",
    ]);
    expect(
      within(steps[0]!).getByRole("link", { name: "Partyreel" }),
    ).toHaveAttribute("href", "/dashboard");
    // The last step is where she is: marked as the current page and never a link to itself.
    expect(within(steps[1]!).queryByRole("link")).toBeNull();
    expect(steps[1]!.querySelector("[aria-current='page']")).not.toBeNull();
  });
});
