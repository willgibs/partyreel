/**
 * Server-side hydration of SocialProfileCard rows into render-ready items:
 * resolve the avatar marker into the public avatar URL (avatars live in the
 * PUBLIC Supabase bucket, see lib/supabase/avatar-storage.ts) so client
 * components only ever receive a URL, never a storage path, and the person's
 * colour beside it (`seed`, `seedFor`: a one-way hash, never the account id).
 * One helper so the guest list, the follows lists, and the blocks list all
 * hydrate identically, and every card that went through it has both.
 *
 * ★ A NAME-ONLY GUEST HAS A COLOUR TOO, FROM HER OWN GUEST ROW (`splitGuestList`): her row's id
 * hashed by the same `seedFor`, never her name (nobody can choose a colour by typing one, and two
 * people who type "Sam" are two colours). One colour per ticket, switched once when she claims it.
 */
import "server-only";

import { seedFor } from "@/lib/avatar/seed";
import type {
  GuestListItem,
  SocialProfileCard,
  UnverifiedGuestListEntry,
} from "@/lib/db/queries/social";
import { getAvatarUrl } from "@/lib/supabase/avatar-storage";

export type ProfileCardItem<T extends SocialProfileCard = SocialProfileCard> =
  T & { avatarUrl: string | null; seed: string };

export async function withAvatarUrls<T extends SocialProfileCard>(
  cards: T[],
): Promise<ProfileCardItem<T>[]> {
  return Promise.all(
    cards.map(async (card) => ({
      ...card,
      avatarUrl: await getAvatarUrl(card.id, card.avatarMarker),
      seed: seedFor(card.id),
    })),
  );
}

/** A named guest who proved no email, with the colour her own row gives her (`splitGuestList`). */
export type UnverifiedGuestItem = UnverifiedGuestListEntry & { seed: string };

/**
 * SPLIT THE GUEST LIST BEFORE IT IS HYDRATED (the identity reshape, 2026-09-21).
 *
 * `getEventGuestList(id, { includeUnverified: true })` returns one list holding two different
 * things: profile cards, which have an avatar and a handle to resolve, and named guests who proved
 * no email, who have neither — there is no profile row behind them at all. `withAvatarUrls` would
 * happily be made to accept both and would then be asking storage for an avatar that cannot exist,
 * once per unnamed stranger at a wedding.
 *
 * So the union splits HERE, in the module that owns hydration, rather than at each caller: the
 * cards go through `withAvatarUrls` unchanged and the unverified entries come back carrying their
 * own mark and their own colour. Order is preserved within each half (the query already sorted them).
 *
 * ★ HER COLOUR IS `seedFor` OF HER GUEST ROW (`entry.id` is the row's, never a user id), hashed here
 * on the server like every seed: the album's guest list, the host's Guests room and the credit
 * (`lib/media/uploader-faces.ts`) all hash the same row id, so she is one colour wherever she is drawn,
 * and the hash is all a browser is handed beyond the id the entry already carried.
 */
export function splitGuestList(items: GuestListItem[]): {
  cards: SocialProfileCard[];
  unverified: UnverifiedGuestItem[];
} {
  const cards: SocialProfileCard[] = [];
  const unverified: UnverifiedGuestItem[] = [];
  for (const item of items) {
    // A profile card carries no `kind`, which is exactly what makes it the discriminator: the two
    // existing callers keep the narrow type they always had, with no tag added to their rows.
    if ("kind" in item && item.kind === "unverified") {
      unverified.push({ ...item, seed: seedFor(item.id) });
    } else cards.push(item as SocialProfileCard);
  }
  return { cards, unverified };
}
