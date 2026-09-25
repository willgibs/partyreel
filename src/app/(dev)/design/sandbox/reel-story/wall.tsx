"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import type { BoardState } from "@/components/lab/board-spec";
import { FooterQr } from "@/components/marketing/chrome/footer-qr";
import { LearnMoreLink } from "@/components/marketing/sections/shared/learn-more-link";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { River } from "@/components/shared/river/river";
import {
  QR_DOOR_FRAMES,
  QR_DOOR_SIZES,
} from "@/components/shared/river/qr-door-frames";
import { Button } from "@/components/ui/button";
import { SITE_URL } from "@/lib/constants/site";
import { cn } from "@/lib/utils";

import { DemoReel, px } from "./parts";
import { CinemaRoom, linesLabel, linesOf, Scene, stopLinks } from "./scene";
import { type ScreenId, screenOf } from "./screens";

/**
 * THE EVENT PAGES' PROOF: THE DEMO DOOR, AND THE REEL AS ITS EQUAL.
 *
 * The section is `event-door.tsx`'s own: the same eyebrow and heading, the
 * same grid (seven and five, the door wider, his layout), the same door. The
 * door is drawn exactly as shipped with one change, its line cut to two lines
 * at 1440 and 375 (the carried call); the caption under every frame reads the
 * line count off the frame, never off the string.
 *
 * The reel side carries the same three strings in every option (the page's
 * reel line, the type's angle and the door into /reel), so the options differ
 * only in how the reel stands. The reel is the demo album's live reel on the
 * real engine, never a render and never a thumbnail.
 *
 * ★ THE ANGLE IS A STAND-IN. `EVENT_TYPES.reelAngle` is reel-sweep's to retell
 * tonight; this draws the weddings page with a line of that length in the new
 * register, judged for its size.
 */

export type WallId = "pair" | "screen" | "bleed";

/** The shipped ratio: wider than tall, so the promise has a solid floor. */
const DOOR_RATIO = 0.78;

/** The door's line, cut to two (the carried call `door-line`). */
export const DOOR_LINE = "A real album, open with no sign-up.";

const REEL_LINE = "The reel plays live at the reception.";
const ANGLE =
  "The first dance, the toasts, the send-off: every photo joins it as it lands.";

/**
 * The demo door, exactly as `event-door.tsx` draws it, its line cut. Its
 * column is the shipped seven of twelve, except beside the screen, whose
 * landscape wall needs the even split to stand as tall as the door.
 */
function DemoDoor({ span }: { span: 6 | 7 }) {
  return (
    <div className={span === 7 ? "lg:col-span-7" : "lg:col-span-6"}>
      <div
        data-door
        className="relative mx-auto w-full max-w-md overflow-hidden rounded-2xl bg-[oklch(0.13_0_0)] ring-1 ring-white/10 lg:max-w-none"
        style={{ aspectRatio: `1 / ${DOOR_RATIO}` }}
      >
        <River
          className="rvr-ink"
          frames={QR_DOOR_FRAMES}
          ratio={DOOR_RATIO}
          origin={-0.1 * DOOR_RATIO}
          sizes={QR_DOOR_SIZES}
        />
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-start gap-3 bg-linear-to-t from-black from-30% via-black/80 to-transparent p-6 pt-24 sm:p-8 sm:pt-28">
          <p
            data-door-line
            className="max-w-md font-heading text-page text-balance text-white"
          >
            {DOOR_LINE}
          </p>
          <Button asChild size="cta" className="mt-1">
            <Link href="/demo">Explore the demo</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * The words every option carries: the page's reel line, the type's angle and
 * the door into /reel. `column` is the register the shipped side used (a
 * subsection line on the section's ground); `floor` is the door's own (a page
 * line on a photograph's black floor), for the options that stand the words
 * on the reel the way the door stands its promise on the river.
 */
function ReelWords({
  register,
  className,
}: {
  register: "column" | "floor";
  className?: string;
}) {
  const floor = register === "floor";
  return (
    <div
      className={cn(
        "flex flex-col items-start",
        floor ? "gap-2" : "gap-2.5",
        className,
      )}
    >
      <p
        className={cn(
          "font-heading text-balance",
          floor ? "max-w-md text-page text-white" : "text-subsection",
        )}
      >
        {REEL_LINE}
      </p>
      <p
        className={cn(
          "text-sm text-pretty",
          floor ? "max-w-sm text-white/70" : "max-w-md text-muted-foreground",
        )}
      >
        {ANGLE}
      </p>
      <LearnMoreLink
        href="/reel"
        className={cn("mt-1", floor && "text-white/85 hover:text-white")}
      >
        See how the reel works
      </LearnMoreLink>
    </div>
  );
}

/** The door's floor, shared by every option that stands words on the reel. */
const FLOOR =
  "absolute inset-x-0 bottom-0 bg-linear-to-t from-black from-30% via-black/80 to-transparent p-6 pt-24 sm:p-8 sm:pt-28";

/**
 * `pair`: the reel takes the door's own card. The same corner, ring and floor,
 * and at a desk the same height as the door beside it (the column stretches
 * to the row), so the two read as one designed pair; on a phone the card
 * stands square under the door, room for the reel above its words.
 *
 * ★ THE LANDSCAPE COMPOSITION, COVERING. A near-square card fits neither
 * composition, and eleven of the album's twelve stills are landscape: the
 * portrait one letterboxes each of them (black above and below, measured on
 * the first pass), the landscape one fills with them and the card crops its
 * sides, which is how every door crops its photograph.
 */
function PairCard({ phone }: { phone: boolean }) {
  return (
    <div className="lg:col-span-5 lg:self-stretch">
      <div
        data-reel-side
        className={cn(
          "relative mx-auto w-full max-w-md overflow-hidden rounded-2xl bg-black ring-1 ring-white/10 lg:h-full lg:max-w-none",
          phone && "aspect-square",
        )}
      >
        <DemoReel orientation="landscape" maxDim={960} />
        <div className={FLOOR}>
          <ReelWords register="floor" />
        </div>
      </div>
    </div>
  );
}

/**
 * `screen`: the reel as the screen it plays on at the event, a landscape wall
 * wearing what the real screen posture wears (`live-reel-view.tsx`, `?reel=
 * screen`): the reel full bleed and, bottom right, "Scan to add yours", the
 * address and the code. Here the code is the demo's own (`/demo`, the QR
 * door's short value), so the picture is a door too. Sizes inside the screen
 * are container units, so the plate keeps its proportion to the wall at any
 * width, as it does on a real one.
 */
function ScreenWall() {
  return (
    <div className="flex flex-col gap-6 lg:col-span-6">
      <div
        data-reel-side
        className="[container-type:inline-size] relative aspect-video w-full overflow-hidden rounded-lg bg-black shadow-lift ring-1 ring-white/15"
      >
        <DemoReel orientation="landscape" maxDim={960} />
        <div className="absolute right-[2.5cqw] bottom-[3cqw] flex items-end gap-[1.6cqw]">
          <div className="text-right [text-shadow:0_1px_2px_rgb(0_0_0/0.55),0_2px_24px_rgb(0_0_0/0.45)]">
            <p className="font-heading text-[3.4cqw] leading-tight font-semibold text-white">
              Scan to add yours
            </p>
            <p className="mt-[0.4cqw] text-[2.2cqw] text-white/90">
              {SITE_URL.replace(/^https?:\/\//, "")}/demo
            </p>
          </div>
          <FooterQr
            value={`${SITE_URL}/demo`}
            size={96}
            className="w-[11cqw] p-[0.7cqw] shadow-lift [&>svg]:h-auto [&>svg]:w-full"
          />
        </div>
      </div>
      <ReelWords register="column" />
    </div>
  );
}

/**
 * `bleed`: no box on the reel's side at all. The reel starts at the column and
 * runs to the window's right edge, as tall as the door (a phone: edge to edge
 * under it), with the words on its floor, so the moving pictures fill the side
 * of the page his portrait note asked to fill.
 *
 * ★ THE BLEED IS ARITHMETIC ON THE GRID'S OWN WIDTH: at a desk the grid is
 * `max-w-5xl` centred, so the gutter to the right is half of what is left of
 * the viewport, and a `vw` inside a frame is the frame's width.
 */
function Bleed({ phone }: { phone: boolean }) {
  return (
    <div className="lg:col-span-5 lg:self-stretch">
      <div
        data-reel-side
        className={cn(
          "relative overflow-hidden bg-black",
          phone
            ? "-mx-4 aspect-[4/3]"
            : "h-full w-[calc(100%+(100vw-64rem)/2)] rounded-l-2xl",
        )}
      >
        <DemoReel orientation="landscape" maxDim={1280} />
        <div className={FLOOR}>
          <ReelWords register="floor" />
        </div>
      </div>
    </div>
  );
}

function Side({ id, phone }: { id: WallId; phone: boolean }): ReactNode {
  if (id === "pair") return <PairCard phone={phone} />;
  if (id === "screen") return <ScreenWall />;
  return <Bleed phone={phone} />;
}

export function WallDrawing({ id, screen }: { id: WallId; screen: ScreenId }) {
  const phone = screen === "375";
  return (
    <CinemaRoom>
      <div onClickCapture={stopLinks}>
        <SectionShell
          eyebrow="See one that is real"
          heading="Open a wedding that already happened."
          reveal="none"
        >
          <div className="mx-auto mt-14 grid max-w-5xl items-center gap-8 lg:grid-cols-12 lg:gap-10">
            <DemoDoor span={id === "screen" ? 6 : 7} />
            <Side id={id} phone={phone} />
          </div>
        </SectionShell>
      </div>
    </CinemaRoom>
  );
}

export function wallPreview(s: BoardState, id: WallId) {
  const screen = screenOf(s.screen);
  return (
    <Scene
      id={`wall-${id}`}
      screen={screen}
      title="An event page's proof"
      measure={(root, win) => {
        const door = root.querySelector("[data-door]");
        const line = root.querySelector("[data-door-line]");
        const reel = root.querySelector("[data-reel-side]");
        if (!door || !line || !reel) return null;
        const d = door.getBoundingClientRect();
        const r = reel.getBoundingClientRect();
        return `The door's line takes ${linesLabel(linesOf(line, win))}. The door is ${px(d.width)} by ${px(d.height)}; the reel beside it ${px(r.width)} by ${px(r.height)}.`;
      }}
    >
      <WallDrawing id={id} screen={screen} />
    </Scene>
  );
}
