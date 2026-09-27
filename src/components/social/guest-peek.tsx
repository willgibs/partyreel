"use client";

import type { ReactElement, ReactNode } from "react";
import Link from "next/link";

import { UnverifiedMark } from "@/components/shared/unverified-mark";
import { FollowButton } from "@/components/social/follow-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Popup,
  PopupBody,
  PopupContent,
  PopupHeader,
  PopupTrigger,
} from "@/components/ui/popup";
import { DESK_QUERY, shapeFor } from "@/components/ui/popup-kinds";
import { useMediaQuery } from "@/lib/use-media-query";

import type { GuestListItem } from "./guest-list";

/**
 * A QUICK LOOK AT A NAME (`popups` r1, `peek=card`, Will 2026-09-27; the ask
 * moved there from `profile-page`'s quick look). Every name in the guest list
 * opens something now, where before a name with no page opened nothing, and at
 * a names-mode party that was most of the list.
 *
 * ★ A CARD BESIDE THE NAME AT A DESK, THE SHEET IN A HAND. At a desk the look
 * opens next to the name, as the Unverified mark's own card does, and the next
 * name tapped moves it, so ten names can be looked at without the list ever
 * being covered; in a hand it is the Sheet, which is how a phone peeks. Its
 * kind's row decides (`popup-kinds.ts`, `peek`), like every popup's.
 *
 * ★ THE LOOK SHOWS NOTHING THE ALBUM DID NOT (profile-page's own rule, and the
 * privacy doctrine in profiles-social.md): the face, the name, the mark where
 * it is Unverified or the handle where there is a page, and, for the host
 * alone, the address the Guests room already shows. A page adds its door.
 *
 * ★ WHAT THEY ADDED TO THIS ALBUM IS NOT HERE YET, AND THAT IS A QUESTION, NOT
 * A CHOICE: the board's look carries their count and four of their pictures,
 * which needs a read the guest list does not carry (their approved uploads by
 * guest row or account, presigned). It is the manifest's question with its
 * follow-up line; the look is built so the strip slots in under the name.
 */

function Face({ item }: { item: GuestListItem }) {
  const unverified = item.kind === "unverified";
  return (
    <Avatar size="lg" seed={unverified ? undefined : item.seed}>
      {!unverified && <AvatarImage src={item.avatarUrl ?? undefined} alt="" />}
      <AvatarFallback>
        {(item.displayName ?? "?").slice(0, 1).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
}

/** The one line under the name: what kind of name this is. */
function lookLine(item: GuestListItem): ReactNode {
  if (item.kind === "unverified") {
    return (
      <span className="inline-flex items-center gap-1.5">
        <UnverifiedMark name={item.displayName} />
        Unverified: anyone can type a name
      </span>
    );
  }
  return item.slug ? `@${item.slug}` : "Confirmed their email";
}

function nameOf(item: GuestListItem): string {
  if (item.kind === "unverified") return item.displayName ?? "A guest";
  return item.displayName ?? "Guest";
}

/** What can be done from the look: follow them, and open their page. */
function LookActions({
  item,
  canFollow,
}: {
  item: GuestListItem;
  canFollow: boolean;
}) {
  if (item.kind === "unverified" || !item.slug) return null;
  return (
    <div className="flex flex-col gap-2 pt-1">
      {canFollow ? (
        <FollowButton
          profileId={item.id}
          slug={item.slug}
          initialFollowing={false}
        />
      ) : null}
      <Button asChild size="sm" className="w-full">
        <Link href={`/u/${item.slug}`}>Open full profile</Link>
      </Button>
    </div>
  );
}

export function GuestPeek({
  item,
  email,
  canFollow,
  children,
}: {
  item: GuestListItem;
  /** HOST-ONLY: the confirmed address the Guests room already shows. */
  email?: string | null;
  /** A signed-in viewer who is somebody else and does not follow them yet. */
  canFollow: boolean;
  /** The name that opens it: one button. */
  children: ReactElement;
}) {
  const desk = useMediaQuery(DESK_QUERY);
  const name = nameOf(item);

  if (shapeFor("peek", desk) === "anchored") {
    return (
      <Popover>
        <PopoverTrigger asChild>{children}</PopoverTrigger>
        <PopoverContent
          align="start"
          data-slot="guest-peek"
          className="w-80 space-y-3 p-4"
        >
          <div className="flex items-center gap-3">
            <Face item={item} />
            <div className="min-w-0 space-y-0.5">
              <p className="truncate font-heading text-card-title font-medium">
                {name}
              </p>
              <p className="text-sm text-muted-foreground">{lookLine(item)}</p>
            </div>
          </div>
          {email ? (
            <p className="truncate text-caption text-muted-foreground">
              {email}
            </p>
          ) : null}
          <LookActions item={item} canFollow={canFollow} />
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Popup>
      <PopupTrigger asChild>{children}</PopupTrigger>
      <PopupContent kind="peek" data-slot="guest-peek">
        <PopupHeader
          title={
            <span className="flex items-center gap-3">
              <Face item={item} />
              <span className="min-w-0 truncate">{name}</span>
            </span>
          }
          description={lookLine(item)}
        />
        <PopupBody className="space-y-3">
          {email ? (
            <p className="truncate text-caption text-muted-foreground">
              {email}
            </p>
          ) : null}
          <LookActions item={item} canFollow={canFollow} />
        </PopupBody>
      </PopupContent>
    </Popup>
  );
}
