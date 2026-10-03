"use client";

import type { CSSProperties, ReactNode } from "react";
import { Clock, Trash2, X } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatCount } from "@/lib/format/count";
import { cn } from "@/lib/utils";

import { HerTile, type RowItem, Rows } from "./album";
import {
  binsOf,
  DEV,
  DEV_HERS,
  DEVELOP,
  HELD,
  HELD_HERS,
  NIGHT_DEV,
  NIGHT_HELD,
  NOW,
  type NightShot,
  PRIYA,
  ROLL,
  type Shot,
} from "./fixtures";
import type { WaitWords } from "./model";

/**
 * HER WAIT, FOUR WAYS, under production's cover (or, for `cover`, in it).
 *
 * Every way draws the same facts and nothing more: her own waiting photos
 * (her pictures, presigned for her alone, each hers to take back), everyone's
 * as the sync carries them (a count, and the minutes they landed in, never a
 * picture or a name), and the clock (a develop time, or the host's approval).
 * Her photo, once it lands, stays where it landed: nothing a guest adds ever
 * vanishes back into an empty album.
 *
 * ★ NOTHING IS TILTED (his disposable-mode r2 note): squares, tiles, frames
 * and the stack all stand square to the page; depth is light and stacking
 * straight.
 */

export type WaitId = "sheet" | "stack" | "reel" | "cover";
export type AlbumKind = "held" | "developing";

/** One album's facts, as a wait reads them. */
export type WaitFacts = {
  kind: AlbumKind;
  /** Everyone's waiting, hers included (the sync's count). */
  count: number;
  guests: number;
  hers: readonly Shot[];
  night: readonly NightShot[];
};

export const FACTS: Record<AlbumKind, WaitFacts> = {
  held: {
    kind: "held",
    count: HELD.waiting,
    guests: HELD.guests,
    hers: HELD_HERS,
    night: NIGHT_HELD,
  },
  developing: {
    kind: "developing",
    count: DEV.waiting,
    guests: DEV.guests,
    hers: DEV_HERS,
    night: NIGHT_DEV,
  },
};

export type WaitProps = {
  facts: WaitFacts;
  words: WaitWords;
  wide: boolean;
  /** Her newest has just landed (the held frame's moment). */
  landing?: boolean;
  /** One of hers opened to take back (the third frame's moment). */
  loupe?: boolean;
  /** The well's light: the house's coral, or the darkroom's safelight where the preset is named for it. */
  light?: "safe";
};

/** The clock's line in full: the develop's countdown, or the host's. */
export const clockLine = (facts: WaitFacts, words: WaitWords) =>
  facts.kind === "developing"
    ? `${words.clock} · in ${DEVELOP.until}`
    : words.clock;

/* ── shared marks ──────────────────────────────────────────────────────── */

/** The one moving word: what just landed, as the sync's delta says it. */
function JustNow({ className }: { className?: string }) {
  return (
    <span
      data-tw-just=""
      className={cn(
        "tw-pill-new inline-flex h-6 items-center rounded-full bg-white/10 px-2.5 text-xs font-medium tabular-nums",
        className,
      )}
    >
      +1 just now
    </span>
  );
}

/** Everyone's count, the room's one number. */
function Count({ n, size = 44 }: { n: number; size?: number }) {
  return (
    <p
      data-tw-count={n}
      className="font-heading leading-none tabular-nums"
      style={{ fontSize: size }}
    >
      {formatCount(n)}
    </p>
  );
}

/**
 * ONE OF HERS, OPENED WHERE SHE IS, to take back: her photograph, its minute
 * and the wait's own word, who sees it until when, and Remove (her uploads'
 * own path, one press, no confirm, the frame given back on a roll). A card
 * over the wait at the frame's foot, the wait still in view above it.
 */
export function Loupe({
  shot,
  words,
  facts,
  wide,
}: {
  shot: Shot;
  words: WaitWords;
  facts: WaitFacts;
  wide: boolean;
}) {
  const until =
    facts.kind === "developing"
      ? `Only you see it until ${DEVELOP.at}`
      : "Only you see it until Maya lets it in";
  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 flex justify-center px-3 pb-6",
        wide && "inset-x-auto right-10 bottom-10 px-0 pb-0",
      )}
    >
      <div className="tw-loupe flex w-full max-w-sm gap-3 p-3" data-tw-loupe="">
        {/* eslint-disable-next-line @next/next/no-img-element -- her own photograph, a marketing still standing in */}
        <img
          src={shot.still.src}
          alt=""
          className="size-24 shrink-0 rounded-[10px] object-cover"
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium">
              {`${shot.time} · ${words.mine}`}
            </p>
            <X className="size-4 shrink-0 text-white/60" aria-hidden />
          </div>
          <p className="mt-0.5 text-xs text-pretty text-white/60">{until}</p>
          <div className="mt-auto flex gap-2 pt-2">
            <Button
              type="button"
              size="sm"
              variant="destructive"
              tabIndex={-1}
              data-tw-remove=""
            >
              <Trash2 /> Remove
            </Button>
            {facts.kind === "developing" && (
              <span className="self-center text-xs text-white/55 tabular-nums">
                {`Frees a shot · ${ROLL - facts.hers.length} left`}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Her newest first: the one a loupe opens is her latest. */
const loupeShot = (facts: WaitFacts) => facts.hers[0]!;

/* ── 1. the contact sheet ──────────────────────────────────────────────── */

/** How many of the newest squares still glow, warm with being just added: a few, more on a busy night. */
const warmOf = (count: number) =>
  Math.max(1, Math.min(8, Math.round(count * 0.06)));

/** Her shot for each of hers in the night's order (oldest first). */
function hersByN(facts: WaitFacts): Map<number, Shot> {
  const oldestFirst = [...facts.hers].reverse();
  const map = new Map<number, Shot>();
  let k = 0;
  for (const s of facts.night) if (s.mine) map.set(s.n, oldestFirst[k++]!);
  return map;
}

/**
 * THE CONTACT SHEET (his disposable-mode r3 pick, `waiting=sheet`), on the
 * album itself: a square a photo in the order the night took them, everyone's
 * dark in the well and filling live, the newest still warm, hers lit with her
 * own photographs; the count over it and the clock under it.
 */
export function SheetWait({
  facts,
  words,
  wide,
  landing,
  loupe,
  light,
}: WaitProps) {
  const mine = hersByN(facts);
  const last = facts.night[facts.night.length - 1]!;
  const cols = wide ? 30 : 12;
  const warm = warmOf(facts.count);
  return (
    <>
      <div
        data-tw-wait="sheet"
        data-light={light}
        className={cn(
          "tw-well",
          wide ? "flex items-stretch gap-10 p-8" : "p-4",
        )}
      >
        <div
          className={cn(
            "flex shrink-0 justify-between",
            wide ? "w-56 flex-col" : "items-end",
          )}
        >
          <div>
            <Count n={facts.count} size={wide ? 64 : 44} />
            <p className="tw-muted mt-2 text-sm" data-tw-title="">
              {words.title}
            </p>
          </div>
          {!wide && <JustNow />}
          {wide && (
            <div className="space-y-2 text-xs">
              <JustNow />
              {facts.hers.length > 0 && (
                <p className="tw-muted flex items-center gap-1.5">
                  <span className="tw-key" aria-hidden />
                  {`Yours · ${facts.hers.length}`}
                </p>
              )}
              <p className="tw-muted" data-tw-clock="">
                {clockLine(facts, words)}
              </p>
            </div>
          )}
        </div>
        <div className={cn(wide ? "min-w-0 flex-1 self-center" : "mt-4")}>
          <div
            className="tw-sheet"
            style={{
              gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
            }}
            data-tw-sheet={facts.night.length}
          >
            {facts.night.map((s, i) => {
              const hers = mine.get(s.n);
              // By place on the sheet, not by number: a sheet after a trickle starts past 1.
              const age = facts.night.length - 1 - i;
              const isNew = s.n === last.n && (landing || !last.mine);
              if (hers)
                return (
                  <span
                    key={s.n}
                    className="tw-cell"
                    data-mine=""
                    data-new={isNew ? "" : undefined}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- her own photograph, lit */}
                    <img src={hers.still.src} alt="" />
                  </span>
                );
              return (
                <span
                  key={s.n}
                  className="tw-cell"
                  data-new={isNew ? "" : undefined}
                  style={
                    age < warm
                      ? ({ "--warm": (warm - age) / warm } as CSSProperties)
                      : undefined
                  }
                />
              );
            })}
          </div>
          {!wide && (
            <div className="mt-3 flex items-center justify-between gap-3 text-xs">
              <span className="tw-muted flex items-center gap-1.5">
                {facts.hers.length > 0 && (
                  <>
                    <span className="tw-key" aria-hidden />
                    {`Yours · ${facts.hers.length}`}
                  </>
                )}
              </span>
              <span className="tw-muted text-right" data-tw-clock="">
                {clockLine(facts, words)}
              </span>
            </div>
          )}
        </div>
      </div>
      {loupe && (
        <Loupe
          shot={loupeShot(facts)}
          words={words}
          facts={facts}
          wide={wide}
        />
      )}
    </>
  );
}

/* ── 2. uploads stacking ───────────────────────────────────────────────── */

/** One edge line in the stack for every ten photos waiting, up to eight. */
const linesFor = (n: number) => Math.min(8, Math.max(1, Math.round(n / 10)));

/**
 * EVERYONE'S, AS ONE TILE THAT THICKENS: the album's own stack (the in-flight
 * stack tile's grammar: the face, two edges behind), dark, the count of
 * everyone else's on its face, an edge line for every ten, the clock at its
 * foot.
 */
function StackTile({ facts, words }: { facts: WaitFacts; words: WaitWords }) {
  const others = facts.count - facts.hers.length;
  return (
    <div className="tw-stack size-full" data-tw-stack={others}>
      <span aria-hidden className="tw-stack-edge" />
      <span aria-hidden className="tw-stack-edge" />
      <div className="tw-stack-face flex flex-col p-3">
        <JustNow className="self-start" />
        <div className="mt-auto">
          <Count n={others} size={36} />
          <p className="mt-1 text-xs" data-tw-title="">
            {words.title}
          </p>
          <p className="tw-muted text-xs" data-tw-clock="">
            {`from ${facts.guests} guests`}
          </p>
        </div>
        <span aria-hidden className="tw-stack-lines">
          {Array.from({ length: linesFor(others) }, (_, i) => (
            <span key={i} />
          ))}
        </span>
      </div>
    </div>
  );
}

/** An empty slot that keeps a short last row at its neighbours' height. */
const spacer = (key: string, ratio: number): RowItem => ({
  kind: "node",
  key,
  ratio,
  node: null,
});

/**
 * UPLOADS STACKING (his words for it): the album's own rows with her photos in
 * them, each marked as waiting, and one more tile that is everyone's: a stack
 * that thickens as uploads land.
 */
export function StackWait({ facts, words, wide, landing, loupe }: WaitProps) {
  const perRow = wide ? 6 : 2;
  const items: RowItem[] = [
    {
      kind: "node",
      key: "stack",
      ratio: 0.82,
      node: <StackTile facts={facts} words={words} />,
    },
    ...facts.hers.map(
      (s, i): RowItem => ({
        kind: "node",
        key: s.id,
        ratio: s.still.w / s.still.h,
        node: (
          <HerTile
            shot={s}
            mark={i === 0 ? words.mine : undefined}
            landing={landing && i === 0}
          />
        ),
      }),
    ),
  ];
  const short = items.length % perRow;
  if (short) {
    for (let k = 0; k < perRow - short; k++) items.push(spacer(`sp${k}`, 1));
  }
  return (
    <>
      <div data-tw-wait="stack">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-1.5">
          <p className="px-0.5 text-working text-muted-foreground tabular-nums">
            {facts.hers.length > 0
              ? `${formatCount(facts.count)} waiting · ${facts.hers.length} yours`
              : `${formatCount(facts.count)} waiting`}
          </p>
          <p
            className="flex items-center gap-1.5 text-sm text-muted-foreground"
            data-tw-clock=""
          >
            <Clock className="size-3.5" aria-hidden />
            {clockLine(facts, words)}
          </p>
        </div>
        <Rows items={items} perRow={perRow} />
      </div>
      {loupe && (
        <Loupe
          shot={loupeShot(facts)}
          words={words}
          facts={facts}
          wide={wide}
        />
      )}
    </>
  );
}

/* ── 3. the night's reel ───────────────────────────────────────────────── */

/**
 * THE NIGHT AS A REEL: a bar a five minutes for everyone's (its height how
 * many landed), hers riding it as lit frames at their minutes, now marked, and
 * the clock at its end: 9 am across the night's gap, or Maya's open end. Her
 * frames again under it, the camera reel's rounded frames.
 */
export function ReelWait({
  facts,
  words,
  wide,
  landing,
  loupe,
  light,
}: WaitProps) {
  const bins = binsOf(facts.night);
  const peak = Math.max(...bins.map((b) => b.n));
  // The night takes most of the width; the rest is the gap to the clock.
  const nightShare = facts.kind === "developing" ? 0.76 : 0.88;
  const x = (minute: number) =>
    `${((minute / NOW) * nightShare * 100).toFixed(2)}%`;
  const binW = wide ? 9 : 3.5;
  const hersOldest = [...facts.hers].reverse();
  return (
    <>
      <div
        data-tw-wait="reel"
        data-light={light}
        className={cn("tw-well", wide ? "p-8" : "p-4")}
      >
        <div className="flex items-end justify-between">
          <div>
            <Count n={facts.count} size={wide ? 64 : 44} />
            <p className="tw-muted mt-2 text-sm" data-tw-title="">
              {words.title}
            </p>
          </div>
          <JustNow />
        </div>
        <div
          className={cn("tw-reel", wide ? "mt-8 h-[150px]" : "mt-6")}
          data-tw-reel={bins.length}
        >
          {bins.map((b) => (
            <span
              key={b.minute}
              aria-hidden
              className="tw-reel-bar"
              data-new={b.minute + 5 > NOW ? "" : undefined}
              style={{
                left: `calc(${x(b.minute + 2.5)} - ${binW / 2}px)`,
                width: binW,
                height: 4 + (b.n / peak) * (wide ? 96 : 58),
              }}
            />
          ))}
          <span aria-hidden className="tw-reel-axis" />
          <span
            aria-hidden
            className="tw-reel-past"
            style={{ width: x(NOW) }}
          />
          {hersOldest.map((s, i) => (
            <span
              key={s.id}
              className="tw-reel-frame"
              data-tw-reel-hers=""
              style={{
                left: `calc(${x(s.minute)} - ${wide ? 17 : 11}px)`,
                bottom: 30 + (wide ? 104 : 64) + (i % 2) * 4,
                ...(wide ? { width: 34, height: 34, borderRadius: 9 } : {}),
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- her own photograph, lit */}
              <img src={s.still.src} alt="" />
            </span>
          ))}
          <span
            aria-hidden
            className="tw-reel-now"
            style={{ left: `calc(${x(NOW)} - 6px)` }}
          />
          {facts.kind === "developing" && (
            <span aria-hidden className="tw-reel-end" />
          )}
          <span className="tw-reel-label" style={{ left: 0 }}>
            7 pm
          </span>
          <span
            className="tw-reel-label"
            style={{ left: `calc(${x(NOW)} - 12px)` }}
          >
            now
          </span>
          <span className="tw-reel-label" style={{ right: 0 }}>
            {facts.kind === "developing" ? DEVELOP.at : "Maya"}
          </span>
        </div>
        <div className="mt-5 flex items-center justify-between gap-3 text-xs">
          <span className="tw-muted">
            {facts.hers.length > 0 ? `Yours · ${facts.hers.length}` : ""}
          </span>
          <span className="tw-muted text-right" data-tw-clock="">
            {clockLine(facts, words)}
          </span>
        </div>
        <div
          className={cn(
            "mt-2 grid gap-2",
            wide ? "grid-cols-12" : "grid-cols-6",
          )}
        >
          {facts.hers.map((s, i) => (
            <span
              key={s.id}
              className="tw-frame"
              data-tw-hers={s.id}
              data-landing={landing && i === 0 ? "" : undefined}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- her own photograph */}
              <img src={s.still.src} alt="" />
            </span>
          ))}
        </div>
      </div>
      {loupe && (
        <Loupe
          shot={loupeShot(facts)}
          words={words}
          facts={facts}
          wide={wide}
        />
      )}
    </>
  );
}

/* ── 4. the cover carries it ───────────────────────────────────────────── */

/**
 * THE COVER'S LINE: everyone's count and the clock, in the note's place on the
 * cover (the page's `line`), the house light under it, hers dissolving there
 * on her own phone.
 */
export function CoverLine({
  facts,
  words,
}: {
  facts: WaitFacts;
  words: WaitWords;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2 text-working text-white/85">
      <span className="font-medium text-white tabular-nums" data-tw-title="">
        {`${formatCount(facts.count)} ${words.title.toLowerCase()}`}
      </span>
      <span aria-hidden className="text-white/45">
        ·
      </span>
      <span data-tw-clock="">
        {facts.kind === "developing"
          ? `${DEVELOP.at}, in ${DEVELOP.until}`
          : words.clock}
      </span>
      <JustNow />
    </div>
  );
}

/**
 * THE COVER CARRIES IT: under the cover, the album is hers (her photos in its
 * rows, each marked), and a quiet line says where everyone's will land.
 */
export function CoverWait({ facts, words, wide, landing, loupe }: WaitProps) {
  const perRow = wide ? 6 : 2;
  const items: RowItem[] = facts.hers.map(
    (s, i): RowItem => ({
      kind: "node",
      key: s.id,
      ratio: s.still.w / s.still.h,
      node: (
        <HerTile
          shot={s}
          mark={i === 0 ? words.mine : undefined}
          landing={landing && i === 0}
        />
      ),
    }),
  );
  const short = items.length % perRow;
  if (short) {
    for (let k = 0; k < perRow - short; k++) items.push(spacer(`sp${k}`, 1));
  }
  const others = facts.count - facts.hers.length;
  return (
    <>
      <div data-tw-wait="cover">
        <div className="mb-3 flex items-center justify-between gap-1.5">
          <p className="px-0.5 text-working text-muted-foreground tabular-nums">
            {`Yours · ${facts.hers.length}`}
          </p>
        </div>
        <Rows items={items} perRow={perRow} />
        <p
          className="mt-4 px-0.5 text-sm text-pretty text-muted-foreground"
          data-tw-land=""
        >
          {facts.kind === "developing"
            ? `Everyone's ${formatCount(others)} land here at ${DEVELOP.at}.`
            : `Everyone's ${formatCount(others)} land here as Maya lets them in.`}
        </p>
      </div>
      {loupe && (
        <Loupe
          shot={loupeShot(facts)}
          words={words}
          facts={facts}
          wide={wide}
        />
      )}
    </>
  );
}

/* ── the page's foot, quoted, so a scrolled frame scrolls as production's ─ */

/** Production's Guests section after the album (`guest-list.tsx`): a row of faces. */
export function GuestsFoot({ guests }: { guests: number }) {
  const names = [
    "Theo",
    "Ana",
    "Sam",
    "Lena",
    "Jo",
    "Kai",
    "Ruth",
    "Ben",
    "Mo",
    "Ivy",
    "Raf",
    "Uma",
  ];
  return (
    <div className="mt-10 w-full max-w-2xl px-2">
      <p className="mb-3 font-heading text-base">Guests</p>
      <div className="flex flex-wrap items-center gap-1.5">
        {names.slice(0, guests).map((n) => (
          <span
            key={n}
            className="flex items-center gap-1.5 rounded-full border border-border py-0.5 pr-2.5 pl-0.5 text-sm"
          >
            <Avatar size="sm" seed={`tw-${n}`}>
              <AvatarFallback className="text-[10px]">
                {n.slice(0, 1)}
              </AvatarFallback>
            </Avatar>
            {n}
          </span>
        ))}
        <span className="flex items-center gap-1.5 rounded-full border border-border py-0.5 pr-2.5 pl-0.5 text-sm">
          <Avatar size="sm" seed={PRIYA.seed}>
            <AvatarFallback className="text-[10px]">P</AvatarFallback>
          </Avatar>
          {PRIYA.name}
        </span>
      </div>
    </div>
  );
}

/** The wait an option names, drawn. */
export function Wait({ id, ...props }: WaitProps & { id: WaitId }) {
  if (id === "stack") return <StackWait {...props} />;
  if (id === "reel") return <ReelWait {...props} />;
  if (id === "cover") return <CoverWait {...props} />;
  return <SheetWait {...props} />;
}

/** Whatever an option needs said beside a wait in its frame. */
export type WaitNode = ReactNode;
