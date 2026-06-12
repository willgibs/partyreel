"use client";

import { use } from "react";

import { MyLikesGallery } from "@/components/app/my-likes-gallery";
import type { getMyLikeCards } from "@/lib/db/queries/my-likes";

type LikesData = Awaited<ReturnType<typeof getMyLikeCards>>;

/** The personal Likes tab as a use()-client section (Phase 5 S1 redo).
 *  MyLikesGallery KEEPS owning its empty state: unlike is a client-only RLS
 *  delete with no server revalidation, so unliking the LAST item must flip
 *  to "No likes yet" instantly (the risk-register rule - do not lift it). */
export function LikesTab({ promise }: { promise: Promise<LikesData> }) {
  const likes = use(promise);
  return <MyLikesGallery items={likes.items} truncated={likes.truncated} />;
}
