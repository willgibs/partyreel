"use server";

import { requireAdminAction } from "@/lib/auth/admin-context";
import { searchAccounts } from "@/lib/db/queries/accounts";

/**
 * ACCOUNTS, FOR THE PALETTE (`nav=rail-palette`: "a search that jumps to a
 * surface, an account or an action").
 *
 * A palette that reaches accounts is the one part of the index that cannot be
 * static, so it is the one part that crosses the seam, and it crosses it the
 * only way anything in the portal is allowed to: through `requireAdminAction`,
 * which is where AAL2 is enforced. The palette is a client island, so without
 * this the index would either be shipped to the browser (every operator's
 * customer list in a JS bundle) or read through a route handler with a second
 * copy of the gate.
 *
 * ★ IT RETURNS EIGHT ROWS AND NO MORE, AND IT RETURNS NOTHING ON A REFUSAL.
 * An empty array on a failed gate rather than an error: the palette's job is to
 * jump somewhere, and a signed-out or AAL1 session has nowhere to jump to. The
 * page it would jump to gates again anyway, so nothing here is the boundary.
 */
export async function searchAccountsForPaletteAction(
  query: string,
): Promise<{ id: string; label: string; meta: string }[]> {
  const auth = await requireAdminAction();
  if (!auth.ok) return [];

  const term = query.trim();
  if (term.length < 2) return [];

  try {
    const rows = await searchAccounts(term);
    return rows.slice(0, 8).map((row) => ({
      id: row.id,
      label: row.display_name?.trim() || row.email || row.id,
      meta: row.display_name?.trim() ? (row.email ?? "") : "",
    }));
  } catch {
    // A palette that throws takes the page down with it; a palette that finds
    // no accounts is simply a palette with no accounts in it today.
    return [];
  }
}
