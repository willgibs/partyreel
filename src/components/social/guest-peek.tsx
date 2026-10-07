"use client";

import { useState, type ReactElement, type ReactNode } from "react";
import Link from "next/link";

import {
  BlockLookAction,
  LazyBlockConfirm,
} from "@/components/app/event-blocks/block-look-action";
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
import type { BlockTarget } from "@/lib/events/event-blocks";
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
 *
 * ★ AND FOR THE HOST ALONE, A QUIET BLOCK (event-safety `entry=all`): `block`
 * is passed only by a host's surface (the Guests room, the host's viewer
 * credit), and the look keeps leading with the person; Block is its last,
 * smallest line (`BlockLookAction`), which closes the look and opens the one
 * block screen.
 *
 * ★ A NAME IN HER CONNECTIONS OPENS THE SAME LOOK (`account-moments` r1, `tidy=stays`, Will 2026-10-06: "Can guest
 * names be clicked here to open the mini card on screen for additional actions beyond the row action flip? ... Don't
 * want to overcrowd the row actions."). A row keeps its one action, and what else a person can be to her, Follow after
 * an Unblock above all, is one press here. So the surface says what is true NOW through `canFollow` (never while she
 * blocks them, and not where the row's own action is the Follow), and hands the look the Follow itself through
 * `follow` where it keeps the relation (`account/page-connections.tsx` holds one answer per person for every control
 * that shows it, and the look's own Follow would start from "Follow" at every open).
 */

// A profile card carries no `kind`: only a name nobody proved has one (the list's discriminator).
function Face({ item }: { item: GuestListItem }) {
  const unverified = "kind" in item;
  return (
    <Avatar size="lg" seed={item.seed}>
      {!unverified && <AvatarImage src={item.avatarUrl ?? undefined} alt="" />}
      <AvatarFallback>
        {(item.displayName ?? "?").slice(0, 1).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
}

/** The one line under the name: what kind of name this is. */
function lookLine(item: GuestListItem): ReactNode {
  if ("kind" in item) {
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
  // A typed name is never null (the entry's own note): no stand-in to invent.
  if ("kind" in item) return item.displayName;
  return item.displayName ?? "Guest";
}

/** What can be done from the look: follow them, and open their page. */
function LookActions({
  item,
  canFollow,
  follow,
}: {
  item: GuestListItem;
  canFollow: boolean;
  follow?: ReactNode;
}) {
  if ("kind" in item || !item.slug) return null;
  return (
    <div className="flex flex-col gap-2 pt-1">
      {canFollow
        ? (follow ?? (
            <FollowButton profileId={item.id} initialFollowing={false} />
          ))
        : null}
      <Button asChild className="w-full">
        <Link href={`/u/${item.slug}`}>Open full profile</Link>
      </Button>
    </div>
  );
}

export function GuestPeek({
  item,
  email,
  canFollow,
  follow,
  block,
  children,
}: {
  item: GuestListItem;
  /** HOST-ONLY: the confirmed address the Guests room already shows. */
  email?: string | null;
  /**
   * A signed-in viewer who is somebody else, may follow them and does not follow them yet. A surface that keeps
   * the answer live (Connections) says so for as long as it is true.
   */
  canFollow: boolean;
  /** The Follow the look offers while `canFollow`, where the surface keeps the relation itself; the look's own otherwise. */
  follow?: ReactNode;
  /** HOST-ONLY: who Block would put out of this event, as this surface knows them. */
  block?: { target: BlockTarget };
  /** The name that opens it: one button. */
  children: ReactElement;
}) {
  const desk = useMediaQuery(DESK_QUERY);
  const name = nameOf(item);
  const [open, setOpen] = useState(false);
  // The block screen mounts on the first press and stays, so it closes with its own exit.
  const [confirmMounted, setConfirmMounted] = useState(false);
  const [blocking, setBlocking] = useState(false);

  const blockAct = block ? (
    <BlockLookAction
      onPress={() => {
        setOpen(false);
        setConfirmMounted(true);
        setBlocking(true);
      }}
    />
  ) : null;
  const blockScreen =
    block && confirmMounted ? (
      <LazyBlockConfirm
        open={blocking}
        onOpenChange={setBlocking}
        target={block.target}
        name={item.displayName ?? null}
      />
    ) : null;

  if (shapeFor("peek", desk) === "anchored") {
    return (
      <>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>{children}</PopoverTrigger>
          <PopoverContent
            align="start"
            data-slot="guest-peek"
            className="w-80 space-y-3 p-4"
          >
            <div className="flex items-center gap-3">
              <Face item={item} />
              <div className="min-w-0 space-y-0.5">
                <p className="truncate font-heading text-card-title">{name}</p>
                <p className="text-sm text-muted-foreground">
                  {lookLine(item)}
                </p>
              </div>
            </div>
            {email ? (
              <p className="truncate text-caption text-muted-foreground">
                {email}
              </p>
            ) : null}
            <LookActions item={item} canFollow={canFollow} follow={follow} />
            {blockAct}
          </PopoverContent>
        </Popover>
        {blockScreen}
      </>
    );
  }

  return (
    <>
      <Popup open={open} onOpenChange={setOpen}>
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
            <LookActions item={item} canFollow={canFollow} follow={follow} />
            {blockAct}
          </PopupBody>
        </PopupContent>
      </Popup>
      {blockScreen}
    </>
  );
}
