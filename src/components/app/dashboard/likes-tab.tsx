import { MyLikesGallery } from "@/components/app/my-likes-gallery";
import { getMyLikeCards } from "@/lib/db/queries/my-likes";

/** The personal Likes tab as a STREAMED boundary (Phase 5 S1). MyLikesGallery
 *  KEEPS owning its empty state: unlike is a client-only RLS delete with no
 *  server revalidation, so unliking the LAST item must flip to "No likes yet"
 *  instantly without a round-trip (the risk-register rule - do not lift it). */
export async function LikesTab() {
  const likes = await getMyLikeCards();
  return <MyLikesGallery items={likes.items} truncated={likes.truncated} />;
}
