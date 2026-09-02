"use client";

import { Globe, KeyRound, Lock, MailCheck } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";

import { VISIBILITY_HINTS } from "@/components/app/visibility-selector";
import { GhostBackdrop } from "@/components/marketing/sections/features/shared/ghost-grid";
import { marketingImage } from "@/lib/constants/marketing-media";
import { TEASER_LIMIT } from "@/lib/events/gallery-access";

/**
 * WHO CAN OPEN IT: the four states a visitor can meet at the link, each as a
 * small frame of what they actually see. The three visibility hints are
 * IMPORTED from the app's selector (never retyped); the fourth state is the
 * default one, an account-required album met signed out: the newest nine
 * photos and a "See all" button, nothing else leaves the server.
 *
 * ★ Private shows NO name and NO count (the real page is an early return:
 * a lock, "This event is private"). The name + count tease belongs to the
 * password state only. A client component because the hints live in a
 * client module.
 */

const EVENT_NAME = "Maya & Jay's Wedding";
const OPEN_TILES = ["wedding-golden", "party-balloons", "wedding-toast", "festival-crowd"];
const TEASER_TILES = [
  "wedding-golden",
  "reception-table",
  "party-balloons",
  "wedding-toast",
  "party-dj",
  "festival-crowd",
  "wedding-rings",
  "reception-hall",
  "wedding-arch",
];

function Frame({
  icon: Icon,
  title,
  hint,
  children,
}: {
  icon: typeof Globe;
  title: string;
  hint: string;
  children: ReactNode;
}) {
  return (
    <div className="flex h-full flex-col gap-3">
      {/* flex-1 so the four frames share one height and their labels align
          on one baseline, whatever each state draws inside. */}
      <div
        aria-hidden
        className="flex flex-1 flex-col justify-center rounded-2xl border bg-card p-3 ring-1 ring-foreground/5"
      >
        <div className="grid min-h-[9.5rem]">{children}</div>
      </div>
      <div className="flex flex-col gap-1 px-1">
        <p className="flex items-center gap-1.5 font-heading text-base">
          <Icon className="size-4 text-muted-foreground" strokeWidth={1.5} />
          {title}
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">{hint}</p>
      </div>
    </div>
  );
}

function Tiles({ ids, cols }: { ids: string[]; cols: 3 | 4 }) {
  return (
    <div
      className={cols === 4 ? "grid grid-cols-4 gap-1.5" : "grid grid-cols-3 gap-1.5"}
    >
      {ids.map((id) => (
        <span
          key={id}
          className="relative block aspect-square overflow-hidden rounded-[3px]"
        >
          <Image
            src={marketingImage(id).src}
            alt=""
            fill
            sizes="80px"
            className="object-cover"
          />
        </span>
      ))}
    </div>
  );
}

export function VisibilityFrames() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <Frame icon={Globe} title="Public" hint={VISIBILITY_HINTS.open}>
        <div className="self-center">
          <Tiles ids={OPEN_TILES} cols={4} />
          <Tiles ids={[...OPEN_TILES].reverse()} cols={4} />
        </div>
      </Frame>

      <Frame
        icon={MailCheck}
        title="Public, accounts required"
        hint={`The default for a new event. Signed out, a visitor sees the newest ${TEASER_LIMIT} photos, then confirms an email to see the rest and add their own.`}
      >
        <div className="flex flex-col gap-2 self-center">
          <Tiles ids={TEASER_TILES} cols={3} />
          <span className="flex h-7 items-center justify-center rounded-md bg-primary text-[11px] font-medium text-primary-foreground">
            See all 214 photos
          </span>
        </div>
      </Frame>

      <Frame icon={KeyRound} title="Password" hint={VISIBILITY_HINTS.password}>
        <GhostBackdrop />
        <div className="z-10 flex items-center justify-center p-2 [grid-area:1/1]">
          <div className="w-full max-w-[11rem] rounded-xl border bg-card/95 p-3 text-center shadow-sm">
            <p className="flex items-center justify-center gap-1 text-[9px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
              <Lock className="size-2.5" />
              Almost in
            </p>
            <p className="mt-1 font-heading text-xs text-balance">
              {EVENT_NAME} is private
            </p>
            <p className="mt-1 text-[10px] text-muted-foreground tabular-nums">
              214 photos & videos inside
            </p>
            <div className="mt-2 flex h-6 items-center justify-center rounded-md bg-primary text-[10px] font-medium text-primary-foreground">
              Unlock
            </div>
          </div>
        </div>
      </Frame>

      <Frame icon={Lock} title="Private" hint={VISIBILITY_HINTS.private}>
        <div className="flex flex-col items-center justify-center gap-2 self-center py-4 text-center">
          <span className="flex size-9 items-center justify-center rounded-full border text-muted-foreground">
            <Lock className="size-4" />
          </span>
          <p className="font-heading text-sm">This event is private</p>
          <p className="max-w-[12rem] text-[11px] leading-snug text-muted-foreground">
            The host has this event set to private. Check back later, or ask
            them to make it public.
          </p>
        </div>
      </Frame>
    </div>
  );
}
