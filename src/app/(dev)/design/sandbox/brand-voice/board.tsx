"use client";

// the board's own sheet; it leaves with the board when the ruling lands.
import "./board.css";

import {
  BoardPage,
  Catalog,
  CellLabel,
  comparePair,
  type Ground,
  type Mode,
  Paste,
} from "@/components/lab";
import { ImagePlus } from "lucide-react";

import { LearnMoreLink } from "@/components/marketing/sections/shared/learn-more-link";
import { PageHero } from "@/components/marketing/system/page-hero";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MAX_EVENTS, planById, plansForTier } from "@/lib/constants/tiers";
import { cn, formatBytes } from "@/lib/utils";

import {
  CardGround,
  TrueSize,
  useAnchorAfterSettle,
  VoiceFrame,
} from "./frames";
import { BRAND_VOICE } from "./spec";
import {
  COUNTS,
  line,
  moved,
  NOUN,
  type SpotDef,
  SPOTS,
  tally,
  UNFURL,
  VOICE_NAME,
  type VoiceId,
  VOICES,
} from "./voices";

/**
 * THE BRAND-VOICE BOARD (round seven, the stepped review, 2026-09-16).
 *
 * What the board ARGUES lives in `spec.ts` and only there. What is here is the
 * evidence for each declared section, as a function of the declared state, and
 * there are eight of them: five are the walk, three are the deep evidence a
 * reader reaches by opening the whole board.
 *
 *   01 catalog   the six voices as six cards (the winner ask's tiles)
 *   02 pages     the real home page, wearing the card being pressed (the stage)
 *   03 noun      two shipped guest lines, under album and under gallery
 *   04 unfurl    the chat preview card, under each of its three lines
 *   05 counts    the home page's one claim, under each pair of numbers
 *   06 volumes   the winner loud and quiet: one voice at two volumes
 *   07 spots     twenty-four real places, each drawn twice, under A and B
 *   08 paste     the picked voice as the block a ruling lands
 *
 * ★ A CARD IS THREE LINES, NOT A SCREEN (round seven). Round six's card drew
 * two whole screens, loud over quiet, which compared two screens rather than
 * two voices: the eye went to the layout. The card is now the SAME three lines
 * on the SAME spot, the home page's first screen, in every voice: the headline,
 * the sentence under it, the button. The quiet volume did not disappear, it
 * became the `volumes` section under the `scope` question, which is what it was
 * always evidence for.
 *
 * ★ EVERY SPOT IS THE COMPONENT THAT SHIPS IT. `PageHero`, `SectionShell`, the
 * pricing markup with its figures read from tiers.ts, the create wizard's card,
 * a sonner-width toast, the guest sheet's dropzone. The strings are the board's,
 * the components and the density are the product's (Will's round-four note: live
 * production components and whole real pages, not a screen of specimens).
 *
 * ★ AND NOTHING IS SCALED. Every spot is a real document at exactly 1440 or
 * exactly 375 (`frames.tsx` says why at length); the cards and the three small
 * specimens are the one place a frame cannot go, so they paint the ground
 * themselves at the phone's own 343px column and ride `TrueSize` into a step's
 * zoomed tile. Whether a headline takes three rows or four at 375 is the
 * sharpest fact on this board, and it is read rather than asserted.
 */

/* -------------------------------------------------------------------------
 * The marketing spots
 * ---------------------------------------------------------------------- */

/** The chevron a section ships under its body, where it ships one. */
const CTA_HREF: Record<string, string> = {
  "how-it-works": "/how-it-works",
  "album-chapter": "/features/album",
  curation: "/features/curation",
  privacy: "/features/privacy",
  reel: "/features/reel",
};

function Chevron({ spot, voice }: { spot: SpotDef; voice: VoiceId }) {
  const text = line(spot, "Link under it", voice);
  const href = CTA_HREF[spot.id];
  if (!text || !href) return null;
  return (
    <div className="mt-4 flex justify-center">
      <LearnMoreLink href={href}>{text}</LearnMoreLink>
    </div>
  );
}

/** The home page's first screen, in the shipped hero lockup. */
function HomeHero({ spot, voice }: { spot: SpotDef; voice: VoiceId }) {
  return (
    <PageHero
      className="w-full py-10"
      scale="xl"
      eyebrow={line(spot, "Small label", voice)}
      heading={line(spot, "Headline", voice)}
      subhead={line(spot, "Sentence under it", voice)}
      actions={
        <div className="flex flex-wrap items-center justify-center gap-3">
          {line(spot, "Buttons", voice)
            .split("·")
            .map((label, i) => (
              <Button
                key={label}
                size="lg"
                variant={i === 0 ? "default" : "outline"}
                className="h-11 px-6 text-base"
              >
                {label.trim()}
              </Button>
            ))}
        </div>
      }
    />
  );
}

/** A chapter of the home page in the shipped section shell. `pad` names the
 *  sm rung explicitly: twMerge cannot drop SectionShell's `sm:py-24` with a
 *  bare `py-10`, so a chapter walks with 96px of dead air per cut without it. */
function Chapter({
  spot,
  voice,
  mode,
  scale = "default",
  align = "center",
  children,
}: {
  spot: SpotDef;
  voice: VoiceId;
  mode: Mode;
  scale?: "default" | "lg";
  align?: "center" | "left";
  children?: React.ReactNode;
}) {
  const pad = mode === "desktop" ? "py-10 sm:py-10" : "py-7 sm:py-7";
  return (
    <SectionShell
      className={pad}
      reveal="none"
      scale={scale}
      align={align}
      eyebrow={line(spot, "Small label", voice) || undefined}
      heading={line(spot, "Header", voice)}
      subhead={line(spot, "Sentence under it", voice) || undefined}
    >
      {children}
      <Chevron spot={spot} voice={voice} />
    </SectionShell>
  );
}

function Steps({ spot, voice }: { spot: SpotDef; voice: VoiceId }) {
  return (
    <div className="mt-8 flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
      {line(spot, "The three steps", voice)
        .split("·")
        .map((label, i) => (
          <p key={label} className="font-heading text-lg">
            <span className="mr-2 text-muted-foreground tabular-nums">
              {i + 1}
            </span>
            {label.trim()}
          </p>
        ))}
    </div>
  );
}

function Claims({ spot, voice }: { spot: SpotDef; voice: VoiceId }) {
  return (
    <div className="mt-6 flex flex-wrap items-start justify-center gap-x-10 gap-y-3">
      {["Claim 1", "Claim 2"].map((slot) => (
        <p key={slot} className="font-heading text-lg">
          {line(spot, slot, voice)}
        </p>
      ))}
    </div>
  );
}

/** A feature card set, in the shipped three-up grid. */
function FeatureCards({
  spot,
  voice,
  mode,
}: {
  spot: SpotDef;
  voice: VoiceId;
  mode: Mode;
}) {
  return (
    <div className={mode === "desktop" ? "px-8 py-10" : "px-4 py-8"}>
      <div
        className={cn(
          "mx-auto grid max-w-5xl gap-4",
          mode === "desktop" ? "grid-cols-3" : "grid-cols-1",
        )}
      >
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className="rounded-2xl border bg-card p-5 ring-1 ring-foreground/5"
          >
            <p className="font-heading text-lg text-balance">
              {line(spot, `Card ${n}, title`, voice)}
            </p>
            <p className="mt-2 text-sm text-pretty text-muted-foreground">
              {line(spot, `Card ${n}, body`, voice)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/** The pricing pair, in the shipped markup with the shipped numbers: every
 *  figure renders from tiers.ts, so no voice can move one. */
function PricingPair({
  spot,
  voice,
  mode,
}: {
  spot: SpotDef;
  voice: VoiceId;
  mode: Mode;
}) {
  const free = planById("free");
  const pro = plansForTier("pro")[0];
  const l = (slot: string) => line(spot, slot, voice);
  return (
    <div
      className={
        mode === "desktop"
          ? "mx-auto grid max-w-4xl grid-cols-2 gap-5 px-6 py-10"
          : "mx-auto flex max-w-sm flex-col gap-5 px-4 py-8"
      }
    >
      <div className="flex flex-col rounded-2xl border bg-card p-6 ring-1 ring-foreground/5">
        <h3 className="font-heading text-xl">{free.name}</h3>
        <p className="mt-2 text-sm text-pretty text-muted-foreground">
          {l("Free, tagline")}
        </p>
        <p className="mt-3 font-heading text-4xl tabular-nums">
          {free.priceLabel}
        </p>
        <ul className="mt-6 flex-1 space-y-2.5 text-sm">
          <li>{MAX_EVENTS.free} event, every guest, the album and the reel</li>
          <li>{l("Free, one feature line")}</li>
        </ul>
        <p className="mt-6 text-sm text-muted-foreground">
          {formatBytes(free.storageBytes)} of storage
        </p>
        <Button variant="outline" className="mt-5 w-full">
          Start free
        </Button>
        <p className="mt-3 text-center text-xs text-muted-foreground/70">
          {l("Free, note under the button")}
        </p>
      </div>
      <div className="relative flex flex-col rounded-2xl bg-foreground p-6 text-background">
        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full border bg-card px-2.5 py-0.5 text-[10px] font-medium tracking-[0.14em] text-foreground uppercase">
          Most popular
        </span>
        <h3 className="font-heading text-xl">Pro</h3>
        <p className="mt-2 text-sm text-pretty text-background/75">
          {l("Pro, tagline")}
        </p>
        <p className="mt-3 font-heading text-4xl tabular-nums">
          {pro.priceLabel}
        </p>
        <ul className="mt-6 flex-1 space-y-2.5 text-sm">
          <li>Photos and video, an album for every event</li>
          <li>{l("Pro, one feature line")}</li>
        </ul>
        <p className="mt-6 text-sm text-background/70">
          {formatBytes(pro.storageBytes)} of storage
        </p>
        <Button className="mt-5 w-full bg-background text-foreground hover:bg-background/90">
          Get Pro at {pro.priceLabel}
        </Button>
        <p className="mt-3 text-center text-xs text-background/60">
          {l("Pro, note under the button")}
        </p>
      </div>
    </div>
  );
}

/** The footer's sign-off register, on the ink slab it ships on. */
function Footer({
  spot,
  voice,
  mode,
}: {
  spot: SpotDef;
  voice: VoiceId;
  mode: Mode;
}) {
  return (
    <Container className="pt-16 pb-10">
      <div
        className={cn(
          "flex gap-10",
          mode === "desktop"
            ? "flex-row items-center justify-between"
            : "flex-col items-start",
        )}
      >
        <div className="flex max-w-lg flex-col items-start gap-4">
          <h2 className="font-heading text-3xl sm:text-4xl">
            {line(spot, "Sign-off header", voice)}
          </h2>
          <p className="max-w-sm text-[17px] text-pretty text-muted-foreground">
            {line(spot, "Sentence under it", voice)}
          </p>
        </div>
        <span className="mkt-learn inline-flex items-center gap-2 rounded-[var(--radius-action)] border px-6 py-3 text-[15px] font-medium">
          Start free
        </span>
      </div>
      <div className="mt-12 flex flex-col items-start gap-3 border-t pt-10">
        <p className="font-heading text-2xl">Partyreel</p>
        <p className="max-w-[26ch] text-[15px] text-pretty text-muted-foreground">
          {line(spot, "Line under the wordmark", voice)}
        </p>
      </div>
    </Container>
  );
}

/** A help article's opening, in the reading column it ships in. */
function HelpOpen({
  spot,
  voice,
  mode,
}: {
  spot: SpotDef;
  voice: VoiceId;
  mode: Mode;
}) {
  return (
    <div className={mode === "desktop" ? "px-8 py-12" : "px-4 py-8"}>
      <div className="mx-auto max-w-2xl">
        <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
          Getting started
        </p>
        <h1 className="mt-3 font-heading text-4xl text-balance sm:text-5xl">
          {line(spot, "Title", voice)}
        </h1>
        <p className="mt-5 text-[17px] leading-relaxed text-pretty text-muted-foreground">
          {line(spot, "First paragraph", voice)}
        </p>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------
 * The app spots
 * ---------------------------------------------------------------------- */

function SignInDoor({
  spot,
  voice,
  mode,
}: {
  spot: SpotDef;
  voice: VoiceId;
  mode: Mode;
}) {
  return (
    <div className={mode === "desktop" ? "px-8 py-12" : "px-4 py-8"}>
      <div className="mx-auto w-full max-w-sm rounded-xl border border-border bg-card p-6">
        <h1 className="font-heading text-2xl">
          {line(spot, "Heading", voice)}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {line(spot, "Sentence under it", voice)}
        </p>
        <div className="mt-5 space-y-3">
          <Button variant="outline" className="w-full">
            Continue with Google
          </Button>
          <Input placeholder="you@example.com" readOnly />
          <Button className="w-full">Email me a link</Button>
        </div>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          {line(spot, "The email hint", voice)}
        </p>
      </div>
    </div>
  );
}

function DashboardHeader({
  spot,
  voice,
  mode,
}: {
  spot: SpotDef;
  voice: VoiceId;
  mode: Mode;
}) {
  return (
    <div className={mode === "desktop" ? "px-8 py-10" : "px-4 py-8"}>
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h1 className="font-heading text-3xl">
            {line(spot, "Heading", voice)}
          </h1>
          <Button size="sm">Create an event</Button>
        </div>
        <div className="mt-5 max-w-sm">
          <div
            className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
            aria-hidden
          >
            <div className="h-full w-[17%] rounded-full bg-foreground" />
          </div>
          <p className="mt-2 flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
            <span className="tabular-nums">
              {line(spot, "Storage line", voice)}
            </span>
            <span className="underline underline-offset-2">
              {line(spot, "The nudge beside it", voice)}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

const GHOSTS = ["g01", "g02", "g03", "g04", "g05", "g06"];

function DashboardEmpty({
  spot,
  voice,
  mode,
}: {
  spot: SpotDef;
  voice: VoiceId;
  mode: Mode;
}) {
  return (
    <div
      className={
        mode === "desktop"
          ? "mx-auto max-w-5xl px-8 py-10"
          : "mx-auto max-w-sm px-4 py-8"
      }
    >
      <div className="relative">
        <div
          aria-hidden
          className={cn(
            "grid gap-3 opacity-25 grayscale",
            mode === "desktop" ? "grid-cols-3" : "grid-cols-2",
          )}
        >
          {GHOSTS.map((g) => (
            // eslint-disable-next-line @next/next/no-img-element -- the shipped decorative ghost pack
            <img
              key={g}
              src={`/guest-ghost/${g}.webp`}
              alt=""
              loading="lazy"
              className="aspect-[16/10] w-full rounded-xl object-cover"
            />
          ))}
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
          <div className="space-y-1.5">
            <h3 className="font-heading text-2xl text-balance">
              {line(spot, "Heading", voice)}
            </h3>
            <p className="mx-auto max-w-sm text-sm text-muted-foreground">
              {line(spot, "Body", voice)}
            </p>
          </div>
          <Button size="lg">{line(spot, "Button", voice)}</Button>
        </div>
      </div>
    </div>
  );
}

function Wizard({
  spot,
  voice,
  mode,
}: {
  spot: SpotDef;
  voice: VoiceId;
  mode: Mode;
}) {
  return (
    <div className={mode === "desktop" ? "px-8 py-10" : "px-4 py-8"}>
      <div className="mx-auto w-full max-w-xl rounded-xl border border-border bg-card p-6">
        <h3 className="font-heading text-lg">{line(spot, "Title", voice)}</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {line(spot, "Sentence under it", voice)}
        </p>
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 pt-3 text-xs">
          {["Details", "Design", "Share"].map((label, i) => (
            <li key={label} className="flex items-center gap-2">
              <span
                className={cn(
                  "flex size-5 items-center justify-center rounded-full text-[11px] font-medium",
                  i === 0
                    ? "bg-brand text-brand-foreground"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {i + 1}
              </span>
              <span
                className={
                  i === 0
                    ? "font-medium text-foreground"
                    : "text-muted-foreground"
                }
              >
                {label}
              </span>
            </li>
          ))}
        </ol>
        <div className="mt-5 space-y-4">
          <div className="space-y-1.5">
            <p className="text-sm font-medium">Event name</p>
            <Input placeholder="Maya &amp; Sam's Wedding" readOnly />
          </div>
          <div className="space-y-1.5">
            <p className="text-sm font-medium">
              Description{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </p>
            <Textarea
              rows={2}
              placeholder="A note your guests will see when they join."
              readOnly
            />
          </div>
          <div className="space-y-1.5">
            <p className="text-sm font-medium">
              Event date{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </p>
            <Input placeholder="2026-03-14" readOnly />
            <p className="text-xs text-muted-foreground">
              {line(spot, "The date helper", voice)}
            </p>
          </div>
        </div>
        <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
          <p className="text-sm font-medium">
            {line(spot, "The QR step's heading", voice)}
          </p>
          <Button>Continue</Button>
        </div>
      </div>
    </div>
  );
}

/** A toast, at sonner's own 356px. */
function Toast({ text, tone }: { text: string; tone?: "warning" }) {
  return (
    <div
      style={{ width: 356, maxWidth: "100%" }}
      className={cn(
        "rounded-lg border bg-card px-4 py-3 text-sm shadow-lg",
        tone === "warning" ? "border-warning/40" : "border-border",
      )}
    >
      {text}
    </div>
  );
}

function Toasts({ spot, voice }: { spot: SpotDef; voice: VoiceId }) {
  return (
    <div className="flex flex-col items-start gap-3 px-6 py-8">
      <Toast text={line(spot, "After copying the link", voice)} />
      <Toast text={line(spot, "After turning review on", voice)} />
    </div>
  );
}

function Notifications({ spot, voice }: { spot: SpotDef; voice: VoiceId }) {
  const rows: [string, string, boolean][] = [
    [
      line(spot, "Uploads waiting, title", voice),
      line(spot, "Uploads waiting, body", voice),
      false,
    ],
    [
      line(spot, "Over storage, title", voice),
      line(spot, "Over storage, body", voice),
      true,
    ],
  ];
  return (
    <div className="px-6 py-8">
      <div
        style={{ width: 380, maxWidth: "100%" }}
        className="divide-y divide-border rounded-lg border border-border bg-card"
      >
        {rows.map(([title, body, warn]) => (
          <div key={title} className="px-4 py-3">
            <p
              className={cn(
                "text-sm font-medium",
                warn && "text-warning-foreground",
              )}
            >
              {title}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">{body}</p>
            <p className="mt-1 text-[11px] text-muted-foreground/70">2h ago</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function AccountPanel({ spot, voice }: { spot: SpotDef; voice: VoiceId }) {
  return (
    <div className="px-6 py-8">
      <div className="mx-auto w-full max-w-xl rounded-lg border border-border bg-card px-4 py-4">
        <ul className="space-y-1.5 text-sm">
          {["Profile", "Public profile", "Connections", "Password"].map(
            (label, i) => (
              <li
                key={label}
                className={i === 1 ? "font-medium" : "text-muted-foreground"}
              >
                {label}
              </li>
            ),
          )}
        </ul>
        <div className="mt-4 border-t border-border pt-3">
          <p className="text-sm font-medium">
            {line(spot, "Panel heading", voice)}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {line(spot, "The help text", voice)}
          </p>
        </div>
      </div>
    </div>
  );
}

function Errors({ spot, voice }: { spot: SpotDef; voice: VoiceId }) {
  return (
    <div className="flex flex-col items-start gap-4 px-6 py-8">
      <div
        style={{ width: 356, maxWidth: "100%" }}
        className="rounded-lg border border-border bg-card px-4 py-4"
      >
        <p className="text-sm font-medium">Sign in</p>
        <div className="mt-2 space-y-2">
          <Input placeholder="you@example.com" readOnly />
          <Input placeholder="Password" readOnly />
        </div>
        <p className="mt-2 text-sm text-destructive">
          {line(spot, "Wrong email or password", voice)}
        </p>
      </div>
      <div
        style={{ width: 356, maxWidth: "100%" }}
        className="rounded-lg border border-border bg-card px-4 py-3 shadow-lg"
      >
        <p className="text-sm font-medium">
          {line(spot, "A refused upload, title", voice)}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {line(spot, "A refused upload, body", voice)}
        </p>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------
 * The guest spots
 * ---------------------------------------------------------------------- */

function GuestDoor({ spot, voice }: { spot: SpotDef; voice: VoiceId }) {
  return (
    <div className="px-4 py-6">
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card px-5 py-6 text-center">
        <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
          {line(spot, "Small label", voice)}
        </p>
        <p className="font-heading text-[22px] leading-tight text-balance">
          {line(spot, "Heading", voice)}
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {line(spot, "Body", voice)}
        </p>
        <Input placeholder="you@example.com" readOnly className="mt-1" />
        <Button size="lg" className="w-full">
          {line(spot, "Button", voice)}
        </Button>
      </div>
    </div>
  );
}

function UploadSheet({ spot, voice }: { spot: SpotDef; voice: VoiceId }) {
  return (
    <div className="space-y-3 px-4 py-5">
      <div className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/40 px-6 py-10 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-background text-primary shadow-sm">
          <ImagePlus className="size-6" />
        </div>
        <p className="text-sm font-medium">
          {line(spot, "Dropzone title", voice)}
        </p>
        <p className="text-xs text-muted-foreground">
          {line(spot, "Dropzone hint", voice)}
        </p>
      </div>
      <p className="rounded-md bg-muted px-3 py-2 text-center text-xs text-muted-foreground">
        {line(spot, "The host's review note", voice)}
      </p>
      <div className="rounded-xl border border-border bg-card p-5 text-center">
        <p className="mx-auto mt-1 mb-4 max-w-xs text-[15px] text-muted-foreground">
          {line(spot, "The save card", voice)}
        </p>
        <Button className="w-full">Save this event</Button>
      </div>
    </div>
  );
}

function GuestEmpty({ spot, voice }: { spot: SpotDef; voice: VoiceId }) {
  const ghosts = [...GHOSTS, ...GHOSTS.slice(0, 3)];
  return (
    <div className="relative px-3 py-5">
      <div
        aria-hidden
        className="grid grid-cols-3 gap-1.5 opacity-25 grayscale"
      >
        {ghosts.map((g, i) => (
          // eslint-disable-next-line @next/next/no-img-element -- the shipped decorative ghost pack
          <img
            key={i}
            src={`/guest-ghost/${g}.webp`}
            alt=""
            loading="lazy"
            className="aspect-square w-full rounded-[3px] object-cover"
          />
        ))}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="font-heading text-2xl text-balance">
          {line(spot, "Heading", voice)}
        </p>
        <Button size="lg">{line(spot, "Button", voice)}</Button>
      </div>
    </div>
  );
}

function EmailCard({ spot, voice }: { spot: SpotDef; voice: VoiceId }) {
  return (
    <div className="space-y-3 px-4 py-5">
      <div className="rounded-lg border border-border bg-card px-3 py-2.5">
        <p className="text-[11px] text-muted-foreground">Partyreel</p>
        <p className="mt-0.5 text-sm font-medium">
          {line(spot, "Subject", voice)}
        </p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {line(spot, "First line", voice)}
        </p>
      </div>
      <div className="rounded-lg border border-border bg-card px-4 py-4">
        <p className="font-heading text-lg">{line(spot, "Headline", voice)}</p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {line(spot, "First line", voice)}
        </p>
        <Button className="mt-4 w-full">{line(spot, "Button", voice)}</Button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------
 * One spot, one voice
 * ---------------------------------------------------------------------- */

/**
 * ★ ONE DISPATCHER, NOT A `render` PER SECTION. The same spot has to draw on a
 * card, inside the A half of a comparison, inside the B half, and again inside
 * the page walk; four copies of the same JSX is four places for a stale string
 * to hide on a board whose entire subject is strings.
 */
function renderSpot(
  spot: SpotDef,
  voice: VoiceId,
  mode: Mode,
): React.ReactNode {
  switch (spot.id) {
    case "home-hero":
      return <HomeHero spot={spot} voice={voice} />;
    case "how-it-works":
      return (
        <Chapter spot={spot} voice={voice} mode={mode}>
          <Steps spot={spot} voice={voice} />
        </Chapter>
      );
    case "album-chapter":
      return (
        <Chapter
          spot={spot}
          voice={voice}
          mode={mode}
          scale="lg"
          align="left"
        />
      );
    case "feature-cards":
      return <FeatureCards spot={spot} voice={voice} mode={mode} />;
    case "live-demo":
      return <Chapter spot={spot} voice={voice} mode={mode} scale="lg" />;
    case "curation":
      return <Chapter spot={spot} voice={voice} mode={mode} />;
    case "privacy":
      return (
        <Chapter spot={spot} voice={voice} mode={mode}>
          <Claims spot={spot} voice={voice} />
        </Chapter>
      );
    case "reel":
      return <Chapter spot={spot} voice={voice} mode={mode} />;
    case "pricing-pair":
      return <PricingPair spot={spot} voice={voice} mode={mode} />;
    case "cta-band":
      return (
        <SectionShell
          className={mode === "desktop" ? "py-12 sm:py-12" : "py-8 sm:py-8"}
          reveal="none"
          scale="lg"
          heading={line(spot, "Header", voice)}
          subhead={line(spot, "Sentence under it", voice)}
        >
          <div className="mt-6 flex justify-center">
            <Button size="lg" className="h-11 px-6 text-base">
              {line(spot, "Button", voice)}
            </Button>
          </div>
        </SectionShell>
      );
    case "footer":
      return <Footer spot={spot} voice={voice} mode={mode} />;
    case "help-open":
      return <HelpOpen spot={spot} voice={voice} mode={mode} />;
    case "signin-door":
      return <SignInDoor spot={spot} voice={voice} mode={mode} />;
    case "dashboard-header":
      return <DashboardHeader spot={spot} voice={voice} mode={mode} />;
    case "dashboard-empty":
      return <DashboardEmpty spot={spot} voice={voice} mode={mode} />;
    case "create-wizard":
      return <Wizard spot={spot} voice={voice} mode={mode} />;
    case "toasts":
      return <Toasts spot={spot} voice={voice} />;
    case "notifications":
      return <Notifications spot={spot} voice={voice} />;
    case "account-storage":
      return <AccountPanel spot={spot} voice={voice} />;
    case "errors":
      return <Errors spot={spot} voice={voice} />;
    case "guest-door":
      return <GuestDoor spot={spot} voice={voice} />;
    case "upload-sheet":
      return <UploadSheet spot={spot} voice={voice} />;
    case "guest-empty":
      return <GuestEmpty spot={spot} voice={voice} />;
    case "email":
      return <EmailCard spot={spot} voice={voice} />;
    default:
      return null;
  }
}

/* -------------------------------------------------------------------------
 * The catalog card, and the four small specimens
 * ---------------------------------------------------------------------- */

const HERO = SPOTS.find((s) => s.id === "home-hero") as SpotDef;
const EMPTY = SPOTS.find((s) => s.id === "dashboard-empty") as SpotDef;

/**
 * ONE CARD: the same three lines, written six ways.
 *
 * ★ THE SAME LINES ON THE SAME SPOT, which is the only way six voices can be
 * compared at a glance. The spot is the home page's first screen (the loudest
 * line on the site) and the three lines are the ones a reader meets in order:
 * the headline, the sentence under it, the first button. Round six drew two
 * whole screens per card and the eye went to the layout instead of the words.
 *
 * ★ AT THE SIZE A PHONE DRAWS THEM. `CardGround` pins the column to the 343px
 * a 375 viewport gives and nothing here carries an `sm:` rung, so the card is
 * the phone's own column at the phone's own type. The row a longer voice costs
 * the h1 is therefore visible on the card rather than asserted in its facts.
 */
function VoiceCard({ voice }: { voice: VoiceId }) {
  return (
    <CardGround ground="cinema" className="px-0 py-7">
      <p className="font-heading text-5xl leading-[1.05] text-balance">
        {line(HERO, "Headline", voice)}
      </p>
      <p className="mt-4 text-[15px] text-pretty text-muted-foreground">
        {line(HERO, "Sentence under it", voice)}
      </p>
      <Button size="lg" className="mt-5 h-11 px-6 text-base">
        {line(HERO, "Buttons", voice).split("·")[0].trim()}
      </Button>
    </CardGround>
  );
}

/**
 * THE THREE CALLS A VOICE DOES NOT DECIDE, one specimen each, and the winner at
 * two volumes.
 *
 * ★ EACH ONE IS ITS OWN SECTION, which is what makes them steps. The step
 * surface draws an option by rendering the ask's whole evidence SECTION in that
 * option's state, so three specimens sharing one section would put all three
 * under every tile of every one of the three questions. One section, one
 * specimen, one question.
 *
 * ★ AND EACH ONE RIDES `TrueSize` AND STOPS AT 100%. A tile zooms its stage to
 * about a fifth, so a fixed 375 box would be 70 pixels of unreadable grey; the
 * compensation returns the subtree to 1:1 and `maxWidth` hands it the tile's
 * real column. On the stage below the same specimen takes its natural width.
 */
/** A ground has no edge of its own, and a cinema one on this board's own dark
 *  page has no edge at all: the kit's catalog rings every card's ground for the
 *  same reason (catalog.tsx's `paint`). */
const GROUND_EDGE = "overflow-hidden rounded-lg ring-1 ring-foreground/10";

function NounSpecimen({ gallery }: { gallery: boolean }) {
  const noun = gallery ? NOUN.guest : NOUN.app;
  return (
    <TrueSize>
      <div style={{ width: 343, maxWidth: "100%" }}>
        <CardGround ground="app-light" className={GROUND_EDGE + " px-0 py-5"}>
          <p className="rounded-md bg-muted px-3 py-2 text-center text-xs text-muted-foreground">
            {`The host reviews uploads before they appear in the ${noun}.`}
          </p>
          <p className="mt-3 text-center text-[15px] text-muted-foreground">
            {`Save this event and come back to the ${noun} whenever you like.`}
          </p>
        </CardGround>
      </div>
    </TrueSize>
  );
}

/** What a chat draws under the title. The only warning a guest gets. */
const UNFURL_LINE: Record<string, string> = {
  email: "Add your photos. An email gets you in.",
  join: "Add your photos to the album.",
  "one-step": "Add your photos. One step to get in.",
};

function UnfurlSpecimen({ line: which }: { line: string }) {
  return (
    <TrueSize>
      <div
        style={{ width: 320, maxWidth: "100%" }}
        className="overflow-hidden rounded-xl border border-border bg-card"
      >
        {/* A strip rather than the chat's 1.91:1 image: the picture is not what
            is being judged, and at its real ratio it is the only thing that
            fits in a tile. */}
        <div className="h-16 bg-muted" aria-hidden />
        <div className="px-3 py-2.5">
          <p className="text-[11px] text-muted-foreground">partyreel.com</p>
          <p className="mt-0.5 text-sm font-medium">{UNFURL.title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {UNFURL_LINE[which] ?? UNFURL_LINE.email}
          </p>
        </div>
      </div>
    </TrueSize>
  );
}

function CountsSpecimen({ pair }: { pair: string }) {
  return (
    <TrueSize>
      <div style={{ width: 343, maxWidth: "100%" }}>
        <CardGround ground="cinema" className={GROUND_EDGE + " px-0 py-6"}>
          <p className="font-heading text-xl text-balance">
            {pair === "hero" ? COUNTS.hero : COUNTS.demo}
          </p>
        </CardGround>
      </div>
    </TrueSize>
  );
}

/**
 * ONE VOICE, LOUD AND QUIET: the home page's first screen and the app's empty
 * dashboard, in the same voice. It is the evidence under `scope`, whose two
 * answers are a fact about how many GUIDES a ruling writes rather than a look,
 * so the specimen shows what ONE voice covering both actually sounds like.
 */
function VolumesSpecimen({ voice }: { voice: VoiceId }) {
  return (
    <TrueSize>
      <div
        className="flex flex-wrap items-start gap-4"
        style={{ maxWidth: "100%" }}
      >
        <figure style={{ width: 343, maxWidth: "100%" }}>
          <CardGround ground="cinema" className={GROUND_EDGE + " px-0 py-6"}>
            <p className="font-heading text-3xl leading-tight text-balance">
              {line(HERO, "Headline", voice)}
            </p>
            <p className="mt-3 text-sm text-pretty text-muted-foreground">
              {line(HERO, "Sentence under it", voice)}
            </p>
          </CardGround>
          <figcaption className="mt-1.5 text-[10px] text-muted-foreground">
            The site, loud
          </figcaption>
        </figure>
        <figure style={{ width: 343, maxWidth: "100%" }}>
          <CardGround ground="app-light" className={GROUND_EDGE + " px-0 py-6"}>
            <p className="font-heading text-2xl text-balance">
              {line(EMPTY, "Heading", voice)}
            </p>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {line(EMPTY, "Body", voice)}
            </p>
            <Button size="sm" className="mt-3">
              {line(EMPTY, "Button", voice)}
            </Button>
          </CardGround>
          <figcaption className="mt-1.5 text-[10px] text-muted-foreground">
            The app, quiet
          </figcaption>
        </figure>
      </div>
    </TrueSize>
  );
}

/* -------------------------------------------------------------------------
 * The page walk
 * ---------------------------------------------------------------------- */

/** The home page, by ground: one skin per frame, because marketing.css flips
 *  the whole document on `data-mkt-skin` and a page cannot wear two at once. */
const WALK: { id: string; title: string; ground: Ground; spots: string[] }[] = [
  {
    id: "chapter-one",
    title: "The home page, chapter one",
    ground: "cinema",
    spots: ["home-hero", "how-it-works", "live-demo"],
  },
  {
    id: "chapter-two",
    title: "The home page, the morning after",
    ground: "paper",
    spots: ["album-chapter", "curation", "feature-cards"],
  },
  {
    id: "chapter-three",
    title: "The home page, the payoff",
    ground: "cinema",
    spots: ["privacy", "reel", "cta-band"],
  },
  {
    id: "the-foot",
    title: "The footer, under every page",
    ground: "ink",
    spots: ["footer"],
  },
];

/* -------------------------------------------------------------------------
 * The paste
 * ---------------------------------------------------------------------- */

function pasteFor(voice: VoiceId): string {
  const get = (id: string, slot: string) =>
    line(
      SPOTS.find((s) => s.id === id),
      slot,
      voice,
    );
  const headers: [string, string, string][] = [
    ["howItWorks", "how-it-works", "Header"],
    ["liveDemo", "live-demo", "Header"],
    ["album", "album-chapter", "Header"],
    ["curation", "curation", "Header"],
    ["privacy", "privacy", "Header"],
    ["reel", "reel", "Header"],
  ];
  return [
    `// src/lib/constants/marketing-voice.ts, in the ${VOICE_NAME[voice]} voice.`,
    `// Generated from the board's own data; every line is on screen above.`,
    ``,
    `export const SITE_THESIS = ${JSON.stringify(get("home-hero", "Headline"))};`,
    `export const SITE_SUBHEAD =`,
    `  ${JSON.stringify(get("home-hero", "Sentence under it"))};`,
    ``,
    `export const SECTION_HEADERS = {`,
    ...headers.map(
      ([key, id, slot]) =>
        `  ${key}: { line: ${JSON.stringify(get(id, slot))}, status: "ruled" },`,
    ),
    `} as const;`,
  ].join("\n");
}

/* -------------------------------------------------------------------------
 * The board
 * ---------------------------------------------------------------------- */

const asVoice = (option: string | undefined): VoiceId =>
  (VOICES.find((v) => v.id === option)?.id ?? "today") as VoiceId;

/**
 * THE SPOT LIST: twenty-four real places, each drawn twice, under A and B.
 *
 * ★ NOT THE KIT'S `SpotCompare`, AND THE REASON IS THE SAME THING SAID TWICE.
 * It printed a "What differs" line whose wording was the place's name and the
 * two card names again, directly under the heading that had just said them
 * (280 words over twenty-four places), and it labelled each half through
 * `Compare` while the frame inside already carried the voice's name in its own
 * caption, so every row read "Today Today Live Live". The row is the same
 * shape, minus both: the frames carry the two names once, and the line under
 * them is the place's own note, which is what a reviewer needs there. The kit
 * finding, asked for in this round's Handoff: `SpotCompare` should take a
 * `differs` per spot and should not label a half that labels itself.
 *
 * ★ THE FILE A SWEEP EDITS LEFT THE CAPTION and went into the section's wiring
 * fold. Twenty-four paths beside twenty-four frames are wiring instructions in
 * a reviewer's eye; the fold is two lines away and is where wiring belongs.
 */
function SpotRows({
  state,
  mode,
  area,
}: {
  state: Record<string, string>;
  mode: Mode;
  area: string;
}) {
  const pair = comparePair(BRAND_VOICE, state);
  if (!pair) return null;
  const { a, b } = pair;
  const shown = SPOTS.filter((s) => area === "all" || s.area === area);
  const same = a.id === b.id;

  return (
    <div className="flex min-w-0 flex-col gap-8">
      {shown.map((def) => {
        const at: Mode = def.canvas === "phone" ? "phone" : mode;
        const half = (id: string) => {
          const voice = asVoice(id);
          return (
            <VoiceFrame
              id={`bv-${def.id}-${id}`}
              mode={at}
              ground={def.ground as Ground}
              title={VOICE_NAME[voice]}
            >
              <div key={voice} data-bv-swap>
                {renderSpot(def, voice, at)}
              </div>
            </VoiceFrame>
          );
        };
        return (
          <section
            key={def.id}
            id={`bv-spot-${def.id}`}
            className="flex min-w-0 flex-col gap-2"
          >
            <h3 className="text-sm font-medium">{def.name}</h3>
            {same ? (
              <>
                {half(a.id)}
                <CellLabel>
                  {`A and B are both ${a.name}. Press B on another card to read this place under two of them.`}
                </CellLabel>
              </>
            ) : (
              <>
                <div
                  className="grid min-w-0 gap-4"
                  // The columns as a NUMBER, because a breakpoint prefix here
                  // reads the browser rather than the canvas: two 1440
                  // documents never sit side by side, two 375 ones do.
                  style={{
                    gridTemplateColumns: `repeat(${mode === "phone" ? 2 : 1}, minmax(0, 1fr))`,
                  }}
                >
                  {half(a.id)}
                  {half(b.id)}
                </div>
                <p className="max-w-2xl text-[11px] leading-relaxed text-muted-foreground">
                  <span className="font-medium text-foreground">
                    What differs:{" "}
                  </span>
                  {def.note}
                </p>
              </>
            )}
          </section>
        );
      })}
    </div>
  );
}

export function BrandVoiceBoard() {
  useAnchorAfterSettle("brand-voice");
  const counted = tally();

  return (
    <BoardPage
      spec={BRAND_VOICE}
      evidence={(id, state, api) => {
        const mode: Mode = state.canvas === "phone" ? "phone" : "desktop";
        const picked = state.voice === "none" ? null : asVoice(state.voice);
        const wearing = picked ?? "today";

        switch (id) {
          /* ── 01 The six voices: the winner ask's tiles ─────────────── */
          case "catalog":
            return (
              <Catalog
                spec={BRAND_VOICE}
                state={state}
                setState={api.setState}
                // 343 for the phone column, plus the card's own padding: the
                // specimen inside has to be the width a 375 viewport gives or
                // the wrap on the h1 is a different wrap.
                minWidth={375}
                render={(candidate) => (
                  <VoiceCard voice={asVoice(candidate.id)} />
                )}
              />
            );

          /* ── 02 The home page, wearing the pick (the stage) ────────── */
          case "pages":
            return (
              <div className="flex flex-col gap-8">
                {!picked && (
                  <CellLabel className="max-w-2xl">
                    Nothing picked, so this is the site as it ships.
                  </CellLabel>
                )}
                {WALK.map((chapter) => (
                  <VoiceFrame
                    key={chapter.id}
                    id={`bv-walk-${chapter.id}-${wearing}`}
                    mode={mode}
                    ground={chapter.ground}
                    // No caption: the voice is the one just pressed and the
                    // canvas is on the strip, so a line under every frame
                    // saying both is the board reading itself back.
                    title={chapter.title}
                  >
                    <div key={wearing} data-bv-swap>
                      {chapter.spots.map((sid) => {
                        const def = SPOTS.find((x) => x.id === sid) as SpotDef;
                        return (
                          <div key={sid}>{renderSpot(def, wearing, mode)}</div>
                        );
                      })}
                    </div>
                  </VoiceFrame>
                ))}
              </div>
            );

          /* ── 03, 04, 05: one question, one specimen ────────────────── */
          case "noun":
            return <NounSpecimen gallery={state.noun === "gallery"} />;

          case "unfurl":
            return <UnfurlSpecimen line={state.unfurl ?? "email"} />;

          case "counts":
            return <CountsSpecimen pair={state.counts ?? "demo"} />;

          /* ── 06 One voice, loud and quiet (the scope question) ─────── */
          case "volumes":
            return <VolumesSpecimen voice={wearing} />;

          /* ── 07 The spot list ─────────────────────────────────────── */
          case "spots":
            return (
              <div className="flex min-w-0 flex-col gap-4">
                <CellLabel className="mt-0">
                  {`${counted.spots} places, ${counted.differ} of ${counted.rows} lines differing.`}
                </CellLabel>
                <SpotRows
                  state={state}
                  mode={mode}
                  area={state.area ?? "all"}
                />
              </div>
            );

          /* ── 08 The ruling, as a paste ────────────────────────────── */
          case "paste":
            return (
              <div className="flex flex-col gap-4">
                <Paste
                  label={`marketing-voice.ts, in ${VOICE_NAME[wearing]}`}
                  code={pasteFor(wearing)}
                />
                <CellLabel className="max-w-2xl">
                  {`${VOICE_NAME[wearing]}: ${moved(wearing).moved} of ${moved(wearing).total} lines rewritten.`}
                </CellLabel>
              </div>
            );

          default:
            return null;
        }
      }}
    />
  );
}
