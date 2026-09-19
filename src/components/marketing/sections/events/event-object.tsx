import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { FooterQr } from "@/components/marketing/chrome/footer-qr";
import { trackAttrs } from "@/lib/analytics/events";
import type { EventObjectKind } from "@/lib/constants/events";
import { marketingImage } from "@/lib/constants/marketing-media";
import { SITE_URL } from "@/lib/constants/site";
import { DEMO_EVENT_URL } from "@/lib/demo";
import { cn } from "@/lib/utils";

import { AttendeeBadge } from "./event-artifacts";

/**
 * ONE STILL LIFE PER EVENT TYPE, LIT, AND EVERY ONE OF THEM IS A DOOR.
 *
 * Will ruled `hero-theme=object` (2026-09-19, verbatim): "While I like the room
 * behind the words to kind of 'theme' each event hero, I think the 'one bespoke
 * object, lit' per page conveys more about how we actually help that event
 * (such as incorporating the QR). With the future Higgsfield generations, the
 * media in the bespoke objects will also feel more themed." And on the drawings
 * themselves: "these 7 preview sections are not nearly good enough for an event
 * page this is the proposed final page design."
 *
 * So the board's two objects were the sketch and these four are the thing. The
 * lockup above them never moves (`PageHero`, `one-hero=page-hero`: "our heroes
 * and headers should share similar design patterns"); everything custom is the
 * object and the single pool of light it stands in, which the page supplies
 * with `SectionLight placement="room"`.
 *
 * ★ "INCORPORATING THE QR" IS LITERAL: THE CODE IS REAL. Every object carries
 * the demo's own scannable code, computed during the server render the way the
 * footer's does (footer-qr.tsx: `qrcode-generator` is DOM-free, so the matrix
 * ships as inert markup and the object costs zero client JS). A reader can lift
 * a phone to the screen on any of these four pages and the demo album opens in
 * their hand while the page stays where it was. That is the product's whole
 * argument standing inside its own hero.
 *
 * ★ IT ENCODES `/demo`, NEVER THE EVENT LINK (Will, river-card `opens=short`):
 * 25 modules against 33, so a plate this size stays well above the scan floor.
 * `/demo` is a 307 to the configured event (src/app/demo/route.ts).
 *
 * ★ NO DEMO CONFIGURED, NO CODE AND NO DEAD LINK (the `DemoCtaLink` contract).
 * With the env unset every object drops the piece that carries the code (the
 * table card, the tent card, the sleeve's plate) and stands on its photographs
 * alone; the badge falls back to its own decorative cells. Nothing here ever
 * renders a link to a demo that does not exist.
 *
 * ★ AND THE OBJECT ARRIVES PAINTED. No `[data-mkt-reveal]` and no cut rides the
 * hero's stage: it sits directly under the h1 and is the LCP candidate on three
 * of the four pages. The only motion is hover and press, which cost nothing at
 * paint (the `emil-design-eng` bar: one property, under 300ms, an eased press).
 */

/* ── the code, the one piece all four share ──────────────────────────────── */

/** The real code on its white plate, as a door. `null` when no demo is set. */
function DemoCode({
  size,
  className,
}: {
  /** Rendered edge length in px, the baked quiet zone included. */
  size: number;
  className?: string;
}) {
  if (!DEMO_EVENT_URL) return null;
  return (
    <Link
      href="/demo"
      aria-label="Open the live demo album"
      {...trackAttrs("demo_open", { source: "events-object" })}
      className={cn(
        // No plate of its own: FooterQr ships the white plate WITH the quiet
        // zone baked into its viewBox, and a second white box under it is two
        // paddings and no pixels.
        "inline-flex rounded-[var(--radius-tile)] ring-1 ring-black/10",
        // One property, 150ms, the house easing, and a press that answers.
        "transition-transform duration-150 ease-emphasis hover:-translate-y-0.5 active:scale-[0.98]",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground",
        "motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100",
        className,
      )}
    >
      <FooterQr value={`${SITE_URL}/demo`} size={size} />
    </Link>
  );
}

/** The line that stands beside a code, sized for whichever piece holds it. */
function ScanLine({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "block text-center text-xs font-medium text-muted-foreground",
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ── the shared physical vocabulary ──────────────────────────────────────── */

/**
 * A PRINT: paper, not a rounded photograph. The white border and the ring are
 * what make these objects rather than tiles, and they are the one thing every
 * object here shares, so four bespoke still lifes still read as one family.
 */
function Print({
  id,
  className,
  sizes,
  priority,
}: {
  id: string;
  className?: string;
  sizes: string;
  priority?: boolean;
}) {
  const m = marketingImage(id);
  return (
    <span
      className={cn(
        "block overflow-hidden rounded-lg bg-card p-1.5 shadow-lift ring-1 ring-foreground/10",
        className,
      )}
    >
      <span className="relative block aspect-4/5 overflow-hidden rounded-[5px]">
        <Image
          src={m.src}
          alt=""
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
        />
      </span>
    </span>
  );
}

/** A print face down: paper with nothing on it. The honest way to fill a fan
 *  for a type the manifest has one or two subjects for, instead of repeating a
 *  frame next to itself. */
function PrintBack({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "block rounded-lg bg-card p-1.5 shadow-lift ring-1 ring-foreground/10",
        className,
      )}
    >
      <span className="block aspect-4/5 rounded-[5px] bg-muted/60" />
    </span>
  );
}

/* ── weddings: the album open, and the card that opened it ───────────────── */

/**
 * The shared album lying open on the table, both leaves filled, with the table
 * card standing in front of it. It is the wedding page's whole promise in one
 * picture: the code went on the table, and this came back.
 *
 * ★ THE SPINE IS LOAD-BEARING. Without it the two leaves read as one six-up
 * grid, which is the contact sheet the round exists to replace.
 *
 * ★ AND A PHONE GETS FEWER, LARGER PIECES (A21, the shipped pages' own rule):
 * below `sm` the second leaf and the third frame of the first go, so the album
 * is an album rather than six stamps.
 */
function AlbumObject({ stills }: { stills: readonly string[] }) {
  const leaves = [stills.slice(0, 3), stills.slice(3, 6)];
  return (
    <div className="relative mx-auto w-full max-w-4xl">
      <div className="relative grid grid-cols-1 gap-6 rounded-2xl border bg-card p-4 shadow-lift ring-1 ring-foreground/5 sm:grid-cols-2 sm:gap-10 sm:p-6">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-6 left-1/2 hidden w-px -translate-x-1/2 bg-foreground/10 sm:block"
        />
        {leaves.map((leaf, i) => (
          <div
            key={i}
            aria-hidden
            className={cn(
              "grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3",
              i === 1 && "hidden sm:grid",
            )}
          >
            {leaf.map((id, k) => (
              <Print
                key={id}
                id={id}
                className={cn("p-1", k === 2 && "hidden sm:block")}
                sizes="(min-width: 640px) 190px, 45vw"
                priority={i === 0 && k === 0}
              />
            ))}
          </div>
        ))}
      </div>

      {/* The card that opened it, leaning on the table in front of the spread.
          The overlap is the composition: a card BESIDE an album is two objects,
          a card ON one is a table. */}
      {DEMO_EVENT_URL && (
        <div className="-mt-11 flex justify-center sm:-mt-14">
          <div className="flex w-[168px] -rotate-[4deg] flex-col items-center gap-2.5 rounded-xl border bg-card p-3.5 shadow-lift ring-1 ring-foreground/5 sm:w-[186px] sm:p-4">
            <DemoCode size={104} />
            <ScanLine>Scan to add your photos</ScanLine>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── parties: the prints on the table, and the tent card among them ──────── */

/**
 * Prints scattered across the table with the folded tent card standing in the
 * middle of them. The pile is deliberately NOT a row: three prints leaning the
 * same way read as a filmstrip (A26, the party hero's own re-cut), so each one
 * takes its own tilt and drop and the card breaks the line.
 */
function PrintsObject({ stills }: { stills: readonly string[] }) {
  /** Tilt, drop and depth per print, so the pile scatters instead of lining up. */
  const lie = [
    "-rotate-[7deg] sm:translate-y-2",
    "rotate-[4deg] translate-y-6 z-10",
    "hidden sm:block -rotate-[3deg] -translate-y-2",
  ];
  return (
    <div className="relative mx-auto flex w-full max-w-3xl items-center justify-center gap-3 sm:gap-6">
      {stills.map((id, i) => (
        <Print
          key={id}
          id={id}
          sizes="(min-width: 640px) 220px, 42vw"
          priority={i === 0}
          className={cn("w-[42%] max-w-[220px] sm:w-1/3", lie[i])}
        />
      ))}

      {/* The tent card, standing ON the pile rather than beside it: it overlaps
          the middle print's lower edge, which is what makes this a table and
          not three photographs and a QR in a row. */}
      {DEMO_EVENT_URL && (
        <div className="absolute bottom-0 left-1/2 z-20 -translate-x-1/2 translate-y-6 sm:translate-y-8">
          <div className="flex w-[136px] rotate-[2deg] flex-col items-center gap-2 rounded-xl border bg-card p-3 shadow-lift ring-1 ring-foreground/5 sm:w-[152px] sm:gap-2.5 sm:p-3.5">
            <DemoCode size={84} />
            <ScanLine className="text-[11px]">Scan to add yours</ScanLine>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── conferences: the badges, and the code on the front of one ───────────── */

/** Five names, so a fan never repeats one next to itself. */
const BADGE_PEOPLE = [
  { name: "Priya Shah", role: "Speaker" },
  { name: "Alex Rivera", role: "Attendee" },
  { name: "Marcus Lee", role: "Crew" },
  { name: "Dana Okafor", role: "Organizer" },
  { name: "Noor Haddad", role: "Attendee" },
] as const;

/**
 * The registration desk: five badges hanging on their lanyards, the front one
 * crisp and carrying the REAL code, the four behind it leaning away with their
 * own decorative cells. It is the one object here with no photograph in it, and
 * that is the honest answer for a type the manifest has no subject for: every
 * attendee walks in wearing the way to upload, so the badges ARE the room.
 *
 * ★ THE LEAN RIDES A WRAPPER, never the badge. `AttendeeBadge` takes a
 * className and no style, and `rotate` is a standalone property in this
 * stylesheet (Tailwind v4), so a utility on the badge would fight whatever it
 * sets. Evenly spaced upright badges read as a filmstrip; these hang.
 */
function BadgesObject() {
  const lean = [-9, -4, 0, 5, 10];
  return (
    <div className="flex items-end justify-center">
      {lean.map((deg, i) => {
        const who = BADGE_PEOPLE[i];
        const front = i === 2;
        return (
          <span
            key={who.name}
            aria-hidden={front ? undefined : true}
            className={cn(
              "-mx-6 block origin-bottom sm:-mx-7",
              front && "z-10",
              // A phone gets three badges, not five: the outer pair would be
              // half off the screen and read as a clipping bug (A21).
              (i === 0 || i === 4) && "hidden sm:block",
            )}
            style={{ rotate: `${deg}deg` }}
          >
            <AttendeeBadge
              name={who.name}
              role={who.role}
              seed={i * 3}
              pulse={front}
              code={front ? <DemoCode size={104} /> : undefined}
              className={front ? "shadow-lift" : "scale-[0.9] opacity-80"}
            />
          </span>
        );
      })}
    </div>
  );
}

/* ── trips: the sleeve the prints came back in ───────────────────────────── */

/**
 * The paper wallet a trip comes home in: the code printed on its face, the
 * album's name beside it, and the group's prints fanning out of the top.
 *
 * ★ WHY A SLEEVE AND NOT AN ALBUM. Weddings already own the open album, and the
 * four objects have to be four objects (the whole point of `hero-theme=object`
 * is that a reader moving between these pages always wants to see what is
 * next). A wallet is also the only one of the four that says "everyone's, in
 * one place, to take away", which is the trip page's actual argument.
 *
 * ★ AND ONE PRINT IS FACE DOWN ON PURPOSE. The manifest holds two honest away
 * frames; a third would have to repeat one beside itself. A fan with a blank
 * back in it is what a real wallet looks like, and it is the stand-in that
 * needs no apology (the generated set fills it, ASSETS row 24).
 */
function SleeveObject({
  stills,
  albumName,
}: {
  stills: readonly string[];
  albumName: string;
}) {
  const fan = [
    "-rotate-[11deg] -translate-x-[58%] translate-y-3",
    "rotate-[1deg] -translate-x-1/2",
    "rotate-[12deg] -translate-x-[42%] translate-y-4",
  ];
  return (
    <div className="relative mx-auto w-full max-w-md pt-2">
      {/* The prints, standing IN the sleeve: each is anchored to the sleeve's
          top edge and only its upper two thirds shows, so the wallet holds them
          rather than sitting under a row of photographs. */}
      <div aria-hidden className="relative h-[168px] sm:h-[196px]">
        {[stills[0], stills[1], null].map((id, i) => (
          <span
            key={i}
            className={cn(
              "absolute bottom-0 left-1/2 w-[128px] sm:w-[150px]",
              fan[i],
            )}
            style={{ zIndex: i === 1 ? 2 : 1 }}
          >
            {id ? (
              <Print id={id} sizes="150px" priority={i === 1} />
            ) : (
              <PrintBack />
            )}
          </span>
        ))}
      </div>

      {/* The wallet itself, drawn OVER the prints' feet so they come out of it.
          `-mt-8` is the overlap; the ring and the inner hairline are the paper's
          own fold. */}
      <div className="relative z-10 -mt-8 flex items-center gap-4 rounded-xl border bg-card p-4 shadow-lift ring-1 ring-foreground/5">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-4 top-3 h-px bg-foreground/10"
        />
        {DEMO_EVENT_URL ? <DemoCode size={88} className="shrink-0" /> : null}
        <span className="flex min-w-0 flex-col gap-1">
          <span className="font-heading text-subsection">{albumName}</span>
          <span className="text-sm text-muted-foreground">
            {DEMO_EVENT_URL
              ? "Everyone on the trip adds to this one. Scan and yours lands here too."
              : "Everyone on the trip adds to this one, from the airport to the last sunset."}
          </span>
        </span>
      </div>
    </div>
  );
}

/* ── the hub: the code, over a ground of every kind of event ─────────────── */

/**
 * THE HUB'S OWN OBJECT. A type page's still life is one kind of event; the hub
 * has to say ANY, so the pile under its code is one print per type (the order
 * is `EVENTS_HUB.heroPrints`, which is `EVENT_TYPES` order) and the card
 * standing in front of them is the same real code every page carries. One code,
 * four very different nights, which is exactly what the page below it sells.
 */
function HubObject({ stills }: { stills: readonly string[] }) {
  const lie = [
    "-rotate-[10deg] translate-y-4",
    "-rotate-[3deg]",
    "rotate-[4deg] translate-y-1",
    "rotate-[11deg] translate-y-5",
  ];
  return (
    <div className="relative mx-auto flex w-full max-w-3xl items-center justify-center">
      <div
        aria-hidden
        className="flex items-center justify-center -space-x-6 sm:-space-x-8"
      >
        {stills.map((id, i) => (
          <Print
            key={id}
            id={id}
            sizes="(min-width: 640px) 190px, 38vw"
            priority={i === 1}
            className={cn(
              "w-[38%] max-w-[190px] sm:w-[23%]",
              lie[i],
              // Two prints at a phone, four above it: the outer pair would be
              // 60px wide in a four-up at 375 (A21).
              (i === 0 || i === 3) && "hidden sm:block",
            )}
          />
        ))}
      </div>

      {DEMO_EVENT_URL && (
        <div className="absolute bottom-0 left-1/2 z-20 -translate-x-1/2 translate-y-8 sm:translate-y-10">
          <div className="flex w-[146px] -rotate-[3deg] flex-col items-center gap-2.5 rounded-xl border bg-card p-3.5 shadow-lift ring-1 ring-foreground/5 sm:w-[164px]">
            <DemoCode size={92} />
            <ScanLine className="text-[11px]">
              Scan to open a real album
            </ScanLine>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── the one entry point ─────────────────────────────────────────────────── */

/**
 * A type's object, lit by the page around it.
 *
 * ★ THE SWITCH IS EXHAUSTIVE ON `EventObjectKind`, not on the slug: a fifth
 * type added to `events.ts` without an object of its own is a typecheck error
 * rather than an empty hero nobody notices (which is how the deleted
 * `events-layout.ts` map went stale).
 */
export function EventObject({
  kind,
  stills,
  albumName,
  className,
}: {
  kind: EventObjectKind;
  stills: readonly string[];
  /** The album this type's product pieces are named for (`events.ts`). */
  albumName: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        // The stage's air, and the fold: at 375 the object deliberately runs
        // past the bottom of the first screen (Will, `the-phone`: "the visual
        // may cross above/below the fold as a teaser to incentivize the scroll
        // down to explore more"), so the hero keeps its top tight and the
        // object keeps its size.
        "mt-8 sm:mt-12",
        className,
      )}
    >
      {kind === "album" && <AlbumObject stills={stills} />}
      {kind === "prints" && <PrintsObject stills={stills} />}
      {kind === "badges" && <BadgesObject />}
      {kind === "sleeve" && (
        <SleeveObject stills={stills} albumName={albumName} />
      )}
    </div>
  );
}

/** The hub's cross-event object, kept apart from the per-type switch because it
 *  answers a different question (any event, not this one). */
export function EventsHubObject({ stills }: { stills: readonly string[] }) {
  return (
    <div className="mt-8 sm:mt-12">
      <HubObject stills={stills} />
    </div>
  );
}
