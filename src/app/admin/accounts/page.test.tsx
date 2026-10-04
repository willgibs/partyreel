import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GIGABYTE, MEGABYTE, planById } from "@/lib/constants/tiers";

/**
 * ★ THE ACCOUNTS LIST SAYS EACH ACCOUNT'S REAL CAP (red-team 52's LOW: "reads a null storage_cap_bytes as 'Unlimited' for
 * every account, Free included ... an operator scanning the list for over-cap accounts sees none"). The real page,
 * its reads stubbed beneath it: a Free profile's null column is the Free cap and a Free account past it is marked,
 * a pass holder's is her pass's room, and only a Pro with no cap on record reads Unlimited.
 */

const accounts = vi.hoisted(() => ({ rows: [] as Record<string, unknown>[] }));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/admin-context", () => ({
  requireAdmin: async () => ({ aal: "aal2" }),
}));
vi.mock("@/lib/db/queries/accounts", () => ({
  searchAccounts: async () => accounts.rows,
  accountTierLabel: (tier: string) =>
    tier === "pro" ? "Pro" : tier === "event_pass" ? "Event Pass" : "Free",
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
