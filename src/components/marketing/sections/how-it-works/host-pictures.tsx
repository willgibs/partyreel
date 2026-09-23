import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clapperboard,
  Download,
  Image as ImageIcon,
  Layers,
  ListChecks,
  Video,
} from "lucide-react";
import Image from "next/image";

import { marketingImage } from "@/lib/constants/marketing-media";
import { QR_PRESETS, QR_STYLE_KEYS } from "@/lib/constants/qr-presets";
import { STYLE_CATALOG } from "@/lib/reel/engine/style-registry";
import { cn } from "@/lib/utils";

import {
  Chip,
  EVENT_NAME,
  EVENT_URL,
  MiniQr,
  MockOutline,
  MockPrimary,
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

/**
 * create-event-wizard.tsx, the DESIGN step: the step rail with Details done,
 * the QR picker, and the button that actually writes the row. Drawn at the
 * commit moment on purpose, because that is the fact the step's copy corrects:
 * "Create event" is what creates the event, not the name field above it.
 */
export function CreatePicture() {
  return (
    <Panel className="p-5">
      {/* The wizard's own rail: numbered circles, a check on what is done. */}
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
        <span className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="size-3" />
        </span>
        Details
        <ArrowRight className="size-3 opacity-50" />
        <span className="flex size-5 items-center justify-center rounded-full border border-foreground/40 text-[10px] text-foreground tabular-nums">
          2
        </span>
        <span className="text-foreground">Design</span>
        <ArrowRight className="size-3 opacity-50" />
        <span className="flex size-5 items-center justify-center rounded-full border text-[10px] tabular-nums">
          3
        </span>
        Share
      </div>

      {/* What step one left behind, read back rather than re-asked. */}
      <div className="mt-4 flex items-center justify-between gap-3 rounded-md bg-muted/60 px-3 py-2">
        <span className="text-[11px] text-muted-foreground">Event name</span>
        <span className="truncate text-xs font-medium">{EVENT_NAME}</span>
      </div>

      <p className="mt-4 text-xs font-medium">Guest join QR</p>
      <p className="mt-1 text-[11px] text-muted-foreground">
        Pick a style for the QR your guests scan. You can change it anytime.
      </p>
      {/* The real picker is a 2x2 of bordered cards, the selected one ringed
          with a brand check badge. Quoted at picture scale. */}
      <div className="mt-3 grid grid-cols-4 gap-2">
        {QR_STYLE_KEYS.map((key, i) => (
          <span
            key={key}
            className={cn(
              "relative flex flex-col items-center gap-1.5 rounded-lg border p-2",
              i === 0 && "border-brand",
            )}
          >
            <span className="w-full rounded-[3px] bg-white p-1">
              <MiniQr preset={key} modules={9} />
            </span>
            <span
              className={cn(
                "text-[10px] font-medium",
                i === 0 ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {QR_PRESETS[key].label}
            </span>
            {i === 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full bg-brand text-brand-foreground">
                <Check className="size-2.5" />
              </span>
            )}
          </span>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t pt-4">
        <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <ArrowLeft className="size-3.5" />
          Back
        </span>
        <MockPrimary className="px-4">Create event</MockPrimary>
      </div>
    </Panel>
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
 * address bar, and two tiles wearing the just-landed check the real gallery
 * draws for about two and a half seconds after an upload arrives
 * (guest-masonry.tsx). The count line is the app's own shape, from
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

const EXPORT_CHIPS = [
  { label: "Everything", Icon: Layers, count: "226", on: true },
  { label: "Photos", Icon: ImageIcon, count: "214", on: false },
  { label: "Videos", Icon: Video, count: "12", on: false },
];

/**
 * export-dialog.tsx: three chip-cards each carrying its own live count, the
 * bundle size in the big tabular numeral, the item line under it, and the
 * Download button. The dialog is drawn as a floating layer over a hint of the
 * album it is taking, so the picture says WHAT is being downloaded.
 */
export function KeepPicture() {
  return (
    <div className="relative">
      {/* The album behind the dialog, at a whisper: three tiles, half out of
          frame, so the layer has something to float over. */}
      <div
        aria-hidden
        className="absolute inset-x-6 -top-2 grid grid-cols-3 gap-1.5 opacity-35"
      >
        {["wedding-golden", "party-dj", "wedding-toast"].map((id) => (
          <Tile key={id} id={id} sizes="90px" />
        ))}
      </div>
      <Panel className="relative mt-10 rounded-float p-5 shadow-layer">
        <p className="text-sm font-medium">Download album</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          Pick what to bundle into your copy.
        </p>
        <div className="mt-3 flex gap-2">
          {EXPORT_CHIPS.map(({ label, Icon, count, on }) => (
            <span
              key={label}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 rounded-lg border px-2 py-2.5",
                on && "border-primary bg-accent",
              )}
            >
              <Icon className="size-4" />
              <span className="text-[11px] font-medium">{label}</span>
              <span className="text-[10px] text-muted-foreground tabular-nums">
                {count}
              </span>
            </span>
          ))}
        </div>
        <div className="mt-4 flex items-end justify-between gap-3 border-t pt-3.5">
          <span className="flex flex-col">
            <span className="text-xl font-medium tabular-nums">4.1 GB</span>
            <span className="text-[11px] text-muted-foreground tabular-nums">
              226 items
            </span>
          </span>
          <MockPrimary className="px-3.5">
            <Download className="size-3.5" />
            Download
          </MockPrimary>
        </div>
      </Panel>
    </div>
  );
}

/* ── 06 · Cut the reel ──────────────────────────────────────────────────── */

const REEL_CLIP_IDS = [
  "wedding-golden",
  "party-balloons",
  "festival-crowd",
  "wedding-petals",
  "party-dj",
  "wedding-toast",
];

/**
 * The reel control the way the event page wears it: the section's own eyebrow,
 * the violet Create reel pill (reel-builder.tsx / the action bar, one label and
 * one colour in both places), the style rail's first four labels straight from
 * STYLE_CATALOG so a catalog change cannot strand a stale name here, and the
 * poster meta line in the format poster-card.tsx prints it.
 */
export function ReelPicture() {
  const styles = STYLE_CATALOG.slice(0, 4);
  const rest = STYLE_CATALOG.length - styles.length;
  return (
    <Panel className="p-5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
          Reel
        </span>
        <span className="flex h-9 items-center gap-2 rounded-full bg-reel px-4 text-sm font-medium text-white">
          <Clapperboard className="size-4" />
          Create reel
        </span>
      </div>

      {/* The cut itself: the moments in order, the way the strip under a
          finished reel shows what went into it. */}
      <div className="mt-4 grid grid-cols-6 gap-1">
        {REEL_CLIP_IDS.map((id) => (
          <Tile key={id} id={id} className="aspect-[9/14]" sizes="60px" />
        ))}
      </div>
      <p className="mt-2 text-[11px] font-medium text-reel tabular-nums">
        {`0:30 \u00b7 ${styles[0].label} \u00b7 ${REEL_CLIP_IDS.length} moments`}
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5 border-t pt-3">
        {styles.map((style, i) => (
          <Chip key={style.id} on={i === 0}>
            {style.label}
          </Chip>
        ))}
        <span className="rounded-md border border-dashed px-2 py-1 text-[11px] font-medium text-muted-foreground">
          +{rest} more
        </span>
      </div>
    </Panel>
  );
}
