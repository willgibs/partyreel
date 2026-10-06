import { Check, ChevronLeft, Clapperboard, ListChecks, X } from "lucide-react";
import Image from "next/image";

import { ctaCorner } from "@/components/ui/button";
import { marketingImage } from "@/lib/constants/marketing-media";
import { QR_PRESETS, QR_STYLE_KEYS } from "@/lib/constants/qr-presets";
import { LIVE_REEL_MINIMUM } from "@/lib/events/gallery-reel";
import { STYLE_CATALOG } from "@/lib/reel/engine/style-registry";
import { cn } from "@/lib/utils";

import { TakeHomeFigure } from "@/components/marketing/sections/features/sharing/zip-modal-demo";
import {
  Chip,
  EVENT_NAME,
  EVENT_URL,
  MiniQr,
  MockOutline,
  Panel,
  Tile,
} from "./picture-parts";

/**
 * THE HOST'S SIX PICTURES: objects on a desk, one per step, each designed for
 * its own moment (Will, `pictures=bespoke`, 2026-09-19). The paper chapter IS
 * the host's desk, so the register is a panel of the real app, a printed card,
 * a browser, a dialog: things a host actually has in front of them.
 *
 * Every string is quoted from the surface named above each picture, and every
 * number either derives from a registry or belongs to the site's one fictional
 * album (Maya & Jay's Wedding). All six are decorative; the spine marks them
 * aria-hidden, and the copy beside them carries the meaning.
 */

/* ── 01 · Create the event ──────────────────────────────────────────────── */

/** The photograph the room's screen shows behind the code (the look step's own stand-in). */
const ROOM_SCREEN = marketingImage("party-dj");

/**
 * The steppers' four hairlines at the commit moment (the room's `STEPS`: name, add, look, beat): the name and the add
 * done, the look she is on, the beat to come.
 */
const ROOM_STEPS = [true, true, true, false] as const;

/**
 * THE ROOM CREATE IS, drawn small (`create-event-wizard.tsx`, its parts in `create-event-wizard/`): the whole
 * screen in his layout, so the picture is the same four places. The subtle steppers on top (the name she gave
 * over four hairlines, the screens done and the one she is on filled, Back and the close at the sides), the
 * question just under them, the answer in the centre, one button at the foot.
 *
 * ★ DRAWN AT THE COMMIT MOMENT ON PURPOSE, because that is the fact the step's copy corrects: "Create event" is
 * what creates the event, not the name before it. That is the look screen, and its centre is the one the room
 * has now (`look-step.tsx`): her code in the two places it goes, her phone held up in front of the room's screen,
 * and four swatches that re-dress both. Every word is the room's own; the codes are drawn ones (`MiniQr`).
 *
 * ★ THE ROOM STANDS ON ITS OWN GROUND, DARK ON EVERY GROUND THE PICTURE STANDS ON, as the room is dark in both
 * themes. `.surface-ink` is that ground: the paper chapter here, the cinema's night on the home, a help page, the
 * welcome. Never `.dark`: a `.dark` nested in a `.surface-paper` is a half-dark subtree (globals.css). Every
 * mark below reads tokens, so it follows the slab's own set, and every size inside the code's two places is in the
 * place's own `cqw`, so one drawing reads the same at whatever width its column gives it.
 */
export function CreatePicture() {
  return (
    <div className="surface-ink overflow-hidden rounded-2xl border bg-background text-foreground">
      {/* The head: Back at the left, her name over the steppers, the close at the right. */}
      <div className="relative flex h-12 items-center px-3">
        <ChevronLeft aria-hidden className="size-4 text-muted-foreground" />
        <span className="absolute left-1/2 flex -translate-x-1/2 flex-col items-center gap-1.5">
          <span className="block max-w-[11rem] truncate text-[11px] font-medium">
            {EVENT_NAME}
          </span>
          <span className="flex w-28 gap-1">
            {ROOM_STEPS.map((done, i) => (
              <span
                key={i}
                className="relative block h-[3px] flex-1 overflow-hidden rounded-full bg-foreground/15"
              >
                {done && (
                  <span className="absolute inset-0 rounded-full bg-foreground" />
                )}
              </span>
            ))}
          </span>
        </span>
        <X aria-hidden className="ml-auto size-4 text-muted-foreground" />
      </div>

      {/* The question, in its one place under the head, and the line that tells her it can change. */}
      <div className="px-5 pt-3 text-center">
        <p className="text-[15px] leading-snug font-medium text-balance">
          {"Pick the code's look"}
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Change it any time from Share
        </p>
      </div>

      {/* The answer, in the centre: her code where guests meet it, then the four looks. */}
      <div className="px-5 pt-4 pb-5">
        <span
          aria-hidden
          className="@container relative mx-auto block aspect-[2/1] w-full max-w-[16rem]"
        >
          {/* The room's screen while the party runs: the slideshow, her code on the white plate at the corner. */}
          <span className="@container absolute top-1/2 right-0 block aspect-video w-[80%] -translate-y-1/2 overflow-hidden rounded-[2cqw] bg-black ring-[0.6cqw] ring-white/15">
            <Image
              src={ROOM_SCREEN.src}
              alt=""
              fill
              sizes="210px"
              className="object-cover"
            />
            <span className="absolute inset-0 bg-gradient-to-tl from-black/60 via-transparent to-transparent" />
            <span className="absolute right-[4cqw] bottom-[4cqw] block w-[17cqw] rounded-[1cqw] bg-white p-[0.7cqw]">
              <MiniQr modules={9} />
            </span>
          </span>
          {/* Her phone held up in front of it: the code card, the whole screen white. The overlap is real, so it
              takes the small shadow. */}
          <span className="@container absolute top-0 left-0 block w-[23.4cqw]">
            <span className="block aspect-[9/19.2] rounded-[14cqw] bg-black p-[2.6cqw] shadow-lift ring-1 ring-white/20">
              <span className="relative flex size-full flex-col items-center justify-center gap-[7cqw] rounded-[11.6cqw] bg-white px-[9cqw]">
                <span className="block w-full">
                  <MiniQr modules={11} />
                </span>
                <span className="h-[4cqw] w-[62cqw] rounded-full bg-neutral-900" />
                <span className="absolute top-[2.6cqw] left-1/2 h-[7.4cqw] w-[26cqw] -translate-x-1/2 rounded-full bg-black" />
              </span>
            </span>
          </span>
        </span>

        {/* The four looks, as four corners: the chosen one ringed, its name in the foreground. */}
        <span aria-hidden className="mt-5 flex justify-center gap-4">
          {QR_STYLE_KEYS.map((key, i) => (
            <span key={key} className="flex flex-col items-center gap-1.5">
              <span
                className={cn(
                  "relative block size-9 overflow-hidden rounded-[22%] bg-white ring-1 ring-white/10",
                  i === 0 &&
                    "outline-2 outline-offset-[3px] outline-foreground",
                )}
              >
                <span className="absolute -top-[14.85%] -left-[14.85%] block w-[270%]">
                  <MiniQr preset={key} modules={9} />
                </span>
              </span>
              <span
                className={cn(
                  "text-[10px]",
                  i === 0
                    ? "font-medium text-foreground"
                    : "text-muted-foreground",
                )}
              >
                {QR_PRESETS[key].label}
              </span>
            </span>
          ))}
        </span>
      </div>

      {/* The foot: the one button, the loudest thing in the room, and the one that writes the row. */}
      <div className="flex justify-center px-5 pb-5">
        <span
          className={cn(
            "flex h-10 w-full items-center justify-center bg-primary px-6 text-sm font-medium text-primary-foreground sm:w-auto sm:min-w-52",
            ctaCorner,
          )}
        >
          Create event
        </span>
      </div>
    </div>
  );
}

/* ── 02 · Share one code ────────────────────────────────────────────────── */

/**
 * The code as a PRINTED OBJECT on a real table, not a screenshot of one: the
 * step is about the code leaving the app. A landscape photograph of the
 * reception carries the width, and the table card lies on it wearing
 * `shadow-lift`, the one overlap the small shadow was ruled for (a print
 * really sitting on something).
 */
export function SharePicture() {
  const table = marketingImage("reception-table");
  return (
    <div className="relative pb-6">
      <div className="relative aspect-[5/3] w-full overflow-hidden rounded-tile">
        <Image
          src={table.src}
          alt=""
          fill
          sizes="(min-width: 1024px) 480px, 90vw"
          className="object-cover"
        />
        {/* A wash under the card's corner only, so white card on white linen
            still reads as two objects without dimming the room. */}
        <span className="absolute inset-0 bg-gradient-to-tr from-black/45 via-black/5 to-transparent" />
      </div>
      {/* The card hangs off the photograph's bottom-left corner the way
          something set down on a table overlaps the edge of the shot: the
          overlap is real, so it is the case `shadow-lift` was ruled for. Kept
          small on purpose, because the photograph is the other half of the
          picture and a plate that covers it says nothing about a room. */}
      <div className="absolute bottom-0 left-4 w-[7.5rem] -rotate-2 rounded-lg bg-white p-2.5 text-center shadow-lift sm:left-8 sm:w-[8.5rem]">
        <span className="block w-full">
          <MiniQr preset="rounded" />
        </span>
        <p className="mt-1.5 text-[10px] leading-none font-semibold text-black">
          Scan to join
        </p>
        <p className="mt-1 text-[8px] leading-tight text-black/55">
          {EVENT_NAME}
        </p>
      </div>
    </div>
  );
}

/* ── 03 · Watch it fill ─────────────────────────────────────────────────── */

const ALBUM_IDS = [
  "wedding-golden",
  "party-balloons",
  "reception-hall",
  "festival-crowd",
  "wedding-toast",
  "party-dj",
  "wedding-arch",
  "concert-confetti",
];

/**
 * The album mid-evening, in a browser: the event's one permanent link in the
 * address bar, and two tiles wearing a just-landed check, which pictures an
 * upload arriving (the product marks one with a pass of light and a rim,
 * shared/arrival.css). The count line is the app's own shape, from
 * event-experience.tsx.
 *
 * ★ NO "LIVE" CHIP. The shipped album has no Live badge anywhere: liveness is
 * a poll nobody sees. Drawing one would picture a control that does not exist,
 * so the picture makes the point the way the product does, with photographs
 * arriving and a count that is bigger than the room expected.
 */
export function FillPicture() {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card ring-1 ring-foreground/5">
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <span className="flex gap-1">
          <span className="size-1.5 rounded-full bg-foreground/20" />
          <span className="size-1.5 rounded-full bg-foreground/20" />
          <span className="size-1.5 rounded-full bg-foreground/20" />
        </span>
        <span className="flex-1 truncate rounded-md bg-muted/70 px-2 py-1 text-center text-[10px] text-muted-foreground">
          {EVENT_URL}
        </span>
      </div>
      <div className="p-3">
        <div className="grid grid-cols-4 gap-1.5">
          {ALBUM_IDS.map((id, i) => (
            <Tile key={id} id={id} sizes="110px">
              {i < 2 && (
                <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-success text-white">
                  <Check className="size-2.5" strokeWidth={3} />
                </span>
              )}
            </Tile>
          ))}
        </div>
        <p className="mt-3 px-0.5 text-[11px] text-muted-foreground tabular-nums">
          128 photos &amp; videos from 23 guests
        </p>
      </div>
    </div>
  );
}

/* ── 04 · Shape what shows ──────────────────────────────────────────────── */

const REVIEW_IDS = ["wedding-rings", "festival-lights", "wedding-petals"];

/**
 * The review queue, quoting feed-section-header.tsx (the amber label plus its
 * count pill) and review-actions.tsx (Select, then Approve all). The three
 * waiting tiles are dimmed because that is what waiting looks like here: they
 * are in the host's hands and not in the album yet.
 */
export function ShapePicture() {
  return (
    <Panel className="p-5">
      <div className="flex min-h-7 items-center justify-between gap-3">
        <span className="flex items-center gap-1.5">
          <span className="text-[11px] font-semibold tracking-wide text-warning uppercase">
            Review
          </span>
          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-warning/15 px-1 text-[10px] font-semibold text-warning tabular-nums">
            3
          </span>
        </span>
        <span className="flex items-center gap-1.5">
          <MockOutline>
            <ListChecks className="size-3.5" />
            Select
          </MockOutline>
          <span className="flex h-7 items-center gap-1.5 rounded-md bg-primary px-2.5 text-xs font-medium text-primary-foreground">
            <Check className="size-3.5" />
            Approve all
          </span>
        </span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-1.5">
        {REVIEW_IDS.map((id) => (
          <Tile key={id} id={id} className="opacity-70" sizes="130px">
            <span className="absolute top-1 left-1 size-1.5 rounded-full bg-warning" />
          </Tile>
        ))}
      </div>

      {/* The other half of the choice, said the way the app says it on the
          switch itself (review-section.tsx's moderation-off state). */}
      <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
        New uploads wait here for your approval instead of showing live.
      </p>
    </Panel>
  );
}

/* ── 05 · Take it all home ──────────────────────────────────────────────── */

/**
 * TAKE IT HOME, the panel her album's Download opens: her two sets, Originals to keep for good and Phone size to post
 * tonight, the very figure the sharing page works (`features/sharing/zip-modal-demo.tsx`, composed of the panel's own
 * pieces), held still. It floats over a hint of the album it is taking, so the picture says WHAT goes home.
 */
export function KeepPicture() {
  return (
    <div className="relative">
      {/* The album behind the panel, at a whisper: three tiles, half out of
          frame, so the layer has something to float over. */}
      <div
        aria-hidden
        className="absolute inset-x-6 -top-2 grid grid-cols-3 gap-1.5 opacity-35"
      >
        {["wedding-golden", "party-dj", "wedding-toast"].map((id) => (
          <Tile key={id} id={id} sizes="90px" />
        ))}
      </div>
      <TakeHomeFigure className="mt-10" />
    </div>
  );
}

/* ── 06 · Watch the reel grow ───────────────────────────────────────────── */

/** The one card, three moments of it: before any photo, one short, living. */
const REEL_CARD_STATES = [
  { still: null, value: `Starts at ${LIVE_REEL_MINIMUM} photos` },
  { still: "party-balloons", value: "1 more photo" },
  { still: "wedding-golden", value: "Live for guests" },
] as const;

/** The eight looks a host may set for everyone: the catalog's moods, in its order. */
const MOODS = STYLE_CATALOG.filter((style) => style.kind === "mood");

/**
 * The reel makes itself, so the host's picture has nothing to press. It draws
 * the hub's Highlight reel card (event-feed/reel-card.tsx) at the three moments
 * a host meets it, counting to the reel's minimum and then living on the reel's
 * own stills, with its words verbatim and the minimum read off
 * LIVE_REEL_MINIMUM; and under it the one thing a host may set, the Look row of
 * Settings' Highlight reel card (event-settings/highlight-reel-card.tsx), its
 * moods straight from STYLE_CATALOG so a catalog change cannot strand a name.
 */
export function ReelPicture() {
  const shown = MOODS.slice(0, 4);
  return (
    <Panel className="p-5">
      <div className="grid grid-cols-3 gap-1.5">
        {REEL_CARD_STATES.map(({ still, value }) => (
          <span
            key={value}
            className={cn(
              "relative flex aspect-[4/3] flex-col justify-end gap-0.5 overflow-hidden rounded-md p-2",
              still
                ? "text-white"
                : "border border-dashed border-foreground/25 text-foreground",
            )}
          >
            {still && (
              <>
                <Image
                  src={marketingImage(still).src}
                  alt=""
                  fill
                  sizes="110px"
                  className="object-cover"
                />
                <span className="absolute inset-0 bg-linear-to-t from-black/80 via-black/45 to-black/25" />
              </>
            )}
            <Clapperboard
              className={cn(
                "absolute top-2 left-2 size-3",
                still ? "text-white/85" : "text-muted-foreground",
              )}
            />
            <span className="relative truncate text-[10px] font-medium">
              Highlight reel
            </span>
            <span
              className={cn(
                "relative truncate text-[9px]",
                still ? "text-white/85" : "text-muted-foreground",
              )}
            >
              {value}
            </span>
          </span>
        ))}
      </div>

      <div className="mt-4 border-t pt-3">
        <p className="text-[11px] font-medium">Look</p>
        <p className="mt-0.5 text-[10px] text-muted-foreground">
          Where every guest starts. Anyone can pick their own on their device.
        </p>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {shown.map((mood, i) => (
            <Chip key={mood.id} on={i === 0}>
              {mood.label}
            </Chip>
          ))}
          <span className="rounded-md border border-dashed px-2 py-1 text-[11px] font-medium text-muted-foreground">
            +{MOODS.length - shown.length} more
          </span>
        </div>
      </div>
    </Panel>
  );
}
