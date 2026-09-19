"use client";

import { Images, QrCode, Radio } from "lucide-react";
import type { ReactNode } from "react";

import { PaperChapter } from "@/components/marketing/system/paper-chapter";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { Container } from "@/components/shared/container";
import { cn } from "@/lib/utils";

import { ROOM_BY_TYPE, type TypeFixture } from "./fixtures";
import type { HeroShape } from "./hero";
import { AlbumObject, BadgeWall, Pic, seat } from "./pieces";

/**
 * DECISION 2: THE SECOND SECTION, staged behind the hero's theme.
 *
 * Will (2026-09-19, verbatim): "I hate the 'A wedding is the most photographed
 * day of your life, and almost none of those photos ever reach you...' bland
 * text just beneath the hero with its tag list, for the second section that
 * needs to catch attention after a hero it's doing horribly."
 *
 * ★ IT IS STAGED BECAUSE THE SEAM IS HALF THE QUESTION. What reads well under a
 * hero that is already a photograph is not what reads well under a hero of dark
 * air, so every option draws the LAST BAND of whatever hero the board is
 * carrying above it. A section judged on its own is a section judged in a page
 * that does not exist.
 */
export type SecondShape = "today" | "statement" | "beats" | "live";

/* ── the seam ────────────────────────────────────────────────────────────── */

/** The hero's last 140 px, so the cut into this section is drawn rather than
 *  imagined: a photograph running into paper is a different page from dark air
 *  running into paper. */
export function HeroTail({
  shape,
  type,
}: {
  shape: HeroShape;
  type: TypeFixture;
}) {
  const room = ROOM_BY_TYPE[type.slug] ?? [];
  // ★ THE TAIL IS ALWAYS CINEMA, whatever ground the section below stands on.
  // The scene's root wears the SECTION's ground, so a paper scene would
  // otherwise paint the hero's last band white and draw a seam that does not
  // exist. This is the one place a ground is re-declared inside a scene.
  return (
    <div className="dark relative h-[140px] overflow-hidden bg-background text-foreground">
      {shape === "room" ? (
        room.length > 0 ? (
          <Pic id={room[0]} className="absolute inset-0" sizes="100vw" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center opacity-25">
            <BadgeWall rows={1} columns={9} />
          </div>
        )
      ) : shape === "object" ? (
        <div
          aria-hidden
          className="absolute inset-x-0 -top-28 h-44"
          style={{
            background:
              "radial-gradient(60% 100% at 50% 0%, color-mix(in oklab, var(--color-foreground) 12%, transparent), transparent)",
          }}
        />
      ) : null}
    </div>
  );
}

/* ── today ───────────────────────────────────────────────────────────────── */

/** The shipped section, verbatim: the intro paragraph and the theme chips on
 *  paper. The control, so every number beside it is a comparison. */
function TodaySecond({ type }: { type: TypeFixture }) {
  return (
    <>
      <SectionShell width="narrow">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p
            data-mkt-reveal
            className="text-lg text-pretty text-muted-foreground"
            style={seat(0)}
          >
            {type.intro}
          </p>
          <div
            data-mkt-reveal
            className="mx-auto mt-6 flex max-w-xl flex-wrap justify-center gap-2"
            style={seat(1)}
          >
            {type.themes.map((theme) => (
              <span
                key={theme}
                className="rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground"
              >
                {theme}
              </span>
            ))}
          </div>
        </Reveal>
      </SectionShell>
    </>
  );
}

/* ── the statement ───────────────────────────────────────────────────────── */

/**
 * The page's own claim, said once and large, against one picture. The chip row
 * becomes a single running line of the same SEO terms, which keeps every word
 * search rewards and stops the section reading as a tag cloud.
 *
 * ★ THE BIG LINE IS THE `chapter` STEP, NOT A ONE-OFF. Bible 5: every heading
 * sits on a step. The quiet line beneath is `subhead`, which is the step the
 * ladder already has for exactly this pair.
 */
function StatementSecond({ type }: { type: TypeFixture }) {
  const room = ROOM_BY_TYPE[type.slug] ?? [];
  return (
    <Container className="py-20 sm:py-24">
      <Reveal className="grid items-center gap-10 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-7">
          <h2
            data-mkt-reveal
            className="font-heading text-chapter text-balance"
            style={seat(0)}
          >
            {type.statement.big}
          </h2>
          <p
            data-mkt-reveal
            className="mt-5 max-w-xl text-subhead text-pretty text-muted-foreground"
            style={seat(1)}
          >
            {type.statement.quiet} Partyreel turns everyone in the room into a
            second shooter, with one code on the table and nothing to install.
          </p>
          <p
            data-mkt-reveal
            className="mt-8 text-xs font-medium tracking-[0.08em] text-faint"
            style={seat(2)}
          >
            {type.themes.join(" · ")}
          </p>
        </div>
        <div data-mkt-reveal className="lg:col-span-5" style={seat(3)}>
          {room.length > 0 ? (
            <Pic
              id="wedding-petals"
              className="aspect-4/5 w-full rounded-2xl"
              sizes="(min-width: 1024px) 440px, 100vw"
            />
          ) : (
            <div className="flex aspect-4/5 w-full items-center justify-center overflow-hidden rounded-2xl bg-muted/50">
              <BadgeWall rows={2} columns={3} className="scale-110" />
            </div>
          )}
        </div>
      </Reveal>
    </Container>
  );
}

/* ── the three beats ─────────────────────────────────────────────────────── */

type BeatRow = {
  icon: typeof QrCode;
  title: string;
  body: string;
  pic: string | null;
};

/** FIXTURE copy, per type: three true things, in the order they happen. */
function beatsFor(type: TypeFixture): BeatRow[] {
  if (type.stills.length === 0)
    return [
      {
        icon: QrCode,
        title: "The code is already on their badge",
        body: "Every attendee walks in wearing the way to upload. Nothing to install, nothing to hand out at the door.",
        pic: null,
      },
      {
        icon: Images,
        title: "The keynote, the booth and the hallway, at once",
        body: "Your team cannot cover three tracks. Six hundred people can, and every shot lands in one feed you curate.",
        pic: null,
      },
      {
        icon: Radio,
        title: "Reshare it before anyone flies home",
        body: "The feed fills while the event runs, so the recap goes out the same evening instead of next quarter.",
        pic: null,
      },
    ];
  return [
    {
      icon: QrCode,
      title: "A code on every table",
      body: "Drop it on the table cards or the program. Guests scan between courses, with nothing to install and no account to make.",
      pic: "wedding-toast",
    },
    {
      icon: Images,
      title: "Every angle your photographer could not be at",
      body: "The happy tears in the third row, the dance floor at midnight, the late candids. All of it lands in one album.",
      pic: "reception-hall",
    },
    {
      icon: Radio,
      title: "Yours the same night, at full resolution",
      body: "The album fills while the party runs, so the first photographs are in your hands before the last song.",
      pic: "wedding-golden",
    },
  ];
}

/**
 * Three beats, one picture each, alternating down the page: the cinema register
 * (bible 17, a chapter opens strong and ramps down) applied to the one section
 * a reader meets straight after the hero. Every line is a fact the page already
 * carries, moved out of a paragraph and into a rhythm.
 */
function BeatsSecond({ type }: { type: TypeFixture }) {
  const rows = beatsFor(type);
  return (
    <Container className="py-20 sm:py-24">
      <Reveal className="flex flex-col gap-16 sm:gap-20">
        {rows.map((row, i) => (
          <div
            key={row.title}
            data-mkt-reveal
            style={seat(i)}
            className={cn(
              "grid items-center gap-8 lg:grid-cols-2 lg:gap-16",
              i % 2 === 1 && "lg:[&>*:first-child]:order-2",
            )}
          >
            <div>
              <span className="flex size-10 items-center justify-center rounded-lg border text-muted-foreground">
                <row.icon className="size-5" strokeWidth={1.5} />
              </span>
              <h3 className="mt-5 font-heading text-section text-balance">
                {row.title}
              </h3>
              <p className="mt-4 max-w-md text-subhead text-pretty text-muted-foreground">
                {row.body}
              </p>
            </div>
            {row.pic ? (
              <Pic
                id={row.pic}
                className="aspect-3/2 w-full rounded-2xl"
                sizes="(min-width: 1024px) 560px, 100vw"
              />
            ) : (
              <div className="flex aspect-3/2 w-full items-center justify-center overflow-hidden rounded-2xl bg-muted/50">
                <BadgeWall rows={1} columns={4} />
              </div>
            )}
          </div>
        ))}
      </Reveal>
    </Container>
  );
}

/* ── the party itself ────────────────────────────────────────────────────── */

/**
 * The product in THAT party, still dark: one line, then the album for this
 * event filling in front of the reader. It keeps the page on cinema through its
 * second beat, which is a real change to the arc and is why the two decisions
 * are judged together.
 */
function LiveSecond({ type }: { type: TypeFixture }) {
  const tiles = type.stills.length > 0 ? type.stills : [];
  return (
    <section className="py-20 sm:py-24">
      <Container>
        <Reveal className="flex flex-col items-center gap-10">
          <div className="max-w-2xl text-center">
            <h2
              data-mkt-reveal
              className="font-heading text-chapter text-balance"
              style={seat(0)}
            >
              {type.statement.big}
            </h2>
            <p
              data-mkt-reveal
              className="mx-auto mt-5 max-w-xl text-subhead text-pretty text-muted-foreground"
              style={seat(1)}
            >
              This is one, filling while it happens.
            </p>
          </div>
          <div
            data-mkt-reveal
            className="relative w-full max-w-4xl"
            style={seat(2)}
          >
            <span className="absolute top-8 right-8 z-10 inline-flex items-center gap-1.5 rounded-full bg-background/80 px-2.5 py-1 text-[11px] font-medium">
              <span className="size-1.5 rounded-full bg-emerald-400" />
              Live
            </span>
            {tiles.length > 0 ? (
              <AlbumObject
                tiles={[...tiles, ...tiles].slice(0, 8)}
                columns={4}
              />
            ) : (
              <div className="flex justify-center rounded-2xl border bg-card p-8">
                <BadgeWall rows={2} columns={5} />
              </div>
            )}
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

/* ── the switch ──────────────────────────────────────────────────────────── */

/** The ground each option's section stands on, read by the board so the scene
 *  wears the right one: `live` keeps the page dark through its second beat and
 *  the other three turn it to paper. */
export const SECOND_GROUND: Record<SecondShape, "cinema" | "paper"> = {
  today: "paper",
  statement: "paper",
  beats: "paper",
  live: "cinema",
};

/**
 * One option's section with NO ground of its own, so a caller decides whether it
 * stands on paper. THE ARC needs exactly this: it is staged behind this decision
 * and has to place whichever section won inside its own chapter structure,
 * rather than draw a second, independent guess at it.
 */
export function SecondBody({
  shape,
  type,
}: {
  shape: SecondShape;
  type: TypeFixture;
}): ReactNode {
  if (shape === "statement") return <StatementSecond type={type} />;
  if (shape === "beats") return <BeatsSecond type={type} />;
  if (shape === "live") return <LiveSecond type={type} />;
  return <TodaySecond type={type} />;
}

export function SecondPreview({
  shape,
  heroShape,
  type,
}: {
  shape: SecondShape;
  heroShape: HeroShape;
  type: TypeFixture;
}): ReactNode {
  const body = <SecondBody shape={shape} type={type} />;
  return (
    <>
      <HeroTail shape={heroShape} type={type} />
      {SECOND_GROUND[shape] === "paper" ? (
        <PaperChapter>{body}</PaperChapter>
      ) : (
        body
      )}
    </>
  );
}
