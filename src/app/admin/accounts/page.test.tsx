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
 * ★ THE ACCOUNTS LIST SAYS EACH ACCOUNT'S REAL CAP (red-team 52's LOW: "reads a null storage_cap_bytes as 'Unlimited' for
 * every account, Free included ... an operator scanning the list for over-cap accounts sees none"). The real page,
 * its reads stubbed beneath it: a Free profile's null column is the Free cap and a Free account past it is marked,
 * a pass holder's is her pass's room, and only a Pro with no cap on record reads Unlimited.
 *
 * ★ AND EACH ACCOUNT'S UPLOADS AGAINST ITS ALLOWANCE (admin-uploads): what her window has used beside the number her plan
 * holds her to, a row at the allowance marked, and a failed read saying No reading rather than zero.
 */

const accounts = vi.hoisted(() => ({ rows: [] as Record<string, unknown>[] }));
/** What each account's window has used, by display name; an account not named here has used nothing. A string fails its read. */
const usage = vi.hoisted(() => ({
  byName: {} as Record<string, number | string>,
}));
const sentry = vi.hoisted(() => ({ warnings: [] as unknown[][] }));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/admin-context", () => ({
  requireAdmin: async () => ({ aal: "aal2" }),
}));
vi.mock("@/lib/observability/sentry", () => ({
  captureWarning: (...args: unknown[]) => sentry.warnings.push(args),
}));
vi.mock("@/lib/db/queries/accounts", () => ({
  searchAccounts: async () => accounts.rows,
  accountTierLabel: (tier: string) =>
    tier === "pro" ? "Pro" : tier === "event_pass" ? "Event Pass" : "Free",
  // The real tier rules over a stubbed read: only `uploads_used`'s answer is canned.
  readAccountUploads: async (profile: {
    tier: string;
    storage_cap_bytes: number | null;
  }) => {
    const tier = toBillingTier(profile.tier);
    const name = (profile as unknown as { display_name: string }).display_name;
    const used = usage.byName[name] ?? 0;
    return {
      window: UPLOADS_WINDOW[tier],
      allowanceBytes: uploadAllowance(tier, profile.storage_cap_bytes),
      used:
        typeof used === "number"
          ? { ok: true, value: used }
          : { ok: false, message: used },
    };
  },
}));

const { default: AdminAccountsPage } = await import("./page");

function row(over: Record<string, unknown>) {
  return {
    id: "id-" + Math.random().toString(36).slice(2),
    email: "host@example.com",
    display_name: "A host",
    tier: "free",
    storage_cap_bytes: null,
    storage_used_bytes: 0,
    last_active_at: "2026-10-04T00:00:00Z",
    created_at: "2026-09-01T00:00:00Z",
    ...over,
  };
}

async function draw() {
  render(await AdminAccountsPage({ searchParams: Promise.resolve({}) }));
}

const rowOf = (name: string) =>
  screen.getByText(name).closest("tr") as HTMLElement;

beforeEach(() => {
  accounts.rows = [];
  usage.byName = {};
  sentry.warnings = [];
});

describe("the Cap column", () => {
  it("★ reads a Free profile's null as the Free cap, and marks the Free account that is past it", async () => {
    accounts.rows = [
      row({
        display_name: "RT44 Hi",
        storage_used_bytes: 109.6 * MEGABYTE,
      }),
      row({ display_name: "Within", storage_used_bytes: 12 * MEGABYTE }),
    ];
    await draw();
    const over = rowOf("RT44 Hi");
    expect(within(over).getByText("100 MB")).toBeInTheDocument();
    expect(within(over).queryByText("Unlimited")).toBeNull();
    // Past its plan, so the row carries the portal's warning tone; the one inside it does not.
    expect(over.getAttribute("data-tone")).toBe("warning");
    expect(rowOf("Within").getAttribute("data-tone")).toBeNull();
  });

  it("reads a pass holder's room, and a Pro's written cap as written", async () => {
    accounts.rows = [
      row({ display_name: "Pass", tier: "event_pass" }),
      row({
        display_name: "Pro host",
        tier: "pro",
        storage_cap_bytes: planById("pro_200").storageBytes,
        storage_used_bytes: 10 * GIGABYTE,
      }),
    ];
    await draw();
    expect(within(rowOf("Pass")).getByText("25 GB")).toBeInTheDocument();
    expect(within(rowOf("Pro host")).getByText("200 GB")).toBeInTheDocument();
  });

  it("keeps Unlimited for the one profile that has no cap: a Pro the webhook has not written yet", async () => {
    accounts.rows = [
      row({
        display_name: "Unwritten",
        tier: "pro",
        storage_used_bytes: 5 * GIGABYTE,
      }),
    ];
    await draw();
    const unwritten = rowOf("Unwritten");
    expect(within(unwritten).getByText("Unlimited")).toBeInTheDocument();
    expect(unwritten.getAttribute("data-tone")).toBeNull();
  });
});

describe("the Uploads and Allowance columns", () => {
  it("reads what each window has used beside its plan's number, with the window named", async () => {
    usage.byName = {
      "Free host": 120 * MEGABYTE,
      "Pass host": 31 * GIGABYTE,
      "Pro host": 40 * GIGABYTE,
    };
    accounts.rows = [
      row({ display_name: "Free host" }),
      row({ display_name: "Pass host", tier: "event_pass" }),
      row({
        display_name: "Pro host",
        tier: "pro",
        storage_cap_bytes: planById("pro_200").storageBytes,
      }),
    ];
    await draw();
    const free = rowOf("Free host");
    expect(within(free).getByText("120 MB")).toBeInTheDocument();
    expect(within(free).getByText("300 MB / mo")).toBeInTheDocument();
    // A pass holder's allowance counts her pass's own year, so the table says so.
    const pass = rowOf("Pass host");
    expect(within(pass).getByText("31 GB")).toBeInTheDocument();
    expect(within(pass).getByText("50 GB / yr")).toBeInTheDocument();
    const pro = rowOf("Pro host");
    expect(within(pro).getByText("40 GB")).toBeInTheDocument();
    expect(within(pro).getByText("200 GB / mo")).toBeInTheDocument();
    for (const name of ["Free host", "Pass host", "Pro host"]) {
      expect(rowOf(name).getAttribute("data-tone")).toBeNull();
      expect(within(rowOf(name)).queryByText("At limit")).toBeNull();
    }
  });

  it("★ marks the account at its allowance, the line where guests' uploads are refused, and tints its row", async () => {
    usage.byName = { "At it": 300 * MEGABYTE, "Under it": 299 * MEGABYTE };
    accounts.rows = [
      row({ display_name: "At it" }),
      row({ display_name: "Under it" }),
    ];
    await draw();
    const at = rowOf("At it");
    expect(within(at).getByText("At limit")).toBeInTheDocument();
    expect(at.getAttribute("data-tone")).toBe("warning");
    expect(within(rowOf("Under it")).queryByText("At limit")).toBeNull();
    expect(rowOf("Under it").getAttribute("data-tone")).toBeNull();
  });

  it("an unmetered Pro (no cap on record yet) reads Unmetered, never at its limit", async () => {
    usage.byName = { Unwritten: 900 * GIGABYTE };
    accounts.rows = [row({ display_name: "Unwritten", tier: "pro" })];
    await draw();
    const unwritten = rowOf("Unwritten");
    expect(within(unwritten).getByText("Unmetered")).toBeInTheDocument();
    expect(within(unwritten).queryByText("At limit")).toBeNull();
    expect(unwritten.getAttribute("data-tone")).toBeNull();
  });

  it("★ a failed read says No reading in its row and never 0 B, tells the operator, and never fails the page", async () => {
    usage.byName = { Broken: "permission denied for function uploads_used" };
    accounts.rows = [
      // Storage is not zero here, so a "0 B" in the row could only be the uploads cell.
      row({ display_name: "Broken", storage_used_bytes: 7 * MEGABYTE }),
      row({ display_name: "Fine", storage_used_bytes: 1 * MEGABYTE }),
    ];
    await draw();
    const broken = rowOf("Broken");
    expect(within(broken).getByText("No reading")).toBeInTheDocument();
    expect(within(broken).queryByText("0 B")).toBeNull();
    // Her allowance is the plan's number, which no read can fail.
    expect(within(broken).getByText("300 MB / mo")).toBeInTheDocument();
    expect(broken.getAttribute("data-tone")).toBeNull();
    // The other row still reads.
    expect(within(rowOf("Fine")).getByText("0 B")).toBeInTheDocument();
    expect(screen.getByRole("alert").textContent).toMatch(
      /could not be read for 1 of 2 accounts/,
    );
    // Said aloud once, with the first reason, never one event a row.
    expect(sentry.warnings).toEqual([
      [
        "admin",
        "accounts: uploads read failed",
        {
          unread: 1,
          of: 2,
          message: "permission denied for function uploads_used",
        },
      ],
    ]);
  });

  it("raises nothing when every row read", async () => {
    accounts.rows = [row({ display_name: "Fine" })];
    await draw();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(sentry.warnings).toEqual([]);
  });
});
