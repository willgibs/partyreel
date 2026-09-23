"use client";

import { type CSSProperties, useState } from "react";
import {
  Camera,
  ChevronLeft,
  Clock,
  Eye,
  EyeOff,
  Images,
  Lock,
  Mail,
  RefreshCw,
  Share2,
} from "lucide-react";

import { GoogleIcon } from "@/components/auth/google-icon";
import { GhostRiver } from "@/components/guest/gallery-empty-state";
import { LegalConsentLine } from "@/components/shared/legal-consent-line";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { GLASS_MARK, GLASS_MARK_LIT } from "@/lib/glass";
import { cn } from "@/lib/utils";

import {
  EVENT,
  FAILED_FILES,
  HOST,
  PICK,
  type PendingStill,
  RUN,
} from "./fixtures";
import {
  ASK,
  EMPTY,
  EMPTY_HEADING,
  FAILED,
  KEEP,
  KEEP_BUTTON,
  type Register,
  WELCOME,
} from "./lines";

/**
 * THE PIECES EACH LINE STANDS IN, QUOTED FROM THE SHIPPED COMPONENTS WITH THE
 * ONE STRING LIFTED TO A PROP (the retired `voice` board's rule: a shipped
 * component takes its line through a prop where one exists, and is copied
 * where none does; none of these has one). Everything around the line is
 * the shipped markup, classes and all, so two options differ in their words
 * and nothing else.
 *
 * ★ `data-vg-line` MARKS THE WORDS BEING JUDGED, and the board's readers
 * measure exactly those (lines run, words read, the pane's share of a
 * photograph). A caption never asserts what a reader can count.
 *
 * ★ NOTHING HERE CALLS A SERVER FUNCTION, READS A SESSION OR MOUNTS A RADIX
 * PORTAL (`scene.tsx`'s own note). Every control that looks pressable is
 * inert (`tabIndex={-1}`, no handler) except the ones that are only local
 * state (the password's eye, the newsletter switch), so a stray tap in a
 * review does nothing rather than something misleading.
 */

/** The reading pane the in-flight tiles say everything on (`stack-tile.tsx`,
 *  `READING_PANE`): the one material, its tint re-pointed to a MEASURED 0.34
 *  so white clears 4.5:1 over the brightest photograph. */
const READING_PANE = { "--glass-tint": "0.34" } as CSSProperties;

/** The album tile's box, worn by anything standing at the album's head. */
const TILE_BOX =
  "relative mb-[var(--gap-gallery)] w-full overflow-hidden bg-black/10";

/** A still in the pick preview's natural fit: the file's own ratio decides the
 *  height, as an album tile's does (`pick-preview.tsx`, `fit="natural"`). */
function NaturalStill({ still }: { still: PendingStill }) {
  return (
    <span className="relative block overflow-hidden rounded-tile bg-muted">
      {/* eslint-disable-next-line @next/next/no-img-element -- a local still standing in for a blob: preview */}
      <img
        src={still.src}
        alt=""
        className="w-full object-cover"
        style={{ aspectRatio: `${still.width} / ${still.height}` }}
      />
    </span>
  );
}

/* ── 1. the welcome (`entry-modal.tsx`, `WelcomeStep`) ─────────────────────── */

export function WelcomeStep({ register }: { register: Register }) {
  const words = WELCOME[register];
  return (
    <div data-welcome-step className="flex flex-col gap-5">
      <div className="flex flex-col">
        <p className="text-label font-medium text-muted-foreground uppercase">
          You&rsquo;re invited to
        </p>
        <p className="mt-1.5 font-heading text-page text-balance">
          {EVENT.name}
        </p>
        <p className="mt-2 flex items-center gap-1.5 text-working text-muted-foreground">
          <Avatar seed={HOST.seed} size="sm">
            <AvatarFallback>{HOST.displayName.slice(0, 1)}</AvatarFallback>
          </Avatar>
          <span>
            Hosted by{" "}
            <span className="font-medium text-foreground">
              {HOST.displayName}
            </span>
          </span>
          <span aria-hidden className="text-faint">
            ·
          </span>
          <span>{EVENT.date}</span>
        </p>
      </div>

      {/* ★ THE CANDIDATE: the two rows. Everything around them is today's. */}
      <div data-vg-line className="flex flex-col gap-3.5">
        <p className="flex items-start gap-3 text-base leading-relaxed">
          <Camera
            className="mt-0.5 size-4.5 shrink-0 text-muted-foreground"
            aria-hidden
          />
          {words.lead}
        </p>
        <p className="flex items-start gap-3 text-base leading-relaxed">
          <Images
            className="mt-0.5 size-4.5 shrink-0 text-muted-foreground"
            aria-hidden
          />
          {words.album(HOST.displayName, EVENT.approvedTotal)}
        </p>
      </div>

      <div className="mt-auto flex flex-col gap-1">
        <Button type="button" size="cta" className="w-full" tabIndex={-1}>
          Continue
        </Button>
        <LegalConsentLine newTab className="mt-2 text-center" />
      </div>
    </div>
  );
}

/* ── 2. the password's ask (`password-gate.tsx`, as the door's step) ───────── */

export function PasswordStep({ register }: { register: Register }) {
  const [show, setShow] = useState(false);
  return (
    <>
      {/* The chevron back to the welcome (`entry-modal.tsx`), which is why
          the step sits under a `pt-7`. */}
      <span
        aria-hidden
        className="absolute top-0 left-0 z-10 flex size-9 items-center justify-center rounded-full text-muted-foreground"
      >
        <ChevronLeft className="size-5" />
      </span>
      <div className="pt-7">
        <div className="flex w-full flex-col gap-4">
          <div className="flex flex-col">
            <p className="flex items-center justify-center gap-1.5 text-label font-medium text-muted-foreground uppercase">
              <Lock className="size-3" aria-hidden />
              Almost in
            </p>
            <p className="mt-1.5 text-center font-heading text-page text-balance">
              {`${EVENT.name} is private`}
            </p>
            {/* ★ THE CANDIDATE. */}
            <p
              data-vg-line
              className="mt-2 text-center text-base leading-relaxed text-muted-foreground"
            >
              {ASK[register]}
            </p>
          </div>
          <div className="w-full space-y-3">
            <div className="relative">
              <Input
                type={show ? "text" : "password"}
                placeholder="Password"
                aria-label="Event password"
                autoComplete="off"
                className="h-11 pr-10 text-base"
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                aria-label={show ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground transition active:scale-90"
              >
                {show ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
            {/* Disabled until something is typed, exactly as it arrives. */}
            <Button type="button" size="cta" className="w-full" disabled>
              Unlock
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ── 3. the landing (`stack-tile.tsx`, `UploadStackTile`, its last beat) ──── */

/**
 * THE STACK'S LAST BEAT, AS A CANDIDATE DRAWS IT: the last file of the pick
 * has landed, the ghost edges have gone with the rest, and instead of leaving
 * at once the tile holds for a beat with its line on the reading pane where
 * "N to go" and the bar were. The line may wrap: the pane grows up over the
 * photograph, which is the honest cost of a long line on a tile a column
 * wide, and the readers measure it.
 */
export function StackLastBeat({
  still,
  line,
}: {
  still: PendingStill;
  line: string;
}) {
  return (
    <div
      data-upload-stack
      className="relative mb-[var(--gap-gallery)] w-full break-inside-avoid pt-1.5 pr-1.5"
    >
      <div data-media-tile data-lit="" className={cn(TILE_BOX, "rounded-tile")}>
        <NaturalStill still={still} />
        <div
          style={READING_PANE}
          className={cn(
            GLASS_MARK,
            "absolute inset-x-0 bottom-0 flex items-center gap-2 px-2 py-1.5",
          )}
        >
          <span
            data-vg-line
            className={cn(
              GLASS_MARK_LIT,
              "min-w-0 text-reading font-medium text-pretty text-white",
            )}
          >
            {line}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── 4. the failure sheet (`failure-sheet.tsx`) ───────────────────────────── */

/**
 * The sheet's own words are the candidate; each row under them carries the
 * SERVER's sentence ("never a house paraphrase", the file's own rule), so the
 * rows, their Retry and "Not now" are today's in every option.
 */
export function FailureSheetBody({ register }: { register: Register }) {
  const words = FAILED[register];
  const landed = RUN.sent - RUN.failed;
  return (
    <>
      <div data-vg-line className="flex flex-col gap-0.5 p-4">
        <p className="font-heading text-card-title font-medium text-foreground">
          {words.heading(RUN.failed, RUN.sent)}
        </p>
        <p className="text-sm text-muted-foreground">
          {words.line(HOST.displayName, landed)}
        </p>
      </div>
      <div className="px-4">
        <div className="flex flex-col gap-4">
          <Button
            type="button"
            size="cta"
            className="w-full"
            tabIndex={-1}
            data-vg-retry
          >
            <RefreshCw /> <span data-vg-line>{words.retry(RUN.failed)}</span>
          </Button>
          <ul className="flex flex-col gap-3">
            {FAILED_FILES.map((f) => (
              <li key={f.name} className="flex items-center gap-3">
                <span className="relative block size-11 shrink-0 overflow-hidden rounded-tile bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element -- a local still standing in for a blob: preview */}
                  <img src={f.src} alt="" className="size-full object-cover" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-reading font-medium">
                    {f.name}
                  </span>
                  <span className="block text-reading text-pretty text-muted-foreground">
                    That upload did not finish.
                  </span>
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="shrink-0"
                  tabIndex={-1}
                >
                  <RefreshCw /> Retry
                </Button>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mt-auto flex flex-col gap-2 p-4">
        <Button
          type="button"
          variant="ghost"
          size="lg"
          className="w-full"
          tabIndex={-1}
        >
          Not now
        </Button>
      </div>
    </>
  );
}

/* ── 5. the empty album (`gallery-empty-state.tsx`) ───────────────────────── */

export function EmptyState({ register }: { register: Register }) {
  return (
    <div className="relative">
      <GhostRiver />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="font-heading text-subsection text-balance">
          {EMPTY_HEADING}
        </p>
        <Button size="lg" tabIndex={-1} data-vg-button>
          <span data-vg-line>{EMPTY[register]}</span>
        </Button>
      </div>
    </div>
  );
}

/** The action block at zero photographs: the page's own Add steps aside (the
 *  empty state's button owns it) and Invite takes the width (`event-experience.tsx`). */
export function InviteOnly() {
  return (
    <div className="mt-4">
      <div className="mt-2 grid grid-cols-1 gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 w-full"
          tabIndex={-1}
        >
          <Share2 /> Invite
        </Button>
      </div>
    </div>
  );
}

/* ── 6. a held photograph (`stack-tile.tsx`, `WaitingTile`) ───────────────── */

export function HeldTile({
  still,
  line,
}: {
  still: PendingStill;
  line: string;
}) {
  return (
    <div
      data-waiting-tile
      data-media-tile
      data-lit=""
      className={cn(TILE_BOX, "break-inside-avoid rounded-tile")}
    >
      <div className="opacity-65">
        <NaturalStill still={still} />
      </div>
      <span
        aria-hidden
        style={READING_PANE}
        className={cn(
          GLASS_MARK,
          "absolute top-1.5 left-1.5 flex size-6 items-center justify-center rounded-full",
        )}
      >
        <Clock className={cn(GLASS_MARK_LIT, "size-3.5 text-white")} />
      </span>
      <p
        style={READING_PANE}
        className={cn(
          GLASS_MARK,
          "absolute inset-x-0 bottom-0 px-2 py-1.5 text-center text-reading",
        )}
      >
        <span data-vg-line className={cn(GLASS_MARK_LIT, "text-white")}>
          {line}
        </span>
      </p>
    </div>
  );
}

/* ── 7. the capture (`save-account-prompt.tsx`, then the `keep` wear) ─────── */

/** The card in the words column's post-upload slot: the glyph in its muted
 *  disc, the heading, the reason, the button that opens the door, and "Maybe
 *  later". ★ DRAWN AS `guest-capture` DRAWS IT NOW (its recheck, merged at
 *  0d6eb748): a mail glyph where the bookmark was, since save is gone and
 *  the card asks for an email, and a plain button rather than the bookmarked
 *  trigger the old save button once drew. A reader meets the same card on
 *  both boards, one after the other, and judges only the words here. */
export function OfferCard({ register }: { register: Register }) {
  const words = KEEP[register];
  return (
    <div
      data-media-tile
      data-vg-card
      className="rounded-xl border border-border bg-card p-5 text-center"
    >
      <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Mail className="size-5" aria-hidden />
      </div>
      <div data-vg-line>
        <p className="font-heading text-subsection">{words.heading(PICK)}</p>
        <p className="mx-auto mt-1 mb-4 max-w-xs text-reading text-muted-foreground">
          {words.body(PICK, EVENT.name)}
        </p>
      </div>
      <div className="flex justify-center">
        <Button type="button" size="default" tabIndex={-1}>
          {KEEP_BUTTON}
        </Button>
      </div>
      <button
        type="button"
        tabIndex={-1}
        className="mt-3 text-xs text-muted-foreground underline-offset-4 hover:underline"
      >
        Maybe later
      </button>
    </div>
  );
}

/** The divider the door's method ladder uses (`account-door.tsx`, `Or`). */
function Or() {
  return (
    <div className="flex items-center gap-3">
      <Separator className="flex-1" />
      <span className="text-xs text-muted-foreground">or</span>
      <Separator className="flex-1" />
    </div>
  );
}

/**
 * THE DOOR THE CARD OPENS, QUOTED: the dialog's own title and description
 * carry the wear's heading and reason (`confirm-email-dialog.tsx` reads them
 * into that slot and passes `chrome="none"`), then the code-led door as it
 * stands on its first screen, the card's newsletter switch in its slot, and
 * the Terms line every wear carries.
 */
export function KeepDoor({ register }: { register: Register }) {
  const words = KEEP[register];
  const [optIn, setOptIn] = useState(false);
  return (
    <>
      <div data-vg-line className="flex flex-col gap-2">
        <p className="font-heading text-card-title leading-none font-medium">
          {words.doorHeading}
        </p>
        <p className="text-sm text-muted-foreground">{words.doorReason}</p>
      </div>
      <div data-account-door="keep" className="space-y-4">
        <div className="space-y-4">
          <div className="space-y-3">
            <div data-vg-field className="grid gap-2">
              <Label htmlFor="vg-keep-email">Email</Label>
              <Input
                id="vg-keep-email"
                type="email"
                inputMode="email"
                placeholder="you@email.com"
              />
            </div>
            <Button type="button" className="w-full" tabIndex={-1}>
              Email me a code
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="vg-keep-newsletter"
              size="sm"
              checked={optIn}
              onCheckedChange={setOptIn}
            />
            <Label
              htmlFor="vg-keep-newsletter"
              className="text-xs font-normal text-muted-foreground"
            >
              Send me occasional Partyreel updates
            </Label>
          </div>
          <Or />
          <Button
            type="button"
            variant="outline"
            className="w-full"
            tabIndex={-1}
          >
            <GoogleIcon /> Continue with Google
          </Button>
        </div>
        <LegalConsentLine newTab className="pt-1 text-center" />
      </div>
    </>
  );
}
