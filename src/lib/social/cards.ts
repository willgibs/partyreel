/**
 * Server-side hydration of SocialProfileCard rows into render-ready items:
 * resolve the avatar marker into the public avatar URL (avatars live in the
 * PUBLIC Supabase bucket, see lib/supabase/avatar-storage.ts) so client
 * components only ever receive a URL, never a storage path. One helper so the
 * guest list, the follows lists, and the blocks list all hydrate identically.
 *
 * ★ AVATAR-WIRING EXCEPTION (2026-09-20, listed in its Handoff): this file
 * belongs to no lane's `owns` this round. `seed` is added here, alongside
 * `avatarUrl`, so every caller of `withAvatarUrls` — the guest list's chips
 * and faces row, the profile's owner-mode Connections, the account page's
 * Following/Blocked rows — gets a colour with ZERO changes of their own
 * (additive field, existing callers just pass items through unchanged).
 * `GuestList` in particular is a client component fed plain data by server
 * callers it does not own; hydrating the seed HERE, alongside the avatar URL
 * it already resolves the same way, is the one place that reaches every
 * caller without threading a new prop through files this lane cannot touch.
 *
 * `seed` is OPTIONAL on the type (never optional at RUNTIME — this function
 * always sets it): a wiring lane never breaks the props of a module the lab
 * imports, and the retired `profile-page` sandbox board still feeds
 * `GuestList` its own `Chip[]` fixtures, structurally close to
 * `ProfileCardItem` but without a `seed`. Required would break that board;
 * optional lets it keep drawing today's ungraded grey while every REAL
 * caller (which always runs through `withAvatarUrls`) gets a colour.
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
  T & { avatarUrl: string | null; seed?: string };

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
