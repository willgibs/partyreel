/**
 * Server-side hydration of SocialProfileCard rows into render-ready items:
 * resolve the avatar marker into the public avatar URL (avatars live in the
 * PUBLIC Supabase bucket, see lib/supabase/avatar-storage.ts) so client
 * components only ever receive a URL, never a storage path, and the person's
 * colour beside it (`seed`, `seedFor`: a one-way hash, never the account id).
 * One helper so the guest list, the follows lists, and the blocks list all
 * hydrate identically, and every card that went through it has both.
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
 * cards go through `withAvatarUrls` unchanged and the unverified entries come back as they are,
 * carrying their own mark. Order is preserved within each half (the query already sorted them).
 */
export function splitGuestList(items: GuestListItem[]): {
  cards: SocialProfileCard[];
  unverified: UnverifiedGuestListEntry[];
} {
  const cards: SocialProfileCard[] = [];
  const unverified: UnverifiedGuestListEntry[] = [];
  for (const item of items) {
    // A profile card carries no `kind`, which is exactly what makes it the discriminator: the two
    // existing callers keep the narrow type they always had, with no tag added to their rows.
    if ("kind" in item && item.kind === "unverified") unverified.push(item);
    else cards.push(item as SocialProfileCard);
  }
  return { cards, unverified };
}
