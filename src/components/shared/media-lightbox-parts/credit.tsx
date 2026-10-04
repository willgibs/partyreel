"use client";

import {
  createContext,
  memo,
  useContext,
  type ReactElement,
  type ReactNode,
} from "react";
import Link from "next/link";

import type { GridMedia } from "@/components/app/media-grid";
import { ActionTooltip } from "@/components/shared/action-tooltip";
import { UnverifiedMark } from "@/components/shared/unverified-mark";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { GLASS, GLASS_MARK_LIT } from "@/lib/glass";
import type { UploaderFace } from "@/lib/media/uploader-identity";
import { cn } from "@/lib/utils";

/**
 * WHAT A CREDIT CAN SAY BEYOND A NAME, WHERE A SURFACE KNOWS IT: the uploader's
 * face and page (crumbs-38). The album's links carry it (the guest's and the
 * host's who tuples, `album-wire.ts`), and so do Review's items: the server
 * resolves `avatarUrl` (never a storage path), `seed` (`seedFor`, never a raw
 * account id) and `href` (`/u/<slug>`, only where a page exists) in one place,
 * `lib/media/uploader-faces.ts`, by the rule that names the person. A guest's
 * view carries the face the album's own Guests list shows and no other (never a
 * blocked person's); the teaser's nine and the personal feeds carry none, and
 * draw the plain disc.
 */
export type CreditFace = UploaderFace;

/** A gallery item as the viewer reads it: the shared GridMedia, its `uploaderFace` where a surface has one. */
export type ViewerMedia = GridMedia;

/**
 * HOST-ONLY: how a host's surface opens a person's look from a credit's name (event-safety
 * `entry=all`). A context rather than a prop or an import, for the reason the Unverified mark carries
 * its own door: the credit sits three modules deep under `shared/masonry.tsx`, and the look (with its
 * Follow and its Block) is host machinery the guest album and this shared part must never pull in.
 * The host's album and Review mount `HostCreditLookProvider` (`app/event-blocks/credit-look.tsx`); a
 * surface without it (the guest album, the storage list) keeps today's plain credit.
 */
export type CreditLook = (props: {
  item: ViewerMedia;
  name: string;
  unverified: boolean;
  /** The name, as the button that opens the look. */
  trigger: ReactElement;
}) => ReactNode;

export const CreditLookContext = createContext<CreditLook | null>(null);

/**
 * THE FACE-LED CREDIT (`who=face`, Will 2026-09-24: "This is already a great
 * step in the right direction of my previous note about redesigning the
 * floating UI"). Top left, opposite the close circle, in the guest list's
 * grammar: a confirmed account's face (its photograph, or its colour's disc
 * with the initial), a typed name's own colour (her guest ROW's, never a
 * photograph, small-fixes) beside the Unverified mark, and a door to the
 * person's page only where one exists. The host still reads the proved address
 * under the name; a typed name never has one to show.
 *
 * ★ ON YOUR OWN UPLOAD IT READS "YOU" (the brief's call, his to overrule), with
 * no separate mark in the viewer: the credit says it. The Unverified mark stays
 * beside "You" on an unproved upload, because on your own credit the mark is the
 * way out ("want to correct that immediately by verifying").
 *
 * ★ A ROW WITH NO NAME NAMES NOBODY. A row minted before names were asked and a
 * deleted account's surviving upload render no credit at all, never an invented
 * stand-in (the identity reshape). The personal Uploads feed, whose items are all
 * yours, shows only the event an upload came from, but on an upload to your own
 * event, which carries your face beside the Host badge, it says "You". And a host
 * with no name draws no disc: the Host badge says who, where a "?" disc stood in
 * for the name (crumbs-45; build 36's red-team found one on that feed).
 *
 * ★ FOR THE HOST, THE NAME OPENS THE PERSON'S LOOK (event-safety `entry=all`:
 * "every road opens the person's look"): on a surface that provides one
 * (`CreditLookContext`), the same look a name in the Guests room opens, social
 * first (their face, the address only the host reads, their page), with a quiet
 * Block at its foot for the photograph's sender. So the host's viewer and Review's
 * peek are two of Block's three doors, and none of them opens onto a block-heavy
 * screen. A guest's credit is unchanged, and the host's own uploads carry no look.
 *
 * ★ IT ARRIVES WITH THE LINK, AND FADES IN. The paged album's attribution rides
 * an item's link (minted by id), so an item not linked yet names nobody and
 * draws nothing; when the link lands the caller hands a new item object, this
 * memo re-renders on it, and the credit mounts and fades in. The viewer keys it
 * by id, so it also fades in afresh on every photograph (the fade the key was
 * always for; a re-minted link on the same photograph re-renders it in place).
 */
export const FaceCredit = memo(function FaceCredit({
  item,
  viewerIsHost,
  isOwn,
}: {
  item: ViewerMedia;
  viewerIsHost: boolean;
  isOwn: boolean;
}) {
  // The host's look, where the surface provides one (read before any early return: a hook).
  const look = useContext(CreditLookContext);
  const name = item.uploaderName?.trim() || null;
  // Undefined reads as VERIFIED, so a name is never marked on a guess; only an
  // explicit `false` beside a real name draws the mark.
  const unverified = item.isVerified === false && name !== null;
  const named = item.isHost === true || name !== null;
  const eventName = item.eventName?.trim() || null;
  const eventLabel =
    eventName &&
    (item.eventDateLabel ? `${eventName} · ${item.eventDateLabel}` : eventName);
  if (!named && !eventLabel) return null;

  const face = named ? (item.uploaderFace ?? null) : null;
  // The host's look, on a guest's photograph that names its sender (never the host's own upload,
  // never the viewer's own), where the surface provides one: the name opens it, so the face and the
  // name stop being a link here.
  const hostLook =
    look !== null && viewerIsHost && named && !item.isHost && !isOwn && !!name;
  // A typed name opens nothing, whatever an item claims: there is no page
  // behind a name nobody proved.
  const door =
    !hostLook && named && !unverified && face?.href ? face.href : null;
  const said = isOwn ? "You" : name;
  const pageLabel = `Open ${isOwn ? "your" : `${name ?? "their"}'s`} page`;

  // A disc only beside a name, the face's own rule: a host who never set one is credited by the badge alone.
  const disc = name !== null && (
    <Avatar
      // The face's colour, whoever it belongs to: a confirmed account's, or a typed name's own row's (the guest
      // list's rule). Only a PHOTOGRAPH is withheld from a name nobody proved: it would lend it the claim the
      // mark withholds, and a typed name has none to show.
      seed={face?.seed ? face.seed : undefined}
      className="size-7 shrink-0 after:border-white/15"
    >
      {!unverified && face?.avatarUrl && (
        <AvatarImage src={face.avatarUrl} alt="" />
      )}
      <AvatarFallback className="bg-white/15 text-caption font-medium text-white">
        {name.slice(0, 1).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );

  return (
    <div
      data-lightbox-credit
      className={cn(
        "pointer-events-auto flex max-w-full min-w-0 items-center gap-2 rounded-full py-1 pr-3",
        // The arrival (above). Opacity alone, never the keyframe `animate-in`,
        // whose `filter` would sit on the same element as the glass's backdrop.
        "transition-opacity duration-200 ease-emphasis motion-safe:starting:opacity-0",
        disc ? "pl-1" : "pl-3",
        GLASS,
      )}
    >
      {disc &&
        (door ? (
          // The face is part of the door for a thumb, and silent for a reader:
          // the name beside it is the one link announced.
          <Link
            href={door}
            tabIndex={-1}
            aria-hidden
            className="shrink-0 rounded-full transition-transform duration-150 ease-emphasis active:scale-95 motion-reduce:active:scale-100"
          >
            {disc}
          </Link>
        ) : (
          disc
        ))}
      <span className="flex min-w-0 flex-col py-0.5">
        {named && (
          <span className="flex min-w-0 items-center gap-1.5">
            {said &&
              (hostLook && name ? (
                look({
                  item,
                  name,
                  unverified,
                  trigger: (
                    <button
                      type="button"
                      data-credit-look=""
                      className={cn(
                        "truncate rounded-sm text-left text-working font-medium text-white outline-none",
                        "transition-transform duration-150 ease-emphasis focus-visible:ring-2 focus-visible:ring-white/70 active:scale-[0.98] motion-reduce:active:scale-100",
                        GLASS_MARK_LIT,
                      )}
                    >
                      {said}
                    </button>
                  ),
                })
              ) : door ? (
                <ActionTooltip label={pageLabel}>
                  <Link
                    href={door}
                    className={cn(
                      "truncate rounded-sm text-working font-medium text-white outline-none",
                      "transition-transform duration-150 ease-emphasis focus-visible:ring-2 focus-visible:ring-white/70 active:scale-[0.98] motion-reduce:active:scale-100",
                      GLASS_MARK_LIT,
                    )}
                  >
                    {said}
                  </Link>
                </ActionTooltip>
              ) : (
                <span
                  data-credit-name
                  className={cn(
                    "truncate text-working font-medium text-white",
                    GLASS_MARK_LIT,
                  )}
                >
                  {said}
                </span>
              ))}
            {unverified && (
              <UnverifiedMark
                name={name}
                tone="lit"
                own={isOwn}
                viewerIsHost={viewerIsHost}
              />
            )}
            {item.isHost && (
              <Badge
                variant="secondary"
                className="shrink-0 bg-white/20 text-white hover:bg-white/20"
              >
                Host
              </Badge>
            )}
          </span>
        )}
        {/* HOST-GALLERY-ONLY by construction: only the host's items carry an
            address, and only a proved one (uploader-identity.ts). */}
        {item.uploaderEmail && (
          <span className="truncate text-caption text-white/60">
            {item.uploaderEmail}
          </span>
        )}
        {eventLabel &&
          (item.eventQrToken ? (
            <a
              href={`/e/${item.eventQrToken}`}
              className="truncate text-caption text-white/70 underline-offset-4 outline-none hover:text-white hover:underline focus-visible:underline"
            >
              {eventLabel}
            </a>
          ) : (
            <span className="truncate text-caption text-white/70">
              {eventLabel}
            </span>
          ))}
      </span>
    </div>
  );
});
