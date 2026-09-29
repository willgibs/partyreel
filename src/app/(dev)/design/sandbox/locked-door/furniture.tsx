"use client";

import "@/components/guest/door.css";
import "@/components/guest/door/lit.css";
import "./locked-door.css";

import {
  createContext,
  type CSSProperties,
  type ReactNode,
  useContext,
  useMemo,
} from "react";
import {
  BellRing,
  Camera,
  DoorOpen,
  Images,
  KeyRound,
  Link2,
  Lock,
  type LucideIcon,
  QrCode,
} from "lucide-react";

import { DOOR_SCRIM } from "@/components/guest/door/lit";
import { DOOR_SHEET } from "@/components/guest/entry-shell";
import { GhostRiver } from "@/components/guest/gallery-empty-state";
import { LegalConsentLine } from "@/components/shared/legal-consent-line";
import { Logo } from "@/components/shared/logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { floatingEdgeEntranceResponsive } from "@/components/ui/floating-layer";
import { HOUSE_HUES, hueOfOklch } from "@/lib/guest/door-light";
import { useSampledPalette } from "@/lib/shared/sampled-palette";
import { cn, formatEventDate } from "@/lib/utils";

import type { Hues } from "./door-props";
import {
  ALBUM,
  EVENT,
  HOST,
  NEWEST,
  PICKS,
  type Reader,
  type Still,
} from "./fixtures";
import {
  ASKED,
  BACK_IN,
  BEAT,
  type Line,
  LOST,
  type Mark,
  PICK,
  UNLISTED,
  WAY_OUT,
  WELCOME,
} from "./words";

/**
 * THE DOOR'S FURNITURE, SHARED BY EVERY DIRECTION: the page's own header, the
 * held sheet and its lamp, the page behind it, the pools, the foot, the beat.
 *
 * ★ WHAT RENDERS NO PORTAL IS THE REAL PIECE (the ghost river, the heading's
 * classes, the not-found screen, the consent line, the avatar, the button),
 * and what would portal or read a session is QUOTED class for class (the Sheet
 * panel, the guest header).
 *
 * ★ THE LIGHT IS QUOTED, AND IT HAS TO BE (round one's finding, kept). The real
 * lamp, pools and glyphs read one module store (`door-light.ts`) that every
 * frame on this board shares, since each frame's tree is portalled from the lab
 * page: publishing the album's hues would repaint every lamp on the board,
 * the shut doors' included. So every lit piece here draws the real classes
 * (`lit.css`) with hues of its own, and carries `data-door-hues` as the real
 * lamp does, which is what the caption reads.
 */

/* ── the light: the album's own, or the house five ─────────────────────────── */

/** The house five, the light of every door nothing may be sampled for. */
export const HOUSE: Hues = HOUSE_HUES;

const AlbumHuesCtx = createContext<Hues>(HOUSE);

/**
 * THE ALBUM'S HUES, SAMPLED OFF ITS NEWEST THREE PHOTOGRAPHS, never typed: the
 * sampler the album's own lamp uses (`useSampledPalette`, the URL form), kept as
 * hues so the register stays the stylesheet's, exactly as `album-light.tsx`
 * hands them to the door. Once, for the whole board: the house five until the
 * sample lands, as production's lamp does.
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

/** The album's light, where the door may wear it (a Public album's welcome, the beat). */
export const useAlbumHues = (): Hues => useContext(AlbumHuesCtx);

/** The hues a lit piece names in its `data-door-hues`, as the real lamp writes them. */
export const huesAttr = (hues: Hues) =>
  hues.slice(0, 3).map(Math.round).join(",");

/** The three custom properties every lit rule reads (`lit.css`'s `--lit-h1..3`). */
export const litVars = (hues: Hues) =>
  ({
    "--lit-h1": hues[0],
    "--lit-h2": hues[1],
    "--lit-h3": hues[2],
  }) as CSSProperties;

/* ── the page's own furniture ──────────────────────────────────────────────── */

/**
 * THE HEADER, QUOTED (`guest-header.tsx`): the wordmark, then who this device
 * is. A stranger meets "Start for free"; a signed-in guest her own face (the
 * account menu's trigger). It resolves a session on mount in production, which
 * a frame may not. `bar` is the session-less `GuestBar` a 404 wears.
 */
export function GuestTop({ reader, bar }: { reader?: Reader; bar?: boolean }) {
  return (
    <header className="relative z-10 flex items-center justify-between gap-2 border-b border-border/60 px-5 py-3">
      <span className="flex items-center gap-2.5">
        <Logo />
      </span>
      {!bar && reader && (
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
      )}
    </header>
  );
}

/** `ui/sheet.tsx`'s panel, quoted: its content keeps its classes private. */
const SHEET_PANEL =
  "fixed z-50 flex flex-col gap-4 bg-popover bg-clip-padding text-sm text-popover-foreground shadow-layer";

/**
 * THE LAMP'S OWN MARKUP WITH HUES OF ITS OWN (see the file's header): the free
 * edge, the three blobs and the bright line, exactly as `DoorLamp` draws them,
 * so `lit.css` lights it the same way.
 */
export function QuotedLamp({
  hues,
  strength = "base",
}: {
  hues: Hues;
  strength?: "base" | "bloom";
}) {
  return (
    <div
      data-door-lamp={strength}
      data-door-hues={huesAttr(hues)}
      aria-hidden
      className={cn(
        "door-lamp door-lamp-free",
        strength === "bloom" && "door-lamp-bloom",
      )}
      style={litVars(hues)}
    >
      <span className="door-lamp-blob door-lamp-b1" />
      <span className="door-lamp-blob door-lamp-b2" />
      <span className="door-lamp-blob door-lamp-b3" />
      <span className="door-lamp-edge" />
    </div>
  );
}

/**
 * THE DOOR, HELD: the page behind, the door's scrim over all of it, and the one
 * product Sheet in the door's padding, no close and no handle (a held step has
 * no exit), the top in a hand and a panel from the right at a desk. `lamp`
 * false for a direction whose light comes from its own emblem rather than the
 * sheet's edge.
 */
export function Held({
  reader,
  bar,
  behind,
  hues,
  lamp = "base",
  children,
}: {
  reader?: Reader;
  /** The session-less bar, for the 404 wearing a direction's held door. */
  bar?: boolean;
  behind: ReactNode;
  hues: Hues;
  lamp?: "base" | "bloom" | false;
  children: ReactNode;
}) {
  return (
    <div className="relative min-h-svh bg-background text-foreground">
      <GuestTop reader={reader} bar={bar} />
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
        {lamp && <QuotedLamp hues={hues} strength={lamp} />}
        <div className="relative pt-1">{children}</div>
      </div>
    </div>
  );
}

/**
 * A DOOR THAT IS A PAGE: the header, then the door centred in what is left of
 * the screen. `bar` for the 404, which has no session to ask about.
 */
export function Page({
  reader,
  bar,
  children,
  className,
}: {
  reader?: Reader;
  bar?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <GuestTop reader={reader} bar={bar} />
      <main
        className={cn(
          "isolate flex flex-1 flex-col items-center justify-center px-5 py-16",
          className,
        )}
      >
        {children}
      </main>
    </div>
  );
}

/* ── what stands behind the sheet ──────────────────────────────────────────── */

/**
 * A PUBLIC ALBUM, AS ITS DOOR BLURS IT: the page's reading column
 * (`event-experience.tsx`'s COLUMN, pinned left on the logo's 20px line) with
 * the name, the byline, the count and the action block, then the album in
 * justified rows across the page's bleed. Only the welcome of a Public album
 * stands over this; every other door stands over nothing real.
 */
export function AlbumBehind() {
  const rows: readonly (readonly Still[])[] = [
    ALBUM.slice(0, 2),
    ALBUM.slice(2, 5),
    ALBUM.slice(5, 8),
  ];
  return (
    <div aria-hidden className="pb-10">
      <div className="max-w-[632px] px-5 pt-6">
        <p className="font-heading text-page text-balance">{EVENT.name}</p>
        <p className="mt-2 flex items-center gap-2 text-working text-muted-foreground">
          {WELCOME.hostedBy}
          <Avatar seed={HOST.seed} size="sm">
            <AvatarFallback>{HOST.name.slice(0, 1)}</AvatarFallback>
          </Avatar>
          <span className="text-foreground">{HOST.name}</span>
          <span>· {formatEventDate(EVENT.date)}</span>
        </p>
        <p className="mt-1 text-working text-muted-foreground">
          {EVENT.count} photos & videos from {EVENT.guests} guests
        </p>
        <div className="mt-5 flex flex-col gap-3">
          <Button size="cta" className="w-full" tabIndex={-1}>
            Add photos
          </Button>
          <Button size="cta" variant="outline" className="w-full" tabIndex={-1}>
            Invite
          </Button>
        </div>
      </div>
      <div className="mt-6 flex flex-col gap-[3px] px-3 sm:px-5">
        {rows.map((row, i) => (
          <div key={i} className="flex gap-[3px]">
            {row.map((p) => (
              // eslint-disable-next-line @next/next/no-img-element -- a bootstrap still standing in for the album's own photograph
              <img
                key={p.src}
                data-ld-shows="photo"
                src={p.src}
                alt=""
                className="min-w-0 rounded-[var(--radius-tile)] object-cover"
                style={{
                  flexGrow: p.width / p.height,
                  flexBasis: 0,
                  aspectRatio: `${p.width} / ${p.height}`,
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * NOTHING REAL BEHIND A DOOR THAT IS NOT OPEN (event-settings' `nothing-behind`):
 * the ghost river a password page shows, in the reading column, under the
 * album's name where the direction names it.
 */
export function RiverBehind({ named }: { named: boolean }) {
  return (
    <div aria-hidden className="w-full max-w-2xl px-5 pt-6">
      {named && (
        <p className="font-heading text-page text-balance">{EVENT.name}</p>
      )}
      <div className={named ? "mt-8" : "mt-2"}>
        <GhostRiver />
      </div>
    </div>
  );
}

/* ── the light carried into the words ──────────────────────────────────────── */

/** A row's glyph, by what its line says (`words.ts`'s `mark`). */
export const MARKS: Record<Mark, LucideIcon> = {
  camera: Camera,
  images: Images,
  key: KeyRound,
  link: Link2,
  lock: Lock,
  door: DoorOpen,
  bell: BellRing,
};

/** A pool of a light of its own (the quoted twin of `DoorPool`). */
export function Pool({
  hue,
  size = "row",
  children,
  className,
}: {
  hue: number;
  size?: "badge" | "row" | "emblem" | "hero";
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "door-pool relative flex shrink-0 items-center justify-center rounded-full text-foreground",
        size === "badge" && "size-6 [&>svg]:size-3.5",
        size === "row" && "size-9 [&>svg]:size-4.5",
        size === "emblem" && "size-14 [&>svg]:size-6",
        size === "hero" && "size-16 [&>svg]:size-7",
        className,
      )}
      style={{ "--pool-h": hue } as CSSProperties}
    >
      {children}
    </span>
  );
}

/** A small glyph in a line, in a light of its own (the quoted twin of `DoorGlyph`). */
export function Glyph({ icon: Icon, hue }: { icon: LucideIcon; hue: number }) {
  return (
    <Icon
      aria-hidden
      className="door-glyph size-3 shrink-0"
      style={{ "--glyph-h": hue } as CSSProperties}
    />
  );
}

/** A line's place in the door's text reveal (`entry-modal.tsx`'s `lineStyle`). */
export const revealAt = (i: number, baseMs = 0) =>
  ({
    "--door-line-i": i,
    ...(baseMs ? { "--door-line-base": `${baseMs}ms` } : {}),
  }) as CSSProperties;

/**
 * THE WELCOME'S PROMISE ROWS (`PromiseRow`), class for class: a pool of the
 * light, its glyph in ink, the line beside it, the rows taking the three hues in
 * turn. The door's other states read their lines the same way where a
 * direction draws rows.
 */
export function Rows({
  lines,
  hues,
  from = 3,
}: {
  lines: readonly Line[];
  hues: Hues;
  /** The first row's place in the reveal. */
  from?: number;
}) {
  return (
    <div className="flex flex-col gap-4">
      {lines.map((line, i) => {
        const Icon = MARKS[line.mark];
        return (
          <p
            key={line.text}
            data-door-line
            style={revealAt(from + i)}
            className="flex items-center gap-3.5 text-base leading-relaxed"
          >
            <Pool hue={hues[i % 3]}>
              <Icon strokeWidth={1.75} />
            </Pool>
            <span data-ld-words>{line.text}</span>
          </p>
        );
      })}
    </div>
  );
}

/** The eyebrow of a door, its glyph in the door's light (`AlmostIn`'s shape). */
export function Eyebrow({
  text,
  mark,
  hue,
  className,
  line = 0,
}: {
  text: string;
  mark?: Mark;
  hue: number;
  className?: string;
  line?: number;
}) {
  return (
    <p
      data-door-line
      style={revealAt(line)}
      className={cn(
        "flex items-center gap-1.5 text-label font-medium text-muted-foreground uppercase",
        className,
      )}
    >
      {mark && <Glyph icon={MARKS[mark]} hue={hue} />}
      <span data-ld-words>{text}</span>
    </p>
  );
}

/** The welcome's byline: the host's face beside "Hosted by", over the date. */
export function Byline({ line = 2 }: { line?: number }) {
  return (
    <div
      data-ld-shows="host"
      data-door-line
      style={revealAt(line)}
      className="flex items-center gap-2.5"
    >
      <Avatar seed={HOST.seed} size="lg">
        <AvatarFallback>{HOST.name.slice(0, 1)}</AvatarFallback>
      </Avatar>
      <HostedBy date />
    </div>
  );
}

/**
 * "Hosted by Maya", with the date under it (`date`) or after it on the same
 * line (`inline`, the centred column's) where the door may say it.
 */
export function HostedBy({
  date = false,
  inline = false,
  className,
}: {
  date?: boolean;
  inline?: boolean;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "text-working leading-snug text-muted-foreground",
        className,
      )}
    >
      {WELCOME.hostedBy}{" "}
      <span className="font-medium text-foreground">{HOST.name}</span>
      {date &&
        (inline ? (
          <> · {formatEventDate(EVENT.date)}</>
        ) : (
          <>
            <br />
            {formatEventDate(EVENT.date)}
          </>
        ))}
    </p>
  );
}

/** The welcome's one primary and its consent line, as the real step ends. */
export function WelcomeFoot({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <Button size="cta" className="w-full" tabIndex={-1}>
        {WELCOME.cta}
      </Button>
      <LegalConsentLine newTab className="mt-2 text-center" />
    </div>
  );
}

/* ── the wait's own pieces ─────────────────────────────────────────────────── */

/**
 * HOW LONG SHE HAS WAITED: still under the still wait, and ticking under the
 * live one, where a dot in the house light says the door is listening (its
 * breath is the stylesheet's, still under reduced motion).
 */
export function AskedMark({
  live = false,
  hue,
  className,
}: {
  live?: boolean;
  hue: number;
  className?: string;
}) {
  return (
    <span
      data-ld-asked={live ? "live" : "still"}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground",
        className,
      )}
    >
      {live ? (
        <span
          aria-hidden
          className="ld-live-dot"
          style={{ "--pool-h": hue } as CSSProperties}
        />
      ) : null}
      <span data-ld-words>{ASKED}</span>
    </span>
  );
}

/**
 * THE `pick` WAIT'S BLOCK: what she chose while she waited, held on her phone.
 * `ready` while she waits (her picks and a Change), `sending` the moment the
 * door opens (the same three, going in).
 */
export function PickBlock({
  phase,
  align = "start",
}: {
  phase: "ready" | "sending";
  align?: "start" | "center";
}) {
  return (
    <div
      data-ld-pick={phase}
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-border bg-muted/30 p-3.5",
        align === "center" && "items-center text-center",
      )}
    >
      {phase === "ready" && (
        <div className={cn(align === "center" && "flex flex-col items-center")}>
          <p data-ld-words className="text-working font-medium text-foreground">
            {PICK.title}
          </p>
          <p
            data-ld-words
            className="mt-0.5 text-working leading-snug text-muted-foreground"
          >
            {PICK.line}
          </p>
        </div>
      )}
      <div className="flex items-center gap-2">
        {PICKS.map((p) => (
          <span
            key={p.src}
            className="relative size-12 overflow-hidden rounded-[var(--radius-tile)]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- a bootstrap still standing in for her own photograph */}
            <img src={p.src} alt="" className="size-full object-cover" />
            {phase === "sending" && (
              <span aria-hidden className="ld-pick-sending" />
            )}
          </span>
        ))}
        <span className="ml-1 flex min-w-0 flex-col text-left">
          <span
            data-ld-words
            className="text-working leading-snug text-foreground"
          >
            {phase === "ready" ? PICK.ready : BEAT.sending}
          </span>
          {phase === "ready" && (
            <span className="text-xs font-medium text-muted-foreground underline decoration-border underline-offset-4">
              {PICK.change}
            </span>
          )}
        </span>
      </div>
    </div>
  );
}

/* ── the shut door's foot, which follows who is reading ─────────────────────── */

/**
 * THE FOOT EVERY SHUT DOOR ENDS ON, as a function of who is reading and never
 * of why she is out: an address the invite list does not hold gets `unlisted=ask`
 * (Ask, then Use a different email); everyone else the one way out, and a phone
 * with no confirmed email the quiet way back in (event-safety's `back-in`).
 */
export function Foot({
  reader,
  align = "center",
  backIn = true,
  className,
}: {
  reader: Reader;
  align?: "start" | "center";
  /** Today's shut door draws no back-in line, because production's does not. */
  backIn?: boolean;
  className?: string;
}) {
  const centered = align === "center";
  if (reader.unlisted) return <AskPair className={className} />;
  return (
    <div
      className={cn(
        "flex w-full flex-col gap-3",
        centered && "items-center",
        className,
      )}
    >
      <WayOutButton className="w-full" />
      {backIn && !reader.confirmed && <BackIn centered={centered} />}
    </div>
  );
}

/** `unlisted=ask`'s two actions: the ask, then the other address. */
export function AskPair({ className }: { className?: string }) {
  return (
    <div data-ld-ask className={cn("flex w-full flex-col gap-2", className)}>
      <Button size="cta" className="w-full" tabIndex={-1}>
        {UNLISTED.ask}
      </Button>
      <Button
        size="cta"
        variant="ghost"
        className="w-full text-muted-foreground"
        tabIndex={-1}
      >
        {UNLISTED.other}
      </Button>
    </div>
  );
}

/** The one way out, outline rather than a push: the door is telling her to come back. */
export function WayOutButton({ className }: { className?: string }) {
  return (
    <Button
      data-ld-way-out
      size="cta"
      variant="outline"
      className={className}
      tabIndex={-1}
    >
      {WAY_OUT}
    </Button>
  );
}

/**
 * THE 404'S FOOT, in whatever look the 404 wears: today's primary, its quiet
 * line to a person (`HelpLine`'s words) and the live demo, word for word.
 */
export function LostFoot({
  align = "center",
  className,
}: {
  align?: "start" | "center";
  className?: string;
}) {
  const centered = align === "center";
  return (
    <div
      data-ld-way-out
      className={cn(
        "flex w-full flex-col gap-3",
        centered && "items-center text-center",
        className,
      )}
    >
      <Button size="cta" className="w-full" tabIndex={-1}>
        {WAY_OUT}
      </Button>
      <p className="text-sm text-muted-foreground">
        {LOST.help.lead}{" "}
        <span className="font-medium text-foreground underline decoration-border underline-offset-4">
          {LOST.help.link}
        </span>
        .
      </p>
      <p className="text-sm font-medium text-brand">{LOST.demo}</p>
    </div>
  );
}

/** Worded and linked like the not-found family's quiet line (`HelpLine`). */
export function BackIn({ centered = true }: { centered?: boolean }) {
  return (
    <p
      data-ld-backin
      className={cn("text-sm text-muted-foreground", centered && "text-center")}
    >
      {BACK_IN.lead}{" "}
      <span className="font-medium text-foreground underline decoration-border underline-offset-4">
        {BACK_IN.link}
      </span>
    </p>
  );
}

/* ── the beat: the door opening itself ─────────────────────────────────────── */

/** The beat's check in a light of its own (the quoted twin of `DoorCheck`). */
export function QuotedCheck({
  hues,
  size = "mark",
}: {
  hues: Hues;
  size?: "mark" | "sent";
}) {
  return (
    <span
      data-door-check={size}
      data-door-hues={huesAttr(hues)}
      aria-hidden
      className={cn(
        "door-check door-bloom relative flex shrink-0 items-center justify-center rounded-full",
        size === "mark" ? "size-14" : "size-9",
      )}
      style={litVars(hues)}
    >
      <svg
        viewBox="12 12 24 24"
        fill="none"
        className={cn("relative", size === "mark" ? "size-7" : "size-5")}
      >
        <path
          d="M17.2803 24.9602L21.7603 29.7602L30.7203 20.1602"
          stroke="currentColor"
          strokeWidth={size === "mark" ? 2.6 : 3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

/**
 * "YOU'RE IN" (`entry-modal.tsx`'s `SuccessStep`): the words under whatever mark
 * the direction blooms, the pick's sending row under them where she chose.
 */
export function BeatWords({
  pick = false,
  align = "center",
  line = 0,
  size = "page",
}: {
  pick?: boolean;
  align?: "start" | "center";
  line?: number;
  /** The step its headline stands on: a page's own headline scale where it has one. */
  size?: "page" | "section";
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        align === "center" && "items-center text-center",
      )}
    >
      <div>
        <p
          data-ld-words
          data-ld-title
          data-door-line
          style={revealAt(line, 140)}
          className={cn(
            "font-heading",
            size === "section" ? "text-section" : "text-page",
          )}
        >
          {BEAT.title}
        </p>
        {!pick && (
          <p
            data-ld-words
            data-door-line
            style={revealAt(line + 1, 140)}
            className="mt-1 text-base text-muted-foreground"
          >
            {BEAT.line}
          </p>
        )}
      </div>
      {pick && <PickBlock phase="sending" align={align} />}
    </div>
  );
}

/** The 404's glyph, where a direction's emblem has nothing of an album to hold. */
export const LostIcon = QrCode;
