"use client";

import { Download, Image as ImageIcon, Layers, Video } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

import {
  AlbumFrame,
  BrowserFrame,
  GalleryFrame,
  PhoneFrame,
  QrFrame,
  ReelFrame,
} from "@/components/marketing/frames";
import {
  CreateFrame,
  ExportFrame,
  GuestEntryFrame,
  LiveAlbumFrame,
  ReelPayoffFrame,
  ReviewFrame,
} from "@/components/marketing/sections/how-it-works/step-frames";
import { marketingImage } from "@/lib/constants/marketing-media";
import { cn } from "@/lib/utils";

import { ALBUM_TILE_IDS, EVENT_URL_LABEL, type PictureMoment } from "./content";

/**
 * THE THREE ANSWERS TO "WHAT DOES A STEP LOOK LIKE": THE PICTURES decision's
 * whole evidence. One component per moment per treatment, so `SpineList`
 * (spine-list.tsx) can draw any step count against any treatment without
 * knowing which one it got.
 */
export type PictureTreatment = "bespoke" | "site" | "live";

/* ── "bespoke": the real step-frames.tsx quotes, unchanged ───────────────── */

const BESPOKE_FRAME: Record<PictureMoment, React.ComponentType> = {
  create: CreateFrame,
  scan: GuestEntryFrame,
  fill: LiveAlbumFrame,
  review: ReviewFrame,
  export: ExportFrame,
  reel: ReelPayoffFrame,
};

/* ── "site": the site's own frame vocabulary (src/components/marketing/frames) ── */

const EXPORT_CHIPS = [
  { label: "Everything", Icon: Layers },
  { label: "Photos", Icon: ImageIcon },
  { label: "Videos", Icon: Video },
] as const;

/** The one moment with no dedicated site frame: a plain BrowserFrame wearing
 *  the export dialog's own shape (chips + a download row), the same way
 *  AlbumFrame and GalleryFrame are BrowserFrame plus one well of their own. */
function DownloadFrame() {
  return (
    <BrowserFrame label={EVENT_URL_LABEL}>
      <p className="text-sm font-medium">Download album</p>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {EXPORT_CHIPS.map(({ label, Icon }) => (
          <span
            key={label}
            className="flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium text-muted-foreground"
          >
            <Icon className="size-3.5" />
            {label}
          </span>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 border-t pt-3">
        <span className="text-[11px] text-muted-foreground">
          The whole album, one zip
        </span>
        <span className="flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground">
          <Download className="size-3.5" />
          Download
        </span>
      </div>
    </BrowserFrame>
  );
}

const SITE_FRAME: Record<PictureMoment, React.ComponentType> = {
  create: () => <QrFrame caption="Scan to join" />,
  scan: () => <PhoneFrame />,
  fill: () => <AlbumFrame label={EVENT_URL_LABEL} />,
  review: () => <GalleryFrame label={EVENT_URL_LABEL} />,
  export: DownloadFrame,
  reel: () => <ReelFrame />,
};

/* ── "live": the product's own controls, mid-action ──────────────────────── */

/** The wizard's real Details-step field, mid-name, with a blinking caret: the
 *  QR beneath it is the real QrFrame, so this option shows the two real
 *  artifacts the step is actually about rather than a diagram of either. */
function LiveCreateCard() {
  const [blink, setBlink] = useState(true);
  useEffect(() => {
    const id = setInterval(() => setBlink((b) => !b), 600);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-2xl border bg-card p-4 ring-1 ring-foreground/5">
        <label className="text-xs font-medium text-muted-foreground">
          Event name
        </label>
        <div className="mt-1.5 flex h-9 items-center rounded-md border bg-background px-3 text-sm">
          Maya &amp; Jay&rsquo;s Wed
          <span
            aria-hidden
            className={cn(
              "ml-0.5 h-4 w-px bg-foreground",
              blink ? "opacity-100" : "opacity-0",
            )}
          />
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">
          The only required field.
        </p>
      </div>
      <QrFrame caption="Scan to join" />
    </div>
  );
}

/** The album mid-fill: some tiles landed, one still spinning in. A still
 *  capture cannot show motion, so this shows the MOMENT motion leaves behind
 *  rather than an animation nothing will see. */
function LiveFillingAlbum() {
  return (
    <BrowserFrame label={EVENT_URL_LABEL}>
      <div className="grid grid-cols-3 gap-1.5">
        {ALBUM_TILE_IDS.map((id, i) => {
          const m = marketingImage(id);
          const landed = i < 4;
          return (
            <div
              key={id}
              className={cn(
                "relative aspect-square overflow-hidden rounded-md",
                !landed && "opacity-40",
              )}
            >
              <Image
                src={m.src}
                alt=""
                fill
                sizes="140px"
                className="object-cover"
              />
              {!landed && (
                <span className="absolute inset-0 flex items-center justify-center bg-background/50">
                  <span className="size-3 animate-spin rounded-full border-2 border-foreground/30 border-t-foreground" />
                </span>
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-2.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <span className="size-1.5 rounded-full bg-success" />
        4 landed, 2 still uploading
      </p>
    </BrowserFrame>
  );
}

/** The other four moments keep the site's own frame: the motion this option
 *  promises (docs/tracks/how-it-works.md, THE PICTURES) is concentrated where
 *  a still capture can actually show it, typing and tiles landing, rather than
 *  spread thin over six frames that would otherwise look identical to "site". */
const LIVE_FRAME: Record<PictureMoment, React.ComponentType> = {
  create: LiveCreateCard,
  scan: SITE_FRAME.scan,
  fill: LiveFillingAlbum,
  review: SITE_FRAME.review,
  export: SITE_FRAME.export,
  reel: SITE_FRAME.reel,
};

const TREATMENT: Record<PictureTreatment, Record<PictureMoment, React.ComponentType>> = {
  bespoke: BESPOKE_FRAME,
  site: SITE_FRAME,
  live: LIVE_FRAME,
};

/**
 * ONE STEP'S PICTURE. `first` marks the page's own first picture, which is
 * what every scene measures its "how far down the first product picture
 * sits" line against (scene.tsx).
 */
export function StepPicture({
  moment,
  treatment,
  first = false,
}: {
  moment: PictureMoment;
  treatment: PictureTreatment;
  first?: boolean;
}) {
  const Picture = TREATMENT[treatment][moment];
  return (
    <div data-hiw-picture={first ? "" : undefined}>
      <Picture />
    </div>
  );
}
