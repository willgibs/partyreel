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
 *
 * ★ AND HER PASS-TO-PRO CREDITS (credit-watch): what became of each credited Pro checkout of hers, a stuck one with
 * its Retry and only a stuck one; drawn only when she has one or the read failed (No reading, never none).
 *
 * ★ AND HER OPERATOR'S UPLOADS CREDITS (crumbs-92, X6): each live one with its amount, where it ends, who made it, when
 * and why, beside the count it has been taken off; the control offered with exactly the room the bound leaves, and in its
 * place a sentence when there is nothing to lift (unmetered, lapsed, the most live credits, no room left) or the credits
 * could not be read. A read that failed says No reading and never an empty list.
 */

const HOST = "22222222-2222-4222-8222-222222222222";

type Reading = { ok: true; value: number } | { ok: false; message: string };
const state = vi.hoisted(() => ({
  profile: {} as Record<string, unknown>,
  detail: {} as Record<string, unknown>,
  used: { ok: true, value: 0 } as Reading,
  /** A lapsed pass's end (null: no pass of hers ever live), or undefined for an account that is not lapsed. */
  lapsedSince: undefined as string | null | undefined,
  /** Whether that end was her passes' conversion to Pro credit (her Pro plan not landed yet). */
  converted: false,
  hour: { ok: true, value: 0 } as Reading,
  warnings: [] as unknown[][],
  aal: "aal2",
  reads: 0,
  /** Her credits' reading (credit-watch). */
  credits: { ok: true, value: [] } as unknown,
  /** Her operator's uploads credits' reading (crumbs-92). */
  lifts: { ok: true, value: [] } as unknown,
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/admin-context", () => ({
  requireAdmin: async () => ({ aal: state.aal }),
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
vi.mock("./credit-retry-control", () => ({
  CreditRetryControl: ({ sessionId }: { sessionId: string }) => (
    <button type="button" data-session={sessionId}>
      Retry the credit
    </button>
  ),
}));
vi.mock("./uploads-credit-control", () => ({
  UploadsCreditControl: ({
    room,
    until,
    who,
  }: {
    room: number;
    until: string;
    who: string;
  }) => (
    <button type="button" data-room={room} data-until={until} data-who={who}>
      Credit…
    </button>
  ),
}));
vi.mock("@/lib/db/queries/uploads-credits", () => ({
  readAccountUploadsCredits: async () => {
    state.reads += 1;
    return state.lifts;
  },
}));
vi.mock("@/lib/db/queries/pass-credits", () => ({
  readAccountPassCredits: async () => {
    state.reads += 1;
    return state.credits;
  },
}));
// The page's one clock read, fixed so each credit's state is judged at a known instant.
vi.mock("@/lib/admin/pending", () => ({
  serverNow: () => Date.parse("2026-10-05T12:00:00.000Z"),
}));
vi.mock("@/lib/db/queries/accounts", () => ({
  getAccountDetail: async () => {
    state.reads += 1;
    return state.detail;
  },
  // The real tier rules over canned reads: only the two answers are stubbed.
  readAccountUploads: async (profile: {
    tier: string;
    storage_cap_bytes: number | null;
  }) => {
    state.reads += 1;
    const tier = toBillingTier(profile.tier);
    return {
      window: UPLOADS_WINDOW[tier],
      allowanceBytes: uploadAllowance(tier, profile.storage_cap_bytes),
      used: state.used,
      lapsed:
        state.used.ok && state.lapsedSince !== undefined
          ? { since: state.lapsedSince, converted: state.converted }
          : null,
    };
  },
  readAccountHourUploads: async () => {
    state.reads += 1;
    return state.hour;
  },
}));

const { default: AdminAccountDetailPage } = await import("./page");

function account(over: {
  tier?: string;
  cap?: number | null;
  active?: number;
  deleted?: number;
  expires?: string | null;
}) {
  const tier = over.tier ?? "free";
  const cap = over.cap ?? null;
  state.profile = {
    id: HOST,
    email: "host@example.com",
    display_name: "A host",
    tier,
    storage_cap_bytes: cap,
    tier_expires_at: over.expires ?? null,
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
  state.lapsedSince = undefined;
  state.converted = false;
  state.hour = { ok: true, value: 0 };
  state.warnings = [];
  state.aal = "aal2";
  state.reads = 0;
  state.credits = { ok: true, value: [] };
  state.lifts = { ok: true, value: [] };
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

/** One live operator credit as the page reads it. */
const lift = (over: Record<string, unknown> = {}) => ({
  id: "c1",
  bytes: 100 * MEGABYTE,
  windowEndsAt: "2026-11-01T00:00:00+00:00",
  grantedAt: "2026-10-04T12:03:00+00:00",
  reason: "She wrote in: her guests were refused",
  operator: "hi@willgibs.com",
  ...over,
});

describe("her operator's uploads credits (crumbs-92, X6)", () => {
  it("★ draws each live credit with its amount, its end, who made it, when and why, and says the count has it taken off", async () => {
    state.used = { ok: true, value: 212 * MEGABYTE };
    state.lifts = {
      ok: true,
      value: [
        lift(),
        lift({ id: "c2", bytes: 50 * MEGABYTE, reason: "again" }),
      ],
    };
    await draw();
    const uploads = within(card("Uploads"));
    expect(uploads.getAllByText("Credit")).toHaveLength(2);
    expect(
      uploads.getByText("+100 MB until Nov 1, 2026 UTC"),
    ).toBeInTheDocument();
    expect(
      uploads.getByText("+50 MB until Nov 1, 2026 UTC"),
    ).toBeInTheDocument();
    expect(
      uploads.getByText(
        "Granted Oct 4, 2026, 12:03 UTC by hi@willgibs.com: She wrote in: her guests were refused",
      ),
    ).toBeInTheDocument();
    expect(uploads.getByText(/credit taken off/)).toBeInTheDocument();
  });

  it("draws nothing for an account with none, and is quiet", async () => {
    await draw();
    const uploads = within(card("Uploads"));
    expect(uploads.queryByText("Credit")).toBeNull();
    expect(state.warnings).toEqual([]);
  });

  it("★ a failed credits read says No reading and why, tells Sentry, holds the control back and leaves the rest of the card", async () => {
    state.lifts = {
      ok: false,
      message: 'relation "uploads_credits" does not exist',
    };
    state.used = { ok: true, value: 212 * MEGABYTE };
    await draw();
    const uploads = within(card("Uploads"));
    expect(
      uploads.getByText("Credit").nextElementSibling?.textContent,
    ).toContain("No reading");
    expect(
      uploads.getByText('relation "uploads_credits" does not exist'),
    ).toBeInTheDocument();
    expect(uploads.queryByRole("button", { name: /Credit/ })).toBeNull();
    expect(
      uploads.getByText(/could not be read, so crediting waits/),
    ).toBeInTheDocument();
    // The count she reads is still drawn.
    expect(
      uploads.getByText("This month").nextElementSibling?.textContent,
    ).toBe("212 MB of 300 MB");
    expect(state.warnings).toEqual([
      [
        "admin",
        "account: uploads credits read failed",
        { user_id: HOST, message: 'relation "uploads_credits" does not exist' },
      ],
    ]);
  });

  it("★ offers the control with the room the bound leaves: the plan's allowance less what she holds", async () => {
    await draw();
    const button = within(card("Uploads")).getByRole("button", {
      name: "Credit…",
    });
    expect(button.dataset.room).toBe(String(300 * MEGABYTE));
    // The month turns at the first instant of the next UTC month (the page's clock is fixed at 2026-10-05).
    expect(button.dataset.until).toBe("Nov 1, 2026 UTC, when the month turns");
    expect(button.dataset.who).toBe("A host");
  });

  it("the room shrinks by what she already holds", async () => {
    state.lifts = { ok: true, value: [lift()] };
    await draw();
    expect(
      within(card("Uploads")).getByRole("button", { name: "Credit…" }).dataset
        .room,
    ).toBe(String(200 * MEGABYTE));
  });

  it("★ a pass holder's credit ends with her soonest live pass, against her stack's allowance", async () => {
    account({ tier: "event_pass", cap: 50 * GIGABYTE });
    await draw();
    const button = within(card("Uploads")).getByRole("button", {
      name: "Credit…",
    });
    expect(button.dataset.room).toBe(String(100 * GIGABYTE));
    expect(button.dataset.until).toBe("her soonest live pass ends");
  });

  it("★ says why there is no control instead of leaving a press that fails: unmetered, lapsed, the most live credits, no room left", async () => {
    // A Pro with no cap on record has no allowance to lift.
    account({ tier: "pro" });
    await draw();
    expect(
      within(card("Uploads")).getByText(/No allowance to lift/),
    ).toBeInTheDocument();
    expect(
      within(card("Uploads")).queryByRole("button", { name: "Credit…" }),
    ).toBeNull();
  });

  it("a lapsed pass is lifted by the recompute, never by a credit", async () => {
    account({
      tier: "event_pass",
      cap: 25 * GIGABYTE,
      expires: "2026-10-03T14:05:00+00:00",
    });
    state.lapsedSince = "2026-10-03T14:05:00+00:00";
    await draw();
    expect(
      within(card("Uploads")).getByText(/never by a credit/),
    ).toBeInTheDocument();
    expect(
      within(card("Uploads")).queryByRole("button", { name: "Credit…" }),
    ).toBeNull();
  });

  it("a pass converted to Pro credit waits on her Pro plan, not on the recompute, and no credit lifts that either", async () => {
    account({ tier: "event_pass", cap: 25 * GIGABYTE });
    state.lapsedSince = "2026-10-05T09:30:00+00:00";
    state.converted = true;
    await draw();
    const uploads = within(card("Uploads"));
    expect(
      uploads.getByText(
        "A pass converted to Pro credit is lifted when her Pro plan lands, never by a credit.",
      ),
    ).toBeInTheDocument();
    expect(uploads.queryByRole("button", { name: "Credit…" })).toBeNull();
  });

  it("the most live credits, and no room left, are said in place of the control", async () => {
    state.lifts = {
      ok: true,
      value: Array.from({ length: 10 }, (_, i) =>
        lift({ id: `c${i}`, bytes: MEGABYTE }),
      ),
    };
    await draw();
    expect(
      within(card("Uploads")).getByText(/the most live credits at once \(10\)/),
    ).toBeInTheDocument();
    expect(
      within(card("Uploads")).queryByRole("button", { name: "Credit…" }),
    ).toBeNull();
  });

  it("no room left: her credits already add one more of her allowance", async () => {
    state.lifts = { ok: true, value: [lift({ bytes: 300 * MEGABYTE })] };
    await draw();
    expect(
      within(card("Uploads")).getByText(
        /already add one more of her plan.s\s+allowance/,
      ),
    ).toBeInTheDocument();
    expect(
      within(card("Uploads")).queryByRole("button", { name: "Credit…" }),
    ).toBeNull();
  });

  it("★ at the allowance, the card says a credit lifts it sooner", async () => {
    state.used = { ok: true, value: 300 * MEGABYTE };
    await draw();
    expect(
      within(card("Uploads")).getByText(/or until you credit her below/),
    ).toBeInTheDocument();
  });
});

describe("a lapsed pass (billing-locks)", () => {
  it("★ says Pass lapsed and what it means, never 0 B of an allowance no live pass holds", async () => {
    account({
      tier: "event_pass",
      cap: 25 * GIGABYTE,
      expires: "2026-10-03T14:05:00+00:00",
    });
    state.lapsedSince = "2026-10-03T14:05:00+00:00";
    await draw();
    const uploads = within(card("Uploads"));
    expect(uploads.getByText("Pass year").nextElementSibling?.textContent).toBe(
      "Pass lapsed",
    );
    expect(uploads.queryByText(/0 B/)).toBeNull();
    expect(
      uploads.getByText(
        "Her pass ended Oct 3, 2026, 14:05 UTC: new uploads, hers and her guests', are refused until the nightly recompute moves her to Free.",
      ),
    ).toBeInTheDocument();
    expect(uploads.queryByText("At limit")).toBeNull();
    // Her billing card tells the expiry in its tense: it is past.
    const billing = within(card("Billing"));
    expect(billing.getByText("Pass expired")).toBeInTheDocument();
    expect(billing.queryByText("Pass expires")).toBeNull();
  });

  it("with no pass of hers ever live, it says so and invents no date", async () => {
    account({ tier: "event_pass" });
    state.lapsedSince = null;
    await draw();
    expect(
      within(card("Uploads")).getByText(
        "She holds no live pass: new uploads, hers and her guests', are refused until the nightly recompute moves her to Free.",
      ),
    ).toBeInTheDocument();
  });

  it("★ a pass converted to Pro credit says Pro pending and that her Pro plan has not landed, never 'moves her to Free'", async () => {
    account({ tier: "event_pass", cap: 25 * GIGABYTE });
    state.lapsedSince = "2026-10-05T09:30:00+00:00";
    state.converted = true;
    await draw();
    const uploads = within(card("Uploads"));
    expect(uploads.getByText("Pass year").nextElementSibling?.textContent).toBe(
      "Pro pending",
    );
    expect(
      uploads.getByText(
        "Her passes became Pro credit Oct 5, 2026, 09:30 UTC and her Pro plan has not landed yet: new uploads, hers and her guests', are refused until it does.",
      ),
    ).toBeInTheDocument();
    expect(uploads.queryByText(/moves her to Free/)).toBeNull();
  });

  it("a live pass still reads its year against its allowance, and an expiry ahead says expires", async () => {
    account({
      tier: "event_pass",
      cap: 25 * GIGABYTE,
      expires: "2099-01-01T00:00:00+00:00",
    });
    state.used = { ok: true, value: 31 * GIGABYTE };
    await draw();
    expect(
      within(card("Uploads")).getByText("Pass year").nextElementSibling
        ?.textContent,
    ).toBe("31 GB of 50 GB");
    expect(
      within(card("Billing")).getByText("Pass expires"),
    ).toBeInTheDocument();
  });
});

describe("the portal's gate and the page's id", () => {
  it("★ below AAL2 the page draws nothing and reads nothing, her uploads and her hour included", async () => {
    state.aal = "aal1";
    const out = await AdminAccountDetailPage({
      params: Promise.resolve({ id: HOST }),
    });
    expect(out).toBeNull();
    expect(state.reads).toBe(0);
    expect(state.warnings).toEqual([]);
  });

  it("★ an id that is not one names no account and reads nothing (a not-found, never a read of a malformed id)", async () => {
    render(
      await AdminAccountDetailPage({
        params: Promise.resolve({ id: "not-a-uuid'; drop table profiles;--" }),
      }),
    );
    expect(screen.getByText("Not found")).toBeInTheDocument();
    expect(state.reads).toBe(0);
  });
});

describe("her pass-to-Pro credits (credit-watch)", () => {
  function credit(name: string, over: Record<string, unknown>) {
    return {
      stripe_session_id: `cs_test_${name}`,
      profile_id: HOST,
      credit_cents: 1850,
      pass_ids: [
        "00000000-0000-4000-8000-00000000000a",
        "00000000-0000-4000-8000-00000000000b",
      ],
      claimed_until: null,
      balance_transaction_id: null,
      granted_at: null,
      converted_at: null,
      converted_count: null,
      released_at: null,
      created_at: "2026-10-05T11:30:00.000Z",
      ...over,
    };
  }

  it("draws no card for an account that never had one", async () => {
    await draw();
    expect(screen.queryByText("Pass-to-Pro credits")).toBeNull();
  });

  it("★ says what became of each, with Retry beside a stuck one and only a stuck one", async () => {
    state.credits = {
      ok: true,
      value: [
        credit("stuck", {
          created_at: "2026-10-05T10:00:00.000Z",
          claimed_until: "2026-10-05T10:10:00.000Z",
        }),
        credit("done", {
          created_at: "2026-10-04T09:00:00.000Z",
          balance_transaction_id: "cbtxn_1",
          granted_at: "2026-10-04T09:00:00.000Z",
          converted_at: "2026-10-04T09:00:01.000Z",
          converted_count: 2,
        }),
        credit("released", {
          created_at: "2026-10-03T09:00:00.000Z",
          released_at: "2026-10-03T10:00:00.000Z",
        }),
      ],
    };
    await draw();
    const credits = within(card("Pass-to-Pro credits"));
    expect(credits.getByText("Stuck")).toBeTruthy();
    expect(
      credits.getByText(
        "Claimed Oct 5, 2026, 10:00 UTC for $18.50 over 2 passes, never granted: its delivery died and no retry has finished it. Retry runs it now.",
      ),
    ).toBeTruthy();
    expect(
      credits.getByText(/2 passes became credit Oct 4, 2026, 09:00 UTC\.$/),
    ).toBeTruthy();
    expect(
      credits.getByText(/^Not credited: another checkout of hers/),
    ).toBeTruthy();
    // Retry beside the stuck one alone, naming its checkout.
    const retries = credits.getAllByRole("button", {
      name: "Retry the credit",
    });
    expect(retries).toHaveLength(1);
    expect(retries[0]!.getAttribute("data-session")).toBe("cs_test_stuck");
    // Each claim names its checkout, for the operator's look in Stripe.
    expect(credits.getByText("cs_test_done")).toBeTruthy();
  });

  it("★ a failed read says No reading and why, tells Sentry, and leaves the rest of the page", async () => {
    state.credits = { ok: false, message: "admin/accounts: her credits: boom" };
    await draw();
    const credits = within(card("Pass-to-Pro credits"));
    expect(credits.getByText("No reading")).toBeTruthy();
    expect(credits.getByText("admin/accounts: her credits: boom")).toBeTruthy();
    expect(state.warnings).toContainEqual([
      "admin",
      "account: credits read failed",
      { user_id: HOST, message: "admin/accounts: her credits: boom" },
    ]);
    expect(screen.getByRole("button", { name: "Delete account" })).toBeTruthy();
  });
});
