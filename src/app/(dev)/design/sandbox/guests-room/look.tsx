"use client";

import { type ReactElement, type ReactNode, useState } from "react";
import { ArrowUpRight, UserCheck, UserPlus } from "lucide-react";

import { UnverifiedMark } from "@/components/shared/unverified-mark";
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
import { cn } from "@/lib/utils";

import { type Guest, stillsOf } from "./fixtures";
import { photosWord } from "./people";

/**
 * WHAT EVERY CANDIDATE CARD STANDS IN: production's two shapes for a look
 * (`popup-kinds.ts`'s `peek` row, `guest-peek.tsx`'s own two branches): a card
 * beside the name at a desk, the display's popover; the sheet in a hand, its
 * head the face and the name. A candidate hands in its head, its line and its
 * body, and the name that opens it.
 */
export function LookShell({
  face,
  name,
  line,
  body,
  children,
}: {
  face: ReactNode;
  name: string;
  /** The one line under the name. */
  line: ReactNode;
  body: ReactNode;
  /** The name that opens it: one button. */
  children: ReactElement;
}) {
  const desk = useMediaQuery(DESK_QUERY);
  const [open, setOpen] = useState(false);
  if (shapeFor("peek", desk) === "anchored") {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>{children}</PopoverTrigger>
        <PopoverContent
          align="start"
          data-slot="guest-peek"
          data-gr-read="the card"
          className="w-80 space-y-3.5 p-4"
        >
          <div className="flex items-center gap-3">
            {face}
            <div className="min-w-0 space-y-0.5">
              <p className="truncate font-heading text-card-title">{name}</p>
              <div className="text-sm text-muted-foreground">{line}</div>
            </div>
          </div>
          {body}
        </PopoverContent>
      </Popover>
    );
  }
  return (
    <Popup open={open} onOpenChange={setOpen}>
      <PopupTrigger asChild>{children}</PopupTrigger>
      <PopupContent kind="peek" data-slot="guest-peek" data-gr-read="the card">
        <PopupHeader
          title={
            <span className="flex items-center gap-3">
              {face}
              <span className="min-w-0 truncate">{name}</span>
            </span>
          }
          description={line}
        />
        <PopupBody className="space-y-3.5 pb-5">{body}</PopupBody>
      </PopupContent>
    </Popup>
  );
}

/** What kind of name this is, the line under it: the page's handle, a confirmed address, or the mark. */
export function kindLine(guest: Guest): ReactNode {
  if (guest.unverified)
    return (
      <span className="inline-flex items-center gap-1.5">
        <UnverifiedMark name={guest.name} />
        Unverified: anyone can type a name
      </span>
    );
  return guest.slug ? `@${guest.slug}` : "Confirmed their email";
}

/** Their four photographs here, each one press from the album's viewer (a stand-in still each). */
export function Strip({
  guest,
  label = true,
  className,
}: {
  guest: Guest;
  /** The count above the four, with See all. */
  label?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)} data-gr-strip="">
      {label ? (
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-label font-semibold text-muted-foreground uppercase">
            {`${photosWord(guest.photos)} here`}
          </p>
          <button
            type="button"
            className="-mr-1 inline-flex focus-halo items-center gap-0.5 rounded-sm px-1 text-xs text-muted-foreground outline-none hover:text-foreground"
          >
            See all
            <ArrowUpRight className="size-3" aria-hidden />
          </button>
        </div>
      ) : null}
      <div className="grid grid-cols-4 gap-1">
        {stillsOf(guest).map((still) => (
          <button
            key={still.id}
            type="button"
            aria-label={`One of ${guest.name}'s photos`}
            className="relative block aspect-square focus-halo overflow-hidden rounded-tile bg-muted outline-none"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- a marketing still standing in for a presigned photograph */}
            <img
              src={still.src}
              alt=""
              className="absolute inset-0 size-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
}

/** Follow, quiet: an outlined key that turns to Following on a press, writing nothing here. */
export function QuietFollow({ className }: { className?: string }) {
  const [on, setOn] = useState(false);
  const Icon = on ? UserCheck : UserPlus;
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      aria-pressed={on}
      onClick={() => setOn((v) => !v)}
      className={className}
    >
      <Icon data-icon="inline-start" />
      {on ? "Following" : "Follow"}
    </Button>
  );
}

/** Their page, quiet: the page's door, never the card's loudest press. */
export function PageKey({ className }: { className?: string }) {
  return (
    <Button type="button" variant="outline" size="sm" className={className}>
      Their page
      <ArrowUpRight data-icon="inline-end" />
    </Button>
  );
}
