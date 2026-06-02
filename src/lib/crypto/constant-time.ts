/**
 * Constant-time string comparison. Hash both sides to a fixed length FIRST:
 * `timingSafeEqual` throws on unequal-length buffers, and we don't want to leak a
 * secret's length via that error / an early return. Used for the cron bearer check
 * (api/cron/purge) and the password-unlock cookie HMAC verify (lib/events/unlock-token).
 *
 * No `import "server-only"` on purpose: this is pure node:crypto (which already can't
 * bundle for the browser), and keeping it import-clean lets the unlock-token unit
 * tests exercise it under Vitest.
 */
import { createHash, timingSafeEqual } from "node:crypto";

export function constantTimeEquals(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}
