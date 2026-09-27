"use client";

import Image from "next/image";
import Link from "next/link";

import type { BoardState } from "@/components/lab/board-spec";
import { LearnChevron } from "@/components/marketing/sections/shared/learn-chevron";
import { Caption } from "@/components/marketing/system/caption";
import { SectionLight } from "@/components/marketing/system/section-light";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { Avatar, AvatarFallback, AvatarGroup } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { marketingImage } from "@/lib/constants/marketing-media";
import { MARKETING_CTA } from "@/lib/constants/marketing-nav";
import { DEMO_CTA_LABEL } from "@/lib/constants/marketing-voice";
import { cn } from "@/lib/utils";

import { EVENT } from "../gallery-fixtures";
import { px } from "./parts";
import { ReelHeroDrawn } from "./reel-hero";
import { CinemaRoom, Scene, stopLinks } from "./scene";
import { type ScreenId, screenOf } from "./screens";

/**
 * WHAT STANDS BESIDE "Try the live demo, no signup.", DRAWN BESIDE THE REAL
 * LINK IN A REAL BAND AND A REAL HERO.
 *
 * The link is `DemoCtaLink` as the wiring round leaves it: the words and the
 * learn chevron, one `<a>`, one accessible name, the frame gone (his r2 note:
 * "It looks really silly here beside the 'Try the live demo...' CTA link").
 * Whatever an option adds rides INSIDE that one anchor, never as a second tap
 * target beside it, so the mark and the words stay one click and one name.
 *
 * The two places are the two ways the line is laid out across its 19: centred
 * under the buttons (14 closing bands and three heroes), drawn in the home's
 * close as the wiring round lands it; and inline beside the button (the /reel
 * and /features/qr heroes), drawn in the /reel hero.
 *
 * ★ EVERY MARK IS A PIECE THE PRODUCT ALREADY DRAWS, so none of them is a new
 * visual language: the live dot is the house pulse (`[data-mkt-pulse]`, the
 * loop-pause contract's own) on the success dot the album door's "Filling
 * live" chip wears; the faces are the guest list's own collapsed row
 * (`AvatarGroup`, seeded avatars); the peek is an opaque floating card on the
 * floating-layer contract (no glass on a panel).
 */

export type BesideId = "none" | "live" | "faces" | "peek";

/** The demo album the peek opens onto: the board's shared stand-in event. */
const PEEK_STILLS = ["wedding-toast", "party-dj", "wedding-petals"] as const;

/** The three guests whose faces stand beside the link, as the album names
 *  them (the gallery fixture's uploaders): seeded, as the guest list seeds. */
const FACES = [
  { seed: "demo-guest-ruby", initial: "R" },
  { seed: "demo-guest-sam", initial: "S" },
  { seed: "demo-guest-theo", initial: "T" },
] as const;

/**
 * `live`: the success dot with the house pulse (`[data-mkt-pulse]`, which
 * the loop-pause contract freezes and reduced motion never starts). The ring
 * is the pulse's own custom property re-pointed at the dot's colour: the
 * house ring is ink-tinted for a QR plate, and a grey halo round a green dot
 * reads as two things.
 */
const LIVE_RING = {
  "--mkt-pulse-ring": "color-mix(in oklab, var(--success) 45%, transparent)",
} as React.CSSProperties;

function LiveDot() {
  return (
    <span
      aria-hidden
      data-mkt-pulse
      className="size-2 shrink-0 rounded-full bg-success"
      style={LIVE_RING}
    />
  );
}

/** `faces`: the guest list's collapsed row, three faces at its small size. */
function Faces() {
  return (
    <AvatarGroup aria-hidden className="-space-x-1.5">
      {FACES.map((f) => (
        <Avatar
          key={f.seed}
          size="sm"
          seed={f.seed}
          className="size-5 transition-transform duration-150 ease-emphasis group-hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-y-0"
        >
          <AvatarFallback className="text-[9px] font-semibold">
            {f.initial}
          </AvatarFallback>
        </Avatar>
      ))}
    </AvatarGroup>
  );
}

/**
 * `peek`: NOTHING AT REST; ON A POINTER'S HOVER OR A KEYBOARD'S FOCUS, A CARD
 * OF THE ALBUM THE LINK OPENS. Drawn open here (the board has no pointer), so
 * the frame shows the moment it answers. It hangs under the link, never over
 * the buttons above it, and a phone, which has no hover, keeps the link alone.
 */
function Peek() {
  return (
    <span
      data-peek
      aria-hidden
      className="absolute top-full left-1/2 z-30 mt-3 block w-64 -translate-x-1/2 rounded-xl bg-popover p-2 text-left text-popover-foreground shadow-layer ring-1 ring-foreground/10"
    >
      <span className="grid grid-cols-3 gap-1">
        {PEEK_STILLS.map((id) => (
          <span
            key={id}
            className="relative block aspect-4/5 overflow-hidden rounded-[var(--radius-tile)]"
          >
            <Image
              src={marketingImage(id).src}
              alt=""
              fill
              sizes="80px"
              // Eager: a card that opens on hover has no time to wait for a
              // lazy request, and three thumbnails cost nothing to hold.
              loading="eager"
              className="object-cover"
            />
          </span>
        ))}
      </span>
      <span className="block px-1.5 pt-2.5 pb-1">
        <span className="block text-sm font-medium">{EVENT.name}</span>
        <span className="block text-caption text-muted-foreground">
          {`${EVENT.photos} photos from ${EVENT.guests} guests`}
        </span>
      </span>
    </span>
  );
}

/**
 * THE LINK, AS THE WIRING ROUND LEAVES IT, WITH AN OPTION'S MARK INSIDE IT.
 * `open` draws the peek's hover state (the link lit as a pointer lights it).
 */
export function DemoLine({
  mark,
  open = false,
}: {
  mark: BesideId;
  open?: boolean;
}) {
  return (
    <span className="relative inline-flex">
      <a
        href="/demo"
        data-demo-line
        className={cn(
          "group mkt-learn inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground",
          open && "text-foreground",
        )}
      >
        {mark === "live" && <LiveDot />}
        {mark === "faces" && <Faces />}
        <span data-demo-words className="inline-flex items-center gap-1">
          {DEMO_CTA_LABEL}
          <LearnChevron />
        </span>
      </a>
      {mark === "peek" && open && <Peek />}
    </span>
  );
}

/** The home's close, as the wiring round lands it: `CtaBand`'s markup with
 *  the demo line in its place (the band takes no line from outside). */
function CloseDrawn({ mark, open }: { mark: BesideId; open: boolean }) {
  return (
    <SectionLight placement="bottom" reach="58%">
      <SectionShell
        className="border-t"
        reveal="none"
        heading="Your next event starts here."
        subhead="Free to host, and every guest joins with one scan."
      >
        <div className="mt-8 flex flex-col items-center gap-4">
          <Button asChild size="cta">
            <Link href={MARKETING_CTA.href}>{MARKETING_CTA.label}</Link>
          </Button>
          <DemoLine mark={mark} open={open} />
        </div>
        <div className="mt-16 flex flex-col items-center">
          <Caption>A Partyreel production · partyreel.com</Caption>
        </div>
      </SectionShell>
    </SectionLight>
  );
}

function Place({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-b border-dashed border-white/15 px-4 py-2 sm:px-8">
      <Caption>{children}</Caption>
    </div>
  );
}

function BesideDrawing({ id, screen }: { id: BesideId; screen: ScreenId }) {
  // A phone has no hover, so the peek never opens there: its 375 frame is the
  // link alone, which is the option's honest cost.
  const open = id === "peek" && screen === "1440";
  return (
    <CinemaRoom>
      <div onClickCapture={stopLinks}>
        <Place>The home&rsquo;s close, as the wiring round lands it</Place>
        <CloseDrawn mark={id} open={open} />
        <Place>/reel, the line beside the button</Place>
        <ReelHeroDrawn
          heading="Your event, playing as it happens."
          demo={<DemoLine mark={id} open={open} />}
        />
      </div>
    </CinemaRoom>
  );
}

export function besidePreview(s: BoardState, id: BesideId) {
  const screen = screenOf(s.screen);
  return (
    <Scene
      id={`beside-${id}`}
      screen={screen}
      title="The demo line in a close and in a hero"
      measure={(root) => {
        const line = root.querySelector("[data-demo-line]");
        const words = root.querySelector("[data-demo-words]");
        if (!line || !words) return null;
        const l = line.getBoundingClientRect();
        const w = words.getBoundingClientRect();
        const mark = l.width - w.width;
        const peek = root.querySelector("[data-peek]");
        const head =
          mark > 1
            ? `The line is ${px(l.width)} wide, ${px(mark)} of it the mark and its gap.`
            : `The line is ${px(l.width)} wide: the words and the chevron alone.`;
        if (id !== "peek") return head;
        if (!peek)
          return `${head} A phone has no hover, so the peek never opens here.`;
        const p = peek.getBoundingClientRect();
        return `${head} Drawn open, as a pointer finds it: the peek is ${px(p.width)} by ${px(p.height)}, hung under the link.`;
      }}
    >
      <BesideDrawing id={id} screen={screen} />
    </Scene>
  );
}
