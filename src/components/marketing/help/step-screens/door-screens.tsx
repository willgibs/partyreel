"use client";

import {
  Camera,
  ChevronLeft,
  CircleCheckIcon,
  Flag,
  Images,
  Search,
} from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";

import {
  CODE_SCREEN_TITLE,
  codeSentLine,
} from "@/components/auth/email-sign-in";
import { DoorChooser } from "@/components/guest/door/chooser";
import { AlmostIn, DoorHeading } from "@/components/guest/door/heading";
import { DoorLamp, DoorPool, LiveCount } from "@/components/guest/door/lit";
import { DOOR_SHEET } from "@/components/guest/entry-shell";
import { GuestNameStep } from "@/components/guest/guest-name-step";
import { IdentifyStep } from "@/components/guest/identify-step";
import { PasswordGate } from "@/components/guest/password-gate";
import { KeepOffer } from "@/components/guest/save-account-prompt";
import { uploadStepReason } from "@/components/guest/upload-step";
import { UploadIntentBody } from "@/components/guest/upload/intent-sheet";
import {
  EVENT_NAME,
  MiniQr,
} from "@/components/marketing/sections/how-it-works/picture-parts";
import { LegalConsentLine } from "@/components/shared/legal-consent-line";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { marketingImage } from "@/lib/constants/marketing-media";
import { KIND_WORDS, REPORT_KINDS } from "@/lib/reports/kinds";
import { cn, formatEventDate } from "@/lib/utils";

import type { PhoneScreenId } from "./registry";

/**
 * THE DOOR AS IT SHIPS, ONE SCREEN A STEP (help-center r1 `article=screen`, moved in from the
 * board's `door-screens.tsx`, which Will picked): the lit door's sheet over the blurred album,
 * drawn from the door's own pieces wherever they stand alone (`PasswordGate`, `DoorChooser`,
 * `GuestNameStep`, `IdentifyStep`, `UploadIntentBody`, `KeepOffer`, `DoorHeading`, `DoorLamp`) and
 * quoted, classes and words, where they cannot (the welcome is `entry-modal.tsx`'s unexported
 * `WelcomeStep`; the code screen is `AccountDoor`'s state after a send, which no prop reaches).
 *
 * ★ A PICTURE BUILT FROM THE PIECES CHANGES WHEN THEY DO. The board's first round drew stand-ins,
 * and within six days they said "Nobody has to prove a name" over a four-box code while the door
 * said "You can change it anytime." over six. So every screen here that can be the real piece is,
 * and the two that are quoted read their words from the pieces' own exports (`CODE_SCREEN_TITLE`,
 * `codeSentLine`, `uploadStepReason`).
 *
 * Each renders inside `phone-document.tsx`'s 375px document, inert. The fixture is the site's one
 * fictional album (Maya & Jay's Wedding), and nothing here can send, sign in or upload: every
 * handler is a no-op and every piece is a picture.
 */

/* ── The door's ground: the album, blurred and dimmed behind the sheet ──────────────────── */

const ALBUM = [
  "wedding-golden",
  "reception-table",
  "party-balloons",
  "wedding-toast",
  "concert-confetti",
  "wedding-rings",
  "reception-hall",
  "wedding-petals",
] as const;

/** `DOOR_SCRIM`'s look (30% black, 28px blur, brightness .72, saturate 1.2) as a plain filter on
 *  the album itself: a backdrop-filter over photographs is the layer a capture sometimes leaves
 *  unpainted. */
function AlbumBehind() {
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden bg-black">
      <div className="absolute -inset-10 grid grid-cols-2 gap-1 p-10 [filter:blur(28px)_brightness(.72)_saturate(1.2)]">
        {ALBUM.map((id, i) => (
          <span
            key={id}
            className={cn(
              "relative block overflow-hidden",
              i % 3 === 0 ? "aspect-[4/5]" : "aspect-square",
            )}
          >
            <Image
              src={marketingImage(id).src}
              alt=""
              fill
              sizes="190px"
              className="object-cover"
            />
          </span>
        ))}
      </div>
      <div className="absolute inset-0 bg-black/30" />
    </div>
  );
}

/**
 * The door's sheet as `entry-shell.tsx` builds it (the responsive Sheet's phone half, `DOOR_SHEET`,
 * the lamp on its free edge) with `entry-modal.tsx`'s step box inside: the chevron back and the
 * `pt-7` that clears it.
 */
function DoorSheet({
  back = true,
  children,
}: {
  back?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="relative h-full">
      <AlbumBehind />
      <div
        data-door-lit=""
        className={cn(
          "absolute inset-x-0 bottom-0 isolate z-10 flex max-h-[85%] flex-col rounded-t-float border-t bg-popover text-popover-foreground shadow-layer",
          DOOR_SHEET,
        )}
      >
        <DoorLamp edge="free" />
        <div className="relative pt-1">
          {back && (
            <span className="absolute top-0 left-0 z-10 flex size-9 items-center justify-center rounded-full text-muted-foreground">
              <ChevronLeft className="size-5" />
            </span>
          )}
          <div className={back ? "pt-7" : undefined}>{children}</div>
        </div>
      </div>
    </div>
  );
}

/** The part of a screen a step is about, picked out the way a finger would point at it. */
function Mark({ on, children }: { on: boolean; children: ReactNode }) {
  return (
    <span
      className={cn(
        "rounded-md",
        on &&
          "bg-warning/15 ring-2 ring-warning/70 ring-offset-2 ring-offset-popover",
      )}
    >
      {children}
    </span>
  );
}

const HOST = "Maya";
const EVENT_DATE = "2026-06-14";
const IN_ALBUM = 48;
const ADDRESS = "priya@example.com";
const noop = () => {};

/* ── The scan: the phone's own camera, not our UI ───────────────────────────────────────── */

function ScanScreen() {
  const table = marketingImage("reception-table");
  return (
    <div className="relative h-full bg-black">
      <Image
        src={table.src}
        alt=""
        fill
        sizes="375px"
        className="object-cover opacity-90"
      />
      <span className="absolute inset-0 bg-black/30" />
      <span className="absolute inset-x-24 top-[30%] aspect-square">
        <span className="absolute -top-3 -left-3 size-8 rounded-tl-xl border-t-4 border-l-4 border-white/90" />
        <span className="absolute -top-3 -right-3 size-8 rounded-tr-xl border-t-4 border-r-4 border-white/90" />
        <span className="absolute -bottom-3 -left-3 size-8 rounded-bl-xl border-b-4 border-l-4 border-white/90" />
        <span className="absolute -right-3 -bottom-3 size-8 rounded-br-xl border-r-4 border-b-4 border-white/90" />
        <span className="absolute inset-0 rounded-md bg-white p-2.5">
          <MiniQr modules={9} />
        </span>
      </span>
      <span className="absolute inset-x-4 bottom-6 flex items-center gap-3 rounded-2xl bg-white/95 px-4 py-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-black text-sm font-bold text-white">
          P
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-base font-semibold text-black">
            {EVENT_NAME}
          </span>
          <span className="truncate text-sm text-black/50">partyreel.com</span>
        </span>
      </span>
    </div>
  );
}

/* ── The welcome: entry-modal.tsx's WelcomeStep, quoted ─────────────────────────────────── */

function WelcomeScreen() {
  return (
    <DoorSheet back={false}>
      <div data-welcome-step className="flex flex-col gap-5">
        <div className="flex flex-col">
          <p className="text-label font-medium text-muted-foreground uppercase">
            You&rsquo;re invited to
          </p>
          <p className="mt-1.5 font-heading text-hero text-balance sm:text-section">
            {EVENT_NAME}
          </p>
          <div className="mt-3 flex items-center gap-2.5">
            <Avatar size="lg">
              <AvatarFallback>{HOST.slice(0, 1)}</AvatarFallback>
            </Avatar>
            <p className="text-working leading-snug text-muted-foreground">
              Hosted by{" "}
              <span className="font-medium text-foreground">{HOST}</span>
              <br />
              {formatEventDate(EVENT_DATE)}
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <p className="flex items-center gap-3.5 text-base leading-relaxed">
            <DoorPool hue={1}>
              <Camera strokeWidth={1.75} />
            </DoorPool>
            <span>Add your photos and videos in seconds. No app required.</span>
          </p>
          <p className="flex items-center gap-3.5 text-base leading-relaxed">
            <DoorPool hue={2}>
              <Images strokeWidth={1.75} />
            </DoorPool>
            <span>
              {"Everyone's shots land in one album. "}
              <LiveCount value={IN_ALBUM} />
              {" are already inside."}
            </span>
          </p>
        </div>
        <div className="mt-auto flex flex-col gap-1">
          <Button size="cta" className="w-full">
            Continue
          </Button>
          <LegalConsentLine newTab className="mt-2 text-center" />
        </div>
      </div>
    </DoorSheet>
  );
}

/* ── The code: AccountDoor's code screen under a verification gate ──────────────────────── */

type CodeMark = "address" | "resend" | "link" | "different" | null;

function CodeScreen({ mark = null }: { mark?: CodeMark }) {
  return (
    <DoorSheet>
      <div className="space-y-4">
        <DoorHeading
          eyebrow={<AlmostIn>Almost in</AlmostIn>}
          title={CODE_SCREEN_TITLE}
          reason={
            mark === "address" ? (
              <Mark on>{codeSentLine(ADDRESS)}</Mark>
            ) : (
              codeSentLine(ADDRESS)
            )
          }
        />
        <div data-otp-entry className="space-y-4">
          <InputOTP
            maxLength={6}
            inputMode="numeric"
            containerClassName="w-full"
            aria-label="Your code"
          >
            <InputOTPGroup className="w-full gap-2">
              {Array.from({ length: 6 }, (_, i) => (
                <InputOTPSlot
                  key={i}
                  index={i}
                  className="h-12! min-w-0 flex-1"
                />
              ))}
            </InputOTPGroup>
          </InputOTP>
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              <Mark on={mark === "link"}>
                Or tap the link in the same email.
              </Mark>
            </p>
            <div className="flex items-center justify-start gap-3 text-xs">
              <Mark on={mark === "resend"}>
                <span className="text-muted-foreground">
                  {/* email-sign-in.tsx's own countdown words. */}
                  {mark === "resend" ? "Resend in 42s" : "Resend code"}
                </span>
              </Mark>
              <span className="text-faint">·</span>
              <Mark on={mark === "different"}>
                <span className="text-muted-foreground">
                  Use a different email
                </span>
              </Mark>
            </div>
          </div>
        </div>
      </div>
    </DoorSheet>
  );
}

/* ── The first photo: the upload step's own heading and body ────────────────────────────── */

function PhotoScreen() {
  return (
    <DoorSheet>
      <div data-upload-step="pick" className="flex flex-col gap-4 pt-1">
        <DoorHeading
          title="Add your photos"
          reason={uploadStepReason({
            isDemo: false,
            requireUpload: false,
            albumEmpty: false,
          })}
        />
        <UploadIntentBody
          picks={[]}
          onPicks={noop}
          onSend={noop}
          footer={
            <Button
              type="button"
              variant="ghost"
              className="w-full text-muted-foreground"
            >
              Skip for now
            </Button>
          }
        />
      </div>
    </DoorSheet>
  );
}

/* ── A mailbox, searched: the phone's own mail app, not our UI ──────────────────────────── */

/**
 * No words are invented for the email itself (the template lives in the Supabase dashboard, not
 * here): the sender is Partyreel and the subject and preview are the bars a glance reads as text.
 */
function MailSearchScreen() {
  return (
    <div className="flex h-full flex-col bg-white px-4 pt-5 text-black">
      <p className="text-3xl font-bold">Search</p>
      <div className="mt-3 flex h-10 items-center gap-2 rounded-xl bg-black/[0.06] px-3 text-base">
        <Search className="size-4 text-black/45" />
        <span>Partyreel</span>
      </div>
      <p className="mt-5 text-xs font-semibold tracking-wide text-black/45 uppercase">
        Spam
      </p>
      <div className="mt-2 flex gap-3 border-b border-black/10 pb-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-black text-sm font-bold text-white">
          P
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-2 pt-0.5">
          <span className="flex items-baseline justify-between gap-2">
            <span className="font-semibold">Partyreel</span>
            <span className="text-xs text-black/45">9:41</span>
          </span>
          <span className="h-2.5 w-3/4 rounded-full bg-black/25" />
          <span className="h-2.5 w-full rounded-full bg-black/10" />
          <span className="h-2.5 w-2/3 rounded-full bg-black/10" />
        </span>
      </div>
      <p className="mt-5 text-xs font-semibold tracking-wide text-black/45 uppercase">
        Promotions
      </p>
      <div className="mt-2 flex gap-3 opacity-40">
        <span className="size-10 shrink-0 rounded-full bg-black/15" />
        <span className="flex min-w-0 flex-1 flex-col gap-2 pt-1.5">
          <span className="h-2.5 w-1/2 rounded-full bg-black/25" />
          <span className="h-2.5 w-full rounded-full bg-black/10" />
        </span>
      </div>
    </div>
  );
}

/* ── The report path: the discreet control at the album's foot (`event-experience.tsx`,
   `report-dialog.tsx`), quoted rather than mounted — its own open state and its toast are not
   reachable through a prop, so the shell and the words are drawn from the real classes and the
   real strings instead. Past the door the album is real, never blurred: only what is not yet
   earned stays behind a blur. ─────────────────────────────────────────────────────────────── */

const REPORT_ALBUM = [
  "wedding-golden",
  "reception-table",
  "party-balloons",
  "wedding-toast",
  "concert-confetti",
  "wedding-rings",
] as const;

/** The event page's own foot: the album, then the hairline and the discreet Report row. */
function ReportPageBehind() {
  return (
    <div aria-hidden className="absolute inset-0 flex flex-col bg-background">
      <div className="grid grid-cols-3 gap-0.5">
        {REPORT_ALBUM.map((id) => (
          <span
            key={id}
            className="relative block aspect-square overflow-hidden"
          >
            <Image
              src={marketingImage(id).src}
              alt=""
              fill
              sizes="125px"
              className="object-cover"
            />
          </span>
        ))}
      </div>
      <footer className="mx-3 mt-8 flex justify-center border-t border-border/60 pt-5">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          tabIndex={-1}
        >
          <Flag /> Report
        </Button>
      </footer>
    </div>
  );
}

type ReportStep = "open" | "reason" | "sent";

/** The report dialog's dialog shape (`popup.tsx`'s `data-shape="dialog"`, quoted: a `Popup` portals
 *  to the top document, which escapes the phone's own iframe, so its shell is redrawn here rather
 *  than mounted). */
function ReportScreen({ step }: { step: ReportStep }) {
  if (step === "sent") {
    return (
      <div className="relative h-full">
        <ReportPageBehind />
        <div className="absolute inset-x-4 top-20 flex items-center gap-2 rounded-float bg-popover px-4 py-3 text-sm text-popover-foreground shadow-layer ring-1 ring-foreground/10">
          <CircleCheckIcon className="size-4 shrink-0 text-success" />
          Thanks. Your report has been sent for review.
        </div>
      </div>
    );
  }
  // The form as it opens (admin-triage r2, `harm=kinds`): what it is first, then the words; the reason step
  // picks the kind a parent picks and says which photo, in the article's own example.
  const picked = step === "reason" ? "consent" : null;
  const reason =
    step === "reason"
      ? "The third photo from the top is of my child, and nobody asked us before posting it."
      : "";
  return (
    <div className="relative h-full">
      <ReportPageBehind />
      <div aria-hidden className="absolute inset-0 bg-black/10" />
      <div className="absolute inset-x-4 top-1/2 flex max-h-[calc(100%-2rem)] -translate-y-1/2 flex-col overflow-hidden rounded-float bg-popover text-popover-foreground shadow-layer ring-1 ring-foreground/10">
        <div className="flex shrink-0 flex-col gap-1 p-4 pr-12">
          <p className="font-heading text-card-title text-pretty text-foreground">
            Report this event
          </p>
          <p className="text-sm text-pretty text-muted-foreground">
            Tell us what&rsquo;s wrong and our team will review it. The host is
            never told who reported.
          </p>
        </div>
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 pb-4">
          <div
            className={cn(
              "flex flex-col gap-2 rounded-md",
              step === "reason" &&
                "bg-warning/15 ring-2 ring-warning/70 ring-offset-2 ring-offset-popover",
            )}
          >
            <p className="text-sm leading-none font-medium">What is it?</p>
            <ul className="space-y-1">
              {REPORT_KINDS.map((k) => (
                <li
                  key={k}
                  className={cn(
                    "flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-caption",
                    picked === k
                      ? "border-foreground bg-muted/60"
                      : "border-border",
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "flex size-3.5 shrink-0 items-center justify-center rounded-full border",
                      picked === k
                        ? "border-foreground"
                        : "border-muted-foreground/50",
                    )}
                  >
                    {picked === k ? (
                      <span className="size-1.5 rounded-full bg-foreground" />
                    ) : null}
                  </span>
                  {KIND_WORDS[k]}
                </li>
              ))}
            </ul>
            <Label>
              Reason{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            <Textarea
              rows={3}
              readOnly
              value={reason}
              placeholder="What's the problem here?"
            />
          </div>
        </div>
        <div className="flex shrink-0 flex-col-reverse gap-2 border-t bg-muted/50 p-4 sm:flex-row sm:justify-end">
          <Button variant="outline" tabIndex={-1}>
            Cancel
          </Button>
          <Button tabIndex={-1}>Submit report</Button>
        </div>
      </div>
    </div>
  );
}

/** Every phone screen, by id: `Record` over the registry's ids, so a missing one is a type error. */
const SCREENS: Record<PhoneScreenId, () => ReactNode> = {
  "door-scan": () => <ScanScreen />,
  "door-welcome": () => <WelcomeScreen />,
  "door-password": () => (
    <DoorSheet>
      <PasswordGate token="help-fixture" eventName={EVENT_NAME} />
    </DoorSheet>
  ),
  "door-chooser": () => (
    <DoorSheet>
      <DoorChooser onPick={noop} />
    </DoorSheet>
  ),
  "door-name": () => (
    <DoorSheet>
      <GuestNameStep
        qrToken="help-fixture"
        mode="join"
        storedName=""
        onNamed={noop}
      />
    </DoorSheet>
  ),
  "door-email": () => (
    <DoorSheet>
      <IdentifyStep
        qrToken="help-fixture"
        verification
        mediaTotal={IN_ALBUM}
        storedName=""
        onTypedName={noop}
        onVerified={noop}
      />
    </DoorSheet>
  ),
  "door-code": () => <CodeScreen />,
  "door-code-address": () => <CodeScreen mark="address" />,
  "door-code-resend": () => <CodeScreen mark="resend" />,
  "door-code-link": () => <CodeScreen mark="link" />,
  "door-code-different": () => <CodeScreen mark="different" />,
  "door-photo": () => <PhotoScreen />,
  "door-keep": () => (
    <DoorSheet back={false}>
      <KeepOffer
        count={1}
        held={false}
        hostName={HOST}
        eventName={EVENT_NAME}
        onConfirm={noop}
        onLater={noop}
      />
    </DoorSheet>
  ),
  "mail-search": () => <MailSearchScreen />,
  "report-open": () => <ReportScreen step="open" />,
  "report-reason": () => <ReportScreen step="reason" />,
  "report-sent": () => <ReportScreen step="sent" />,
};

/** One phone screen's content, for `phone-document.tsx` to hold. */
export function DoorScreen({ id }: { id: PhoneScreenId }) {
  return <>{SCREENS[id]()}</>;
}
