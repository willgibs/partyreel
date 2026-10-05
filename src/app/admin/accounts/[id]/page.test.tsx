import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  GIGABYTE,
  MEGABYTE,
  planById,
  toBillingTier,
  uploadAllowance,
  UPLOADS_WINDOW,
} from "@/lib/constants/tiers";

/**
 * ★ THE ACCOUNT'S PAGE SAYS WHAT THE PRODUCT ENFORCES (admin-uploads): her albums and her Deleted side by side with the
 * total her plan's cap holds, her window's uploads against the plan's allowance, and the hour against the breaker. A
 * failed read says No reading and why, never a zero, and never takes the page (the delete below it is still there).
 * The real page, its reads stubbed beneath it.
 */

const HOST = "22222222-2222-4222-8222-222222222222";

type Reading = { ok: true; value: number } | { ok: false; message: string };
const state = vi.hoisted(() => ({
  profile: {} as Record<string, unknown>,
  detail: {} as Record<string, unknown>,
  used: { ok: true, value: 0 } as Reading,
  hour: { ok: true, value: 0 } as Reading,
  warnings: [] as unknown[][],
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/admin-context", () => ({
  requireAdmin: async () => ({ aal: "aal2" }),
}));
vi.mock("@/lib/observability/sentry", () => ({
  captureWarning: (...args: unknown[]) => state.warnings.push(args),
}));
vi.mock("@/lib/lifecycle/account-deletion", () => ({
  getAccountDeletionState: async () => ({
    requestedAt: null,
    eventCount: 0,
    heldEventCount: 0,
  }),
}));
vi.mock("@/app/admin/not-found.metadata", () => ({
  adminNotFoundMetadata: {},
}));
vi.mock("@/app/admin/not-found.screen", () => ({
  AdminNotFoundPageScreen: () => <p>Not found</p>,
}));
vi.mock("./delete-account-control", () => ({
  DeleteAccountControl: () => <button type="button">Delete account</button>,
  CancelDeletionControl: () => null,
}));
vi.mock("@/lib/db/queries/accounts", () => ({
  getAccountDetail: async () => state.detail,
  // The real tier rules over canned reads: only the two answers are stubbed.
  readAccountUploads: async (profile: {
    tier: string;
    storage_cap_bytes: number | null;
  }) => {
    const tier = toBillingTier(profile.tier);
    return {
      window: UPLOADS_WINDOW[tier],
      allowanceBytes: uploadAllowance(tier, profile.storage_cap_bytes),
      used: state.used,
    };
  },
  readAccountHourUploads: async () => state.hour,
}));

const { default: AdminAccountDetailPage } = await import("./page");

function account(over: {
  tier?: string;
  cap?: number | null;
  active?: number;
  deleted?: number;
}) {
  const tier = over.tier ?? "free";
  const cap = over.cap ?? null;
  state.profile = {
    id: HOST,
    email: "host@example.com",
    display_name: "A host",
    tier,
    storage_cap_bytes: cap,
    tier_expires_at: null,
    storage_grace_until: null,
    created_at: "2026-09-01T00:00:00Z",
    last_active_at: "2026-10-04T00:00:00Z",
  };
  const active = over.active ?? 0;
  const deleted = over.deleted ?? 0;
  const effective =
    tier === "free" && cap === null
      ? planById("free").storageBytes
      : tier === "pro" && cap === null
        ? null
        : cap;
  state.detail = {
    profile: state.profile,
    tierLabel:
      tier === "pro" ? "Pro" : tier === "event_pass" ? "Event Pass" : "Free",
    effectiveCapBytes: effective,
    activeBytes: active,
    deletedBytes: deleted,
    storedBytes: active + deleted,
    storageUsedBytes: active + deleted,
    eventCount: 1,
    mediaCount: 4,
    hasSubscription: false,
    stripeCustomerUrl: null,
  };
}

async function draw() {
  render(
    await AdminAccountDetailPage({ params: Promise.resolve({ id: HOST }) }),
  );
}

/** A card by its title, so a figure is read where the operator reads it. */
const card = (title: string) =>
  screen.getByText(title).closest('[data-slot="card"]') as HTMLElement;

beforeEach(() => {
  state.used = { ok: true, value: 0 };
  state.hour = { ok: true, value: 0 };
  state.warnings = [];
  account({});
});

describe("the storage card", () => {
  it("★ draws her albums and her Deleted side by side, and the total her cap holds against the cap", async () => {
    account({ active: 60 * MEGABYTE, deleted: 25 * MEGABYTE });
    await draw();
    const storage = within(card("Storage and usage"));
    expect(storage.getByText("Albums").nextElementSibling?.textContent).toBe(
      "60 MB",
    );
    expect(storage.getByText("Deleted").nextElementSibling?.textContent).toBe(
      "25 MB",
    );
    // The cap holds both: 85 MB stored against Free's 100 MB, not the 60 MB the albums alone would say.
    expect(storage.getByText("Stored").nextElementSibling?.textContent).toBe(
      "85 MB of 100 MB",
    );
  });

  it("a Pro with no cap on record is stored against Unlimited", async () => {
    account({ tier: "pro", active: 5 * GIGABYTE, deleted: 1 * GIGABYTE });
    await draw();
    expect(
      within(card("Storage and usage")).getByText("Stored").nextElementSibling
        ?.textContent,
    ).toBe("6 GB of Unlimited");
  });
});

describe("the uploads card", () => {
  it("★ reads the month's uploads against the plan's allowance, and the hour against the breaker", async () => {
    state.used = { ok: true, value: 212 * MEGABYTE };
    state.hour = { ok: true, value: 312 };
    await draw();
    const uploads = within(card("Uploads"));
    expect(
      uploads.getByText("This month").nextElementSibling?.textContent,
    ).toBe("212 MB of 300 MB");
    expect(
      uploads.getByText("Started this hour").nextElementSibling?.textContent,
    ).toBe("312 of 20,000");
    expect(uploads.queryByText("At limit")).toBeNull();
  });

  it("★ a pass holder's row is her pass's year, against her stack's allowance", async () => {
    account({ tier: "event_pass", cap: 50 * GIGABYTE }); // two passes' rooms
    state.used = { ok: true, value: 31 * GIGABYTE };
    await draw();
    const uploads = within(card("Uploads"));
    expect(uploads.queryByText("This month")).toBeNull();
    expect(uploads.getByText("Pass year").nextElementSibling?.textContent).toBe(
      "31 GB of 100 GB",
    );
  });

  it("★ at the allowance, it says so and what that means for her guests", async () => {
    state.used = { ok: true, value: 300 * MEGABYTE };
    await draw();
    const uploads = within(card("Uploads"));
    expect(uploads.getByText("At limit")).toBeInTheDocument();
    expect(
      uploads.getByText(/are refused until the window turns/),
    ).toBeInTheDocument();
  });

  it("at the hour's breaker, it says so and until when", async () => {
    state.hour = { ok: true, value: 20_000 };
    await draw();
    const uploads = within(card("Uploads"));
    expect(uploads.getByText("At limit")).toBeInTheDocument();
    expect(
      uploads.getByText(/refused until the next UTC hour/),
    ).toBeInTheDocument();
  });

  it("an unmetered Pro (no cap on record yet) reads its uploads and says unmetered, never at its limit", async () => {
    account({ tier: "pro" });
    state.used = { ok: true, value: 5 * GIGABYTE };
    await draw();
    const uploads = within(card("Uploads"));
    expect(
      uploads.getByText("This month").nextElementSibling?.textContent,
    ).toBe("5 GB, unmetered");
    expect(uploads.queryByText("At limit")).toBeNull();
  });

  it("★ a real zero is a reading", async () => {
    await draw();
    const uploads = within(card("Uploads"));
    expect(
      uploads.getByText("This month").nextElementSibling?.textContent,
    ).toBe("0 B of 300 MB");
    expect(
      uploads.getByText("Started this hour").nextElementSibling?.textContent,
    ).toBe("0 of 20,000");
  });

  it("★ a failed read says No reading and why, never a zero, tells Sentry once, and leaves the rest of the page", async () => {
    state.used = {
      ok: false,
      message: "permission denied for function uploads_used",
    };
    state.hour = { ok: false, message: "fetch failed" };
    await draw();
    const uploads = within(card("Uploads"));
    expect(uploads.getAllByText("No reading")).toHaveLength(2);
    expect(
      uploads.getByText("permission denied for function uploads_used"),
    ).toBeInTheDocument();
    expect(uploads.getByText("fetch failed")).toBeInTheDocument();
    expect(uploads.queryByText(/^0 B/)).toBeNull();
    expect(uploads.queryByText("At limit")).toBeNull();
    // The operator who came to read something else still has the delete.
    expect(
      screen.getByRole("button", { name: "Delete account" }),
    ).toBeInTheDocument();
    expect(state.warnings).toEqual([
      [
        "admin",
        "account: uploads read failed",
        {
          user_id: HOST,
          unread: 2,
          message: "permission denied for function uploads_used",
        },
      ],
    ]);
  });

  it("raises nothing when both reads came back", async () => {
    await draw();
    expect(state.warnings).toEqual([]);
  });
});
