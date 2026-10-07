import {
  DEFAULT_QR_PRESET,
  type QrStyleKey,
  QR_STYLE_KEYS,
} from "@/lib/constants/qr-presets";
import { type AlbumStyle, styleOf } from "@/lib/disposable/album-style";
import type { Capture } from "@/lib/disposable/facts";

/**
 * MAKE ONE LIKE THIS: CREATE IN AN ALBUM'S STYLE (after-party r1's `bridge=end`, Will 2026-10-07: "I love how easy this
 * makes it for guests to go straight into becoming a host rather than dropping them off in marketing"). A guest in an
 * album she loves follows the header's corner, or a row of her menu, into Create already answered in that album's
 * style, and Create asks only her event's name.
 *
 * ★ WHAT CROSSES IS THE STYLE, AND NOTHING ELSE: the album's mode (its capture and review, as a style) and its code's
 * look, and a Disposable's roll; never its name, its date, its guests or its photographs, and never its develop time
 * (her party's time is hers: Create offers its own 9 am and asks it on the Disposable's screen). It is read by the token
 * the visitor already holds (the album's link), through the album's own read and its door (`dashboard/new/page.tsx`),
 * and an album whose door shuts her out lends nothing.
 *
 * ★ A DOOR, SO A SIGNED-OUT GUEST SIGNS UP FIRST AND COMES BACK TO IT: the corner leads to `/dashboard/new/like/<token>`,
 * which keeps the token for half an hour in a cookie only Create's own page is sent (`LIKE_COOKIE`, path
 * `/dashboard/new`), then hands a signed-out visitor to sign-up with Create as her return, and a signed-in one straight
 * to Create. A sign-in return carries a path and never a query (`lib/auth/return-path.ts`), and a new account names
 * itself at `/welcome` before Create, so the token rides the cookie through both rather than an address; Create forgets
 * it the moment it has opened in the style. `?like=<token>` on Create's own address does the same for a link that
 * carries it.
 *
 * Pure and isomorphic: the route, the page, the wizard and the guest header read it.
 */

/** Create's own parameter for the album it is styled from (`/dashboard/new?like=<token>`). */
export const LIKE_PARAM = "like";

/** The cookie that carries the token through a sign-up, sent to Create's page alone. */
export const LIKE_COOKIE = "pr_create_like";

/** Where it is sent: Create's page and nothing else (no other route ever reads it). */
export const LIKE_COOKIE_PATH = "/dashboard/new";

/** How long the token waits for her to come back from sign-up: half an hour, then it is gone. */
export const LIKE_COOKIE_SECONDS = 30 * 60;

/** The words every way in says (the corner, her name menu, her account menu). */
export const LIKE_WORDS = "Make one like this";

/** An album's token (32 hex) or its custom link, in any case: the shape `/e/<token>` takes. Anything else is none. */
const TOKEN = /^[A-Za-z0-9-]{3,64}$/;

/** The token as Create may read it, or null: never a cleaned-up copy of what arrived. */
export function likeToken(value: unknown): string | null {
  const v = Array.isArray(value) ? value[0] : value;
  return typeof v === "string" && TOKEN.test(v) ? v : null;
}

/** The door every way in leads through: it keeps the token, then sends her on (signed in or not). */
export function likeHref(token: string): string {
  return `${LIKE_COOKIE_PATH}/like/${encodeURIComponent(token)}`;
}

/** What Create opens on, from an album: its style, its code's look, a Disposable's roll. */
export type CreateLike = {
  style: AlbumStyle;
  look: QrStyleKey;
  /** The album's roll, carried only with a Disposable. */
  roll: number | null;
};

/** The album's own columns, as its read returns them. */
export type LikeColumns = {
  capture?: Capture;
  moderation_mode: string;
  develops_at?: string | null;
  qr_style: string;
  roll_size?: number | null;
};

const isLook = (v: string): v is QrStyleKey =>
  (QR_STYLE_KEYS as readonly string[]).includes(v);

/**
 * THE STYLE AN ALBUM LENDS: its columns read as one of the three styles (`styleOf`), its look where it is one of ours,
 * or null for a mix outside the three (Settings' Customize), which lends nothing: Create then opens as it always does.
 */
export function likeOf(album: LikeColumns): CreateLike | null {
  const style = styleOf({
    capture: album.capture ?? "upload",
    review: album.moderation_mode === "hold_for_approval",
    developsAt: album.develops_at ?? null,
  });
  if (!style) return null;
  return {
    style,
    look: isLook(album.qr_style) ? album.qr_style : DEFAULT_QR_PRESET,
    roll: style === "disposable" ? (album.roll_size ?? null) : null,
  };
}

/** Create has opened in the style: the token it was carried by is put down, so the next Create is her own. */
export function forgetLike(): void {
  try {
    document.cookie = `${LIKE_COOKIE}=; Max-Age=0; Path=${LIKE_COOKIE_PATH}; SameSite=Lax`;
  } catch {
    // No cookie to put down; it leaves on its own within the half hour.
  }
}
