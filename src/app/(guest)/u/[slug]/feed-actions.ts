"use server";

import { z } from "zod";

import type { GridMedia } from "@/components/app/media-grid";
import { readMyLikesPage } from "@/lib/db/queries/my-likes";
import {
  readMyUploadsPage,
  type FeedCursor,
  type FeedPage,
} from "@/lib/db/queries/my-uploads";
import { timestampToMicros } from "@/lib/events/album-wire";
import { captureError } from "@/lib/observability/sentry";
import { getRequestAuth } from "@/lib/supabase/request-auth";

/**
 * THE OWNER MODE'S SHOW MORE (crumbs-38): the next page of her uploads or her likes, after the last one she was shown.
 *
 * ★ THE GATE IS STILL THE QUERY. Each is a public endpoint (a Server Function answers any POST), so each parses what
 * the client sent (a cursor, nothing else: no profile, no handle, no id but the last row's) and reads with the
 * request's own `getUser()`; the feed functions answer for `auth.uid()` alone. So a hand-made call can only ever page
 * the CALLER's own feed, exactly as the owner mode's first page can (`owner-sections.tsx`).
 *
 * ★ A FAILED PAGE SAYS SO, AND KEEPS WHAT SHE HAS: the gallery leaves its pages standing and its button asks again,
 * and the failure is captured where it is caught.
 */

export type FeedPageAnswer =
  | { ok: true; items: GridMedia[]; next: FeedCursor | null }
  | { ok: false; message: string };

/** A timestamp as the server wrote it, read back exactly (`timestampToMicros` refuses anything else). */
function isTimestamp(value: string): boolean {
  try {
    timestampToMicros(value);
    return true;
  } catch {
    return false;
  }
}

const askSchema = z.object({
  before: z.object({
    at: z.string().max(40).refine(isTimestamp),
    id: z.uuid(),
  }),
});

async function readPage(
  ask: unknown,
  feed: "uploads" | "likes",
): Promise<FeedPageAnswer> {
  const parsed = askSchema.safeParse(ask);
  if (!parsed.success) return { ok: false, message: "That isn't a page." };
  const auth = await getRequestAuth();
  if (!auth.user) return { ok: false, message: "Sign in and try again." };
  try {
    const page: FeedPage =
      feed === "uploads"
        ? await readMyUploadsPage(auth, parsed.data.before)
        : await readMyLikesPage(auth, parsed.data.before);
    return { ok: true, items: page.items, next: page.next };
  } catch (error) {
    captureError("media", error, { seam: `my_${feed}_page` });
    return { ok: false, message: "Couldn't load more. Please try again." };
  }
}

/** The page of her uploads after `before`. */
export async function readMyUploadsPageAction(
  ask: unknown,
): Promise<FeedPageAnswer> {
  return readPage(ask, "uploads");
}

/** The page of her likes after `before`. */
export async function readMyLikesPageAction(
  ask: unknown,
): Promise<FeedPageAnswer> {
  return readPage(ask, "likes");
}
