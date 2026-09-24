"use client";

import { memo } from "react";
import Link from "next/link";

import type { GridMedia } from "@/components/app/media-grid";
import { ActionTooltip } from "@/components/shared/action-tooltip";
import { UnverifiedMark } from "@/components/shared/unverified-mark";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { GLASS, GLASS_MARK_LIT } from "@/lib/glass";
import { cn } from "@/lib/utils";

/**
 * WHAT A CREDIT CAN SAY BEYOND A NAME, WHERE A SURFACE KNOWS IT: the uploader's
 * face and page. Optional on every item and carried by none today: no gallery
 * payload holds a face or a handle yet (the album's items carry a name, an
 * isHost and an isVerified, resolved server-side), so the credit draws the plain
 * disc until the data rides the item. When it does, this is the one seam: the
 * server resolves `avatarUrl` (never a storage path), `seed` (`seedFor`, never a
 * raw account id) and `href` (`/u/<slug>`, only where a page exists).
 */
export type CreditFace = {
  avatarUrl?: string | null;
  seed?: string | null;
  href?: string | null;
};

/** A gallery item as the viewer reads it: the shared GridMedia, plus the face where a surface has one. */
export type ViewerMedia = GridMedia & { uploaderFace?: CreditFace | null };

/**
 * THE FACE-LED CREDIT (`who=face`, Will 2026-09-24: "This is already a great
 * step in the right direction of my previous note about redesigning the
 * floating UI"). Top left, opposite the close circle, in the guest list's
 * grammar: a confirmed account's face (or the plain disc while the face is not
 * in the payload), a typed name's plain disc and the Unverified mark, and a
 * door to the person's page only where one exists. The host still reads the
 * proved address under the name; a typed name never has one to show.
 *
 * ★ ON YOUR OWN UPLOAD IT READS "YOU" (the brief's call, his to overrule), with
 * no separate mark in the viewer: the credit says it. The Unverified mark stays
 * beside "You" on an unproved upload, because on your own credit the mark is the
 * way out ("want to correct that immediately by verifying").
 *
 * ★ A ROW WITH NO NAME NAMES NOBODY. A row minted before names were asked and a
 * deleted account's surviving upload render no credit at all, never an invented
 * stand-in (the identity reshape). The personal Uploads feed, whose items carry
 * no uploader because they are all yours, shows only the event they came from.
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
  // A typed name opens nothing, whatever an item claims: there is no page
  // behind a name nobody proved.
  const door = named && !unverified && face?.href ? face.href : null;
  const said = isOwn ? "You" : name;
  const initial = (name ?? "?").slice(0, 1).toUpperCase();
  const pageLabel = `Open ${isOwn ? "your" : `${name ?? "their"}'s`} page`;

  const disc = (
    <Avatar
      // A colour is an identity everywhere else, so only a confirmed account's
      // seed paints one; a typed name keeps the plain disc (the guest list's rule).
      seed={!unverified && face?.seed ? face.seed : undefined}
      className="size-7 shrink-0 after:border-white/15"
    >
      {!unverified && face?.avatarUrl && (
        <AvatarImage src={face.avatarUrl} alt="" />
      )}
      <AvatarFallback className="bg-white/15 text-caption font-medium text-white">
        {initial}
      </AvatarFallback>
    </Avatar>
  );

  return (
    <div
      data-lightbox-credit
      className={cn(
        "pointer-events-auto flex max-w-full min-w-0 items-center gap-2 rounded-full py-1 pr-3",
        named ? "pl-1" : "pl-3",
        GLASS,
      )}
    >
      {named &&
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
              (door ? (
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
