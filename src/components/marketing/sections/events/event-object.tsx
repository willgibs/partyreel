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
 * A PRINT: paper, not a rounded photograph.
 *
 * ★ THE PAPER IS LITERAL WHITE, NOT `bg-card`, and that is the whole reason
 * these read as objects. Every one of these still lifes stands on the cinema
 * ground, where `bg-card` is near-black: a "border" in it is a GAP, so six
 * prints in a row read as a thumbnail strip and the pile reads as a toolbar.
 * Paper is white in a dark room, the photograph is the colour (bible 1), and
 * the border is what says somebody held this. Same family as the white QR
 * plate beside it, which is white for the scanner's sake and lands as the other
 * piece of paper in the composition.
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
        "block overflow-hidden rounded-lg bg-white p-1.5 shadow-lift ring-1 ring-black/10",
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
        "block rounded-lg bg-white p-1.5 shadow-lift ring-1 ring-black/10",
        className,
      )}
    >
      <span className="block aspect-4/5 rounded-[5px] bg-black/[0.06]" />
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
    <div className="relative mx-auto w-full max-w-3xl">
      {/* The cover: dark board, the one piece of this object that is not paper. */}
      <div className="relative grid grid-cols-1 gap-2 rounded-2xl bg-card p-2.5 shadow-lift ring-1 ring-foreground/12 sm:grid-cols-2 sm:gap-2.5 sm:p-3">
        {leaves.map((leaf, i) => (
          <div
            key={i}
            aria-hidden
            className={cn(
              // THE LEAF IS AN IVORY PAGE, and the dark channel between two of
              // them IS the spine. A hairline in `foreground/10` over a dark
              // cover was invisible, which left six prints reading as one
              // six-up grid: the contact sheet this object exists to replace.
              "grid grid-cols-2 gap-2 rounded-lg bg-white p-2.5 sm:grid-cols-3 sm:gap-2.5 sm:p-3",
              i === 1 && "hidden sm:grid",
            )}
          >
            {leaf.map((id, k) => (
              <span
                key={id}
                className={cn(
                  // On the page the prints need no paper of their own: a white
                  // border on white is a margin, and the page already is one.
                  "relative block aspect-4/5 overflow-hidden rounded-[5px] ring-1 ring-black/10",
                  k === 2 && "hidden sm:block",
                )}
              >
                <Image
                  src={marketingImage(id).src}
                  alt=""
                  fill
                  sizes="(min-width: 640px) 160px, 45vw"
                  priority={i === 0 && k === 0}
                  className="object-cover"
                />
              </span>
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
    "rotate-[4deg] translate-y-5",
    "hidden sm:block -rotate-[3deg] -translate-y-2",
  ];
  return (
    <div className="relative mx-auto w-full max-w-3xl">
      <div className="flex items-center justify-center gap-3 sm:gap-6">
        {stills.map((id, i) => (
          <Print
            key={id}
            id={id}
            sizes="(min-width: 640px) 230px, 42vw"
            priority={i === 0}
            className={cn("w-[44%] max-w-[230px] sm:w-1/3", lie[i])}
          />
        ))}
      </div>

      {/* ★ THE CARD IS IN FLOW, PULLED UP, never absolutely placed over the
          pile. Absolute, it sat across the middle print and hid the photograph
          it was meant to be standing in front of; pulled up by less than its
          own height it OVERLAPS the pile's lower edge and the rest of it stands
          on the table, which is the read: a card somebody put down among the
          prints. It also keeps the object's own box honest, so the hero's
          padding is the hero's and nothing overhangs into the next section. */}
      {DEMO_EVENT_URL && (
        <div className="relative z-10 -mt-12 flex justify-center sm:-mt-14">
          <div className="flex w-[140px] rotate-[2deg] flex-col items-center gap-2 rounded-xl border bg-card p-3 shadow-lift ring-1 ring-foreground/10 sm:w-[156px] sm:gap-2.5 sm:p-3.5">
            <DemoCode size={88} />
            <ScanLine className="text-caption">Scan to add yours</ScanLine>
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
              // The four behind carry drawn cells, so five white plates would
              // compete with the one that actually scans. They step back far
              // enough to read as a desk full of badges and no further.
              className={front ? "shadow-lift" : "scale-[0.88] opacity-55"}
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
  /**
   * ★ THE SPREAD IS WHOLE PRINT WIDTHS, NOT PERCENTAGES OF ONE. The first cut
   * fanned at -58 / -50 / -42 percent, which is plus or minus 8 percent of a
   * single print: three photographs stacked almost exactly on top of each
   * other, one of them visible. A fan has to move by most of a print, and the
   * lift is what makes them read as pulled out at different depths.
   */
  const fan = [
    "-rotate-[12deg] -translate-x-[118%] translate-y-5",
    "rotate-[1deg] -translate-x-1/2",
    "rotate-[13deg] translate-x-[18%] translate-y-7",
  ];
  return (
    <div className="relative mx-auto w-full max-w-lg">
      {/* The prints coming OUT of the wallet: each stands on the pocket's top
          edge and the wallet is drawn over their feet, so they read as pulled
          out rather than laid behind. */}
      <div aria-hidden className="relative h-[196px] sm:h-[224px]">
        {[stills[0], stills[1], null].map((id, i) => (
          <span
            key={i}
            className={cn(
              "absolute bottom-0 left-1/2 w-[132px] sm:w-[158px]",
              fan[i],
              // A phone keeps two: three at this spread run off both edges at
              // 375, which reads as a clipping bug rather than a fan (A21).
              i === 2 && "hidden sm:block",
            )}
            style={{ zIndex: i === 1 ? 2 : 1 }}
          >
            {id ? (
              <Print id={id} sizes="158px" priority={i === 1} />
            ) : (
              <PrintBack />
            )}
          </span>
        ))}
      </div>

      {/* The wallet itself, the pocket the prints stand in. `-mt-14` is the
          overlap: deep enough that their feet are genuinely inside it, which is
          the difference between a wallet and a shelf. */}
      <div className="relative z-10 -mt-14 flex items-center gap-4 rounded-xl border bg-card p-4 shadow-lift ring-1 ring-foreground/10">
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
    <div className="relative mx-auto w-full max-w-3xl">
      {/* ★ `w-full` ON THE ROW, not just on the wrapper. A percentage width
          inside a SHRINK-TO-FIT flex container resolves against a width the
          container is deriving from its children, so the four prints collapsed
          to nothing and the card floated up over the buttons: a hero with no
          object in it and no error anywhere. */}
      <div
        aria-hidden
        className="flex w-full items-center justify-center -space-x-6 sm:-space-x-8"
      >
        {stills.map((id, i) => (
          <Print
            key={id}
            id={id}
            sizes="(min-width: 640px) 190px, 40vw"
            priority={i === 1}
            className={cn(
              "w-[40%] max-w-[190px] sm:w-[24%]",
              lie[i],
              // Two prints at a phone, four above it: the outer pair would be
              // 60px wide in a four-up at 375 (A21).
              (i === 0 || i === 3) && "hidden sm:block",
            )}
          />
        ))}
      </div>

      {/* In flow and pulled up, like the type pages' cards: absolutely placed
          it depends on the pile having a height, which is exactly what failed. */}
      {DEMO_EVENT_URL && (
        <div className="relative z-10 -mt-12 flex justify-center sm:-mt-14">
          <div className="flex w-[146px] -rotate-[3deg] flex-col items-center gap-2.5 rounded-xl border bg-card p-3.5 shadow-lift ring-1 ring-foreground/10 sm:w-[164px]">
            <DemoCode size={92} />
            <ScanLine className="text-caption">
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
