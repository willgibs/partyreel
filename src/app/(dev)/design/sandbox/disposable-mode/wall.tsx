"use client";

import { FooterQr } from "@/components/marketing/chrome/footer-qr";
import { GLASS_MARK, GLASS_MARK_LIT } from "@/lib/glass";
import { cn } from "@/lib/utils";

import { EVENT, PARTY, ROLL, ROLL_STILLS, SCENE } from "./fixtures";
import { FilmStill, type LookId } from "./film";

/**
 * THE ROOM'S SCREEN UNTIL 9 AM: the reel's own screen posture
 * (`?reel=screen`, the host signed in on the wall's laptop), which today plays
 * the live reel with the code in the corner. At a disposable event the phones
 * wait in the waiting room; the question is what this one screen shows.
 *
 * ★ QUOTED, NOT MOUNTED. The view is a Radix dialog over the engine; here its
 * two pieces a wall reads across a room are drawn from their own classes: the
 * arrivals (a glass chip naming whose shot just came in) and the corner code
 * (white plate, "Scan to add yours", the address), at the screen's own type
 * steps. No event name on screen, as the reel's screen has none.
 */

/** The code in the corner, as the screen posture draws it. */
function CornerCode() {
  return (
    <div className="absolute right-8 bottom-8 flex items-end gap-4">
      <div className="max-w-[16rem] text-right">
        <p className="dm-ink font-heading text-page text-white">
          Scan to add yours
        </p>
        <p className="dm-ink mt-1 text-copy break-all text-white/90">
          {EVENT.address}
        </p>
      </div>
      <span className="rounded-[var(--radius)] bg-white p-1.5 shadow-lift">
        <FooterQr value={`https://${EVENT.address}`} size={132} />
      </span>
    </div>
  );
}

/** The arrival chip, the reel's own: whose shot just came in. */
function Arrival({ name, className }: { name: string; className?: string }) {
  return (
    <span
      data-dm-arrival
      className={cn(
        "rounded-full px-3 py-1.5 text-copy font-medium text-white",
        GLASS_MARK,
        className,
      )}
    >
      <span className={GLASS_MARK_LIT}>{name}</span>
    </span>
  );
}

/* ── 1. the darkroom, building to 9 am ──────────────────────────────────── */

/** The frames that landed last, newest first, a dark one for each. */
const LANDED = [
  "10:39",
  "10:39",
  "10:38",
  "10:36",
  "10:35",
  "10:33",
  "10:31",
  "10:30",
  "10:28",
  "10:26",
  "10:25",
  "10:23",
];

export function DarkroomWall({ landing }: { landing: boolean }) {
  const shots = landing ? PARTY.shots + 1 : PARTY.shots;
  const frames = landing ? ["10:41", ...LANDED.slice(0, 11)] : LANDED;
  return (
    <div className="dm-wall surface-ink" data-dm-wall="darkroom">
      <span aria-hidden className="dm-room-light dm-room-light-wide" />
      <span aria-hidden className="dm-room-grain" />
      <div className="absolute top-1/2 left-20 -translate-y-1/2" data-dm-count>
        <p className="font-heading text-[200px] leading-none tabular-nums">
          {shots}
        </p>
        <p className="mt-4 font-heading text-[44px] leading-tight">
          shots developing
        </p>
        <p className="mt-6 text-[28px] text-[#f7e9e4]/75" data-dm-when>
          {`It develops at ${ROLL.develops}, for everyone at once.`}
        </p>
      </div>
      <div className="absolute top-16 right-16 grid w-[500px] grid-cols-4 gap-3">
        {frames.map((t, i) => (
          <span
            key={`${t}-${i}`}
            className="dm-undeveloped aspect-[3/4]"
            data-new={landing && i === 0 ? "" : undefined}
            data-dm-frame
          >
            <span className="absolute bottom-2 left-2.5 text-sm tabular-nums">
              {t}
            </span>
          </span>
        ))}
      </div>
      {landing && <Arrival name="Priya" className="absolute top-6 left-6" />}
      <CornerCode />
    </div>
  );
}

/* ── 2. his live slideshow ──────────────────────────────────────────────── */

export function SlideshowWall({
  look,
  landing,
}: {
  look: LookId;
  landing: boolean;
}) {
  const still = landing ? SCENE : ROLL_STILLS[4];
  return (
    <div className="dm-wall" data-dm-wall="slideshow">
      <FilmStill
        still={still}
        look={look}
        className="absolute inset-0 size-full"
        position="50% 45%"
      />
      <div className="absolute top-6 left-6 flex flex-col items-start gap-2">
        {landing ? (
          <>
            <Arrival name="Priya" />
            <Arrival name="Theo +3" className="opacity-80" />
          </>
        ) : (
          <Arrival name="Ana +2" />
        )}
      </div>
      <span
        className={cn(
          "absolute top-6 right-6 rounded-full px-3.5 py-1.5 text-copy font-medium text-white",
          GLASS_MARK,
        )}
        data-dm-say
      >
        <span className={GLASS_MARK_LIT}>
          {`On this screen only. Phones get it all at ${ROLL.develops}.`}
        </span>
      </span>
      <CornerCode />
    </div>
  );
}

/* ── 3. a glimpse of each new shot ──────────────────────────────────────── */

export function GlimpseWall({
  look,
  landing,
}: {
  look: LookId;
  landing: boolean;
}) {
  return (
    <div className="dm-wall surface-ink" data-dm-wall="glimpse">
      <span aria-hidden className="dm-room-light dm-room-light-wide" />
      <span aria-hidden className="dm-room-grain" />
      <div className="absolute top-20 left-20" data-dm-count>
        <p className="font-heading text-[120px] leading-none tabular-nums">
          {landing ? PARTY.shots + 1 : PARTY.shots}
        </p>
        <p className="mt-3 font-heading text-[34px] leading-tight">
          shots developing
        </p>
        <p className="mt-5 text-[26px] text-[#f7e9e4]/75" data-dm-when>
          {`It develops at ${ROLL.develops}.`}
        </p>
      </div>
      <div className="absolute top-1/2 left-[640px] w-[330px] -translate-y-1/2">
        <span
          className="dm-glimpse block"
          data-state={landing ? "up" : "down"}
          data-dm-glimpse={landing ? "surfacing" : "sunk"}
        >
          <FilmStill
            still={SCENE}
            look={look}
            stamp={false}
            className="aspect-[3/4] w-full"
          />
        </span>
        {landing && (
          <p className="dm-ink mt-4 text-center text-copy text-white/85">
            Priya&rsquo;s, still developing
          </p>
        )}
      </div>
      <CornerCode />
    </div>
  );
}
