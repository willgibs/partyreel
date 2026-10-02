"use client";

import {
  ChevronLeft,
  CircleCheckIcon,
  Download,
  Flag,
  Heart,
  Link2,
  Search,
  Share2,
  X,
} from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";

import {
  CODE_SCREEN_TITLE,
  codeSentLine,
} from "@/components/auth/email-sign-in";
import { DoorChooser } from "@/components/guest/door/chooser";
import { DOOR_MAIN, DoorColumn } from "@/components/guest/door/door-page";
import { Doorway } from "@/components/guest/door/doorway";
import { AlmostIn, DoorHeading } from "@/components/guest/door/heading";
import { DoorLamp } from "@/components/guest/door/lit";
import { WaitingDoor } from "@/components/guest/door/waiting-step";
import { STAGE_SCRIM } from "@/components/guest/door/stage";
import { WelcomeWords } from "@/components/guest/door/welcome";
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
import { Logo } from "@/components/shared/logo";
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
import { cn } from "@/lib/utils";

import type { PhoneScreenId } from "./registry";

/**
 * THE DOOR AS IT SHIPS, ONE SCREEN A STEP (help-center r1 `article=screen`, moved in from the
 * board's `door-screens.tsx`, which Will picked): the welcome and the wait at the doorway, the door
 * as the page (`locked-door` r2), and every other step in the lit door's sheet over the blurred
 * album, drawn from the door's own pieces wherever they stand alone (`Doorway`, `WelcomeWords`,
 * `WaitingDoor`, `PasswordGate`, `DoorChooser`, `GuestNameStep`, `IdentifyStep`, `UploadIntentBody`,
 * `KeepOffer`, `DoorHeading`, `DoorLamp`) and quoted, classes and words, where they cannot (the
 * guest's header resolves a session; the code screen is `AccountDoor`'s state after a send, which no
 * prop reaches).
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
 * `pt-7` that clears it. `behind` is what it rises over: the album blurred (a step after the
 * welcome's open door), or at a gate the doorway itself, shut, under the gate's light dim
 * (`STAGE_SCRIM`), keeping its state above the sheet.
 */
function DoorSheet({
  back = true,
  behind = "album",
  children,
}: {
  back?: boolean;
  behind?: "album" | "door";
  children: ReactNode;
}) {
  return (
    <div className="relative h-full">
      {behind === "door" ? (
        <div aria-hidden className="absolute inset-0">
          <DoorPageScreen doorway={<Doorway state="shut" />}>
            {null}
          </DoorPageScreen>
          <div className={cn("absolute inset-0", STAGE_SCRIM)} />
        </div>
      ) : (
        <AlbumBehind />
      )}
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

/* ── The door as the page: the welcome and the wait at the doorway (`door/stage.tsx`) ───── */

/**
 * The door's page as a guest's phone shows it: the guest header (quoted: the real one resolves a
 * session on mount), then the doorway and its words in the door's own column (`DOOR_MAIN`).
 */
function DoorPageScreen({
  doorway,
  children,
}: {
  doorway: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex h-full flex-col bg-background text-foreground">
      <header className="flex items-center justify-between gap-2 border-b border-border/60 px-5 py-3">
        <Logo />
        <div className="flex h-8 items-center">
          <Button variant="ghost" size="sm" tabIndex={-1}>
            Start for free
          </Button>
        </div>
      </header>
      <main className={DOOR_MAIN}>
        <DoorColumn doorway={doorway}>{children}</DoorColumn>
      </main>
    </div>
  );
}

/** The welcome at a Public album: the door open onto it, the album seen through the opening. */
function WelcomeScreen() {
  return (
    <DoorPageScreen
      doorway={
        <Doorway
          state="open"
          photos={ALBUM.slice(0, 4).map((id) => marketingImage(id).src)}
        />
      }
    >
      <WelcomeWords
        eventName={EVENT_NAME}
        hostName={HOST}
        eventDate={EVENT_DATE}
        mediaTotal={IN_ALBUM}
        acceptsVideo
      />
    </DoorPageScreen>
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

/* ── The report path: a photo's own Report in the viewer, and the form it opens
   (`media-lightbox-parts/actions.tsx`, `guest/report-dialog.tsx`), quoted rather than mounted: the
   viewer is a portalled dialog with the album's gestures under it, and the form's open state, its
   session read and its toast are not reachable through a prop, so the shells and the words are
   drawn from the real classes and the real strings instead. ────────────────────────────────── */

/** The photograph the article's example reports (a child at a party). */
const REPORTED = "party-balloons";

/** The report dialog's own title for a photo (`TITLE.photo`, quoted). */
const REPORT_PHOTO_TITLE = "Report this photo";

type ReportStep = "open" | "reason" | "sent";

/**
 * The photo viewer as it stands over the album (`media-lightbox.tsx`): the ground is the album blurred
 * and dimmed (the door's own ground, `AlbumBehind`), the photograph fit to the width, the sender's
 * credit top left and Close top right, and the action capsule at the foot in the order the guest's
 * viewer draws it: like and its count, Save, Share, Copy link, and Report, the flag. `marked` picks
 * that flag out the way a finger would point at it.
 */
function ViewerBehind({ marked = false }: { marked?: boolean }) {
  return (
    <div aria-hidden className="absolute inset-0">
      <AlbumBehind />
      <span className="absolute inset-x-0 top-[40%] block aspect-[3/2] -translate-y-1/2">
        <Image
          src={marketingImage(REPORTED).src}
          alt=""
          fill
          sizes="375px"
          className="object-contain"
        />
      </span>
      <span className="absolute top-2.5 left-2.5 flex items-center gap-2 rounded-full bg-black/45 py-1 pr-3 pl-1 text-sm text-white">
        <span className="flex size-7 items-center justify-center rounded-full bg-white/15 text-caption font-medium">
          P
        </span>
        Priya
      </span>
      <span className="absolute top-2.5 right-2.5 flex size-8 items-center justify-center rounded-full bg-black/45 text-white">
        <X className="size-4" />
      </span>
      <span className="absolute inset-x-0 bottom-7 flex justify-center">
        <span
          data-lightbox-capsule
          className="flex items-center gap-3 rounded-full bg-black/55 px-4 py-2.5 text-white/80"
        >
          <Heart className="size-5" />
          <span className="-ml-1.5 text-caption tabular-nums">12</span>
          <Download className="size-5" />
          <Share2 className="size-5" />
          <Link2 className="size-5" />
          <span
            className={cn(
              "-m-1 flex rounded-full p-1",
              marked && "bg-warning/25 text-white ring-2 ring-warning/80",
            )}
          >
            <Flag className="size-5" />
          </span>
        </span>
      </span>
    </div>
  );
}

/**
 * The report form for a photograph, in the dialog shape a phone opens it in (`popup.tsx`'s
 * `data-shape="dialog"`, quoted: a `Popup` portals to the top document, which escapes the phone's own
 * iframe, so its shell is redrawn here rather than mounted). It stands over the viewer it was opened
 * from, whose capsule shows the flag it came from (`ViewerBehind`), and it carries what only a photograph's
 * form does: its title, and the row that names the one photograph. A kind is picked the way a parent
 * picks it, with the article's own note in the Reason box.
 *
 * ★ IT IS DRAWN AT THE HEIGHT A PHONE GIVES IT, NOT THE FRAME'S. The form is about 770 tall (measured;
 * the six kinds are 38 each) and a real 812 phone gives its dialog 780 to stand in; this frame is 640,
 * so the dialog's contents are `zoom`ed to 75%, as the desk screens are, which leaves the box about
 * 580 with room to spare for a font that sets a line taller. The box itself keeps the 343 a phone gives
 * it (a percentage width is not scaled by zoom, so the text wraps as it would at 457), and nothing
 * is cropped: at 100% the Reason box, the step's own subject, fell below the fold.
 */
function ReportForm() {
  const picked = "consent";
  return (
    <div className="absolute inset-x-4 top-1/2 -translate-y-1/2">
      <div
        style={{ zoom: 0.75 }}
        className="flex w-full flex-col overflow-hidden rounded-float bg-popover text-sm text-popover-foreground shadow-layer ring-1 ring-foreground/10"
      >
        <div className="flex shrink-0 flex-col gap-1 p-4 pr-12">
          <p className="font-heading text-card-title text-pretty text-foreground">
            {REPORT_PHOTO_TITLE}
          </p>
          <p className="text-sm text-pretty text-muted-foreground">
            Tell us what&rsquo;s wrong and our team will review it. The host is
            never told who reported.
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          className="absolute top-2 right-2"
          tabIndex={-1}
        >
          <X />
        </Button>
        <div className="min-h-0 flex-1 space-y-4 px-4 pb-4">
          <div className="flex items-center gap-3 rounded-lg border bg-muted/40 p-2">
            <span className="relative block size-12 shrink-0 overflow-hidden rounded-md">
              <Image
                src={marketingImage(REPORTED).src}
                alt=""
                fill
                sizes="48px"
                className="object-cover"
              />
            </span>
            <p className="text-working">This photo, and only this one</p>
          </div>

          <fieldset className="space-y-1.5">
            <legend className="mb-1.5 text-sm leading-none font-medium">
              What is it?
            </legend>
            <ul className="space-y-1.5">
              {REPORT_KINDS.map((k) => (
                <li key={k}>
                  <label
                    className={cn(
                      "flex items-center gap-2.5 rounded-md border px-3 py-2 text-working",
                      picked === k
                        ? "border-foreground bg-muted/60"
                        : "border-border",
                    )}
                  >
                    <input
                      type="radio"
                      readOnly
                      tabIndex={-1}
                      checked={picked === k}
                      className="size-4 shrink-0 accent-foreground"
                    />
                    {KIND_WORDS[k]}
                  </label>
                </li>
              ))}
            </ul>
          </fieldset>

          <div className="space-y-2">
            <Label>
              Reason{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            <Textarea
              rows={3}
              readOnly
              value="The third photo from the top is of my child, and nobody asked us before posting it."
              placeholder="What's the problem here?"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium">
                Your email{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </p>
              <Button type="button" variant="outline" size="sm" tabIndex={-1}>
                Confirm your email
              </Button>
            </div>
            <p className="text-caption text-pretty text-muted-foreground">
              Only so we can ask for more if we need it. It&rsquo;s deleted when
              the report closes.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col-reverse gap-2 border-t bg-muted/50 p-4">
          <Button variant="outline" tabIndex={-1}>
            Cancel
          </Button>
          <Button tabIndex={-1}>Submit report</Button>
        </div>
      </div>
    </div>
  );
}

function ReportScreen({ step }: { step: ReportStep }) {
  if (step === "reason") {
    return (
      <div className="relative h-full">
        <ViewerBehind />
        <div aria-hidden className="absolute inset-0 bg-black/10" />
        <ReportForm />
      </div>
    );
  }
  // Back in the viewer after Submit report (the form closes and lands there), with the toast the
  // page raises: `Toaster`'s top band, clear of the header.
  return (
    <div className="relative h-full">
      <ViewerBehind marked={step === "open"} />
      {step === "sent" && (
        <div className="absolute inset-x-4 top-20 flex items-center gap-2 rounded-float bg-popover px-4 py-3 text-sm text-popover-foreground shadow-layer ring-1 ring-foreground/10">
          <CircleCheckIcon className="size-4 shrink-0 text-success" />
          Thanks. Your report has been sent for review.
        </div>
      )}
    </div>
  );
}

/** Every phone screen, by id: `Record` over the registry's ids, so a missing one is a type error. */
const SCREENS: Record<PhoneScreenId, () => ReactNode> = {
  "door-scan": () => <ScanScreen />,
  "door-welcome": () => <WelcomeScreen />,
  // A password is a gate: its step rises over the doorway, shut, never over the album it keeps.
  "door-password": () => (
    <DoorSheet behind="door">
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
  // The held door's face alone (`WaitingDoor`), never `WaitingStep`, whose loop would check in: at the
  // doorway, ajar, in the house light.
  "door-waiting": () => (
    <DoorPageScreen doorway={<Doorway state="ajar" />}>
      <WaitingDoor hostName={HOST} />
    </DoorPageScreen>
  ),
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
