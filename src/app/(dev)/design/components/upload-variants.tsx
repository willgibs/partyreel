import Image from "next/image";
import { Check, ImageUp, Play, Plus } from "lucide-react";

import { EVENT_NAME, PHOTOS } from "../screens/sample-photos";
import { Variant } from "./variant-frame";

/**
 * Touchpoint: the upload moment. Where "add photos" lives, and how progress
 * and the posted-vs-pending distinction feel while it happens.
 */
export function UploadVariants() {
  return (
    <div aria-hidden className="grid gap-8 py-4 md:grid-cols-2 xl:grid-cols-3">
      <Variant
        n={1}
        name="Dropzone card"
        rationale="A dedicated panel above the gallery: maximum clarity about what to do, costs vertical space."
      >
        <Page>
          <div
            className="mt-4 flex flex-col items-center gap-1.5 border border-dashed border-foreground/40 bg-muted/60 py-7"
            style={{ borderRadius: "var(--radius)" }}
          >
            <ImageUp className="size-5 text-muted-foreground" />
            <p className="text-[13px] font-medium">Add photos & videos</p>
            <p className="text-[11px] text-muted-foreground">
              Tap to choose from your phone
            </p>
          </div>
          <QueueRow />
          <Grid from={2} />
        </Page>
      </Variant>

      <Variant
        n={2}
        name="Floating action bar"
        rationale="The gallery leads; one thumb-reach pill is always present. Progress lives inside the pill, never blocks browsing."
      >
        <Page>
          <Grid from={0} rows={4} />
        </Page>
        <div className="absolute inset-x-0 bottom-4 flex justify-center">
          <button
            data-dir-press
            className="flex h-11 items-center gap-3 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground shadow-[0_6px_16px_rgba(0,0,0,0.18)]"
          >
            <span className="flex items-center gap-2">
              <ImageUp className="size-4" />
              Add photos
            </span>
            <span className="rounded-full bg-primary-foreground/20 px-2 py-0.5 text-[11px]">
              2 uploading
            </span>
          </button>
        </div>
      </Variant>

      <Variant
        n={4}
        name="Floating + tile combo"
        rationale="THE SELECTED SPEC (revised): no add tile (busy) - the header's wide Add owns page-top, the floating button takes over on scroll (never both visible). Dynamic state in the pill, progress on arriving tiles, green completion check, subtle play badge marks videos."
      >
        <Page>
          <div className="mt-4 grid grid-cols-3 gap-[3px]">
            {PHOTOS.slice(0, 9).map((src, i) => (
              <Tile
                key={src}
                src={src}
                uploading={i === 0}
                done={i === 1}
                video={i === 4}
              />
            ))}
          </div>
        </Page>
        <div className="absolute inset-x-0 bottom-4 flex justify-center">
          <button
            data-dir-press
            className="flex h-11 items-center gap-3 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground shadow-[0_6px_16px_rgba(0,0,0,0.18)]"
          >
            <span className="flex items-center gap-2">
              <ImageUp className="size-4" />
              Add photos
            </span>
            <span className="rounded-full bg-primary-foreground/20 px-2 py-0.5 text-[11px]">
              2 uploading
            </span>
          </button>
        </div>
      </Variant>

      <Variant
        n={3}
        name="Add tile in the grid"
        rationale="Upload IS a gallery cell: the lightest chrome possible, photos stay the whole story. Progress shows on the arriving tiles."
      >
        <Page>
          <div className="mt-4 grid grid-cols-3 gap-[3px]">
            <button
              data-dir-press
              className="flex aspect-square flex-col items-center justify-center gap-1 border border-dashed border-foreground/35 bg-muted/40"
              style={{ borderRadius: "var(--radius-tile)" }}
            >
              <Plus className="size-5" />
              <span className="text-[10px] font-medium">Add</span>
            </button>
            {PHOTOS.slice(0, 8).map((src, i) => (
              <Tile key={src} src={src} uploading={i === 0} done={i === 1} />
            ))}
          </div>
        </Page>
      </Variant>
    </div>
  );
}

function Page({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 px-4 pt-12">
      <p data-dir-display className="text-xl leading-tight">
        {EVENT_NAME}
      </p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">
        128 photos & videos
      </p>
      {children}
    </div>
  );
}

function QueueRow() {
  return (
    <div data-dir-card className="mt-2 flex items-center gap-2.5 p-2.5">
      <div className="relative size-9 overflow-hidden rounded-md">
        <Image src={PHOTOS[0]} alt="" fill sizes="36px" className="object-cover" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium">IMG_2041.jpg</p>
        <div className="mt-1 h-1 overflow-hidden rounded-full bg-muted">
          <div className="h-full w-2/3 rounded-full bg-foreground/70" />
        </div>
      </div>
      <span className="text-[10px] text-muted-foreground">2 of 3</span>
    </div>
  );
}

function Grid({ from, rows = 2 }: { from: number; rows?: number }) {
  return (
    <div className="mt-4 grid grid-cols-3 gap-[3px]">
      {PHOTOS.slice(from, from + rows * 3).map((src) => (
        <Tile key={src} src={src} />
      ))}
    </div>
  );
}

function Tile({
  src,
  uploading = false,
  done = false,
  video = false,
}: {
  src: string;
  uploading?: boolean;
  done?: boolean;
  video?: boolean;
}) {
  return (
    <div
      className="relative aspect-square overflow-hidden"
      style={{ borderRadius: "var(--radius-tile)" }}
    >
      <Image src={src} alt="" fill sizes="100px" className="object-cover" />
      {video && (
        /* Subtle type marker: videos read as videos before they're tapped. */
        <span className="absolute bottom-1.5 left-1.5 flex size-4.5 items-center justify-center rounded-full bg-black/45 backdrop-blur-sm">
          <Play className="ml-px size-2.5 text-white" fill="currentColor" />
        </span>
      )}
      {uploading && (
        <div className="absolute inset-0 flex items-end bg-black/35 p-1.5">
          <div className="h-1 w-full overflow-hidden rounded-full bg-white/30">
            <div className="h-full w-1/2 rounded-full bg-white" />
          </div>
        </div>
      )}
      {done && (
        /* Done is ALWAYS state-green (round-6 policy): certainty must read
           at a glance, and white reads as chrome. */
        <span
          className="absolute top-1.5 right-1.5 flex size-4.5 items-center justify-center rounded-full"
          style={{
            background: "var(--success)",
            color: "var(--success-foreground)",
          }}
        >
          <Check className="size-3" />
        </span>
      )}
    </div>
  );
}
