import {
  Camera,
  Check,
  Clapperboard,
  Download,
  Heart,
  Images,
  ImageUp,
  Play,
  Share2,
} from "lucide-react";
import Image from "next/image";

import { marketingImage } from "@/lib/constants/marketing-media";
import { STYLE_CATALOG } from "@/lib/reel/engine/style-registry";
import { cn } from "@/lib/utils";

import {
  EVENT_NAME,
  MiniQr,
  MockPrimary,
  Phone,
  PhoneScene,
  Tile,
} from "./picture-parts";

/**
 * THE GUEST'S SIX PICTURES: one phone, six screens, a companion object beside
 * each. The guest half of the loop happens in a hand and nowhere else, so the
 * toggle switching to Guest switches the whole medium (picture-parts.tsx's
 * header note) and the phone answers the `phone` step the board could not:
 * this side of the page IS the phone, rather than a bezel added to one video.
 *
 * Every screen quotes its real surface: entry-modal.tsx and email-sign-in.tsx
 * for the door, event-experience.tsx for the add action and the count line,
 * guest-masonry.tsx for the landed check and the save affordance,
 * media-lightbox.tsx for the pill, poster-card.tsx for the reel card. All six
 * are decorative; the spine marks them aria-hidden.
 */

/** The screen's own body padding, so six screens share one inner margin. */
const SCREEN = "px-3 pb-3";

/* ── 01 · Scan the code ─────────────────────────────────────────────────── */

/**
 * The camera, not a screenshot of an app: a viewfinder over the table, the
 * corner brackets a phone draws while it hunts, and the link banner the
 * operating system slides in when the code resolves. The companion is the same
 * printed card the host set down one step earlier on the host's side, seen
 * from the guest's chair.
 */
export function ScanPicture() {
  const table = marketingImage("reception-table");
  return (
    <PhoneScene
      clear
      companion={
        /* The object the phone is pointed at, from the guest's own chair.
           It is the host's step two seen from the other end of the evening,
           and the echo is the point: one card, two sides of it. */
        <div className="relative">
          <div className="relative aspect-[4/3] overflow-hidden rounded-tile">
            <Image
              src={table.src}
              alt=""
              fill
              sizes="240px"
              className="object-cover"
            />
            <span className="absolute inset-0 bg-black/20" />
          </div>
          <div className="absolute -bottom-3 left-1/2 w-[7rem] -translate-x-1/2 rotate-1 rounded-lg bg-white p-2 text-center shadow-lift">
            <MiniQr />
            <p className="mt-1.5 text-[9px] leading-none font-semibold text-black">
              Scan to join
            </p>
          </div>
        </div>
      }
    >
      <Phone>
        <div className={cn(SCREEN, "relative pt-1")}>
          <div className="relative aspect-[9/15] overflow-hidden rounded-xl bg-black">
            <Image
              src={table.src}
              alt=""
              fill
              sizes="220px"
              className="object-cover opacity-90"
            />
            <span className="absolute inset-0 bg-black/30" />
            {/* The hunt: four brackets closing on the card in the middle. */}
            <span className="absolute inset-x-9 top-1/3 aspect-square">
              <span className="absolute -top-1.5 -left-1.5 size-4 rounded-tl-md border-t-2 border-l-2 border-white/90" />
              <span className="absolute -top-1.5 -right-1.5 size-4 rounded-tr-md border-t-2 border-r-2 border-white/90" />
              <span className="absolute -bottom-1.5 -left-1.5 size-4 rounded-bl-md border-b-2 border-l-2 border-white/90" />
              <span className="absolute -right-1.5 -bottom-1.5 size-4 rounded-br-md border-r-2 border-b-2 border-white/90" />
              <span className="absolute inset-0 rounded-[3px] bg-white p-1">
                <MiniQr modules={9} />
              </span>
            </span>
            {/* The banner the phone itself raises: a favicon tile, the event,
                the host we are not. Not our UI at all, which is the whole
                point of the step: the browser is already installed. */}
            <span className="absolute inset-x-2 bottom-2 flex items-center gap-2 rounded-lg bg-white/95 px-2 py-1.5">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-[5px] bg-black text-[8px] font-bold text-white">
                P
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-[9px] font-semibold text-black">
                  {EVENT_NAME}
                </span>
                <span className="truncate text-[8px] text-black/50">
                  partyreel.com
                </span>
              </span>
            </span>
          </div>
        </div>
      </Phone>
    </PhoneScene>
  );
}

/* ── 02 · Step inside ───────────────────────────────────────────────────── */

/**
 * entry-modal.tsx's welcome step, verbatim: the eyebrow, the event as the
 * hero, the host byline, the two icon rows, and Continue pinned to the foot.
 *
 * ★ THE DOOR IS THREE STEPS NOW, AND THE PICTURE DRAWS ALL THREE (Will, 2026-09-21, "the door as
 * three steps"). The phone holds the welcome; the companion holds what comes after it in the same
 * held sheet: the NAME, then the first UPLOAD asked. The verify path stays beside them as the card
 * it is, because only some events ask for it, and it sits between the two when they do.
 *
 * ★ "Email me a code" IS THE APP'S BUTTON, byte for byte (email-sign-in.tsx,
 * pinned by mock-parity.test.ts). Wherever the guest door is drawn on this
 * site, this literal is what the drawing says.
 */
export function DoorPicture() {
  return (
    <PhoneScene
      clear
      companion={
        <div className="flex flex-col gap-2.5">
          {/* Step two: the name, asked before the album rather than at the first Add. */}
          <div className="rounded-xl border bg-card p-3 ring-1 ring-foreground/5">
            <p className="text-[11px] font-semibold">
              What should we call you?
            </p>
            <div className="mt-2 flex h-8 items-center rounded-md border bg-background px-2 text-[11px] text-muted-foreground">
              Your name
            </div>
            <MockPrimary className="mt-1.5 h-8 w-full text-[11px]">
              Continue
            </MockPrimary>
          </div>
          {/* The verify path, which only some events ask for, between the name and the upload. */}
          <div className="rounded-xl border bg-card p-3 ring-1 ring-foreground/5">
            <p className="text-[10px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
              When the host asks
            </p>
            <div className="mt-2 flex h-8 items-center rounded-md border bg-background px-2 text-[11px] text-muted-foreground">
              you@email.com
            </div>
            <MockPrimary className="mt-1.5 h-8 w-full text-[11px]">
              Email me a code
            </MockPrimary>
          </div>
          {/* Step three: the first photograph, asked. */}
          <div className="rounded-xl border bg-card p-3 ring-1 ring-foreground/5">
            <p className="text-[11px] font-semibold">Add your photos</p>
            <p className="mt-1 text-[10px] text-muted-foreground">
              Add one now and the album opens.
            </p>
            <MockPrimary className="mt-2 flex h-8 w-full items-center justify-center gap-1.5 text-[11px]">
              <Camera className="size-3" />
              Take a photo
            </MockPrimary>
          </div>
        </div>
      }
    >
      <Phone>
        <div className={cn(SCREEN, "pt-2")}>
          <p className="text-[9px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
            You&rsquo;re invited to
          </p>
          <p className="mt-1 text-[15px] leading-snug font-semibold text-balance">
            {EVENT_NAME}
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground">
            Hosted by <span className="font-medium">Maya</span>
            {" · "}June 14
          </p>
          <div className="mt-3 flex flex-col gap-2 border-t pt-3">
            <span className="flex items-start gap-2 text-[10px] leading-relaxed">
              <Camera className="mt-px size-3.5 shrink-0 text-muted-foreground" />
              Add your photos and videos in seconds. No app required.
            </span>
            <span className="flex items-start gap-2 text-[10px] leading-relaxed">
              <Images className="mt-px size-3.5 shrink-0 text-muted-foreground" />
              Everyone&rsquo;s shots land in one album, yours included.
            </span>
          </div>
          <MockPrimary className="mt-4 h-10 w-full text-[13px]">
            Continue
          </MockPrimary>
        </div>
      </Phone>
    </PhoneScene>
  );
}

/* ── 03 · Add your photos ───────────────────────────────────────────────── */

const ROLL_IDS = [
  "wedding-toast",
  "party-balloons",
  "wedding-golden",
  "festival-crowd",
  "party-dj",
  "wedding-arch",
  "concert-confetti",
  "reception-hall",
  "wedding-petals",
];

/**
 * The camera roll with three picked, and the action bar's own pill underneath
 * (event-experience.tsx's ImageUp + "Add photos"; the uploading chip is the
 * floating button's). The companion is what happens next: the three on their
 * way, one still climbing, one landed with the success check guest-masonry.tsx
 * paints for about two and a half seconds.
 */
export function AddPicture() {
  return (
    <PhoneScene
      clear
      companion={
        <div className="flex flex-col gap-1.5">
          {["wedding-toast", "party-balloons", "wedding-golden"].map(
            (id, i) => (
              <div
                key={id}
                className="flex items-center gap-2.5 rounded-lg border bg-card p-1.5 ring-1 ring-foreground/5"
              >
                <Tile id={id} className="size-10 shrink-0" sizes="40px" />
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="h-1 w-full overflow-hidden rounded-full bg-muted">
                    <span
                      className="block h-full rounded-full bg-brand"
                      style={{
                        width: i === 0 ? "100%" : i === 1 ? "72%" : "38%",
                      }}
                    />
                  </span>
                  <span className="text-[9px] text-muted-foreground">
                    {i === 0 ? "Added" : "Uploading"}
                  </span>
                </span>
                {i === 0 && (
                  <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-success text-white">
                    <Check className="size-2.5" strokeWidth={3} />
                  </span>
                )}
              </div>
            ),
          )}
        </div>
      }
    >
      <Phone>
        <div className={cn(SCREEN, "pt-1")}>
          <p className="pb-2 text-[10px] font-medium text-muted-foreground">
            Recents
          </p>
          <div className="grid grid-cols-3 gap-1">
            {ROLL_IDS.map((id, i) => (
              <Tile key={id} id={id} sizes="70px">
                {i < 3 && (
                  <>
                    <span className="absolute inset-0 bg-foreground/15" />
                    <span className="absolute top-1 right-1 flex size-3.5 items-center justify-center rounded-full bg-brand text-brand-foreground">
                      <Check className="size-2" strokeWidth={3} />
                    </span>
                  </>
                )}
              </Tile>
            ))}
          </div>
          {/* The real add control is a full-width pill with a count chip on
              it once something is in flight. */}
          <span className="mt-3 flex h-9 w-full items-center justify-center gap-2 rounded-full bg-primary px-3 text-[12px] font-medium text-primary-foreground">
            <ImageUp className="size-3.5" />
            Add photos
            <span className="rounded-full bg-primary-foreground/20 px-1.5 text-[9px] tabular-nums">
              3 uploading
            </span>
          </span>
        </div>
      </Phone>
    </PhoneScene>
  );
}

/* ── 04 · See the room fill ─────────────────────────────────────────────── */

const ROOM_IDS = [
  "wedding-golden",
  "reception-hall",
  "party-dj",
  "wedding-rings",
  "festival-lights",
  "wedding-toast",
];

const BEHIND_IDS = [
  "concert-confetti",
  "party-balloons",
  "wedding-arch",
  "festival-crowd",
  "wedding-petals",
  "reception-table",
  "wedding-rings",
  "reception-hall",
  "festival-lights",
];

/**
 * The album as a guest holds it, and the same album carrying on past the edge
 * of the phone: the companion is deliberately MORE of it, faded out rather
 * than framed, because the step's whole claim is that the album is bigger than
 * what one person shot. The count line is event-experience.tsx's own.
 */
export function RoomPicture() {
  return (
    <PhoneScene
      companion={
        <div className="relative">
          {/* Squares, every one: this half of the picture is the SAME album
              carrying on past the phone's edge, so a ragged grid of mixed
              crops reads as scattered tiles instead of a continuation. */}
          <div className="grid grid-cols-3 gap-1.5">
            {BEHIND_IDS.map((id) => (
              <Tile key={id} id={id} sizes="100px" />
            ))}
          </div>
          {/* The album runs off the page; it does not stop at a border. Kept
              narrow so the fade reads as distance rather than as a mask over
              a third of the picture. */}
          <span className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-background to-transparent" />
        </div>
      }
    >
      <Phone>
        <div className={cn(SCREEN, "pt-1")}>
          <p className="truncate pb-1 text-[11px] font-semibold">
            {EVENT_NAME}
          </p>
          <p className="pb-2 text-[9px] text-muted-foreground tabular-nums">
            128 photos &amp; videos from 23 guests
          </p>
          <div className="grid grid-cols-2 gap-1">
            {ROOM_IDS.map((id, i) => (
              <Tile
                key={id}
                id={id}
                className={i % 3 === 0 ? "aspect-[3/4]" : undefined}
                sizes="100px"
              >
                {i === 1 && (
                  <span className="absolute top-1 right-1 flex size-3.5 items-center justify-center rounded-full bg-success text-white">
                    <Check className="size-2" strokeWidth={3} />
                  </span>
                )}
              </Tile>
            ))}
          </div>
        </div>
      </Phone>
    </PhoneScene>
  );
}

/* ── 05 · Save what you love ────────────────────────────────────────────── */

/**
 * media-lightbox.tsx: one photograph edge to edge and the floating pill over
 * it, left to right exactly as it ships (like, the count, Save, Share). The
 * companion is the consequence, the same frame lying in your own camera roll
 * as a print, wearing `shadow-lift` because one object really is sitting on
 * another.
 */
export function SavePicture() {
  const hero = marketingImage("wedding-golden");
  const second = marketingImage("wedding-toast");
  return (
    <PhoneScene
      companion={
        <div className="relative min-h-[13rem]">
          <div className="absolute top-4 left-2 w-28 -rotate-3 rounded-md bg-white p-1.5 pb-4 shadow-lift">
            <span className="relative block aspect-square overflow-hidden rounded-[2px]">
              <Image
                src={second.src}
                alt=""
                fill
                sizes="112px"
                className="object-cover"
              />
            </span>
          </div>
          <div className="absolute top-16 left-20 w-32 rotate-2 rounded-md bg-white p-1.5 pb-5 shadow-lift">
            <span className="relative block aspect-square overflow-hidden rounded-[2px]">
              <Image
                src={hero.src}
                alt=""
                fill
                sizes="128px"
                className="object-cover"
              />
            </span>
          </div>
        </div>
      }
    >
      <Phone>
        <div className={cn(SCREEN, "pt-1")}>
          <div className="relative aspect-[9/14] overflow-hidden rounded-xl bg-black">
            <Image
              src={hero.src}
              alt=""
              fill
              sizes="220px"
              className="object-cover"
            />
            {/* The pill: black glass, one row, nothing else on the frame. */}
            <span className="absolute inset-x-0 bottom-2.5 flex justify-center">
              <span className="flex items-center gap-3 rounded-full bg-black/55 px-4 py-2 text-white backdrop-blur-sm">
                <Heart className="size-3.5" />
                <span className="text-[10px] tabular-nums">12</span>
                <Download className="size-3.5" />
                <Share2 className="size-3.5" />
              </span>
            </span>
          </div>
        </div>
      </Phone>
    </PhoneScene>
  );
}

/* ── 06 · Get the reel ──────────────────────────────────────────────────── */

const ARRIVED_CLIPS = [
  "wedding-golden",
  "party-balloons",
  "festival-crowd",
  "wedding-petals",
];

/**
 * The reel where a guest meets it: in the album they have been adding to, as
 * the poster card with its eyebrow chip and meta line (poster-card.tsx, the
 * ` · `-separated duration, style and moment count). The companion is what the
 * host cut it from, so the last guest picture closes the loop back onto the
 * last host picture.
 */
export function ArrivesPicture() {
  const poster = marketingImage("wedding-petals");
  const style = STYLE_CATALOG[0];
  return (
    <PhoneScene
      clear
      companion={
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-4 gap-1">
            {ARRIVED_CLIPS.map((id) => (
              <Tile key={id} id={id} className="aspect-[9/14]" sizes="56px" />
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground">
            Cut from the album, by the host, after the last guest went home.
          </p>
        </div>
      }
    >
      <Phone>
        <div className={cn(SCREEN, "pt-1")}>
          <p className="truncate pb-2 text-[11px] font-semibold">
            {EVENT_NAME}
          </p>
          <div className="relative aspect-[9/13] overflow-hidden rounded-xl">
            <Image
              src={poster.src}
              alt=""
              fill
              sizes="220px"
              className="object-cover"
            />
            <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />
            <span className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-black/45 px-1.5 py-0.5">
              <Clapperboard className="size-2.5 text-reel" />
              <span className="text-[9px] font-semibold tracking-[0.14em] text-white uppercase">
                The reel
              </span>
            </span>
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex size-9 items-center justify-center rounded-full bg-white/90 text-black">
                <Play className="size-4 translate-x-px fill-current" />
              </span>
            </span>
            <span className="absolute inset-x-2 bottom-2 text-[9px] font-medium text-white tabular-nums">
              {`0:30 \u00b7 ${style.label} \u00b7 8 moments`}
            </span>
          </div>
        </div>
      </Phone>
    </PhoneScene>
  );
}
