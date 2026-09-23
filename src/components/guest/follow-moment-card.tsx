"use client";

import Link from "next/link";
import { AtSign, Check } from "lucide-react";

import { FollowButton } from "@/components/social/follow-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

/**
 * THE MOMENT AFTER CONFIRMING (the identity reshape, 2026-09-21; Will's own
 * words for the flow he asked for: "a flow for us to capture non-user guests
 * after their uploads to save the event/uploads to a profile, follow host/other
 * guests, etc.").
 *
 * The sequence a name-only guest walks is three beats and this is the third:
 * they add photographs, the offer card asks them to keep the photographs, and
 * the second the address is confirmed this card takes the same slot and says
 * what they now have. ★ IT IS ONE CARD AT A TIME, never a stack under an album
 * somebody came to look at: `claim-handle-prompt.tsx` owns the slot and decides
 * which of the three stands (guest-upload.tsx's own note on that sequencing).
 *
 * ★ THE HOST IS THE ONE FOLLOW WORTH OFFERING HERE. The other guests are
 * already on this page, in the Guests list, where a signed-in viewer's chips now
 * carry their own Follow (`social/guest-list.tsx`): a second copy of those names
 * inside this card would be the same list twice on one screen. The host is the
 * person this guest actually came for and the only one the album never lists.
 *
 * ★ AND "CLAIM YOUR HANDLE" IS ITS SECOND LINE, not a fourth card. It was its
 * own card (`claim-handle-prompt.tsx`, `claim=after`, 2026-09-19) and it still
 * is for a guest who was ALREADY signed in when they uploaded; for the one who
 * just confirmed, it is the same breath as everything else they just gained.
 *
 * ★ NOTHING HERE IS SHOWN WITHOUT ITS OBJECT. No host card resolved means no
 * host row (a locked or hostless event, or a host with no public page); a
 * profile that already has a handle means no handle line. A card whose every row
 * is gone does not render at all, which is the caller's check, not a stub.
 */

export type FollowMomentHost = {
  id: string;
  slug: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  /** seedFor(host id), so the host wears the colour they wear everywhere else. */
  seed?: string | null;
};

export function FollowMomentCard({
  host,
  needsHandle,
  count,
}: {
  /** The event's host as a public card, or null (nothing to follow). */
  host: FollowMomentHost | null;
  /** This account has no handle yet: the second line earns its place. */
  needsHandle: boolean;
  /**
   * Photographs this guest added in this session (the sentence's number), or
   * null when they added none this visit: a guest back from Google or a magic
   * link is holding photos from before the redirect, and the card will not
   * invent a number for them.
   */
  count: number | null;
}) {
  const hostName = host?.displayName?.trim() || null;
  const canFollowHost = Boolean(host?.slug && hostName);
  if (!canFollowHost && !needsHandle) return null;

  return (
    <div
      data-media-tile
      data-follow-moment
      className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5"
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-success text-success-foreground">
          <Check className="size-3.5" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="font-heading text-subsection">
            {count === 1 ? "Your photo is safe" : "Your photos are safe"}
          </p>
          {/* ★ "In your account", never "on your profile": the claim puts the
              photographs in the account and the event comes with them (a Guest
              card on the dashboard: guest by upload, 2026-09-22), while a
              profile shows nothing until its owner chooses it
              (profiles-social.md), so a profile line here would be false. */}
          <p className="mt-0.5 text-reading text-pretty text-muted-foreground">
            {count === 1
              ? "It is in your account now, and this event came with it."
              : count === null
                ? "They are in your account now, and this event came with them."
                : `All ${count} are in your account now, and this event came with them.`}
          </p>
        </div>
      </div>

      {canFollowHost && host?.slug && hostName && (
        <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-4">
          <Link
            href={`/u/${host.slug}`}
            className="flex min-w-0 items-center gap-2.5 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <Avatar seed={host.seed ?? undefined} size="sm">
              <AvatarImage src={host.avatarUrl ?? undefined} alt="" />
              <AvatarFallback>
                {hostName.slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="min-w-0">
              <span className="block truncate text-reading font-medium">
                {hostName}
              </span>
              <span className="block text-working text-muted-foreground">
                Your host
              </span>
            </span>
          </Link>
          <FollowButton
            profileId={host.id}
            slug={host.slug}
            initialFollowing={false}
          />
        </div>
      )}

      {needsHandle && (
        <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-4">
          <p className="flex min-w-0 items-start gap-2.5 text-reading text-pretty text-muted-foreground">
            <AtSign
              className="mt-0.5 size-4 shrink-0 text-muted-foreground"
              aria-hidden
            />
            Claim a handle and your name becomes a page.
          </p>
          {/* The door lands ON the handle field, not at the top of a five-card
              account page: the offer and the box that answers it are one act. */}
          <Button asChild size="sm" variant="outline" className="shrink-0">
            <Link href="/account#public-profile">Claim</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
