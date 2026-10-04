import { effectiveStorageCap, toBillingTier } from "@/lib/constants/tiers";
import { formatBytes } from "@/lib/utils";

/**
 * ★ A NULL `storage_cap_bytes` IS UNLIMITED ONLY FOR A PRO (red-team 52's LOW: the Accounts list printed "Unlimited"
 * for every account with no cap column, a Free host's included, so an operator scanning it for accounts over their
 * plan saw none while the account's own page said "of 100 MB").
 *
 * A Free or pass profile's column is null and its plan's cap is the tier's own default (`effectiveStorageCap`, the one
 * function the over-capacity sweep and the account's page read); only a Pro with no cap on record yet (the webhook
 * writes it) is unmetered. The operator's list, its over-tint and the account's page all read the cap through here.
 */
export function accountCap(
  tier: string,
  storageCapBytes: number | null,
): number | null {
  return effectiveStorageCap(toBillingTier(tier), storageCapBytes);
}

/** A cap as an operator reads it: a size, or Unlimited for the one profile that has none. */
export function capLabel(capBytes: number | null): string {
  return capBytes === null ? "Unlimited" : formatBytes(capBytes);
}
