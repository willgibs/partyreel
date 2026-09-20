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
import type { SocialProfileCard } from "@/lib/db/queries/social";
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
