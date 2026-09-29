"use client";

import "@/components/guest/door.css";
import "./locked-door.css";

import type { CSSProperties, ReactNode } from "react";
import { Eye, KeyRound, Link2, Lock, type LucideIcon } from "lucide-react";

import { DoorHeading } from "@/components/guest/door/heading";
import {
  DOOR_SCRIM,
  DoorGlyph,
  DoorLamp,
  DoorPool,
  useDoorLitVars,
} from "@/components/guest/door/lit";
import { DOOR_SHEET } from "@/components/guest/entry-shell";
import { GhostRiver } from "@/components/guest/gallery-empty-state";
import { Logo } from "@/components/shared/logo";
import { NotFoundScreen } from "@/components/shared/not-found-screen";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { floatingEdgeEntranceResponsive } from "@/components/ui/floating-layer";
import { useDoorHues } from "@/lib/guest/door-light";
import { cn } from "@/lib/utils";

import { COVER, EVENT, HOST, type Reader } from "./fixtures";
import { BACK_IN, type Line, type LockId, WAY_OUT, type Words } from "./words";

/**
 * THE FIVE LOCKED SCREENS, EACH A FUNCTION OF WHO IS READING AND NOTHING ELSE.
 *
 * `today` and `lit` are the not-found family (`NotFoundScreen`, the real one:
 * `lit` hands it its lit lock through the component's own `visual` slot, so the
 * option is production's screen wearing light, not a lookalike). `door`, `host`
 * and `cover` are the held door (`entry-shell.tsx`), QUOTED because the real
 * Sheet portals out of the frame: the one product Sheet's classes and posture,
 * the door's padding (`DOOR_SHEET`) and scrim (`DOOR_SCRIM`), the lamp on its
 * free edge. What renders no portal is the real piece: the lamp, the heading,
 * the glyph, the pool, the ghost river.
 *
 * ★ THE COVER'S LIGHT IS QUOTED, AND IT HAS TO BE. The real lamp reads one
 * module store (`door-light.ts`) that every frame on this board shares, since
 * each frame's tree is portalled from the lab's own page: publishing the
 * photograph's hues would repaint every lamp on the board. So `cover` draws the
 * lamp's own markup with its own hues, and its glyph and pools the same way.
 */

/* ── the page's own furniture ──────────────────────────────────────────────── */

/**
 * THE HEADER, QUOTED (`guest-header.tsx`): the wordmark, then who this device
 * is. A stranger meets "Start for free"; a signed-in guest her own face (the
 * account menu's trigger). It resolves a session on mount in production, which
 * a frame may not.
 */
export function GuestTop({ reader }: { reader: Reader }) {
  return (
    <header className="flex items-center justify-between gap-2 border-b border-border/60 px-5 py-3">
      <span className="flex items-center gap-2.5">
        <Logo />
      </span>
      <div className="flex h-8 items-center">
        {reader.who.kind === "stranger" ? (
          <Button variant="ghost" size="sm" tabIndex={-1}>
            Start for free
          </Button>
        ) : (
          <Avatar seed={reader.who.seed}>
            <AvatarFallback>{reader.who.name.slice(0, 1)}</AvatarFallback>
          </Avatar>
        )}
      </div>
    </header>
  );
}

/**
 * THE WAY BACK FOR SOMEONE ALREADY IN, ON A NEW PHONE (event-safety's
 * `back-in` call). Drawn for a reader with no confirmed email and nobody else,
 * on every cause alike: a line one cause drew and the others did not would tell
 * them apart. Worded and linked like the not-found family's quiet line
 * (`HelpLine`).
 */
export function BackIn({ className }: { className?: string }) {
  return (
    <p
      data-ld-backin
      className={cn("text-sm text-muted-foreground", className)}
    >
      {BACK_IN.lead}{" "}
      <span className="font-medium text-foreground underline decoration-border underline-offset-4">
        {BACK_IN.link}
      </span>
    </p>
  );
}

/** Today's one way out, as the private branch draws it (outline, not a push). */
function WayOut({ className }: { className?: string }) {
  return (
    <Button size="cta" variant="outline" tabIndex={-1} className={className}>
      {WAY_OUT}
    </Button>
  );
}

/* ── the not-found family: today, and today lit ────────────────────────────── */

/** The column as the private branch lays it: the header, then the screen centred. */
function Column({
  reader,
  lit = false,
  children,
}: {
  reader: Reader;
  lit?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <GuestTop reader={reader} />
      {/* `isolate` gives the lit lock's spill (z -1) a floor under the words
          and above the page's own ground. */}
      <main
        className={cn(
          "flex flex-1 flex-col items-center justify-center px-5 py-20",
          lit && "isolate",
        )}
      >
        {children}
      </main>
    </div>
  );
}

/** Production's private branch, word for word, for the reader in front of it. */
function TodayScreen({ reader, words }: { reader: Reader; words: Words }) {
  return (
    <Column reader={reader}>
      <NotFoundScreen
        icon={Lock}
        title={words.title}
        description={<span data-ld-words>{prose(words.lines)}</span>}
        actions={<WayOut />}
      />
    </Column>
  );
}

/**
 * THE LOCK IN A POOL OF THE HOUSE LIGHT, for `lit`. A new lamp answers four
 * questions (design-system.md): the lock itself is lit, from behind, in the
 * lamp set's house five (nothing of a locked album may be sampled), and the
 * pool it sits in admits it. The spill is the door lamp's own blobs and drift
 * (`lit.css`, still under reduced motion), laid round the lock instead of along
 * an edge, and masked so the light is spent before the headline under it.
 */
function LitLock() {
  const vars = useDoorLitVars();
  const { hues } = useDoorHues();
  return (
    <div className="relative flex items-center justify-center">
      <div
        data-ld-spill
        aria-hidden
        className="door-lamp ld-spill"
        style={vars}
      >
        <span className="door-lamp-blob door-lamp-b1" />
        <span className="door-lamp-blob door-lamp-b2" />
        <span className="door-lamp-blob door-lamp-b3" />
      </div>
      <span
        aria-hidden
        className="door-pool relative flex size-14 items-center justify-center rounded-full text-foreground"
        style={{ "--pool-h": hues[0] } as CSSProperties}
      >
        <Lock className="size-6" />
      </span>
    </div>
  );
}

function LitScreen({ reader, words }: { reader: Reader; words: Words }) {
  return (
    <Column reader={reader} lit>
      <NotFoundScreen
        visual={<LitLock />}
        title={words.title}
        description={<span data-ld-words>{prose(words.lines)}</span>}
        actions={<WayOut />}
        footnote={reader.confirmed ? undefined : <BackIn />}
      />
    </Column>
  );
}

/* ── the held door, shut ───────────────────────────────────────────────────── */

/** `ui/sheet.tsx`'s panel, quoted: its content keeps its classes private. */
const SHEET_PANEL =
  "fixed z-50 flex flex-col gap-4 bg-popover bg-clip-padding text-sm text-popover-foreground shadow-layer";

/**
 * THE LAMP'S OWN MARKUP WITH HUES OF ITS OWN (see the file's header): the free
 * edge, the three blobs and the bright line, exactly as `DoorLamp` draws them,
 * so `lit.css` lights it the same way. `data-door-hues` is what the frame's
 * caption reads, as it reads the real lamp's.
 */
function QuotedLamp({ hues }: { hues: readonly number[] }) {
  return (
    <div
      data-door-lamp="base"
      data-door-hues={hues.slice(0, 3).map(Math.round).join(",")}
      aria-hidden
      className="door-lamp door-lamp-free"
      style={litVars(hues)}
    >
      <span className="door-lamp-blob door-lamp-b1" />
      <span className="door-lamp-blob door-lamp-b2" />
      <span className="door-lamp-blob door-lamp-b3" />
      <span className="door-lamp-edge" />
    </div>
  );
}

const litVars = (hues: readonly number[]) =>
  ({
    "--lit-h1": hues[0],
    "--lit-h2": hues[1],
    "--lit-h3": hues[2],
  }) as CSSProperties;

/**
 * THE DOOR, HELD AND SHUT: the page behind (the ghost river, or the album's
 * cover), the door's scrim over all of it, and the one product Sheet in the
 * door's padding, no close and no handle (a held step has no exit), its lamp on
 * the free edge: the top in a hand, the left at a desk.
 */
function HeldShut({
  reader,
  behind,
  hues,
  children,
}: {
  reader: Reader;
  behind: ReactNode;
  /** The photograph's own hues for a quoted lamp; omitted, the real lamp. */
  hues?: readonly number[];
  children: ReactNode;
}) {
  return (
    <div className="relative min-h-svh bg-background text-foreground">
      <GuestTop reader={reader} />
      {behind}
      <div
        aria-hidden
        className={cn(
          "fixed inset-0 z-50 bg-black/10 supports-backdrop-filter:backdrop-blur-xs",
          DOOR_SCRIM,
        )}
      />
      <div
        data-entry-sheet
        data-door-lit=""
        data-side="responsive"
        className={cn(SHEET_PANEL, floatingEdgeEntranceResponsive, DOOR_SHEET)}
      >
        {hues ? <QuotedLamp hues={hues} /> : <DoorLamp edge="free" />}
        <div className="relative pt-1">{children}</div>
      </div>
    </div>
  );
}

/**
 * NOTHING REAL BEHIND A SHUT DOOR (event-safety's `nothing-behind`): the ghost
 * river a password page shows, in the reading column, under the album's name
 * where the option shows it.
 */
function River({ named }: { named: boolean }) {
  return (
    <div className="w-full max-w-2xl px-5 pt-6">
      {named && (
        <p className="font-heading text-page text-balance">{EVENT.name}</p>
      )}
      <div className={named ? "mt-8" : "mt-2"}>
        <GhostRiver />
      </div>
    </div>
  );
}

/** The album's newest photograph as the page's ground, for the one option that shows it. */
function CoverGround() {
  return (
    <div className="absolute inset-x-0 top-[57px] bottom-0 overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element -- a bootstrap still standing in for the album's newest photograph */}
      <img
        data-ld-shows="photo"
        src={COVER.src}
        alt=""
        className="size-full object-cover"
      />
    </div>
  );
}

/** The foot every shut door ends on: the one way out, then the way back in. */
function DoorFoot({ reader }: { reader: Reader }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <WayOut className="w-full" />
      {!reader.confirmed && <BackIn className="text-center" />}
    </div>
  );
}

/**
 * `door`: THE GATE'S OWN GRAMMAR, SHUT. Every step of the door heads this way
 * (`door/heading.tsx`, from the left), and the gate's eyebrow is its lit Lock
 * beside a word ("Almost in"); here the word is the state, the headline the
 * way on, the reason the way back.
 */
function DoorScreen({ reader, words }: { reader: Reader; words: Words }) {
  return (
    <HeldShut reader={reader} behind={<River named={false} />}>
      <div className="flex flex-col gap-6">
        <DoorHeading
          eyebrow={
            <>
              <DoorGlyph icon={Lock} hue={1} className="size-3" />
              <span data-ld-words>{words.eyebrow}</span>
            </>
          }
          title={
            <span data-ld-words data-ld-title>
              {words.title}
            </span>
          }
          reason={<span data-ld-words>{prose(words.lines)}</span>}
        />
        <DoorFoot reader={reader} />
      </div>
    </HeldShut>
  );
}

/** A glyph in a line, in a light of its own (the quoted twin of `DoorGlyph`). */
function Glyph({ icon: Icon, hue }: { icon: LucideIcon; hue: number }) {
  return (
    <Icon
      aria-hidden
      className="door-glyph size-3 shrink-0"
      style={{ "--glyph-h": hue } as CSSProperties}
    />
  );
}

/** A pool in a light of its own (the quoted twin of `DoorPool`). */
function Pool({ hue, children }: { hue: number; children: ReactNode }) {
  return (
    <span
      aria-hidden
      className="door-pool relative flex size-9 shrink-0 items-center justify-center rounded-full text-foreground [&>svg]:size-4.5"
      style={{ "--pool-h": hue } as CSSProperties}
    >
      {children}
    </span>
  );
}

/** A row's glyph, by what its line says (`words.ts`'s `mark`). */
const MARKS: Record<Line["mark"], LucideIcon> = {
  key: KeyRound,
  link: Link2,
  lock: Lock,
  eye: Eye,
};

/** Where a screen draws its lines as one paragraph. */
const prose = (lines: readonly Line[]) => lines.map((l) => l.text).join(" ");

/**
 * `host` and `cover`: THE WELCOME'S HERO, SHUT (`entry-modal.tsx`'s
 * `WelcomeStep`, the door's one screen with a hero): the eyebrow, the album's
 * name large beside the host's face, then rows on pools of the lamp's light
 * where the welcome's two promises stand. It stands as tall as the welcome
 * does in a hand (`data-welcome-step`, `door.css`'s 55svh), so a guest who met
 * the welcome here meets the same door, shut.
 */
function HostSheet({
  reader,
  words,
  hues,
}: {
  reader: Reader;
  words: Words;
  hues?: readonly number[];
}) {
  return (
    <div data-welcome-step className="flex flex-col gap-5">
      <div className="flex flex-col">
        <p
          data-door-line
          style={revealAt(0)}
          className="flex items-center gap-1.5 text-label font-medium text-muted-foreground uppercase"
        >
          {hues ? (
            <Glyph icon={Lock} hue={hues[0]} />
          ) : (
            <DoorGlyph icon={Lock} hue={1} className="size-3" />
          )}
          <span data-ld-words>{words.eyebrow}</span>
        </p>
        <p
          data-ld-words
          data-ld-title
          data-door-line
          style={revealAt(1)}
          className="mt-1.5 font-heading text-hero text-balance sm:text-section"
        >
          {words.title}
        </p>
        <div
          data-ld-shows="host"
          data-door-line
          style={revealAt(2)}
          className="mt-3 flex items-center gap-2.5"
        >
          <Avatar seed={HOST.seed} size="lg">
            <AvatarFallback>{HOST.name.slice(0, 1)}</AvatarFallback>
          </Avatar>
          <p className="text-working leading-snug text-muted-foreground">
            Hosted by{" "}
            <span className="font-medium text-foreground">{HOST.name}</span>
          </p>
        </div>
      </div>
      {/* The welcome's promise rows (`PromiseRow`), class for class: a pool
          of the lamp's light, its glyph in ink, the line beside it. */}
      <div className="flex flex-col gap-4">
        {words.lines.map((line, i) => {
          const Icon = MARKS[line.mark];
          const glyph = <Icon strokeWidth={1.75} />;
          return (
            <p
              key={line.text}
              data-door-line
              style={revealAt(3 + i)}
              className="flex items-center gap-3.5 text-base leading-relaxed"
            >
              {hues ? (
                <Pool hue={hues[i % 3]}>{glyph}</Pool>
              ) : (
                <DoorPool hue={i === 0 ? 1 : 2}>{glyph}</DoorPool>
              )}
              <span data-ld-words>{line.text}</span>
            </p>
          );
        })}
      </div>
      <div className="mt-auto">
        <DoorFoot reader={reader} />
      </div>
    </div>
  );
}

/** A line's place in the door's text reveal (`entry-modal.tsx`'s `lineStyle`). */
const revealAt = (i: number) => ({ "--door-line-i": i }) as CSSProperties;

/* ── the one entry point ───────────────────────────────────────────────────── */

/**
 * One locked screen for one reader. `hues` are the cover's own (sampled by the
 * board off the photograph, never typed), for `cover` alone.
 */
export function LockScreen({
  lock,
  reader,
  words,
  hues,
}: {
  lock: LockId;
  reader: Reader;
  words: Words;
  hues: readonly number[] | null;
}) {
  switch (lock) {
    case "today":
      return <TodayScreen reader={reader} words={words} />;
    case "lit":
      return <LitScreen reader={reader} words={words} />;
    case "door":
      return <DoorScreen reader={reader} words={words} />;
    case "host":
      return (
        <HeldShut reader={reader} behind={<River named />}>
          <HostSheet reader={reader} words={words} />
        </HeldShut>
      );
    case "cover":
      return (
        <HeldShut
          reader={reader}
          behind={<CoverGround />}
          hues={hues ?? undefined}
        >
          <HostSheet reader={reader} words={words} hues={hues ?? undefined} />
        </HeldShut>
      );
  }
}
