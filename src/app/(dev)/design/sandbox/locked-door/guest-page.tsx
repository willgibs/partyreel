"use client";

import {
  createContext,
  type CSSProperties,
  type ReactNode,
  useContext,
  useMemo,
} from "react";
import { ImageUp, QrCode } from "lucide-react";

import { Logo } from "@/components/shared/logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatMediaCount } from "@/lib/format/count";
import { HOUSE_HUES, hueOfOklch } from "@/lib/guest/door-light";
import { useSampledPalette } from "@/lib/shared/sampled-palette";
import { cn, formatEventDate } from "@/lib/utils";

import { ALBUM, EVENT, HOST, NEWEST, type Still } from "./fixtures";
import type { ScreenId } from "./scene";

/**
 * THE GUEST PAGE AROUND THE DOOR, AND THE ALBUM BEHIND IT.
 *
 * ★ WHAT WOULD REACH A SESSION OR THE NETWORK IS QUOTED, class for class: the
 * guest header (it resolves a session on mount) and the album (its live
 * gallery polls, presigns and samples). Everything else on the door's page is
 * production's own piece, drawn by the scenes beside this file.
 *
 * ★ THE LIGHT IS THE ALBUM'S OWN, SAMPLED, NEVER TYPED, and passed down rather
 * than published. Production's lamp reads one module store (`door-light.ts`)
 * that every frame on this board would share, since each frame's tree is the
 * lab page's own: publishing the album's hues would light the shut doors too.
 * So the board samples once (`AlbumHuesProvider`, the sampler the album's own
 * lamp uses) and hands the hues to the doorways that may wear them.
 */

/* ── the light: the album's own, or the house five ──────────────────────── */

export type Hues = readonly number[];

/** The house five, the light of every door nothing may be sampled for. */
export const HOUSE: Hues = HOUSE_HUES;

const AlbumHuesCtx = createContext<Hues>(HOUSE);

/**
 * THE ALBUM'S HUES, SAMPLED OFF ITS NEWEST THREE PHOTOGRAPHS: the URL form of
 * the sampler, kept as hues so the register stays the stylesheet's, exactly as
 * `album-light.tsx` hands them to the door. The house five until the sample
 * lands, as production's lamp does.
 */
export function AlbumHuesProvider({ children }: { children: ReactNode }) {
  const colors = useSampledPalette(NEWEST, "dark");
  const hues = useMemo(() => {
    const list = (colors ?? [])
      .map(hueOfOklch)
      .filter((h): h is number => h !== null);
    return list.length >= 3 ? list : HOUSE;
  }, [colors]);
  return <AlbumHuesCtx.Provider value={hues}>{children}</AlbumHuesCtx.Provider>;
}

/** The album's light, where the door may wear it (a Public album's welcome, the moment she is let in). */
export const useAlbumHues = (): Hues => useContext(AlbumHuesCtx);

/** The hues a lit piece names in its `data-door-hues`, as the real lamp writes them. */
export const huesAttr = (hues: Hues) =>
  hues.slice(0, 3).map(Math.round).join(",");

/** The three custom properties every lit rule reads (`--lit-h1..3`). */
export const litVars = (hues: Hues) =>
  ({
    "--lit-h1": hues[0],
    "--lit-h2": hues[1],
    "--lit-h3": hues[2],
  }) as CSSProperties;

/* ── the page's own furniture ───────────────────────────────────────────── */

/**
 * THE HEADER, QUOTED (`guest-header.tsx`): the wordmark, then who this device
 * is. A stranger meets "Start for free"; a signed-in guest her own face (the
 * account menu's trigger).
 */
export function GuestTop({
  who,
}: {
  who: "stranger" | { name: string; seed: string };
}) {
  return (
    <header className="relative z-40 flex items-center justify-between gap-2 border-b border-border/60 bg-background px-5 py-3">
      <span className="flex items-center gap-2.5">
        <Logo />
      </span>
      <div className="flex h-8 items-center">
        {who === "stranger" ? (
          <Button variant="ghost" size="sm" tabIndex={-1}>
            Start for free
          </Button>
        ) : (
          <Avatar seed={who.seed}>
            <AvatarFallback>{who.name.slice(0, 1)}</AvatarFallback>
          </Avatar>
        )}
      </div>
    </header>
  );
}

/**
 * THE GUEST PAGE: the header over the page's flex column, as
 * `e/[token]/page.tsx` stands it (`data-guest-page`, the page held to one
 * screen while the door stands over the album).
 */
export function GuestPage({
  who,
  children,
}: {
  who: "stranger" | { name: string; seed: string };
  children: ReactNode;
}) {
  return (
    <div
      data-guest-page=""
      className="flex h-svh flex-col overflow-hidden bg-background text-foreground"
    >
      <GuestTop who={who} />
      {children}
    </div>
  );
}

/* ── the album she walks into ───────────────────────────────────────────── */

/** `event-experience.tsx`'s reading column and the album's bleed. */
const COLUMN = "w-full max-w-2xl px-5";
const BLEED = "px-3 sm:px-5";

/**
 * The album's rows at each screen, newest first, as the justified layout lays
 * them (each row one height, each photograph its own ratio): two to a row at a
 * phone, four and five at a laptop, past the first screen, since the album
 * goes on below it (214 photographs, the board's nine stills round again).
 */
const PER_ROW: Record<ScreenId, readonly number[]> = {
  "375": [2, 2, 2, 3, 2, 2, 3, 2],
  "1440": [4, 5, 4, 5, 4, 5, 4, 5],
};

function rowsAt(screen: ScreenId): readonly (readonly Still[])[] {
  let at = 0;
  return PER_ROW[screen].map((n) =>
    Array.from({ length: n }, () => ALBUM[at++ % ALBUM.length]),
  );
}

const ROWS: Record<ScreenId, readonly (readonly Still[])[]> = {
  "375": rowsAt("375"),
  "1440": rowsAt("1440"),
};

/**
 * A PUBLIC ALBUM'S FIRST SCREEN, QUOTED (`event-experience.tsx` past the
 * door): the reading column pinned left on the logo's 20px line, holding the
 * name, the byline, the count and the action block, then the album's own
 * count and its photographs in justified rows across the page's bleed. No
 * reel tile: it waits until the door is behind her (`welcomePending`), which
 * the walk through never is.
 *
 * Its head and its photographs carry the reveal curtain's marks
 * (`data-ld-reveal`, `data-ld-tile` with their place in the stagger), which
 * the scene holds back until the door lets her through (`locked-door.css`).
 */
export function AlbumPage({
  screen,
  className,
}: {
  screen: ScreenId;
  className?: string;
}) {
  return (
    <div
      data-ld-album=""
      className={cn("relative w-full flex-1 bg-background pt-8", className)}
    >
      <div className={COLUMN}>
        <header>
          <h1 className="font-heading text-page text-balance">{EVENT.name}</h1>
          <p
            data-ld-reveal=""
            style={{ "--ld-i": 0 } as CSSProperties}
            className="mt-2.5 flex items-center gap-2 text-xs text-muted-foreground"
          >
            <span className="flex items-center gap-1.5">
              <span className="text-faint">Hosted by</span>
              <Avatar seed={HOST.seed} size="sm">
                <AvatarFallback>{HOST.name.slice(0, 1)}</AvatarFallback>
              </Avatar>
              <span className="font-medium text-foreground">{HOST.name}</span>
            </span>
            <span aria-hidden className="text-faint">
              ·
            </span>
            <span>{formatEventDate(EVENT.date)}</span>
          </p>
          <p
            data-ld-reveal=""
            style={{ "--ld-i": 1 } as CSSProperties}
            className="mt-1 text-xs text-muted-foreground"
          >
            {formatMediaCount(EVENT.count)} from {EVENT.guests} guests
          </p>
        </header>
        <div
          className="mt-4"
          data-ld-reveal=""
          style={{ "--ld-i": 2 } as CSSProperties}
        >
          <Button size="lg" className="w-full" tabIndex={-1}>
            <ImageUp /> Add photos
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="mt-2 h-9 w-full"
            tabIndex={-1}
          >
            <QrCode /> Invite
          </Button>
        </div>
      </div>
      <div className={cn("mt-7", BLEED)}>
        <p
          data-ld-reveal=""
          style={{ "--ld-i": 3 } as CSSProperties}
          className="mb-3 px-0.5 text-working text-muted-foreground tabular-nums"
        >
          {formatMediaCount(EVENT.count)}
        </p>
        <AlbumRows screen={screen} />
      </div>
    </div>
  );
}

/**
 * THE ALBUM'S PHOTOGRAPHS, newest first, in its justified rows: the album
 * page's own, and on their own the copy `through` stands behind the door
 * (`mini`, which nothing measures and the curtain never holds).
 */
export function AlbumRows({
  screen,
  mini = false,
}: {
  screen: ScreenId;
  mini?: boolean;
}) {
  let n = 0;
  return (
    <div
      data-ld-rows=""
      data-ld-mini={mini ? "" : undefined}
      className="flex flex-col gap-[var(--gap-gallery)]"
    >
      {ROWS[screen].map((row, r) => (
        <div key={r} className="flex gap-[var(--gap-gallery)]">
          {row.map((p) => {
            const i = n++;
            return (
              // eslint-disable-next-line @next/next/no-img-element -- a bootstrap still standing in for the album's own photograph
              <img
                key={i}
                data-ld-tile={mini ? undefined : i}
                data-ld-shows="photo"
                src={p.src}
                alt=""
                draggable={false}
                className="min-w-0 rounded-tile object-cover"
                style={
                  {
                    flexGrow: p.width / p.height,
                    flexBasis: 0,
                    aspectRatio: `${p.width} / ${p.height}`,
                    // The stagger runs out where the first screen does.
                    "--ld-i": 4 + Math.min(i, 10),
                  } as CSSProperties
                }
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
