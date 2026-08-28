"use client";

import { useState, type CSSProperties, type ReactNode } from "react";

import { MonoCaption } from "@/components/marketing/system/mono-caption";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Touchpoint: CAREERS IDENTITY (the careers round, 2026-08-28).
 *
 * Will's brief: "if this page didn't exist yet, what would the ideal version
 * be." Today's /careers is a template instance - it shares its hero AND its
 * numbered-principles grid with /about (whose comment literally calls the shape
 * "the careers idiom"), invents a team album that does not exist, restates the
 * product pitch four times before the job appears, and hides the one genuinely
 * compelling asset (the reel engine) one click deep.
 *
 * RULED BEFORE PROTOTYPING (do not re-litigate here):
 *  - cinema-led with PaperChapter cuts (the /pricing + /help precedent);
 *  - the role is real intent but placeholder copy, so no JobPosting JSON-LD;
 *  - "small team, outsized problem, early, move fast" is KEPT (it is the
 *    candidate hook); exact headcount and founder identity stay off the site;
 *  - copy leads: each direction below carries its OWN rewritten voice, so one
 *    ruling settles layout and words together (the contact-identity pattern).
 *
 * TWO DIRECTIONS WERE DROPPED BEFORE BUILD, with reasons, so they are not
 * re-proposed: THE CALL SHEET (a call sheet persuades by being full of facts -
 * call times, crew, locations - that we are forbidden from publishing, and it
 * is mono-native against the R6 mono ruling) and THE WORK SAMPLE (its
 * centrepiece was the live style switcher, already /reel's ruled flagship
 * signature; it would make careers a /reel remix and drag the engine into a
 * marketing chunk that style-switcher-island.tsx exists to keep it out of).
 * The proof survives as a LINK to /reel#styles, not an embed.
 *
 *  D THE CONTACT SHEET - careers as an album of the build. The media is the
 *    craft itself, so the product's own thesis is turned on the company. No
 *    people in it, scales 1 to 6 roles.
 *  E THE HANDOFF - the annotated page, built from this codebase's actual
 *    signature: every file opens with why it is the way it is. Warm host voice
 *    in the column, flat mono in the gutter. Sells the UNSOLVED problems.
 *  C ONE ROOM - radical focus. /careers IS the role. Opens on proof, never on
 *    a void (the failure mode "focus" and "nothing to say" render identically).
 *
 * ! LAB BLIND SPOT: marketing.css is imported ONLY by (marketing)/layout.tsx,
 *   so nothing here gets the [data-mkt-*] grammar (no reveal, cut, .mkt-line,
 *   marquee, .mkt-stack, mkt-check, accordion, confetti) AND the cinema room
 *   does not exist - --background: oklch(0.11 0 0) lives only under
 *   .dark[data-mkt-skin="cinema"]. So CinemaFrame hardcodes the room ink the
 *   way PaperChapter carries paper explicitly, and every motion below is
 *   hand-rolled off globals.css tokens, to be translated to the mkt- grammar
 *   at wire time. Each frame states its motion intent for what it cannot show.
 */

// ── Verified facts (every one checked in-repo; nothing here is invented) ──────
// 14 styles = 8 moods + 6 treatments ....... style-registry.test.ts:15-17
// one draw() -> rAF player AND encode loop . engine/contract.ts:1-5
// Safari has no canvas ctx.filter .......... engine/contract.ts:23 (filterOk)
// "weaker look beats a crashed reel" ....... engine/contract.ts:15
// seeded, reproduces exactly ............... reel/seed-default.ts
// ~11,900 lines of render farm deleted ..... CHANGELOG.md:611-625
// the 2.5s beat that became 2ms ............ lib/shared/read-css-ms.ts
// tile cascade 45ms step, 540ms cap ........ globals.css (--tile-i)
// IS_HIRING derives from OPEN_ROLES ........ constants/careers.ts:92

const ROLE_TITLE = "Graphics Engineer, Reel";

// ── Frame chrome (the lab's own furniture, not the design) ───────────────────

function Frame({
  letter,
  name,
  note,
  motion,
  children,
}: {
  letter: string;
  name: string;
  note: string;
  /** What the real page does that marketing.css cannot show in here. */
  motion: string;
  children: ReactNode;
}) {
  return (
    // Anchored so the ruling can be discussed by link (#d, #e, #c).
    <section id={letter.toLowerCase()} className="scroll-mt-4 flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h3 className="font-heading text-lg font-medium">
          <span className="mr-2 font-mono text-sm text-muted-foreground">
            {letter}
          </span>
          {name}
        </h3>
        <p className="max-w-2xl text-sm text-pretty text-muted-foreground">
          {note}
        </p>
        <p className="max-w-2xl text-xs text-pretty text-muted-foreground/70">
          <span className="font-medium">Motion (not shown in the lab):</span>{" "}
          {motion}
        </p>
      </div>
      <div className="overflow-hidden rounded-2xl border">{children}</div>
    </section>
  );
}

/**
 * The cinema room, carried explicitly. `dark` flips the token subtree; the
 * literal ink is the ruled room (oklch 0.11), which in production comes from
 * marketing.css chapter 3 and therefore does not exist in this route group.
 * Without it a frame renders the APP night (0.14) and the ruling would be made
 * against the wrong black.
 */
function CinemaFrame({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn("dark text-foreground", className)}
      style={{ background: "oklch(0.11 0 0)" }}
    >
      {children}
    </div>
  );
}

/** The paper chapter cut: hard hairline + plane change, never a gradient. */
function PaperCut({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "surface-paper border-y bg-background text-foreground",
        className,
      )}
    >
      {children}
    </div>
  );
}

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
      {children}
    </span>
  );
}

/**
 * The derived hiring line. In production this reads OPEN_ROLES.length, so it
 * takes itself down the day the last real role closes - the same honesty
 * automation the footer badge already runs on (careers.ts:92).
 */
function HiringLine({ tone = "cinema" }: { tone?: "cinema" | "paper" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2.5 text-xs tracking-wide",
        tone === "cinema" ? "text-foreground/60" : "text-muted-foreground",
      )}
    >
      <span className="relative flex size-1.5">
        <span className="absolute inline-flex size-full rounded-full bg-success/70" />
      </span>
      <span className="font-mono tabular-nums">01</span>
      <span>open position</span>
      <span aria-hidden className="text-foreground/25">
        /
      </span>
      <span>Engineering</span>
      <span aria-hidden className="text-foreground/25">
        /
      </span>
      <span>Remote</span>
    </span>
  );
}

// ── The craft stills (direction D's media) ───────────────────────────────────
// Hand-built DOM art in the help-emblems.tsx tradition: pure divs + tokens, no
// images, achromatic. The point of the direction: the product's thesis says the
// best record of an event is the candid stuff gathered in one place, so careers
// is an album of THE BUILD. People are banned (headcount/founder ruling), and
// dev-tool screenshots are ugly, so the "photos" are the work itself, drawn.

type StillKind =
  | "draw"
  | "grade"
  | "cascade"
  | "seed"
  | "qr"
  | "shimmer"
  | "flip"
  | "encode";

function CraftStill({ kind }: { kind: StillKind }) {
  switch (kind) {
    case "draw":
      // A composition mid-draw: layers landed, the next one still arriving.
      return (
        <div className="relative size-full">
          <div className="absolute inset-x-[14%] top-[16%] h-[38%] rounded-[3px] bg-current/25" />
          <div className="absolute inset-x-[24%] top-[30%] h-[38%] rounded-[3px] bg-current/45" />
          <div className="absolute inset-x-[34%] top-[44%] h-[38%] rounded-[3px] border border-current/50 border-dashed" />
        </div>
      );
    case "grade":
      // The Safari filter gap: the same frame with and without its grade.
      return (
        <div className="relative flex size-full">
          <div className="h-full w-1/2 bg-[linear-gradient(160deg,currentColor_0%,transparent_78%)] opacity-55" />
          <div className="h-full w-1/2 bg-current/12" />
          <div className="absolute inset-y-0 left-1/2 w-px bg-current/40" />
        </div>
      );
    case "cascade":
      // The tile entrance: a 45ms step per index, capped at 540ms.
      return (
        <div className="grid size-full grid-cols-4 gap-[3px] p-[9%]">
          {Array.from({ length: 12 }, (_, i) => (
            <span
              key={i}
              className="rounded-[2px] bg-current"
              style={{ opacity: 0.85 - i * 0.06 }}
            />
          ))}
        </div>
      );
    case "seed":
      // Determinism: the same seed, the same take, on any device.
      return (
        <div className="flex size-full flex-col items-center justify-center gap-1">
          <span className="font-mono text-[10px] tracking-[0.2em] opacity-45">
            SEED
          </span>
          <span className="font-mono text-lg tabular-nums">73</span>
        </div>
      );
    case "qr":
      // Three finder corners and one data module, at the shipped 3px radius.
      return (
        <div className="relative size-full p-[18%]">
          <span className="absolute top-[18%] left-[18%] size-[26%] rounded-tl-[3px] border-2 border-r-0 border-b-0 border-current" />
          <span className="absolute top-[18%] right-[18%] size-[26%] rounded-tr-[3px] border-2 border-b-0 border-l-0 border-current" />
          <span className="absolute bottom-[18%] left-[18%] size-[26%] rounded-bl-[3px] border-2 border-t-0 border-r-0 border-current" />
          <span className="absolute right-[22%] bottom-[22%] size-[18%] rounded-[2px] bg-current" />
        </div>
      );
    case "shimmer":
      // The skeleton that sits UNDER the photo until it decodes.
      return (
        <div className="relative size-full overflow-hidden">
          <div className="absolute inset-[12%] rounded-[3px] bg-current/18" />
          <div className="absolute inset-y-[12%] left-[30%] w-[22%] -skew-x-12 bg-current/35 blur-[3px]" />
        </div>
      );
    case "flip":
      // A reorder caught at its midpoint: the ghost slot and the tile in flight.
      return (
        <div className="relative size-full p-[14%]">
          <span className="absolute top-[14%] left-[14%] h-[24%] w-[72%] rounded-[2px] bg-current/45" />
          <span className="absolute top-[42%] left-[14%] h-[24%] w-[72%] rounded-[2px] border border-current/35 border-dashed" />
          <span className="absolute top-[52%] left-[26%] h-[24%] w-[72%] rounded-[2px] bg-current/70" />
        </div>
      );
    case "encode":
      // Frames leaving for the muxer, on a device that is not a server.
      return (
        <div className="flex size-full items-center justify-center gap-[3px] px-[10%]">
          {[0.9, 0.7, 0.5, 0.32, 0.18].map((o, i) => (
            <span
              key={i}
              className="h-[46%] flex-1 rounded-[2px] bg-current"
              style={{ opacity: o }}
            />
          ))}
        </div>
      );
  }
}

/** One still in its frame. Decorative by contract, like every marketing frame. */
function Still({
  kind,
  className,
  ratio = "aspect-[4/5]",
}: {
  kind: StillKind;
  className?: string;
  ratio?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "block overflow-hidden rounded-[3px] bg-current/5 ring-1 ring-current/15",
        ratio,
        className,
      )}
    >
      <CraftStill kind={kind} />
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// D - THE CONTACT SHEET
// ═══════════════════════════════════════════════════════════════════════════
// Voice: caption-led, photo-book back matter. Almost no body copy; every
// artifact carries its fact in the credit register. The argument is made by
// evidence, never by claim: you never read "small team, high standards", you
// see that somebody sweated a 3px gap token and you infer it.

const CONTACT_SHEET_RECEIPTS: {
  kind: StillKind;
  title: string;
  caption: string;
}[] = [
  {
    kind: "draw",
    title: "One draw call, two destinations",
    caption:
      "The same function paints the live player and the frame the encoder steps. The pixels you preview are the pixels you download, by construction rather than by testing.",
  },
  {
    kind: "grade",
    title: "A weaker look beats a crash",
    caption:
      "Safari will not take a CSS filter on a canvas context. So a missing capability degrades the render and never fails it, and every style has to be beautiful with its grade and without it.",
  },
  {
    kind: "cascade",
    title: "45ms apart, capped at 540",
    caption:
      "Album tiles arrive one step behind each other, with a ceiling so a deep gallery cannot queue forever. Photos that land while you are watching skip the queue entirely.",
  },
  {
    kind: "seed",
    title: "The same take, on any device",
    caption:
      "Layouts are seeded off the event id, so a reel reproduces exactly. Shuffle was removed on purpose: an event should have one take, not a slot machine.",
  },
];

function ContactSheet() {
  return (
    <div>
      {/* THE WALL. Craft stills instead of event photos: the media on this page
          is the software. In production this is the [data-mkt-wall] drift that
          the home hero already runs, so the mechanic is not new. */}
      <CinemaFrame className="relative overflow-hidden px-6 pt-14 pb-16">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 grid grid-cols-6 gap-[3px] p-[3px] opacity-45"
        >
          {(
            [
              "draw", "cascade", "qr", "shimmer", "flip", "encode",
              "grade", "seed", "draw", "cascade", "shimmer", "qr",
              "flip", "draw", "encode", "grade", "cascade", "seed",
            ] as StillKind[]
          ).map((kind, i) => (
            <span
              key={i}
              className="aspect-[4/5] rounded-[3px] bg-foreground/[0.04] text-foreground/70"
            >
              <CraftStill kind={kind} />
            </span>
          ))}
        </div>
        {/* The wall reads as texture, not content, so the type stays legible. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            // The wall must READ (it is the direction's whole argument) while
            // the type stays legible, so the scrim is a tight pool over the
            // copy rather than a blanket over the grid.
            background:
              "radial-gradient(58% 46% at 50% 46%, oklch(0.11 0 0 / 0.93) 30%, oklch(0.11 0 0 / 0.62) 68%, oklch(0.11 0 0 / 0.18) 100%)",
          }}
        />
        <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-5 text-center">
          <Eyebrow>Careers</Eyebrow>
          <h1 className="font-heading text-3xl text-balance sm:text-4xl">
            The work nobody will consciously notice.
          </h1>
          <p className="max-w-xl text-sm text-pretty text-muted-foreground sm:text-base">
            Partyreel is built and live and has not launched. Nobody has used it
            yet. One surface, the highlight reel, is good and should be
            extraordinary, and we are hiring one person to own it.
          </p>
          <HiringLine />
        </div>
      </CinemaFrame>

      {/* THE CONTACT SHEET. /about already owns "principles, all checkable" for
          customers; this is the engineer's register: craft decisions with their
          receipt attached, numbered like frames on a strip. */}
      <PaperCut className="px-6 py-12">
        <div className="mx-auto max-w-3xl">
          <Eyebrow>Contact sheet</Eyebrow>
          <h2 className="mt-2 font-heading text-xl text-balance sm:text-2xl">
            Four frames from the build.
          </h2>
          <p className="mt-2 max-w-xl text-sm text-pretty text-muted-foreground">
            Every one of these is in the shipped product today. You can check
            all four before you write a word to us.
          </p>
          <ol className="mt-8 grid gap-x-8 gap-y-8 sm:grid-cols-2">
            {CONTACT_SHEET_RECEIPTS.map((receipt, i) => (
              <li key={receipt.title} className="flex gap-4">
                <Still
                  kind={receipt.kind}
                  ratio="aspect-[4/5]"
                  className="w-16 shrink-0"
                />
                <div className="flex flex-col gap-1.5">
                  <span className="font-mono text-[11px] tracking-wider text-muted-foreground tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="font-heading text-base">{receipt.title}</h3>
                  <p className="text-[13px] leading-relaxed text-pretty text-muted-foreground">
                    {receipt.caption}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </PaperCut>

      {/* THE ROLE, on the room. The pile is the signature gesture: scattered,
          then gathered, which is the product's own thesis performed once. */}
      <CinemaFrame className="px-6 py-12">
        <div className="mx-auto grid max-w-3xl items-center gap-8 sm:grid-cols-[1fr_auto]">
          <div className="flex flex-col gap-4">
            <Eyebrow>The open position</Eyebrow>
            <h2 className="font-heading text-xl text-balance sm:text-2xl">
              {ROLE_TITLE}
            </h2>
            <p className="text-sm leading-relaxed text-pretty text-muted-foreground">
              Fourteen styles ship today, eight moods and six treatments, and
              not one is a template with the colours swapped. There are no
              render servers behind them because we deleted ours: about eleven
              thousand nine hundred lines of rented render farm came out, and
              the whole export moved onto the host&rsquo;s own phone.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Button size="sm" className="h-9">
                Read the role
              </Button>
              <span className="text-xs text-muted-foreground">
                or go run the engine at /reel
              </span>
            </div>
          </div>
          <StackFan />
        </div>
      </CinemaFrame>

      <PaperCut className="px-6 py-9">
        <div className="mx-auto flex max-w-3xl flex-wrap items-baseline justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Not this role? Tell us what you&rsquo;d build.
          </p>
          <MonoCaption>A Partyreel production / partyreel.com</MonoCaption>
        </div>
      </PaperCut>
    </div>
  );
}

/**
 * The signature gesture: a pile that fans on hover. In production this is the
 * .mkt-stack card-stack-hover recipe already tokened in marketing.css (springs
 * absorbed into --mkt-ease-pop, hover-gated so a touch tap cannot stick it
 * open); hand-rolled here because that sheet does not load in the lab.
 *
 * Geometry rides INLINE custom properties exactly like the real recipe does:
 * a template-literal class (`group-hover:${...}`) would never survive
 * Tailwind's static scan, so the rest pose and the fan delta are vars and the
 * two group-hover utilities that read them are literal strings.
 */
function StackFan() {
  const cards: {
    kind: StillKind;
    pose: { "--cx": string; "--cy": string; "--rot": string };
    fan: { "--fx": string; "--fy": string; "--frot": string };
  }[] = [
    {
      kind: "qr",
      pose: { "--cx": "-8px", "--cy": "0px", "--rot": "-6deg" },
      fan: { "--fx": "-52px", "--fy": "-6px", "--frot": "-14deg" },
    },
    {
      kind: "shimmer",
      pose: { "--cx": "0px", "--cy": "0px", "--rot": "3deg" },
      fan: { "--fx": "50px", "--fy": "-4px", "--frot": "9deg" },
    },
    {
      kind: "encode",
      pose: { "--cx": "4px", "--cy": "0px", "--rot": "-1deg" },
      fan: { "--fx": "-16px", "--fy": "-34px", "--frot": "-3deg" },
    },
    {
      kind: "draw",
      pose: { "--cx": "0px", "--cy": "0px", "--rot": "1deg" },
      fan: { "--fx": "20px", "--fy": "-30px", "--frot": "4deg" },
    },
  ];
  return (
    <div className="group relative mx-auto size-44 shrink-0">
      {cards.map((card, i) => (
        <span
          key={i}
          style={{ ...card.pose, ...card.fan } as CSSProperties}
          className={cn(
            "absolute top-1/2 left-1/2 -ml-10 -mt-12 w-20",
            "[translate:var(--cx)_var(--cy)] [rotate:var(--rot)]",
            "transition-[translate,rotate] duration-300 ease-emphasis",
            "group-hover:[translate:var(--fx)_var(--fy)] group-hover:[rotate:var(--frot)]",
            "motion-reduce:transition-none",
          )}
        >
          <Still kind={card.kind} className="bg-foreground/[0.07]" />
        </span>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// E - THE HANDOFF
// ═══════════════════════════════════════════════════════════════════════════
// Voice: two of them, running in parallel. Warm host in the column, flat and
// factual in the gutter. That tension IS the brand: we write to people warmly
// and to ourselves precisely. The device is this codebase's real signature -
// every file opens with why it is the way it is and what was rejected - and no
// careers page is built out of that register.
//
// DISCIPLINE: exactly seven annotations on the whole page. Annotate forty
// things and it is noise. In production the gutter collapses on mobile via the
// 21-accordion recipe already in marketing.css (grid-rows 0fr to 1fr, no JS
// measuring), so the phone reads one clean column with the notes on demand.

/** One block of host-voice copy with its engineering annotation alongside. */
function Annotated({
  note,
  children,
}: {
  /** The gutter annotation. Omit for a block that earns no note. */
  note?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-x-8 gap-y-2 lg:grid-cols-[1fr_13rem]">
      <div className="min-w-0">{children}</div>
      {note ? (
        <p className="border-t pt-2 font-mono text-[11px] leading-relaxed text-pretty text-muted-foreground lg:border-t-0 lg:border-l lg:pt-0 lg:pl-4">
          {note}
        </p>
      ) : (
        <span aria-hidden />
      )}
    </div>
  );
}

const HANDOFF_PROBLEMS: { title: string; body: string; note: string }[] = [
  {
    title: "Grades that cannot be relied on",
    body: "Safari refuses a CSS filter string on a canvas context, so a style that leans on its grade has to be beautiful without one too. Every look needs a second look that is still worth watching.",
    note: "filterOk is false there. The engine reports the gap and skips, because a reel with a weaker look still beats a crashed reel.",
  },
  {
    title: "Backpressure, on somebody's phone",
    body: "The export steps the same draw loop the player runs, so a fast device will happily buffer frames faster than the encoder drains them. Getting that budget right on a mid-range phone is most of the work.",
    note: "The encode loop is the only place in the product where going faster is a bug.",
  },
  {
    title: "Fourteen styles, and the fifteenth",
    body: "Eight moods and six treatments ship today, all Canvas2D, all driven by one shared draw function. The interesting question is not how to add a style. It is what a style is allowed to be.",
    note: "Pinned by a test at 8 + 6, so the catalog cannot drift silently.",
  },
  {
    title: "The same reel, twice",
    body: "Layouts are seeded off the event id so a reel reproduces exactly, on any device, forever. Shuffle came out on purpose: an event deserves one take, not a slot machine.",
    note: "Seeds stay under 1e6 so the multiply stays exact in V8. That is the kind of detail this job is made of.",
  },
];

function Handoff() {
  return (
    <div>
      <CinemaFrame className="px-6 pt-14 pb-12">
        <div className="mx-auto max-w-3xl">
          <Annotated note="Live at partyreel.com. Nobody has used it yet, and that is deliberate: it is built, and it has not launched.">
            <Eyebrow>Careers</Eyebrow>
            <h1 className="mt-3 font-heading text-3xl text-balance sm:text-4xl">
              You would be handed the reel engine.
            </h1>
            <p className="mt-4 max-w-xl text-sm text-pretty text-muted-foreground sm:text-base">
              Not a ticket queue on it. The engine: the canvas, the styles, the
              export, and the judgement about what a thirty second film of
              somebody&rsquo;s night should feel like.
            </p>
            <div className="mt-5">
              <HiringLine />
            </div>
          </Annotated>
        </div>
      </CinemaFrame>

      {/* What you would be handed, stated as its real condition rather than as
          a solved brag. Every careers page sells solved problems; the open ones
          are the only part a good engineer is actually buying. */}
      <PaperCut className="px-6 py-12">
        <div className="mx-auto flex max-w-3xl flex-col gap-9">
          <Annotated note="About eleven thousand nine hundred lines of rented render farm came out in one ruling. Renders moved onto the host's own device and stopped costing anything.">
            <Eyebrow>The state of it</Eyebrow>
            <h2 className="mt-2 font-heading text-xl text-balance sm:text-2xl">
              It works. That is the starting line.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-pretty text-muted-foreground">
              One draw function paints the live player and the frame the encoder
              steps, so the pixels a host previews are the pixels they download.
              There are no render servers. You can go and run the whole thing in
              your browser before you decide whether any of this interests you.
            </p>
          </Annotated>

          <div className="flex flex-col gap-8 border-t pt-8">
            <h2 className="font-heading text-lg sm:text-xl">The hard parts</h2>
            {HANDOFF_PROBLEMS.map((problem) => (
              <Annotated key={problem.title} note={problem.note}>
                <h3 className="font-heading text-base">{problem.title}</h3>
                <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-pretty text-muted-foreground">
                  {problem.body}
                </p>
              </Annotated>
            ))}
          </div>
        </div>
      </PaperCut>

      <CinemaFrame className="px-6 py-12">
        <div className="mx-auto max-w-3xl">
          <Annotated note="Every application gets read. The hiring badge that brought you here is derived from the open roles, so it takes itself down the day the last one closes.">
            <h2 className="font-heading text-xl text-balance sm:text-2xl">
              {ROLE_TITLE}
            </h2>
            <p className="mt-3 max-w-xl text-sm text-pretty text-muted-foreground">
              Send a link to something you made that moves. No degree, no
              resume, no cover letter, no event industry experience. The link is
              the whole application.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Button size="sm" className="h-9">
                Read the role
              </Button>
              <Button size="sm" variant="outline" className="h-9">
                Go run the engine
              </Button>
            </div>
          </Annotated>
        </div>
      </CinemaFrame>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// C - ONE ROOM
// ═══════════════════════════════════════════════════════════════════════════
// Radical focus: /careers IS the role. Single column, one idea per viewport, no
// grid anywhere. The job turns the page to paper, which is pricing's ruled move
// ("the money turns the page to paper") re-aimed. Motion is near zero: on a
// site where everything reveals and drifts, holding perfectly still reads as
// confidence.
//
// SHARPENED AGAINST ITS OWN FAILURE MODE: "radical focus" and "we have nothing
// to say" render identically, and a near-empty dark page with one job on it is
// the literal visual of a company that is not hiring. So it opens on PROOF -
// three facts, at size - and never on a void.

const ONE_ROOM_FACTS: { value: string; label: string }[] = [
  { value: "14", label: "styles, hand built" },
  { value: "1", label: "draw function" },
  { value: "0", label: "render servers" },
];

function OneRoom() {
  return (
    <div>
      {/* The proof, first. No pitch: the candidate already read the pitch. */}
      <CinemaFrame className="px-6 pt-16 pb-14">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-10 text-center">
          <Eyebrow>One open role</Eyebrow>
          <div className="flex items-start justify-center gap-10 sm:gap-16">
            {ONE_ROOM_FACTS.map((fact) => (
              <div key={fact.label} className="flex flex-col items-center gap-1.5">
                <span className="font-mono text-3xl tabular-nums sm:text-4xl">
                  {fact.value}
                </span>
                <span className="max-w-[7rem] text-[11px] leading-tight text-balance text-muted-foreground">
                  {fact.label}
                </span>
              </div>
            ))}
          </div>
          <p className="max-w-lg text-sm text-pretty text-muted-foreground">
            The highlight reel is drawn on a canvas, encoded on the
            host&rsquo;s own phone, and costs nothing to make. It is the best
            thing we have built and it is nowhere near finished.
          </p>
        </div>
      </CinemaFrame>

      {/* The hierarchy cliff IS the design: the title at the route ceiling,
          then a hard drop straight into a reading column. */}
      <CinemaFrame className="border-t border-foreground/10 px-6 pt-12 pb-16">
        <div className="mx-auto max-w-2xl">
          <h1 className="font-heading text-4xl text-balance sm:text-5xl">
            {ROLE_TITLE}
          </h1>
          <div className="mt-5">
            <HiringLine />
          </div>
          <p className="mt-7 text-sm leading-relaxed text-pretty text-muted-foreground sm:text-base">
            You would own the engine end to end: eight moods, six treatments,
            one shared draw function that paints both the live player and the
            frame the encoder steps. Getting the export to stay fast on a phone
            somebody actually owns is most of the job. Deciding what the
            fifteenth style is allowed to be is the rest of it.
          </p>
        </div>
      </CinemaFrame>

      {/* The job turns the page to paper: the document register for the spec. */}
      <PaperCut className="px-6 py-12">
        <div className="mx-auto flex max-w-2xl flex-col gap-8">
          <div>
            <Eyebrow>Where it stands</Eyebrow>
            <p className="mt-3 text-sm leading-relaxed text-pretty text-muted-foreground">
              Partyreel is small, early, and moving fast. The product is built
              and live at partyreel.com, it has not launched, and nobody has
              used it yet. There is no legacy, no committee, and nothing between
              you and the thing you ship. It also means you would be building
              for an audience that does not exist yet. If that trade is
              obviously yours, the rest of this page is for you.
            </p>
          </div>
          <div className="border-t pt-8">
            <Eyebrow>What you do not need</Eyebrow>
            <p className="mt-3 text-sm leading-relaxed text-pretty text-muted-foreground">
              No degree, no resume, no cover letter, no event industry
              experience, and no company name we would recognise. A link to
              something you made that moves is the whole application.
            </p>
          </div>
          <div className="border-t pt-8">
            <ApplySketch />
          </div>
        </div>
      </PaperCut>
    </div>
  );
}

/**
 * The application card, link-first. Today the form asks for a name, an email,
 * OPTIONAL links, and a REQUIRED free-text note ("tell us why you'd be a great
 * fit"). For a senior graphics engineer that is inverted: the work is the whole
 * signal and a blank cover-letter box is the highest-friction, lowest-
 * information thing you can put in front of someone who has options. So the
 * work link becomes required and moves up, and the note becomes optional with
 * one specific question a strong candidate enjoys and a weak one cannot fake.
 * Dress is the contact round's ruling: a card on the gray panel, fields
 * explicitly bg-background so white reads against it.
 */
function ApplySketch() {
  const [sent, setSent] = useState(false);
  return (
    <div className="rounded-2xl border bg-muted/50 p-5 sm:p-6">
      <h2 className="font-heading text-lg">Apply</h2>
      <p className="mt-1 text-[13px] text-muted-foreground">
        We read every application.
      </p>
      {sent ? (
        <div className="mt-5 flex flex-col gap-2">
          <span className="text-success" aria-hidden>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </span>
          <p className="text-sm font-medium">In, and it will get read.</p>
          <MonoCaption>
            The delight beat lands here: your name draws as one more frame of
            the reel.
          </MonoCaption>
        </div>
      ) : (
        <div className="mt-5 flex flex-col gap-3">
          <Input placeholder="Your name" className="bg-background" />
          <Input placeholder="you@example.com" className="bg-background" />
          <Input
            placeholder="Something you made that moves. A repo, a shader, a reel."
            className="bg-background"
          />
          <div className="flex items-center gap-3 pt-1">
            <Button size="sm" className="h-9" onClick={() => setSent(true)}>
              Send it
            </Button>
            <span className="text-xs text-muted-foreground">
              One optional question follows.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── The touchpoint page ──────────────────────────────────────────────────────

export function CareersIdentityVariants() {
  return (
    <div className="flex flex-col gap-12">
      <Frame
        letter="D"
        name="The contact sheet"
        note="Careers as an album of the build. The product's thesis says the best record of an event is the candid material gathered in one place, so the page applies it to the company: the media is the craft itself, drawn as DOM art rather than photographed. No people in it, and it scales from one role to six."
        motion="The wall drifts on the home hero's existing [data-mkt-wall] loop. The pile fans on the .mkt-stack recipe (hover-gated, springs on --mkt-ease-pop) - scattered, then gathered, which is the product's own thesis performed once. Receipts arrive on the standard reveal stagger."
      >
        <ContactSheet />
      </Frame>

      <Frame
        letter="E"
        name="The handoff"
        note="The annotated page, built from this codebase's real signature: every file here opens with why it is the way it is and what was rejected. Warm host voice in the column, flat engineering voice in the hairline gutter. It sells the UNSOLVED problems, which is the only part a good engineer is actually buying. Exactly seven annotations, on purpose."
        motion="Each gutter note reveals one stagger slot BEHIND its block, so the page appears to annotate itself as you read. On mobile the gutter collapses into the 21-accordion recipe (grid-rows 0fr to 1fr, no JS measuring) so the phone gets one clean column."
      >
        <Handoff />
      </Frame>

      <Frame
        letter="C"
        name="One room"
        note="Radical focus: /careers IS the role. One idea per viewport, no grid anywhere, and the job turns the page to paper. Sharpened against its own failure mode, since focus and having nothing to say render identically: it opens on three facts at size, never on a void."
        motion="Near zero, deliberately. One cut on the title and then stillness, which on a site where everything reveals and drifts reads as confidence. The single beat is at submit."
      >
        <OneRoom />
      </Frame>
    </div>
  );
}
