"use client";

import { QrCode } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

import { BrowserFrame } from "@/components/marketing/frames";
import { AttendeeBadge } from "@/components/marketing/sections/events/event-artifacts";
import { DemoCtaLink } from "@/components/marketing/system/demo-cta-link";
import { PageHero } from "@/components/marketing/system/page-hero";
import { Button } from "@/components/ui/button";
import { marketingImage } from "@/lib/constants/marketing-media";
import { MARKETING_CTA } from "@/lib/constants/marketing-nav";
import { cn } from "@/lib/utils";

import type { TypeFixture } from "./fixtures";

/**
 * THE PARTS EVERY CONCEPT ON THIS BOARD IS BUILT FROM.
 *
 * ★ THE LOCKUP IS THE SAME IN ALL FOUR THEMES, AND THAT IS THE DECISION. Will
 * (2026-09-19): "our heroes and headers should share similar design patterns
 * (H1 size, H1 and subhead spacing, button groups etc) to maintain some
 * consistency, but simply using these with custom copy per instance will not
 * cut it for production-quality." So every theme below wears the REAL
 * `PageHero` at the same `title` step, the same `gap-6`, the same button pair,
 * and varies only what is BEHIND and BELOW it. A reviewer comparing two themes
 * is comparing the identity, never a moved heading.
 *
 * ★ AND THE THEME IS NEVER A COLOUR. Bible 1: the interface stays achromatic
 * and the media is the colour. Nothing here tints a page per event type; what
 * changes is the photograph, the object and the motion.
 */

/* ── The shared lockup ───────────────────────────────────────────────────── */

/** The one hero grammar: eyebrow, h1 at `title`, subhead, the button pair, the
 *  demo line. Identical in every theme; `backdrop` and `children` are the theme. */
export function Lockup({
  type,
  backdrop,
  className,
  children,
}: {
  type: TypeFixture;
  backdrop?: ReactNode;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <PageHero
      entrance="cut"
      eyebrow={
        <Link
          href="/events"
          className="transition-colors hover:text-foreground"
        >
          Events
        </Link>
      }
      heading={type.headline}
      subhead={type.subhead}
      actions={
        <div className="flex flex-col items-center gap-4">
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <Button asChild size="cta">
              <Link href={MARKETING_CTA.href}>{MARKETING_CTA.label}</Link>
            </Button>
            <Button asChild size="cta" variant="outline">
              <Link href="/pricing">See pricing</Link>
            </Button>
          </div>
          <DemoCtaLink />
        </div>
      }
      backdrop={backdrop}
      className={cn("relative overflow-x-clip pt-14 pb-10 sm:pt-20", className)}
    >
      {children}
    </PageHero>
  );
}

/* ── Furniture ───────────────────────────────────────────────────────────── */

/**
 * The hairline that separates the worked type from the second one inside a
 * single 1440 frame. A concept that claims to be "themed for its own page" has
 * to be judged on two pages at once, and weddings (six honest stills) plus
 * conferences (none at all) is the whole range.
 */
export function SecondType({ label }: { label: string }) {
  return (
    // `relative z-30` and a ground of its own: under the arrival theme the
    // stream's photographs pass over this seam, and a divider a falling frame
    // can hide is a divider a reviewer reads as part of the page.
    <div className="relative z-30 mt-14 mb-2 flex items-center gap-4 bg-background px-8 py-3">
      <span className="text-xs font-medium tracking-[0.14em] text-faint uppercase">
        the same theme, {label.toLowerCase()}
      </span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

/** One manifest still, marked so the scene's measurement can find the FIRST
 *  photograph on the page (a drawn plate or a QR is not media). */
export function Pic({
  id,
  className,
  sizes = "(min-width: 768px) 50vw, 100vw",
  priority,
}: {
  id: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  const m = marketingImage(id);
  return (
    <div data-ei-pic className={cn("relative overflow-hidden", className)}>
      <Image
        src={m.src}
        alt=""
        fill
        sizes={sizes}
        priority={priority}
        className="object-cover"
      />
    </div>
  );
}

/** Five names, so a wall never repeats one next to itself. */
const BADGE_PEOPLE = [
  { name: "Priya Shah", role: "Speaker" },
  { name: "Alex Rivera", role: "Attendee" },
  { name: "Marcus Lee", role: "Crew" },
  { name: "Dana Okafor", role: "Organizer" },
  { name: "Noor Haddad", role: "Attendee" },
] as const;

/* ── The two types' objects ──────────────────────────────────────────────── */

/**
 * THE WEDDING'S OBJECT: the shared album, mid-fill, in the browser frame the
 * page already uses. Kept as the shipped composition so a theme that changes
 * everything around it is judged on the change, not on a new object smuggled
 * in beside it.
 */
export function AlbumObject({
  tiles,
  columns = 4,
  className,
}: {
  tiles: readonly string[];
  columns?: number;
  className?: string;
}) {
  return (
    <BrowserFrame
      label={
        <>
          <QrCode className="size-3" />
          partyreel.com/a/maya-and-jay
        </>
      }
    >
      <div
        className={cn("grid gap-2", className)}
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {tiles.map((id) => (
          <Pic
            key={id}
            id={id}
            className="aspect-square rounded-lg"
            sizes="180px"
          />
        ))}
      </div>
    </BrowserFrame>
  );
}

/**
 * THE CONFERENCE'S ROOM, when the manifest has no photograph of one. Every
 * attendee wears the code, so the wall of badges IS the room: the product
 * standing in for a picture we do not hold and will not fake (the shipped
 * pages' own ruling, event-artifacts.tsx). Decorative.
 */
export function BadgeWall({
  rows = 3,
  columns = 7,
  className,
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none flex flex-col", className)}
    >
      {Array.from({ length: rows }, (_, r) => (
        <div
          key={r}
          className="-mt-6 flex shrink-0 first:mt-0"
          style={{ marginInlineStart: r % 2 ? -64 : 0 }}
        >
          {Array.from({ length: columns }, (_, c) => {
            const n = r * columns + c;
            const who = BADGE_PEOPLE[n % BADGE_PEOPLE.length];
            return (
              // ★ THE LEAN RIDES A WRAPPER, never the badge. `AttendeeBadge`
              // takes a className and no style, and `rotate` is a standalone
              // property in this stylesheet (Tailwind v4), so a utility here
              // would fight whatever the badge sets. They hang on lanyards:
              // evenly spaced upright badges read as a filmstrip, the exact
              // failure the shipped party hero was re-cut for.
              <span
                key={c}
                className="-ml-5 block shrink-0 first:ml-0"
                style={{ rotate: `${((n * 37) % 9) - 4}deg` }}
              >
                <AttendeeBadge
                  scale="card"
                  seed={n}
                  name={who.name}
                  role={who.role}
                  className="opacity-70"
                />
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/** A fan of badges at hero scale, overlapping and leaning: the conference's own
 *  object, the way the shipped `BadgeFan` reads, with enough of them to stand
 *  for a room rather than a person. */
export function BadgeStack({ className }: { className?: string }) {
  const lean = [-9, -4, 0, 5, 10];
  return (
    <div aria-hidden className={cn("flex items-end justify-center", className)}>
      {lean.map((deg, i) => {
        const who = BADGE_PEOPLE[i % BADGE_PEOPLE.length];
        const front = i === 2;
        return (
          <span
            key={i}
            className={cn("-mx-7 block origin-bottom", front && "z-10")}
            style={{ rotate: `${deg}deg` }}
          >
            <AttendeeBadge
              name={who.name}
              role={who.role}
              seed={i * 3}
              pulse={front}
              className={front ? "shadow-lift" : "scale-[0.9] opacity-80"}
            />
          </span>
        );
      })}
    </div>
  );
}

/** A type's stage object, whichever it is: the album for a type with
 *  photographs, the badges for one without. One entry point so every concept
 *  asks the same question of a type instead of switching on the slug itself. */
export function TypeObject({
  type,
  className,
}: {
  type: TypeFixture;
  className?: string;
}) {
  if (type.stills.length === 0)
    return (
      <div className={cn("flex justify-center", className)}>
        <BadgeStack />
      </div>
    );
  return (
    <div className={cn("mx-auto w-full max-w-3xl", className)}>
      <AlbumObject tiles={type.stills.slice(0, 4)} />
    </div>
  );
}

/* ── Small blocks the arc is built from ──────────────────────────────────── */

/** A quiet beat used only inside THE ARC, where the question is the rhythm and
 *  a full FAQ accordion would cost 600 px of frame to say "a FAQ is here". */
export function Beat({
  label,
  lines = 3,
  className,
}: {
  label: string;
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn("px-8 py-16 text-center", className)}>
      <p className="font-heading text-subsection">{label}</p>
      <div className="mx-auto mt-6 flex max-w-2xl flex-col gap-3">
        {Array.from({ length: lines }, (_, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-lg border px-5 py-4"
          >
            <span className="h-2 w-40 rounded-full bg-muted-foreground/25" />
            <span className="h-2 w-2 rounded-full bg-muted-foreground/25" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** The stagger seat a slot takes inside a `Reveal`, written once. */
export const seat = (i: number) => ({ "--i": i }) as CSSProperties;
