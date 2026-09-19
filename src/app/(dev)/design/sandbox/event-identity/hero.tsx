"use client";

import { QrCode } from "lucide-react";
import type { ReactNode } from "react";

import { EventHeroMedia } from "@/components/marketing/sections/events/event-hero-media";
import { SectionLight } from "@/components/marketing/system/section-light";
import { AlbumStream } from "@/components/shared/album-stream/album-stream";
import { AlbumStreamPause } from "@/components/shared/album-stream/album-stream";
import { PhotoSection } from "@/components/shared/backdrop/photo-section";
import { cn } from "@/lib/utils";

import { ROOM_BY_TYPE, type TypeFixture } from "./fixtures";
import {
  AlbumObject,
  BadgeStack,
  BadgeWall,
  Lockup,
  Pic,
  SecondType,
} from "./pieces";

/**
 * DECISION 1: THE HERO'S THEME.
 *
 * Will (2026-09-19, verbatim): each hero "should continue to be media and
 * motion forward, but feel custom and themed for its own page. I don't want to
 * set many rules here because each page has its own needs" and, in the same
 * breath, the heroes "should share similar design patterns (H1 size, H1 and
 * subhead spacing, button groups etc)". So the question is not WHETHER a hero
 * is custom, it is WHERE the custom lives once the lockup is fixed. Three
 * answers, plus today measured:
 *
 *  - `room`    the ROOM is the theme: the words stand inside a photograph of
 *              that kind of event, and it changes as you move.
 *  - `arrival` the MOTION is the theme: the photographs arrive, and each type
 *              has its own thing for them to land in.
 *  - `object`  the OBJECT is the theme: one bespoke, lit still life per type,
 *              drawn properly rather than thrown up.
 *  - `today`   the shipped compositions, measured.
 *
 * ★ EVERY OPTION IS DRAWN ON TWO TYPES, and that is the whole test. Weddings
 * has six honest stills in the manifest; conferences has none, and the shipped
 * ruling is that a photograph never promises the wrong event. A theme that only
 * works where photographs exist is not a theme, it is a wedding page.
 */
export type HeroShape = "room" | "arrival" | "object" | "today";

/* ── today ───────────────────────────────────────────────────────────────── */

function TodayHero({ type }: { type: TypeFixture }) {
  return (
    <Lockup type={type}>
      <EventHeroMedia slug={type.slug} />
    </Lockup>
  );
}

/* ── the room ────────────────────────────────────────────────────────────── */

/**
 * The words stand inside the room. `PhotoSection` is the ruled engine for this
 * (Will, 2026-09-18: a full image section can "open a chapter"), and its plate
 * already owns the one thing a hero over a photograph needs: measured
 * legibility, with body copy promoted out of the muted tier.
 *
 * ★ A TYPE WITH NO ROOM GETS THE PRODUCT AS ITS ROOM. There is no honest
 * conference photograph in the manifest and this lane will not fake one, so the
 * badges every attendee wears become the wall the words stand against. That is
 * the concept's hardest case drawn rather than hidden.
 */
function RoomHero({ type }: { type: TypeFixture }) {
  const frames = ROOM_BY_TYPE[type.slug] ?? [];

  if (frames.length === 0)
    return (
      <SectionLight placement="room" from={{ x: "50%", y: "28%" }} reach="130%">
        <section className="relative isolate overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-25"
          >
            <BadgeWall rows={5} columns={9} className="scale-110" />
          </div>
          <div className="bkd relative">
            <div className="bkd-content">
              <div className="bkd-plate">
                <Lockup type={type} className="pb-14" />
              </div>
            </div>
          </div>
        </section>
      </SectionLight>
    );

  return (
    <PhotoSection
      frames={frames}
      // FORCED for the board only: production lets the media query pick. A
      // still capture has no cursor, and the pointer rule's rail would draw a
      // reader's position that nobody is standing in.
      source="scroll"
      className="min-h-[660px]"
    >
      <Lockup type={type} className="pb-14" />
    </PhotoSection>
  );
}

/* ── the arrival ─────────────────────────────────────────────────────────── */

/**
 * The photographs arrive, and the type's own object takes them in. This is the
 * album page's ruled motion (`album-wiring`, 2026-09-19) asked to carry four
 * pages instead of one: the stream rides `PageHero`'s backdrop, which paints
 * UNDER the container, so a frame whose path ends inside the object below
 * slides behind it and is gone.
 *
 * ★ WHAT IS SHARED AND WHAT IS THE TYPE'S, said plainly because the cost is
 * real: the FALL is one engine with one photograph set, so under this theme all
 * four pages rain the same frames. Only the object they land in is the type's.
 * Theming the fall itself per type is new work the engine does not take today,
 * and this option is the honest drawing of that.
 *
 * ★ AND THE LAB HAS TO HAND THE STREAM ITS OWN PAUSE. `useAmbientPause` walks
 * DOM ancestors that never reach the step's `data-paused` from inside a
 * portalled frame, so the provider says "never paused" and the fall runs where
 * a reviewer can see it.
 */
function ArrivalHero({ type }: { type: TypeFixture }) {
  return (
    <AlbumStreamPause.Provider value={() => false}>
      <Lockup
        type={type}
        backdrop={<AlbumStream />}
        className="pb-[110px] lg:pb-[150px]"
      >
        <div className="mt-10">
          {type.stills.length > 0 ? (
            <div className="mx-auto w-full max-w-3xl">
              <AlbumObject tiles={type.stills.slice(0, 4)} />
            </div>
          ) : (
            <div className="flex justify-center">
              <BadgeStack />
            </div>
          )}
        </div>
      </Lockup>
    </AlbumStreamPause.Provider>
  );
}

/* ── the object ──────────────────────────────────────────────────────────── */

/** The wedding's object, drawn as an object: the album open across the page,
 *  both leaves filled, the table card that opened it standing in front, and one
 *  pool of light under the whole thing. */
function WeddingSpread() {
  const leaves: [string[], string[]] = [
    ["wedding-golden", "wedding-arch", "reception-hall"],
    ["wedding-toast", "reception-table", "wedding-rings"],
  ];
  return (
    <div className="relative mx-auto w-full max-w-5xl">
      <div className="relative grid grid-cols-1 gap-6 rounded-2xl border bg-card p-4 shadow-lift ring-1 ring-foreground/5 sm:grid-cols-2 sm:gap-10 sm:p-6">
        {/* The spine. Without it the two leaves read as one six-up grid, which
            is the thumbnail the concept exists to replace. */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-6 left-1/2 hidden w-px -translate-x-1/2 bg-foreground/10 sm:block"
        />
        {/* A21, the shipped pages' own rule: every composition has a phone
            variant that shows FEWER, LARGER pieces. Below `sm` the second leaf
            and the third frame go, so the album is an album and not six
            stamps. */}
        {leaves.map((leaf, i) => (
          <div
            key={i}
            className={cn(
              "grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3",
              i === 1 && "hidden sm:grid",
            )}
          >
            {leaf.map((id, k) => (
              <Pic
                key={id}
                id={id}
                className={cn(
                  "aspect-4/5 rounded-lg",
                  k === 2 && "hidden sm:block",
                )}
                sizes="(min-width: 640px) 200px, 45vw"
              />
            ))}
          </div>
        ))}
      </div>
      {/* The card that opened it, standing on the table in front of the spread. */}
      <div className="-mt-10 flex justify-center sm:-mt-12">
        <div className="flex w-[186px] -rotate-[4deg] flex-col items-center gap-2.5 rounded-xl border bg-card p-4 shadow-lift ring-1 ring-foreground/5">
          <span className="flex size-[72px] items-center justify-center rounded-md bg-foreground/90 text-background">
            <QrCode className="size-12" strokeWidth={1.25} />
          </span>
          <span className="text-center text-xs font-medium text-muted-foreground">
            Scan to add photos
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * ONE OBJECT PER TYPE, LIT. The lockup does not move; everything custom is the
 * still life beneath it and the single pool of light it stands in. It answers
 * Will's note on the shipped frames directly ("incredibly V1, and were never
 * considered individually, just all thrown up at once... let's make these feel
 * bespoke"), and it is the only theme that costs no new photography and no
 * engine on a type with no pictures.
 */
function ObjectHero({ type }: { type: TypeFixture }) {
  return (
    <SectionLight placement="room" from={{ x: "50%", y: "76%" }} reach="110%">
      <Lockup type={type} className="pb-20">
        <div className="mt-12">
          {type.stills.length > 0 ? <WeddingSpread /> : <BadgeStack />}
        </div>
      </Lockup>
    </SectionLight>
  );
}

/* ── the switch ──────────────────────────────────────────────────────────── */

/** One type's hero under one theme. Exported so the decisions staged behind
 *  this one (the second section, the phone, the hub) draw the hero the board is
 *  actually carrying rather than a second, independent guess at it. */
export function Hero({
  shape,
  type,
}: {
  shape: HeroShape;
  type: TypeFixture;
}): ReactNode {
  if (shape === "room") return <RoomHero type={type} />;
  if (shape === "arrival") return <ArrivalHero type={type} />;
  if (shape === "object") return <ObjectHero type={type} />;
  return <TodayHero type={type} />;
}

/**
 * A theme's MEDIA on its own, with no lockup and no backdrop: what THE PHONE
 * moves around the words. Exported so that decision draws the theme the board
 * is carrying rather than inventing a second picture of it.
 */
export function HeroMedia({
  shape,
  type,
  fill = false,
  className,
}: {
  shape: HeroShape;
  type: TypeFixture;
  /** Make the media a GROUND that fills its box, rather than an object in the
   *  flow. THE PHONE's `media` option needs every theme to be able to do this,
   *  including the three whose media is an object rather than a photograph. */
  fill?: boolean;
  className?: string;
}): ReactNode {
  const room = ROOM_BY_TYPE[type.slug] ?? [];
  if (shape === "room")
    return (
      <div className={cn("relative overflow-hidden", className)}>
        {room.length > 0 ? (
          <Pic
            id={room[0]}
            className="absolute inset-0"
            sizes="100vw"
            priority
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center opacity-30">
            <BadgeWall rows={3} columns={4} />
          </div>
        )}
      </div>
    );

  const object =
    shape === "today" ? (
      <EventHeroMedia slug={type.slug} />
    ) : type.stills.length > 0 ? (
      shape === "arrival" ? (
        <AlbumObject tiles={type.stills.slice(0, 4)} columns={2} />
      ) : (
        <WeddingSpread />
      )
    ) : (
      <BadgeStack />
    );

  if (!fill) return <div className={cn("px-4", className)}>{object}</div>;

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <div className="absolute inset-0 flex items-center justify-center px-4">
        <div className="w-full scale-[1.15]">{object}</div>
      </div>
    </div>
  );
}

/** The decision's own preview: the worked type, then the same theme on the type
 *  with no photographs. The phone draws weddings alone (the second type would
 *  put 1,800 px of scroll between a reviewer and a comparison). */
export function HeroPreview({
  shape,
  width,
  worked,
  second,
}: {
  shape: HeroShape;
  width: 1440 | 375;
  worked: TypeFixture;
  second: TypeFixture;
}) {
  if (width === 375) return <Hero shape={shape} type={worked} />;
  return (
    <>
      <Hero shape={shape} type={worked} />
      <SecondType label={second.navLabel} />
      <Hero shape={shape} type={second} />
    </>
  );
}
