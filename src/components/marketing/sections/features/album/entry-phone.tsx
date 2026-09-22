"use client";

import { Camera, Images, ImageUp } from "lucide-react";
import Image from "next/image";

import { StyledQr } from "@/components/app/styled-qr";
import { PhoneShell } from "@/components/marketing/frames";
import { marketingImage } from "@/lib/constants/marketing-media";
import { resolveQrPreset } from "@/lib/constants/qr-presets";
import { DEMO_EVENT_URL } from "@/lib/demo";
import { cn } from "@/lib/utils";

/**
 * ONE PHONE, THREE SCREENS: how a guest reaches the album, as the guest sees
 * it. The table card with the real code, the welcome sheet with the app's own
 * strings, and the album with the guest's first upload in flight.
 *
 * CONTROLLED since the finish pass (2026-09-02): the stage beside it owns the
 * clock and the pointer, because the three facts next to the phone ARE these
 * three screens (the phone's index), and pointing at a fact pins its screen.
 * The strings are the shipped entry modal's (src/components/guest/
 * entry-modal.tsx), pinned by mock-parity.test.ts.
 */

export const ENTRY_SCREENS = [
  "The table card",
  "The welcome",
  "Adding",
] as const;
export type EntryScreen = 0 | 1 | 2;

const EVENT_NAME = "Maya & Jay's Wedding";
const QR_VALUE = DEMO_EVENT_URL ?? "https://partyreel.com/e/demo";

export function EntryPhone({ screen }: { screen: EntryScreen }) {
  return (
    <PhoneShell screenClassName="p-2.5" className="mx-auto max-w-[16.5rem]">
      <div aria-hidden className="grid">
        <Screen active={screen === 0}>
          <TableCard />
        </Screen>
        <Screen active={screen === 1}>
          <Welcome />
        </Screen>
        <Screen active={screen === 2}>
          <Adding />
        </Screen>
      </div>
    </PhoneShell>
  );
}

/** One stacked screen; inactive screens fade and stop catching taps. The
 *  stack sizes to the tallest screen, so the phone never changes height. */
function Screen({
  active,
  children,
}: {
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "transition-opacity [transition-duration:var(--mkt-tabs-dur)] ease-emphasis [grid-area:1/1] motion-reduce:transition-none",
        active ? "opacity-100" : "pointer-events-none opacity-0",
      )}
    >
      {children}
    </div>
  );
}

/** Screen 1: the code on the table, as the guest's camera sees it. */
function TableCard() {
  return (
    <div className="relative flex min-h-[19rem] flex-col items-center justify-center gap-3 rounded-[1.25rem] bg-black/50 p-4">
      <div className="w-full rounded-lg bg-white p-4 text-center text-neutral-900">
        <div className="mx-auto w-fit">
          <StyledQr
            value={QR_VALUE}
            size={120}
            style={resolveQrPreset("classic")}
          />
        </div>
        <p className="mt-3 font-heading text-sm">Scan to add your photos</p>
        <p className="mt-0.5 text-[10px] text-neutral-500">{EVENT_NAME}</p>
      </div>
      {/* The camera's own scan frame. */}
      <span className="pointer-events-none absolute inset-5 rounded-xl border border-white/30" />
    </div>
  );
}

/** Screen 2: the welcome sheet, the app's strings verbatim. */
function Welcome() {
  return (
    <div className="flex min-h-[19rem] flex-col rounded-[1.25rem] bg-card p-4">
      <p className="text-[10px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
        You&rsquo;re invited to
      </p>
      <p className="mt-1.5 font-heading text-lg leading-tight text-balance">
        {EVENT_NAME}
      </p>
      <p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <span className="grid size-4 place-items-center rounded-full bg-muted text-[8px] font-medium text-foreground">
          M
        </span>
        Hosted by <span className="font-medium text-foreground">Maya</span>
      </p>
      <div className="mt-4 flex flex-col gap-2.5">
        <p className="flex items-start gap-2 text-[11px] leading-snug">
          <Camera className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
          Add your photos and videos in seconds. No app required.
        </p>
        <p className="flex items-start gap-2 text-[11px] leading-snug">
          <Images className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
          Everyone&rsquo;s shots land in one album. 18 are already inside.
        </p>
      </div>
      {/* ★ THE GHOST ROW IS GONE (Will, 2026-09-21, "the door as three steps": "No exit").
          Continue is the only way on out of the welcome now. `ENTRY_SCREENS` still counts three
          screens: what changed is what this one offers, not how many there are. */}
      <span className="mt-auto flex h-8 items-center justify-center rounded-md bg-primary text-xs font-medium text-primary-foreground">
        Continue
      </span>
    </div>
  );
}

const ADDING_TILES = ["wedding-toast", "party-balloons", "reception-table"];

/** Screen 3: the album, the guest's first upload in flight (the real
 *  in-tile progress strip), the "Add photos" pill. */
function Adding() {
  return (
    <div className="flex min-h-[19rem] flex-col rounded-[1.25rem] bg-card p-3">
      <p className="font-heading text-sm leading-tight">{EVENT_NAME}</p>
      <p className="mt-0.5 text-[10px] text-muted-foreground tabular-nums">
        19 photos & videos from 6 guests
      </p>
      <div className="mt-3 grid grid-cols-2 gap-1">
        {ADDING_TILES.map((id, i) => (
          <span
            key={id}
            className={cn(
              "relative overflow-hidden rounded-tile bg-muted",
              i === 0 ? "aspect-[4/5]" : "aspect-square",
            )}
          >
            <Image
              src={marketingImage(id).src}
              alt=""
              fill
              sizes="110px"
              className={cn("object-cover", i === 0 && "opacity-70")}
            />
            {i === 0 && (
              <span className="absolute inset-x-0 bottom-0 bg-black/35 p-1">
                <span className="block h-1 w-full overflow-hidden rounded-full bg-white/30">
                  <span className="block h-full w-[64%] rounded-full bg-white" />
                </span>
              </span>
            )}
          </span>
        ))}
        <span className="flex aspect-square items-center justify-center rounded-tile border border-dashed border-border/70 text-muted-foreground">
          <ImageUp className="size-4" />
        </span>
      </div>
      <span className="mt-auto flex h-8 items-center justify-center gap-1.5 rounded-full bg-primary text-xs font-medium text-primary-foreground">
        <ImageUp className="size-3.5" />
        Add photos
      </span>
    </div>
  );
}
