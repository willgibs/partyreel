"use client";

import { Camera, ChevronLeft, Images } from "lucide-react";
import Image from "next/image";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { DoorLamp, DoorPool, LiveCount } from "@/components/guest/door/lit";
import { AlmostIn, DoorHeading } from "@/components/guest/door/heading";
import { DOOR_SHEET } from "@/components/guest/entry-shell";
import { GuestNameStep } from "@/components/guest/guest-name-step";
import { PasswordGate } from "@/components/guest/password-gate";
import { KeepOffer } from "@/components/guest/save-account-prompt";
import { uploadStepReason } from "@/components/guest/upload-step";
import { UploadIntentBody } from "@/components/guest/upload/intent-sheet";
import {
  CODE_SCREEN_TITLE,
  codeSentLine,
} from "@/components/auth/email-sign-in";
import {
  EVENT_NAME,
  MiniQr,
  Phone,
} from "@/components/marketing/sections/how-it-works/picture-parts";
import { LegalConsentLine } from "@/components/shared/legal-consent-line";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { marketingImage } from "@/lib/constants/marketing-media";
import { cn, formatEventDate } from "@/lib/utils";

/**
 * THE DOOR AS IT SHIPS, ONE SCREEN PER STEP, for the article ask's `screen`
 * option: the lit door's sheet over the blurred album, drawn from the door's
 * own pieces wherever they can stand alone (`PasswordGate`, `GuestNameStep`,
 * `UploadIntentBody`, `KeepOffer`, `DoorHeading`, `DoorLamp`) and quoted,
 * classes and words, where they cannot (the welcome is `entry-modal.tsx`'s
 * unexported `WelcomeStep`; the code screen is `AccountDoor`'s state after a
 * send, which no prop reaches). Round one drew hand-made stand-ins here, and
 * within six days they said "Nobody has to prove a name" and a four-box code
 * screen while the door said "You can change it anytime." over six boxes:
 * a picture built from the pieces changes when they do.
 *
 * ★ EACH SCREEN IS ITS OWN 375px DOCUMENT, scaled down, never a div. The
 * type ladder is `vw`-clamped and the door reads `sm:` and `40rem`
 * breakpoints, so a phone drawn inside the 1440 frame would wear the desk's
 * sizes and the desk's left-edge lamp. And the lit pieces carry `.dark`
 * variants (`lit.css`), so under the lab's own dark theme a paper-coloured
 * sheet would wear dark pools; the screen's document takes the lab's classes
 * (the font faces live on them) minus `dark`, the light door a help page on
 * paper would show. Every screen is inert: a picture, never a control.
 */

/** The phone's own CSS size, and the width it is drawn at beside a step. */
const SCREEN_W = 375;
const SCREEN_H = 640;
export const SHOT_W = 200;
/** `Phone`'s body pads 8px a side, so the screen inside it is 16px narrower. */
const SCALE = (SHOT_W - 16) / SCREEN_W;

const SHOT_DOC =
  '<!doctype html><html><head><meta charset="utf-8"></head><body></body></html>';

/** One screen: a 375px document of its own, scaled into `Phone`'s body. */
function Shot({ label, children }: { label: string; children: ReactNode }) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [body, setBody] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const frame = ref.current;
    if (!frame) return;
    const mount = () => {
      const doc = frame.contentDocument;
      if (!doc?.head || !doc.body) return;
      if (!doc.head.querySelector("[data-shot-copied]")) {
        // The parent's parsed sheets, as the lab's own Frame copies them: a
        // portalled document has no route to load its own.
        document
          .querySelectorAll<HTMLElement>('style, link[rel="stylesheet"]')
          .forEach((node) => {
            const copy = node.cloneNode(true) as HTMLElement;
            copy.dataset.shotCopied = "";
            doc.head.appendChild(copy);
          });
        const reset = doc.createElement("style");
        reset.dataset.shotCopied = "";
        // The screen is the viewport: its `h-full` chain needs a height to resolve against.
        reset.textContent =
          "html,body{height:100%}body{margin:0;overflow:hidden}";
        doc.head.appendChild(reset);
        doc.documentElement.setAttribute(
          "class",
          document.documentElement.className.replace(/\bdark\b/g, " ").trim(),
        );
      }
      setBody(doc.body);
    };
    mount();
    frame.addEventListener("load", mount);
    return () => frame.removeEventListener("load", mount);
  }, []);

  return (
    <Phone className="w-[200px] shrink-0">
      <div
        aria-label={label}
        role="img"
        className="pointer-events-none relative overflow-hidden"
        style={{ width: SCREEN_W * SCALE, height: SCREEN_H * SCALE }}
      >
        <iframe
          ref={ref}
          srcDoc={SHOT_DOC}
          title={label}
          tabIndex={-1}
          aria-hidden
          width={SCREEN_W}
          height={SCREEN_H}
          className="absolute top-0 left-0 block border-0"
          style={{ transform: `scale(${SCALE})`, transformOrigin: "0 0" }}
        />
        {body &&
          createPortal(
            <div inert className="h-full bg-background text-foreground">
              {children}
            </div>,
            body,
          )}
      </div>
    </Phone>
  );
}

/* ── The door's ground: the album, blurred and dimmed behind the sheet ────── */

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

/** `DOOR_SCRIM`'s look (30% black, 28px blur, brightness .72, saturate 1.2) as a
 *  plain filter on the album itself: a backdrop-filter over photographs is the
 *  layer headless Chrome sometimes leaves unpainted, and the lab checks read it. */
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
 * The door's sheet as `entry-shell.tsx` builds it (the responsive Sheet's
 * phone half, `DOOR_SHEET`, the lamp on its free edge) with `entry-modal.tsx`'s
 * step box inside: the chevron back and the `pt-7` that clears it.
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

const HOST = "Maya";
const EVENT_DATE = "2026-06-14";
const IN_ALBUM = 48;
const ADDRESS = "priya@example.com";
const noop = () => {};

/* ── 01 · Scan the code: the phone's own camera, not our UI ──────────────── */

export function ScanShot() {
  const table = marketingImage("reception-table");
  return (
    <Shot label="The phone's camera over the host's printed code">
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
            <span className="truncate text-sm text-black/50">
              partyreel.com
            </span>
          </span>
        </span>
      </div>
    </Shot>
  );
}

/* ── 02 · The welcome: entry-modal.tsx's WelcomeStep, quoted ──────────────── */

export function WelcomeShot() {
  return (
    <Shot label="The welcome">
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
              <span>
                Add your photos and videos in seconds. No app required.
              </span>
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
    </Shot>
  );
}

/* ── 03 · The password: the real gate ──────────────────────────────────────── */

export function PasswordShot() {
  return (
    <Shot label="The password step">
      <DoorSheet>
        <PasswordGate token="board-fixture" eventName={EVENT_NAME} />
      </DoorSheet>
    </Shot>
  );
}

/* ── 04 · The name: the real step, as Continue as guest opens it ───────────── */

export function NameShot() {
  return (
    <Shot label="The name step">
      <DoorSheet>
        <GuestNameStep
          qrToken="board-fixture"
          mode="join"
          storedName=""
          onNamed={noop}
        />
      </DoorSheet>
    </Shot>
  );
}

/* ── 05 · The code: AccountDoor's code screen under a verification gate ───── */

export function CodeShot() {
  return (
    <Shot label="Check your email, six boxes for the code">
      <DoorSheet>
        <div className="space-y-4">
          <DoorHeading
            eyebrow={<AlmostIn>Almost in</AlmostIn>}
            title={CODE_SCREEN_TITLE}
            reason={codeSentLine(ADDRESS)}
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
                Or tap the link in the same email.
              </p>
              <div className="flex items-center justify-start gap-3 text-xs">
                <span className="text-muted-foreground">Resend code</span>
                <span className="text-faint">·</span>
                <span className="text-muted-foreground">
                  Use a different email
                </span>
              </div>
            </div>
          </div>
        </div>
      </DoorSheet>
    </Shot>
  );
}

/* ── 06 · The first photo: the upload step's own heading and body ─────────── */

export function PhotoShot() {
  return (
    <Shot label="Add your photos, with Skip for now">
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
    </Shot>
  );
}

/* ── The keep: the door reopening once the first photo lands ───────────────── */

export function KeepShot() {
  return (
    <Shot label="Sent, then Keep this photo">
      <DoorSheet back={false}>
        <KeepOffer
          count={1}
          held={false}
          hostName={HOST}
          onConfirm={noop}
          onLater={noop}
        />
      </DoorSheet>
    </Shot>
  );
}
