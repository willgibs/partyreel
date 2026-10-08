"use server";

/**
 * A PERSON'S PHOTOGRAPHS FOR THE CARD A NAME OPENS (guests-room r1, `card=standing`: "four of their photos and See
 * all"), one Server Function a side. Each is a public endpoint taking raw client values, so each parses them first and
 * answers anything it will not serve with the same empty `NO_LOOK`, in no detail.
 *
 *  - The HOST's (the Guests room, the credit in her viewer and in Review): `getUser()`, then the read proves her the
 *    event's host itself (`readHostLook`, its person named the way Block names one), then the event through RLS
 *    (`getEvent`), then the host's own links builder (`readHostLinksBody`, the hub's), so the items are the ones her
 *    album draws, her credit's address and like counts with them.
 *  - The ALBUM's (a guest's card from the album's guest list): the album's own gate (`resolveAlbumViewer`, the links
 *    route's: the door, the account, the unlock cookie and the ticket), at `full` and never the demo, then the album's
 *    own gated minter (`mintGuestAlbumLinks`), which drops any id this viewer's album would not show. So a guest's card
 *    holds only photographs her album already shows her, and never an address.
 *
 * ★ THE CURSOR IS A CLIENT'S STRING THAT RIDES A FILTER, SO IT IS REWRITTEN, NEVER PASSED: its time is parsed to
 * microseconds and written back by the album's own codec (`timestampToMicros`, `microsToTimestamp`), so nothing but a
 * timestamp reaches PostgREST's logic tree, and its id is a uuid.
 */
import { z } from "zod";

import {
  LOOK_PAGE,
  NO_LOOK,
  albumLookItems,
  hostLookItems,
  type LookAnswer,
} from "@/app/(app)/dashboard/[eventId]/guests/look";
import { getEvent } from "@/lib/db/queries/events";
import {
  readAlbumLook,
  readHostLook,
  type LookCursor,
} from "@/lib/db/queries/guest-look";
import { readHostLinksBody } from "@/lib/event/host-links.server";
import { resolveAlbumViewer } from "@/lib/events/album-viewer.server";
import { microsToTimestamp, timestampToMicros } from "@/lib/events/album-wire";
import { mintGuestAlbumLinks } from "@/lib/events/album-wire-links.server";
import { blockTargetSchema } from "@/lib/events/event-blocks";
import { captureError } from "@/lib/observability/sentry";
import { createClient } from "@/lib/supabase/server";

const cursorSchema = z
  .object({ at: z.string().min(1).max(64), id: z.uuid() })
  .nullable()
  .default(null);

const pageSchema = {
  after: cursorSchema,
  limit: z.number().int().min(1).max(LOOK_PAGE),
};

/** The cursor as the album's codec writes it, or null when its time is no timestamp (the read then starts over). */
function cleanCursor(after: LookCursor | null): LookCursor | null | false {
  if (!after) return null;
  try {
    return { at: microsToTimestamp(timestampToMicros(after.at)), id: after.id };
  } catch {
    return false;
  }
}

const hostInput = z.object({ target: blockTargetSchema, ...pageSchema });

/** The host's look at one person of her own event: a page of what her album shows of theirs. */
export async function readHostLookAction(input: unknown): Promise<LookAnswer> {
  const parsed = hostInput.safeParse(input);
  if (!parsed.success) return NO_LOOK;
  const after = cleanCursor(parsed.data.after);
  if (after === false) return NO_LOOK;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NO_LOOK;
  try {
    const look = await readHostLook(parsed.data.target, {
      after,
      limit: parsed.data.limit,
    });
    if (!look) return NO_LOOK;
    const event = await getEvent(look.eventId);
    if (!event) return NO_LOOK;
    const body = await readHostLinksBody(
      supabase,
      event,
      look.rows.map((row) => row.id),
    );
    return {
      ok: true,
      photos: look.photos,
      videos: look.videos,
      items: hostLookItems(look.rows, body.links, body.likes),
      next: look.next,
    };
  } catch (error) {
    captureError("db", error, { action: "guest_look_host" });
    return NO_LOOK;
  }
}

const albumInput = z.object({
  qrToken: z.string().min(1).max(200),
  sessionToken: z.string().min(1).max(200).nullable().optional(),
  who: z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("account"), userId: z.uuid() }),
    z.object({ kind: z.literal("row"), guestId: z.uuid() }),
  ]),
  ...pageSchema,
});

/** A guest's look at another guest of the album she is in: a page of what that album shows of theirs. */
export async function readAlbumLookAction(input: unknown): Promise<LookAnswer> {
  const parsed = albumInput.safeParse(input);
  if (!parsed.success) return NO_LOOK;
  const after = cleanCursor(parsed.data.after);
  if (after === false) return NO_LOOK;
  try {
    const viewer = await resolveAlbumViewer(
      parsed.data.qrToken,
      parsed.data.sessionToken ?? undefined,
    );
    if (
      viewer.kind === "gone" ||
      viewer.decision.access !== "full" ||
      viewer.isDemo
    )
      return NO_LOOK;
    const look = await readAlbumLook(viewer.event.id, parsed.data.who, {
      after,
      limit: parsed.data.limit,
    });
    if (!look) return NO_LOOK;
    const minted =
      look.rows.length > 0
        ? await mintGuestAlbumLinks(
            viewer.event,
            look.rows.map((row) => row.id),
            { isDemo: false },
          )
        : { links: [] };
    // The album's own read refused a viewer its decision let in (a password album without its cookie): nothing.
    if (!minted) return NO_LOOK;
    return {
      ok: true,
      photos: look.photos,
      videos: look.videos,
      items: albumLookItems(look.rows, minted.links),
      next: look.next,
    };
  } catch (error) {
    captureError("db", error, { action: "guest_look_album" });
    return NO_LOOK;
  }
}
