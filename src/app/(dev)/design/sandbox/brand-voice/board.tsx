"use client";

// the board's own sheet; it leaves with the board when the ruling lands.
import "./board.css";

import {
  BoardPage,
  Catalog,
  CellLabel,
  type Ground,
  Knob,
  Labeled,
  type Mode,
  Paste,
  type Spot,
  SpotCompare,
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

import { CardGround, useAnchorAfterSettle, VoiceFrame } from "./frames";
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
 * THE BRAND-VOICE BOARD (round six, the catalog rebuild, 2026-09-16).
 *
 * ★ WILL'S BRIEF IS THE WHOLE SHAPE, and it is not the catalog shape the other
 * boards take. He asked for "a couple dozen spot examples across the marketing
 * site and app" where he can "compare 2 brand voices in usage side by side",
 * with "a config to choose which 2, then select my winner". A voice is not a
 * picture, so a grid of six pictures answers nothing: the thing being chosen is
 * applied in a hundred places and it is only judged in them. So the catalog is
 * the PICKER (six cards, each the same real screen written that way) and the
 * board's main surface is the SPOT LIST: twenty-four real places, each drawn
 * twice, under whichever two cards A and B are pressed on.
 *
 * ★ EVERY SPOT IS THE COMPONENT THAT SHIPS IT. `PageHero`, `SectionShell`, the
 * pricing markup with its figures read from tiers.ts, the create wizard's card,
 * a sonner-width toast, the guest sheet's dropzone. The strings are the board's,
 * the components and the density are the product's (Will's round-four note: live
 * production components and whole real pages, not a screen of specimens).
 *
 * ★ AND NOTHING IS SCALED. Every spot is a real document at exactly 1440 or
 * exactly 375 (`frames.tsx` says why at length); the catalog's cards are the one
 * place a frame cannot go, so they paint the ground themselves at the phone's
 * own 343px column. Whether a headline takes three rows or four at 375 is the
 * sharpest fact on this board, and it is read rather than asserted.
 *
 * WHAT LEFT WITH ROUND FIVE: fifteen ledger rows of the home arc, the thirty
 * feature-page identity strings, two feature pages card by card, four diff
 * counters, and 13,000 words of argument. The argument is not withdrawn, it is
 * folded: what is above a fold now is what a reviewer has to READ.
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
 * The catalog card
 * ---------------------------------------------------------------------- */

const HERO = SPOTS.find((s) => s.id === "home-hero") as SpotDef;
const EMPTY = SPOTS.find((s) => s.id === "dashboard-empty") as SpotDef;

/**
 * ONE CARD: the same two screens, written six ways.
 *
 * ★ THE LOUD ONE AND THE QUIET ONE, on one card, because the thing that
 * separates these six is not a headline, it is whether the headline and the
 * empty state sound like one person. The hero is at the phone's own column and
 * its own type step, so the row a longer voice costs is visible on the card
 * rather than asserted in its facts.
 */
function VoiceCard({ voice }: { voice: VoiceId }) {
  return (
    <div className="flex flex-col">
      <CardGround ground="cinema" className="px-0 py-7">
        <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
          {line(HERO, "Small label", voice)}
        </p>
        <p className="mt-3 font-heading text-5xl leading-[1.05] text-balance">
          {line(HERO, "Headline", voice)}
        </p>
        <p className="mt-4 text-[15px] text-pretty text-muted-foreground">
          {line(HERO, "Sentence under it", voice)}
        </p>
      </CardGround>
      <CardGround ground="app-light" className="px-0 py-6">
        <p className="text-[11px] tracking-[0.12em] text-muted-foreground uppercase">
          The app, quiet
        </p>
        <p className="mt-2 font-heading text-2xl text-balance">
          {line(EMPTY, "Heading", voice)}
        </p>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {line(EMPTY, "Body", voice)}
        </p>
        <Button size="sm" className="mt-3">
          {line(EMPTY, "Button", voice)}
        </Button>
      </CardGround>
    </div>
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

/** The spot list, as the kit reads it: an id, a name and the line that says
 *  what to read HERE. */
const SPOT_LIST: Spot[] = SPOTS.map((s) => ({
  id: s.id,
  name: s.name,
  note: s.note,
}));

export function BrandVoiceBoard() {
  useAnchorAfterSettle("brand-voice");
  const counted = tally();

  return (
    <BoardPage
      spec={BRAND_VOICE}
      evidence={(id, state, api) => {
        const mode: Mode = state.canvas === "phone" ? "phone" : "desktop";
        const area = state.area ?? "all";
        const picked = state.voice === "none" ? null : asVoice(state.voice);
        const wearing = picked ?? "today";

        switch (id) {
          /* ── The six voices ───────────────────────────────────────── */
          case "catalog":
            return (
              <>
                <Catalog
                  spec={BRAND_VOICE}
                  state={state}
                  setState={api.setState}
                  minWidth={375}
                  render={(candidate) => (
                    <VoiceCard voice={asVoice(candidate.id)} />
                  )}
                />
                <CellLabel className="max-w-2xl">
                  {`Pick drives the page walk and the paste; A and B drive the places below. Both screens sit at a phone's own 343px column, so a headline that costs a row costs it here.`}
                </CellLabel>
              </>
            );

          /* ── The spot list ────────────────────────────────────────── */
          case "spots": {
            const shown = SPOT_LIST.filter(
              (s) =>
                area === "all" ||
                SPOTS.find((x) => x.id === s.id)?.area === area,
            );
            return (
              <>
                <div className="flex flex-wrap items-center gap-3">
                  <Knob label="Jump to">
                    <select
                      aria-label="Jump to a place"
                      onChange={(e) => {
                        const target = e.target.value;
                        if (!target) return;
                        document
                          .getElementById(`bv-spot-${target}`)
                          ?.scrollIntoView({ block: "start" });
                      }}
                      className="h-7 rounded-[var(--radius-action-sm)] border border-border bg-background px-2 text-[11px] outline-none focus:border-foreground/40"
                    >
                      <option value="">Pick a place</option>
                      {shown.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </Knob>
                  <CellLabel className="mt-0">
                    {`${shown.length} of ${counted.spots} places, ${counted.differ} of ${counted.rows} lines differing.`}
                  </CellLabel>
                </div>
                <SpotCompare
                  spec={BRAND_VOICE}
                  state={state}
                  spots={shown}
                  cols={mode === "phone" ? 2 : 1}
                  render={(spot, candidate, side) => {
                    const def = SPOTS.find((x) => x.id === spot.id) as SpotDef;
                    const at: Mode = def.canvas === "phone" ? "phone" : mode;
                    const voice = asVoice(candidate.id);
                    return (
                      <div id={`bv-spot-${spot.id}`}>
                        <VoiceFrame
                          id={`bv-${spot.id}-${candidate.id}`}
                          mode={at}
                          ground={def.ground as Ground}
                          title={VOICE_NAME[voice]}
                          // The file a sweep would edit, once per place rather
                          // than twice: B is the same file as A.
                          caption={side === "a" ? def.where : undefined}
                        >
                          <div key={voice} data-bv-swap>
                            {renderSpot(def, voice, at)}
                          </div>
                        </VoiceFrame>
                      </div>
                    );
                  }}
                />
              </>
            );
          }

          /* ── The three calls a voice does not decide ───────────────── */
          case "calls":
            return (
              <div className="flex flex-col gap-8">
                <Labeled
                  name="The link preview, in a group chat"
                  note="One string, whichever voice wins."
                >
                  <div
                    data-lab-specimen=""
                    style={{ width: 360, maxWidth: "100%" }}
                    className="overflow-hidden rounded-xl border border-border bg-card"
                  >
                    <div className="aspect-[1.91/1] bg-muted" aria-hidden />
                    <div className="px-3 py-2.5">
                      <p className="text-[11px] text-muted-foreground">
                        partyreel.com
                      </p>
                      <p className="mt-0.5 text-sm font-medium">
                        {UNFURL.title}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {state.unfurl === "join"
                          ? "Add your photos to the album."
                          : state.unfurl === "one-step"
                            ? "Add your photos. One step to get in."
                            : "Add your photos. An email gets you in."}
                      </p>
                    </div>
                  </div>
                </Labeled>

                <Labeled
                  name={`The noun, on a guest's phone: ${state.noun === "gallery" ? NOUN.guest : NOUN.app}`}
                  note="The site and the app say album; the guest pages say gallery."
                >
                  <div
                    data-lab-specimen=""
                    style={{ width: 375, maxWidth: "100%" }}
                  >
                    <CardGround ground="app-light" className="px-0 py-5">
                      <p className="rounded-md bg-muted px-3 py-2 text-center text-xs text-muted-foreground">
                        {`The host reviews uploads before they appear in the ${
                          state.noun === "gallery" ? NOUN.guest : NOUN.app
                        }.`}
                      </p>
                      <p className="mt-3 text-center text-[15px] text-muted-foreground">
                        {`Save this event and come back to the ${
                          state.noun === "gallery" ? NOUN.guest : NOUN.app
                        } whenever you like.`}
                      </p>
                    </CardGround>
                  </div>
                </Labeled>

                <Labeled
                  name="The two counts the home page carries"
                  note="The hero proposes one pair, the band below ships another."
                >
                  <div
                    data-lab-specimen=""
                    style={{ width: 420, maxWidth: "100%" }}
                  >
                    <CardGround ground="cinema" className="px-0 py-6">
                      <p className="font-heading text-xl text-balance">
                        {state.counts === "hero" ? COUNTS.hero : COUNTS.demo}
                      </p>
                    </CardGround>
                  </div>
                </Labeled>
              </div>
            );

          /* ── The pages, wearing the pick ──────────────────────────── */
          case "pages":
            return (
              <>
                <CellLabel className="max-w-2xl">
                  {picked
                    ? `The home page in ${VOICE_NAME[picked]}, top to bottom.`
                    : "Nothing picked, so this is the site as it ships. Press Pick on a card above."}
                </CellLabel>
                <div className="flex flex-col gap-8">
                  {WALK.map((chapter) => (
                    <VoiceFrame
                      key={chapter.id}
                      id={`bv-walk-${chapter.id}-${wearing}`}
                      mode={mode}
                      ground={chapter.ground}
                      title={chapter.title}
                      caption={`${VOICE_NAME[wearing]}, at ${mode === "phone" ? "375" : "1440"}.`}
                    >
                      <div key={wearing} data-bv-swap>
                        {chapter.spots.map((sid) => {
                          const def = SPOTS.find(
                            (x) => x.id === sid,
                          ) as SpotDef;
                          return (
                            <div key={sid}>
                              {renderSpot(def, wearing, mode)}
                            </div>
                          );
                        })}
                      </div>
                    </VoiceFrame>
                  ))}
                </div>
              </>
            );

          /* ── The ruling, as a paste ───────────────────────────────── */
          case "paste":
            return (
              <div className="flex flex-col gap-6">
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
