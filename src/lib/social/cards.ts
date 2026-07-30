/**
 * Server-side hydration of SocialProfileCard rows into render-ready items:
 * resolve the avatar marker into the public avatar URL (avatars live in the
 * PUBLIC Supabase bucket, see lib/supabase/avatar-storage.ts) so client
 * components only ever receive a URL, never a storage path. One helper so the
 * guest list, the follows lists, and the blocks list all hydrate identically.
 */
import "server-only";

import type { SocialProfileCard } from "@/lib/db/queries/social";
import { getAvatarUrl } from "@/lib/supabase/avatar-storage";

export type ProfileCardItem<T extends SocialProfileCard = SocialProfileCard> =
  T & { avatarUrl: string | null };

export async function withAvatarUrls<T extends SocialProfileCard>(
  cards: T[],
): Promise<ProfileCardItem<T>[]> {
  return Promise.all(
    cards.map(async (card) => ({
      ...card,
      avatarUrl: await getAvatarUrl(card.id, card.avatarMarker),
    })),
  );
}
