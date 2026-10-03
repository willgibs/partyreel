"use client";

import type { CSSProperties, ReactNode } from "react";
import { Pause, Play, SkipForward, Volume2 } from "lucide-react";

import { formatCount } from "@/lib/format/count";
import { GLASS } from "@/lib/glass";
import { cn } from "@/lib/utils";

import { AlbumHead, GuestPage, HerTile, type RowItem, Rows } from "./album";
import {
  albumStills,
  DEVELOP,
  EVENT,
  HELD_HERS,
  MORNING,
  MORNING_HERS,
  NIGHT_HELD,
  NIGHT_MORNING,
  type NightShot,
  PARTY_STILLS,
  TRICKLE,
} from "./fixtures";
import { MODEL_WORDS, type ModelId } from "./model";
import { GuestsFoot, Wait, type WaitFacts, type WaitId } from "./wait";

/**
 * EVERYONE'S PHOTOS ARRIVING, three ways, in the model and the wait picked:
 *  - the TRICKLE, 11:20 pm on the held album: Maya lets 24 in from her phone,
 *    two of Priya's among them; 17 still wait, one of them hers;
 *  - the DEVELOP, 9 am on the developing album: the roll (214 photos from 14
 *    guests, nine of hers) opens to everyone at once, and the reel premieres
 *    it (settled on disposable-mode).
 *
 * `place` moves an arrival out of the wait into the album's rows with the
 * album's own glow; `develops` turns the wait itself into the album; and
 * `premiere` brings an arrival as a reel first.
 */

export type ArrivalId = "place" | "develops" | "premiere";
export type ArrivalBeat = "trickle" | "develop";

/* ── the trickle's facts ───────────────────────────────────────────────── */

const HER_STILL_WAITING = HELD_HERS.filter(
  (s) => !TRICKLE.hersIn.includes(s.id),
);

/**
 * The held night at 11:20 pm: three more landed since 10:40, and the 24 Maya
 * let in are its oldest (her own two among them), marked `in`.
 */
const NIGHT_1120: readonly (NightShot & { in: boolean })[] = (() => {
  const more: NightShot[] = [228, 236, 251].map((minute, i) => ({
    n: NIGHT_HELD.length + i + 1,
    minute,
    mine: false,
  }));
  const all = [...NIGHT_HELD, ...more];
  const hersIn = new Set(
    NIGHT_HELD.filter((s) => s.mine)
      .slice(0, TRICKLE.hersIn.length)
      .map((s) => s.n),
  );
  let others = TRICKLE.letIn - hersIn.size;
  return all.map((s) => {
    const isIn = s.mine ? hersIn.has(s.n) : others-- > 0;
    return { ...s, in: isIn };
  });
})();

const TRICKLE_FACTS: WaitFacts = {
  kind: "held",
  count: TRICKLE.waiting,
  guests: 6,
  hers: HER_STILL_WAITING,
  night: NIGHT_1120.filter((s) => !s.in),
};

/** The 24 let in, newest first, as the album's rows draw them. */
function letInRows(n: number, glow: number, offset = 0): RowItem[] {
  return albumStills(n, offset).map((s, i) => ({
    kind: "photo",
    still: s,
    key: `${s.id}-${i}`,
    arrived: i < glow,
  }));
}

/** The line an arrival says at the album's head, in the model's own words. */
function News({ children }: { children: ReactNode }) {
  return (
    <p
      className="mb-3 flex items-center gap-2 px-0.5 text-sm font-medium"
      data-tw-news=""
    >
      <span
        aria-hidden
        className="size-2 rounded-full bg-foreground shadow-[0_0_10px_var(--foreground)]"
      />
      {children}
    </p>
  );
}

/* ── the sheet, developed in place ─────────────────────────────────────── */

/**
 * THE CONTACT SHEET AS THE ALBUM: every square in the night's order, the ones
 * that have arrived developed into their photographs (in the order the night
 * took them), the rest still dark, hers lit. At the develop it fills from the
 * first square to the last.
 */
function DevelopedSheet({
  night,
  developed,
  wide,
  head,
  hers,
}: {
  night: readonly NightShot[];
  /** Which squares have developed, by their place in the night. */
  developed: (s: NightShot, i: number) => boolean;
  wide: boolean;
  head: ReactNode;
  /** Her photographs for her own squares, oldest first. */
  hers: readonly { still: { src: string } }[];
}) {
  const cols = wide ? 30 : 12;
  let k = 0;
  return (
    <div
      className={cn("tw-well", wide ? "p-8" : "p-4")}
      data-tw-wait="sheet, developing in place"
    >
      {head}
      <div
        className="tw-sheet mt-4"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {night.map((s, i) => {
          const mine = s.mine ? hers[k++] : undefined;
          const lit = developed(s, i);
          if (mine)
            return (
              <span key={s.n} className="tw-cell" data-mine="">
                {/* eslint-disable-next-line @next/next/no-img-element -- her own photograph */}
                <img src={mine.still.src} alt="" />
              </span>
            );
          if (lit)
            return (
              <span
                key={s.n}
                className="tw-cell tw-develop-cell"
                data-developed=""
                style={{ "--tw-delay": `${i * 18}ms` } as CSSProperties}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- a party still, developed */}
                <img src={PARTY_STILLS[i % PARTY_STILLS.length]!.src} alt="" />
              </span>
            );
          return <span key={s.n} className="tw-cell" />;
        })}
      </div>
    </div>
  );
}

/* ── the reel's premiere, full screen ──────────────────────────────────── */

/**
 * THE REEL'S VIEW, PREMIERING THE ROLL (the live reel's view, quoted: black,
 * the photograph filling the screen, the arrival's name top left, its dock at
 * the foot), opened before the album on the morning's first visit.
 */
function Premiere({ wide, what }: { wide: boolean; what: string }) {
  // The roll's most-loved moment, bright: the reel's first frame.
  const s =
    PARTY_STILLS.find((p) => p.id === "wedding-petals") ?? PARTY_STILLS[0]!;
  return (
    <div
      className="relative flex min-h-screen flex-col bg-black text-white"
      data-tw-premiere=""
      data-tw-arrival="the premiere, full screen"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- the roll's photograph, the reel's frame */}
      <img
        src={s.src}
        alt=""
        className="absolute inset-0 size-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-black/60" />
      <div className={cn("relative px-5 pt-6", wide && "px-10 pt-10")}>
        <p className="text-label font-medium tracking-[0.14em] text-white/75 uppercase">
          {what}
        </p>
        <p
          className="mt-1 font-heading text-title text-balance"
          data-tw-news=""
        >
          {EVENT.name}
        </p>
        <p className="mt-1 text-sm text-white/80 tabular-nums">
          {`${MORNING.shots} photos from ${MORNING.guests} guests`}
        </p>
      </div>
      <div className="relative mt-auto flex items-center justify-center gap-3 pb-8">
        <span className={cn(GLASS, "flex items-center gap-1 rounded-full p-1")}>
          <span className="flex size-10 items-center justify-center">
            <Pause className="size-5 fill-current" aria-hidden />
          </span>
          <span className="flex size-10 items-center justify-center">
            <Volume2 className="size-5" aria-hidden />
          </span>
        </span>
        <span
          className={cn(
            GLASS,
            "flex h-12 items-center gap-2 rounded-full px-5 text-sm font-medium",
          )}
        >
          The album <SkipForward className="size-4" aria-hidden />
        </span>
      </div>
    </div>
  );
}

/* ── the frame ─────────────────────────────────────────────────────────── */

export function ArrivalFrame({
  model,
  wait,
  arrival,
  beat,
  wide,
}: {
  model: ModelId;
  wait: WaitId;
  arrival: ArrivalId;
  beat: ArrivalBeat;
  wide: boolean;
}) {
  if (beat === "develop")
    return <Develop model={model} wait={wait} arrival={arrival} wide={wide} />;
  return <Trickle model={model} wait={wait} arrival={arrival} wide={wide} />;
}

/** 11:20 pm on the held album: Maya lets 24 in. */
function Trickle({
  model,
  wait,
  arrival,
  wide,
}: {
  model: ModelId;
  wait: WaitId;
  arrival: ArrivalId;
  wide: boolean;
}) {
  const m = MODEL_WORDS[model];
  const perRow = wide ? 6 : 2;
  const said = m.trickle(TRICKLE.letIn);
  const ground = { kind: "stills" as const, stills: albumStills(6) };

  // Approval apart: the held album is the live album, so the 24 simply arrive, hers still waiting in place.
  if (m.held === null) {
    const items: RowItem[] = [
      ...HER_STILL_WAITING.map(
        (s): RowItem => ({
          kind: "node",
          key: s.id,
          ratio: s.still.w / s.still.h,
          node: <HerTile shot={s} mark={m.inline} />,
        }),
      ),
      ...letInRows(TRICKLE.letIn, 6),
    ];
    return (
      <GuestPage
        wide={wide}
        ground={ground}
        mediaCount={TRICKLE.letIn}
        waitingHers={1}
        reel
      >
        <div data-tw-arrival="the trickle, into the live album">
          <News>{`${said} · just now`}</News>
          <AlbumHead count={TRICKLE.letIn} />
          <Rows items={items} perRow={perRow} />
        </div>
      </GuestPage>
    );
  }

  const words = m.held;

  if (arrival === "develops" && wait === "sheet") {
    const hersOldest = [...HELD_HERS].reverse();
    return (
      <GuestPage
        wide={wide}
        ground={ground}
        mediaCount={TRICKLE.letIn}
        waitingHers={1}
        eyebrow={m.chip?.held}
        reel
      >
        <div data-tw-arrival="the trickle, developed in the sheet">
          <News>{`${said} · just now`}</News>
          <DevelopedSheet
            night={NIGHT_1120}
            developed={(s) => NIGHT_1120.find((x) => x.n === s.n)?.in ?? false}
            hers={hersOldest}
            wide={wide}
            head={
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p
                    className="font-heading text-[44px] leading-none tabular-nums"
                    data-tw-count={TRICKLE.waiting}
                  >
                    {formatCount(TRICKLE.waiting)}
                  </p>
                  <p className="tw-muted mt-2 text-sm">{words.title}</p>
                </div>
                <span className="tw-muted text-right text-xs">
                  {words.clock}
                </span>
              </div>
            }
          />
        </div>
        <GuestsFoot guests={6} />
      </GuestPage>
    );
  }

  const glow = arrival === "premiere" ? 0 : 6;
  return (
    <GuestPage
      wide={wide}
      ground={ground}
      mediaCount={TRICKLE.letIn}
      waitingHers={1}
      eyebrow={m.chip?.held}
      reel
    >
      <div
        data-tw-arrival={
          arrival === "premiere"
            ? "the trickle, as a reel to watch"
            : arrival === "develops"
              ? "the trickle, developing out of the wait"
              : "the trickle, into place"
        }
      >
        {arrival === "premiere" ? (
          <div className="mb-3 flex items-center justify-between gap-3 rounded-xl bg-muted/60 px-3 py-2">
            <span className="text-sm font-medium" data-tw-news="">
              {`${said} · just now`}
            </span>
            <span className="flex h-8 items-center gap-1.5 rounded-full bg-foreground px-3 text-sm font-medium text-background">
              <Play className="size-3.5 fill-current" aria-hidden />
              {`Watch ${TRICKLE.letIn}`}
            </span>
          </div>
        ) : (
          <News>{`${said} · just now`}</News>
        )}
        <Wait id={wait} facts={TRICKLE_FACTS} words={words} wide={wide} />
        <div className="mt-5">
          <AlbumHead count={TRICKLE.letIn} />
          <Rows
            items={letInRows(TRICKLE.letIn, glow).map((r, i) =>
              arrival === "develops" && i < 6 && r.kind === "photo"
                ? {
                    kind: "node",
                    key: r.key,
                    ratio: r.still.w / r.still.h,
                    node: (
                      <span
                        className="tw-hers tw-develop-cell block size-full"
                        data-developed=""
                        style={
                          { "--tw-delay": `${i * 120}ms` } as CSSProperties
                        }
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element -- a party still, developing */}
                        <img src={r.still.src} alt="" />
                      </span>
                    ),
                  }
                : r,
            )}
            perRow={perRow}
          />
        </div>
      </div>
      <GuestsFoot guests={6} />
    </GuestPage>
  );
}

/** 9 am on the developing album: the roll develops. */
function Develop({
  model,
  wait,
  arrival,
  wide,
}: {
  model: ModelId;
  wait: WaitId;
  arrival: ArrivalId;
  wide: boolean;
}) {
  const m = MODEL_WORDS[model];
  const perRow = wide ? 6 : 2;
  const ground = { kind: "stills" as const, stills: albumStills(6, 3) };
  const chip = m.chip ? `${m.chip.developing} · developed` : undefined;
  // ★ THE ROLL IS THE ALBUM'S CAMERA (fixtures.ts), and the develop does not change how the album takes photos: at 9 am
  // its cover's Add and its shutter still say Take photos with the camera's glyph (production's `cameraAlbum`), so every
  // page below is a camera's.

  if (arrival === "premiere")
    return <Premiere wide={wide} what={chip ?? `Developed at ${DEVELOP.at}`} />;

  if (arrival === "develops") {
    const hersOldest = [...MORNING_HERS].reverse();
    if (wait === "sheet") {
      // The develop mid-way: the first three fifths of the night have developed, in order.
      const upTo = Math.round(NIGHT_MORNING.length * 0.6);
      return (
        <GuestPage
          wide={wide}
          ground={ground}
          mediaCount={MORNING.shots}
          camera
          eyebrow={chip}
          reel="premiere"
        >
          <div data-tw-arrival="the roll, developing in the sheet">
            <DevelopedSheet
              night={NIGHT_MORNING}
              developed={(_, i) => i < upTo}
              hers={hersOldest}
              wide={wide}
              head={
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="font-heading text-[44px] leading-none tabular-nums">
                      {formatCount(MORNING.shots)}
                    </p>
                    <p className="tw-muted mt-2 text-sm" data-tw-news="">
                      {`Developing · ${formatCount(upTo)} of ${formatCount(MORNING.shots)}`}
                    </p>
                  </div>
                  <span className="tw-muted text-xs">{DEVELOP.at}</span>
                </div>
              }
            />
          </div>
        </GuestPage>
      );
    }
    // Every other wait develops out into the album's rows, the newest first, the reel playing in the cover.
    const items: RowItem[] = albumStills(wide ? 24 : 10, 3).map((s, i) => ({
      kind: "node",
      key: `${s.id}-${i}`,
      ratio: s.w / s.h,
      node: (
        <span
          className="tw-hers tw-develop-cell block size-full"
          data-developed=""
          style={{ "--tw-delay": `${i * 90}ms` } as CSSProperties}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- a party still, developing */}
          <img src={s.src} alt="" />
        </span>
      ),
    }));
    return (
      <GuestPage
        wide={wide}
        ground={ground}
        mediaCount={MORNING.shots}
        camera
        eyebrow={chip}
        reel="premiere"
      >
        <div data-tw-arrival="the roll, developing out of the wait">
          <News>{`Developing · ${formatCount(MORNING.shots)} photos from ${MORNING.guests} guests`}</News>
          <Rows items={items} perRow={perRow} />
        </div>
      </GuestPage>
    );
  }

  // Into place: at 9 am the album is simply there, newest first, the premiere on its round.
  return (
    <GuestPage
      wide={wide}
      ground={ground}
      mediaCount={MORNING.shots}
      camera
      eyebrow={chip}
      reel="premiere"
    >
      <div data-tw-arrival="the roll, in place">
        <News>{`Developed at ${DEVELOP.at} · ${formatCount(MORNING.shots)} photos`}</News>
        <AlbumHead count={MORNING.shots} />
        <Rows items={letInRows(wide ? 24 : 10, 8, 3)} perRow={perRow} />
      </div>
    </GuestPage>
  );
}
