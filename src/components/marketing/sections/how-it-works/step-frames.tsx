import {
  ArrowRight,
  Camera,
  Clapperboard,
  Download,
  Image as ImageIcon,
  Layers,
  QrCode,
  Video,
} from "lucide-react";
import Image from "next/image";

import { BrowserFrame } from "@/components/marketing/frames";
import { marketingImage } from "@/lib/constants/marketing-media";
import { QR_PRESETS, QR_STYLE_KEYS } from "@/lib/constants/qr-presets";
import { STYLE_CATALOG } from "@/lib/reel/engine/style-registry";
import { cn } from "@/lib/utils";

/**
 * The walkthrough spine's six product frames: small, static quotes of the
 * shipped surfaces (exact control shapes + exact strings, stylized to
 * marketing), one per step. All decorative (aria-hidden at the spine), all
 * still: the spine reads like a plan, so the frames hold their pose. Source
 * strings: create wizard + qr-designer-dialog (S1), guest entry-modal +
 * email-sign-in (S2), the live gallery (S3), feed-section-header (S4), the
 * export dialog (S5), event-feed-action-bar + the style registry (S6).
 */

// The site-wide fixture event (one coherent fictional album across pages).
const EVENT_NAME = "Maya & Jay's Wedding";

/** Shared card shell so the six frames read as one family. */
function FrameCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border bg-card p-5 ring-1 ring-foreground/5 select-none",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** A resting primary button shape (mock; not a real control). */
function MockPrimary({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "flex h-9 items-center justify-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground",
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ── S1 · HOST: create the event + pick a QR preset ── */
export function CreateFrame() {
  return (
    <FrameCard>
      <p className="text-xs font-medium">Event name</p>
      <div className="mt-1.5 flex h-9 items-center rounded-md border bg-background px-3 text-sm">
        {EVENT_NAME}
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">
        The only required field. The event is live the moment you create it.
      </p>
      <div className="mt-4 border-t pt-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-medium">Customize the QR code</p>
          <span className="flex size-9 items-center justify-center rounded-md border">
            <QrCode className="size-5" strokeWidth={1.4} />
          </span>
        </div>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {QR_STYLE_KEYS.map((key, i) => (
            <span
              key={key}
              className={cn(
                "rounded-md border px-2 py-1 text-[11px] font-medium",
                i === 0
                  ? "text-foreground ring-1 ring-foreground/40"
                  : "text-muted-foreground",
              )}
            >
              {QR_PRESETS[key].label}
            </span>
          ))}
        </div>
        <MockPrimary className="mt-3 w-full">Save QR style</MockPrimary>
      </div>
    </FrameCard>
  );
}

/* ── S2 · GUEST: the entry sheet + the verify beat ── */
export function GuestEntryFrame() {
  return (
    <FrameCard>
      <p className="text-[10px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
        You&rsquo;re invited to
      </p>
      <p className="mt-1 font-heading text-lg leading-snug text-balance">
        {EVENT_NAME}
      </p>
      <p className="mt-3 flex items-start gap-2.5 text-xs leading-relaxed">
        <Camera className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
        Add your photos and videos in seconds. No app, no account.
      </p>
      <MockPrimary className="mt-4 w-full">Continue</MockPrimary>
      <div className="mt-4 border-t pt-3.5">
        <p className="text-[10px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
          When the host requires accounts
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1.5 text-[11px] text-muted-foreground">
          <span className="rounded-md border px-2 py-1">Email me a code</span>
          <ArrowRight className="size-3" />
          <span className="rounded-md border px-2 py-1">Enter your code</span>
          <ArrowRight className="size-3" />
          <span className="rounded-md border px-2 py-1 text-success">
            You&rsquo;re in
          </span>
        </div>
      </div>
    </FrameCard>
  );
}

/* ── S3 · BOTH: the album filling live ── */
const ALBUM_TILE_IDS = [
  "wedding-golden",
  "party-balloons",
  "reception-table",
  "festival-crowd",
  "wedding-toast",
  "party-dj",
  "wedding-arch",
  "concert-confetti",
];

export function LiveAlbumFrame() {
  return (
    <BrowserFrame label="partyreel.com/a/maya-and-jay">
      <div className="grid grid-cols-4 gap-1.5">
        {ALBUM_TILE_IDS.map((id) => {
          const m = marketingImage(id);
          return (
            <div
              key={id}
              className="relative aspect-square overflow-hidden rounded-md"
            >
              <Image
                src={m.src}
                alt=""
                fill
                sizes="(min-width: 640px) 104px, 22vw"
                className="object-cover"
              />
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 px-1">
        <span className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <span className="size-2 rounded-full bg-success" />
          Filling live right now
        </span>
        <span className="text-[11px] text-muted-foreground tabular-nums">
          128 photos · 23 guests
        </span>
      </div>
    </BrowserFrame>
  );
}

/* ── S4 · HOST: the review queue ── */
const REVIEW_TILE_IDS = ["wedding-rings", "reception-hall", "festival-lights"];

export function ReviewFrame() {
  return (
    <FrameCard>
      {/* The feed section header, quoted: amber REVIEW eyebrow + count pill +
          the Approve all cluster (the app's one needs-action tone). */}
      <div className="flex min-h-7 items-center justify-between gap-3">
        <p className="flex items-center gap-1.5">
          <span className="text-[11px] font-semibold tracking-wide text-warning uppercase">
            Review
          </span>
          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-warning/15 px-1 text-[10px] font-semibold text-warning tabular-nums">
            8
          </span>
        </p>
        <span className="flex h-7 items-center rounded-md border px-2.5 text-xs font-medium">
          Approve all
        </span>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-1.5">
        {REVIEW_TILE_IDS.map((id) => {
          const m = marketingImage(id);
          return (
            <div
              key={id}
              className="relative aspect-square overflow-hidden rounded-md"
            >
              <Image
                src={m.src}
                alt=""
                fill
                sizes="120px"
                className="object-cover"
              />
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        New uploads wait here for your approval, or skip review and let the
        album run live.
      </p>
    </FrameCard>
  );
}

/* ── S5 · EVERYONE: the download-album dialog ── */
const EXPORT_CHIPS = [
  { label: "Everything", Icon: Layers, active: true },
  { label: "Photos", Icon: ImageIcon, active: false },
  { label: "Videos", Icon: Video, active: false },
];

export function ExportFrame() {
  return (
    <FrameCard>
      <p className="text-sm font-medium">Download album</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {EXPORT_CHIPS.map(({ label, Icon, active }) => (
          <span
            key={label}
            className={cn(
              "flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium",
              active
                ? "text-foreground ring-1 ring-foreground/40"
                : "text-muted-foreground",
            )}
          >
            <Icon className="size-3.5" />
            {label}
          </span>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between gap-3 border-t pt-3.5">
        <span className="text-[11px] text-muted-foreground tabular-nums">
          214 photos · 12 videos
        </span>
        <MockPrimary className="px-3.5">
          <Download className="size-3.5" />
          Download
        </MockPrimary>
      </div>
    </FrameCard>
  );
}

/* ── S6 · THE PAYOFF: the reel ── */
export function ReelPayoffFrame() {
  // The catalog is the source: the first few named styles + a derived rest
  // count, so a catalog change can never strand a stale number here.
  const shown = STYLE_CATALOG.slice(0, 4);
  const rest = STYLE_CATALOG.length - shown.length;
  return (
    <FrameCard>
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-1.5">
          <span className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
            Reel
          </span>
        </p>
        {/* The app's real create control: the violet pill, quoted. */}
        <span className="flex h-9 items-center gap-2 rounded-full bg-reel px-4 text-sm font-medium text-white">
          <Clapperboard className="size-4" />
          Create reel
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {shown.map((style, i) => (
          <span
            key={style.id}
            className={cn(
              "rounded-md border px-2 py-1 text-[11px] font-medium",
              i === 0
                ? "text-foreground ring-1 ring-foreground/40"
                : "text-muted-foreground",
            )}
          >
            {style.label}
          </span>
        ))}
        <span className="rounded-md border border-dashed px-2 py-1 text-[11px] font-medium text-muted-foreground">
          +{rest} more
        </span>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Pick a style and the reel cuts itself. Rendered free, on your phone.
      </p>
    </FrameCard>
  );
}
