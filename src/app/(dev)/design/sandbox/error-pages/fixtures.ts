/**
 * FIXTURES FOR `error-pages`: the two screens every decision is judged at, one
 * fabricated crash shared by every preview that needs one, and the portal
 * alerts held constant. Nothing here touches a database, a queue or the
 * network: every screen on this board renders from these constants alone.
 */

export const SCREENS = {
  "1440": { w: 1440, h: 900, name: "a laptop" },
  "375": { w: 375, h: 812, name: "a phone" },
} as const;
export type ScreenId = keyof typeof SCREENS;
export const screenOf = (v: string | undefined): ScreenId =>
  v === "375" ? "375" : "1440";

/**
 * The SAME crash everywhere a screen needs one, so a reader can tell which
 * screens are drawing one shared error rather than a different one each time.
 * `next`'s real digest is an opaque hash; this one is shaped like it and never
 * changes, so a "Copy" control has something stable to copy.
 */
export function fabricatedError(): Error & { digest?: string } {
  const err = new Error("fabricated for the lab, never thrown") as Error & {
    digest?: string;
  };
  err.digest = "f3a91c7e";
  return err;
}

/** The portal's alerts bell, held constant across every admin frame: three
 *  inboxes with something waiting, jobs healthy (so no health band fires and
 *  borrows attention from a question that is not about it). */
export const ALERTS = { support: 4, applicants: 1, reports: 2 };
export const OPERATOR_EMAIL = "partyr33l@gmail.com";
