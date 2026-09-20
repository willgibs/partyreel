import Link from "next/link";

import { EmptySectionTeaser } from "@/components/app/dashboard/empty-section-teaser";
import { FeedSection } from "@/components/app/dashboard/feed-section";
import { MyLikesGallery } from "@/components/app/my-likes-gallery";
import { MyUploadsGallery } from "@/components/app/my-uploads-gallery";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getMyLikeCards } from "@/lib/db/queries/my-likes";
import { getMyUploadCards } from "@/lib/db/queries/my-uploads";
import { getMyFollowing } from "@/lib/db/queries/social";
import { withAvatarUrls } from "@/lib/social/cards";

/**
 * THE OWNER MODE: what only the person themselves sees on their own page.
 *
 * Will answered `you=?` in his own note (2026-09-20): "Your own photos, likes,
 * connections, etc should be on your profile page... However, plans, billing,
 * etc should live under an account page". So the three personal feeds left the
 * host's home — where they never belonged, since your own likes are not a
 * hosting job — and landed here, private, under the public page that is
 * already about this person.
 *
 * ★ THE GATE IS THE QUERY, NOT THE BOOLEAN. Every read below is an
 * `auth.uid()`-scoped RPC or an owner-RLS select: `get_my_uploads`,
 * `get_my_likes` and `getMyFollowing` answer for the CALLER and for nobody
 * else. This component is never handed the profile's id and must never be:
 * the page's `isSelf` check decides whether these sections render at all, but
 * if that check were ever wrong — a refactor, a cached viewer, a bug — the
 * worst it could do is render the VIEWER'S OWN media on somebody else's page.
 * It cannot leak the page owner's. A gate you can only fail safely is the only
 * kind worth putting in front of a growth surface that anonymous strangers
 * read all day.
 *
 * ★ AND FOLLOWERS ARE NEVER LISTED. "Connections" means the people you follow,
 * exactly as the dashboard's Following section meant. The graph is
 * owner-private by ruling (profiles-social.md) and there is still no public
 * count anywhere; this section is the owner reading their own half of it.
 */
export async function OwnerSections() {
  const [uploads, likes, following] = await Promise.all([
    getMyUploadCards(),
    getMyLikeCards(),
    getMyFollowing(),
  ]);
  const followingItems = await withAvatarUrls(following);

  return (
    <div className="mt-10 space-y-8">
      {/* The private half is marked as such once, at the top, rather than
          three times. A person looking at their own page should never have to
          wonder which of these strangers can see. */}
      <p className="text-xs text-muted-foreground">
        Only you can see the sections below.
      </p>

      {uploads.items.length === 0 ? (
        <EmptySectionTeaser
          heading="Your uploads"
          blurb="Photos and videos you add to any event, yours or a friend's, collect here."
        />
      ) : (
        <FeedSection heading="Your uploads">
          <MyUploadsGallery
            items={uploads.items}
            truncated={uploads.truncated}
          />
        </FeedSection>
      )}

      {likes.items.length === 0 ? (
        <EmptySectionTeaser
          heading="Your likes"
          blurb="Tap the heart on any photo or video and it lands here, across every event."
        />
      ) : (
        <FeedSection heading="Your likes">
          <MyLikesGallery items={likes.items} truncated={likes.truncated} />
        </FeedSection>
      )}

      <FeedSection heading="Connections">
        {followingItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            You&rsquo;re not following anyone yet. Find a host&rsquo;s profile
            from any album they share.
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {followingItems.map((item) => {
              const identity = (
                <>
                  <Avatar size="sm" seed={item.seed}>
                    <AvatarImage src={item.avatarUrl ?? undefined} alt="" />
                    <AvatarFallback className="text-[10px]">
                      {(item.displayName ?? "?").slice(0, 1).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate text-sm">
                    {item.displayName ?? "Someone"}
                  </span>
                </>
              );
              return (
                <li key={item.id}>
                  {item.slug ? (
                    <Link
                      href={`/u/${item.slug}`}
                      className="flex max-w-56 items-center gap-2 rounded-full border border-border py-1 pr-3 pl-1 outline-none transition-[background-color,transform] duration-150 ease-emphasis hover:bg-muted/40 active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-ring/50 motion-reduce:active:scale-100"
                    >
                      {identity}
                    </Link>
                  ) : (
                    <span className="flex max-w-56 items-center gap-2 rounded-full border border-border py-1 pr-3 pl-1">
                      {identity}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </FeedSection>
    </div>
  );
}
