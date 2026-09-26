import Link from "next/link";
import { cookies } from "next/headers";

import { EmptySectionTeaser } from "@/components/app/dashboard/empty-section-teaser";
import { FeedSection } from "@/components/app/dashboard/feed-section";
import { MyLikesGallery } from "@/components/app/my-likes-gallery";
import { MyUploadsGallery } from "@/components/app/my-uploads-gallery";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { listEvents } from "@/lib/db/queries/events";
import { getMyLikeCards } from "@/lib/db/queries/my-likes";
import { getMyUploadCards } from "@/lib/db/queries/my-uploads";
import { getMyFollowing } from "@/lib/db/queries/social";
import {
  resolveRowStep,
  TILE_SIZE_COOKIE,
} from "@/lib/shared/tile-size-cookie";
import { withAvatarUrls } from "@/lib/social/cards";

/**
 * THE OWNER MODE: what only the person themselves sees on their own page.
 *
 * Your own photos, likes and connections belong on your profile page, while
 * plans, billing and the like live under an account page. So the three personal
 * feeds live here, private, under the public page that is already about this
 * person, and not on the host's home: your own likes are not a hosting job.
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
 * ★ AND FOLLOWERS ARE NEVER LISTED. "Connections" means the people you follow.
 * The graph is owner-private (profiles-social.md) and there is no public count
 * anywhere; this section is the owner reading their own half of it.
 *
 * ★ YOUR UPLOADS SAY WHICH DELETES YOU CAN TAKE BACK (a guest's own delete is
 * final, and says so). The feed holds two
 * kinds of upload that one Trash removes differently: one you added to
 * SOMEBODY ELSE's event is gone for good (`remove_my_upload`'s guest arm marks
 * it `removed_by_uploader`, which no host surface shows or restores), while one
 * you added to an event you HOST lands in that event's Deleted, restorable
 * (the host arm). The lightbox's confirm says which off `isHost`, so the host
 * arm's items carry it: an upload is the host arm exactly when its event is one
 * of yours, because get_my_uploads splits its two arms on the event's host.
 * `listEvents()` is an owner-RLS read (`events_host_all`), so like every read
 * above it answers for the caller alone, and the gate stays one you can only
 * fail safely.
 *
 * ★ THE FEEDS ARE THE JUSTIFIED ROWS, WINDOWED (album-guest-wiring), at the one
 * step the shared `pr_tile_size` cookie holds for the album and the hub alike, so
 * a person who picked the largest photographs there sees them here too. Each
 * keeps its 200 cap (the feed queries'), and the rows mount only what is in view.
 */
export async function OwnerSections() {
  const [uploads, likes, following, hostedEvents, cookieJar] =
    await Promise.all([
      getMyUploadCards(),
      getMyLikeCards(),
      getMyFollowing(),
      listEvents(),
      cookies(),
    ]);
  const rowStep = resolveRowStep(cookieJar.get(TILE_SIZE_COOKIE)?.value);
  const hostedTokens = new Set(hostedEvents.map((event) => event.qr_token));
  const uploadItems = uploads.items.map((item) =>
    item.eventQrToken != null && hostedTokens.has(item.eventQrToken)
      ? { ...item, isHost: true }
      : item,
  );
  const followingItems = await withAvatarUrls(following);

  return (
    <div className="mt-10 space-y-8">
      {/* The private half is marked as such once, at the top, rather than
          three times. A person looking at their own page should never have to
          wonder which of these strangers can see. */}
      <p className="text-xs text-muted-foreground">
        Only you can see the sections below.
      </p>

      {uploadItems.length === 0 ? (
        <EmptySectionTeaser
          heading="Your uploads"
          blurb="Photos and videos you add to any event, yours or a friend's, collect here."
        />
      ) : (
        <FeedSection heading="Your uploads">
          <MyUploadsGallery
            items={uploadItems}
            truncated={uploads.truncated}
            rowStep={rowStep}
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
          <MyLikesGallery
            items={likes.items}
            truncated={likes.truncated}
            rowStep={rowStep}
          />
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
                      className="flex max-w-56 items-center gap-2 rounded-full border border-border py-1 pr-3 pl-1 transition-[background-color,transform] duration-150 ease-emphasis outline-none hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring/50 active:scale-[0.97] motion-reduce:active:scale-100"
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
