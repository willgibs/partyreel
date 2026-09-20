import "server-only";

import { createHash } from "node:crypto";

/**
 * `profiles.id` -> the seed every avatar surface paints (docs/design/rulings.md,
 * the sixth batch, `seed=account`). SHA-256, hex, SERVER-ONLY.
 *
 * ★ WHY A HASH, AND WHY EVERY SURFACE GOES THROUGH IT. A raw account id must
 * never reach a browser that does not already hold it — the guest "Hosted by"
 * byline paints the HOST's colour on a GUEST's screen, and `events.host_id` is
 * deliberately kept off that client today (docs/systems/auth-accounts.md,
 * `getHostAvatarUrl`; `/api/me/menu`'s own comment: "host_id never leaks to
 * the client"). A one-way hash lets that surface paint the exact right colour
 * without handing over anything the raw id could be used for.
 *
 * That forces the SAME rule everywhere else too, not just there: `orbFor`
 * (gradient.ts) is a pure function of whatever string it is given, so if one
 * surface fed it the raw id and another fed it this hash, the SAME person
 * would be two different hues on two different pages. "One colour per person
 * everywhere" only holds if this function is the ONE step between an id and a
 * seed, called on every surface, with no exception for a person's own id.
 *
 * Never import this from a "use client" module — node:crypto has no browser
 * build, and the `server-only` guard above throws at build time if you try.
 * Compute it in the Server Component or Route Handler that already holds the
 * id, and hand the STRING this returns to whatever renders the avatar next.
 */
export function seedFor(id: string): string {
  return createHash("sha256").update(id).digest("hex");
}
