import Image from "next/image";
import {
  Check,
  Download,
  Eye,
  EyeOff,
  Heart,
  Share2,
  Trash2,
} from "lucide-react";

import { PHOTOS } from "../screens/sample-photos";
import { GalleryActionsToastDemo } from "./gallery-actions-toast-demo";
import { Variant } from "./variant-frame";

/**
 * Touchpoint: the GALLERY ACTION MODEL (Phase 5 S3·3c), cross-surface (guest +
 * host). 3c.1 SHIPPED the host tile reveal (top-right hover row, like far-right,
 * hidden = 30% dim). This lab pass shapes 3c.2: the LIGHTBOX host actions + the
 * UNIVERSAL per-action COLOR layer + the feedback toasts.
 *
 * Will's color direction (2026-06-20): per-action colors give recognizability +
 * clearer state feedback than monochrome (which is hard to read). The system is
 * UNIVERSAL - the SAME colors on guest and host; the only difference is the
 * action SET (guests have no hide/approve/delete). Emil rule: icons MONOCHROME
 * at rest (on the media-hover reveal), then take their color on direct
 * icon-hover + on active state (liked = filled pink). Native `title` tooltips.
 *
 * Static mocks can't hover, so the revealed rows are drawn at full opacity with
 * each icon in its hover/active COLOR (so the palette reads in a screenshot); a
 * note marks the rest-monochrome behavior. The toast group is a live client
 * island. NO production imports - hand-built from sample-photos + lucide.
 */
export function GalleryActionsVariants() {
  return (
    <div className="space-y-12 py-4">
      <Legend />

      <Group
        eyebrow="A. Host tile: rest vs. hover (3c.1, shipped)"
        blurb="At rest the gallery stays clean; a HIDDEN tile keeps a persistent amber Show marker (off-hover, like the liked heart) PLUS the 30% dim, so hidden is unmistakable + 1-tap to show. Hovering reveals the rest of the row, each icon monochrome until you hover it, then its color. Like is FAR-RIGHT and stays colored while liked, so it never shifts as the rest collapse on hover-off. Moderation is optimistic (instant, reverts on failure)."
      >
        <Variant
          n={1}
          name="At rest"
          rationale="Pure media. Hidden = 30% opacity (the mark). No status dots in the main gallery - anything here is approved + visible (pending lives in its own review section, 3b)."
        >
          <TileBoard mode="rest" />
        </Variant>
        <Variant
          n={2}
          name="On hover (colors shown)"
          rationale="The revealed row in its hover/active colors: hide/show amber, delete red, download blue, like pink (far-right). Approve (green) shows on review items, in the lightbox + the review section. Live: icons are white until directly hovered."
        >
          <TileBoard mode="hover" />
        </Variant>
      </Group>

      <Group
        eyebrow="B. Host lightbox: the grouped pill (B2, colored)"
        blurb="The full-screen viewer carries the full action set as a clear, accessible alternative to the hover (and on mobile it's the ONLY place hide/delete live). The ratified grouped pill splits 'enjoy' (like · download · share) from 'curate' (hide/approve · remove) with a divider, signalling 'these change what guests see' vs 'these are just for you'. Delete sits behind a modal confirm; everything else is 1-way-safe or reversible."
      >
        <Variant
          n={1}
          name="Approved item"
          rationale="enjoy: like (pink when liked) · count · download (blue) · share | curate: hide (amber) · remove (red, modal-confirm)."
        >
          <LightboxMock status="approved" />
        </Variant>
        <Variant
          n={2}
          name="Pending item"
          rationale="Same pill, curate group leads with approve (green); hidden items swap hide for show (amber). The pill reads the item's status."
        >
          <LightboxMock status="pending" />
        </Variant>
      </Group>

      <Group
        eyebrow="C. Guest parity: same colors, fewer actions"
        blurb="The color language is NOT host-exclusive, a guest reads a pink heart as 'liked' and white as base just as clearly. The guest gets the same colored Like + Download; the only difference is no moderation. The guest viewer keeps its exact behavior + gestures; it just gains the same colors."
      >
        <Variant
          n={1}
          name="Guest tile (on hover)"
          rationale="download (blue) + like (pink, far-right). The host's row minus the curate actions, one vocabulary, two roles."
        >
          <GuestTileMock />
        </Variant>
        <Variant
          n={2}
          name="Guest lightbox pill"
          rationale="enjoy group only: like (pink when liked) · download (blue) · share. No divider, no curate group."
        >
          <LightboxMock status="guest" />
        </Variant>
      </Group>

      <Group
        eyebrow="D. Feedback toasts (live)"
        blurb="A subtle confirmation on Like and Hide so the impact is never a guess. Tap to feel each + lock the copy."
      >
        <div className="md:col-span-2 xl:col-span-3">
          <GalleryActionsToastDemo />
        </div>
      </Group>
    </div>
  );
}

/* ── The color legend (the system key) ───────────────────────────────────── */

function Legend() {
  const items: { label: string; swatch: string }[] = [
    { label: "Like", swatch: "bg-like" },
    { label: "Save · Download", swatch: "bg-save" },
    { label: "Hide · Show", swatch: "bg-warning" },
    { label: "Approve", swatch: "bg-success" },
    { label: "Delete", swatch: "bg-destructive" },
  ];
  return (
    <section>
      <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
        The action color system (universal: guest + host)
      </p>
      <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
        One color per action, the same everywhere it appears, so the action is
        recognizable and its state is legible at a glance. Monochrome at rest,
        color on direct icon-hover + active state; desktop hover shows a styled
        tooltip label. (Download, Save, and Share share the blue, they aren&rsquo;t
        state-based; the distinct hues are for the state actions.)
      </p>
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
        {items.map((it) => (
          <span key={it.label} className="flex items-center gap-2 text-sm">
            <span className={`size-3 rounded-full ${it.swatch}`} />
            {it.label}
          </span>
        ))}
      </div>
    </section>
  );
}

/* ── Layout scaffolding ──────────────────────────────────────────────────── */

function Group({
  eyebrow,
  blurb,
  children,
}: {
  eyebrow: string;
  blurb: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
        {eyebrow}
      </p>
      <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{blurb}</p>
      <div aria-hidden className="mt-5 grid gap-8 md:grid-cols-2 xl:grid-cols-3">
        {children}
      </div>
    </section>
  );
}

function Photo({ src }: { src: string }) {
  return <Image src={src} alt="" fill sizes="160px" className="object-cover" />;
}

/** A circular action chip (mirrors the shipped 3c.1 host-tile ACTION_BASE). The
 *  icon child carries its action color; the chip stays the dark glass disc. */
function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex size-7 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm">
      {children}
    </span>
  );
}

function HoverLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="absolute bottom-1.5 left-1.5 z-20 rounded-full bg-black/55 px-1.5 py-0.5 text-[8px] font-medium tracking-wide text-white/90 uppercase backdrop-blur-sm">
      {children}
    </span>
  );
}

/* ── A. Host tile (rest + hover) ──────────────────────────────────────────── */

function TileBoard({ mode }: { mode: "rest" | "hover" }) {
  return (
    <div className="absolute inset-0 flex flex-col px-4 pt-12">
      <p data-dir-display className="text-lg leading-snug">
        Maya &amp; Jay&apos;s Wedding
      </p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">
        {mode === "rest" ? "Resting gallery" : "Each tile's revealed actions"}
      </p>
      <div className="mt-3 columns-2 gap-[3px]">
        <HostTile src={PHOTOS[0]} ratio="aspect-[3/4]" status="approved" mode={mode} />
        <HostTile src={PHOTOS[1]} ratio="aspect-square" status="approved" mode={mode} liked />
        <HostTile src={PHOTOS[2]} ratio="aspect-[4/5]" status="approved" mode={mode} />
        <HostTile src={PHOTOS[3]} ratio="aspect-[3/4]" status="hidden" mode={mode} />
        <HostTile src={PHOTOS[5]} ratio="aspect-square" status="approved" mode={mode} />
        <HostTile src={PHOTOS[6]} ratio="aspect-[4/5]" status="approved" mode={mode} />
      </div>
    </div>
  );
}

function HostTile({
  src,
  ratio,
  status,
  mode,
  liked,
}: {
  src: string;
  ratio: string;
  status: "approved" | "pending" | "hidden";
  mode: "rest" | "hover";
  liked?: boolean;
}) {
  const dimmed = status === "hidden";
  return (
    <div
      className={`relative mb-[3px] overflow-hidden ${ratio}`}
      style={{ borderRadius: "var(--radius-tile)" }}
    >
      <div className={dimmed ? "absolute inset-0 opacity-30" : "absolute inset-0"}>
        <Photo src={src} />
      </div>

      {mode === "hover" && (
        <>
          <HoverLabel>on hover</HoverLabel>
          <div
            data-dir-press
            className="absolute top-1.5 right-1.5 z-10 flex items-center gap-1"
          >
            {status === "pending" && (
              <Chip>
                <Check className="size-3.5 text-success" />
              </Chip>
            )}
            <Chip>
              {status === "hidden" ? (
                <Eye className="size-3.5 text-warning" />
              ) : (
                <EyeOff className="size-3.5 text-warning" />
              )}
            </Chip>
            <Chip>
              <Trash2 className="size-3.5 text-destructive" />
            </Chip>
            <Chip>
              <Download className="size-3.5 text-save" />
            </Chip>
            {/* Like FAR-RIGHT; pink + filled while liked (persists off-hover). */}
            <Chip>
              <Heart
                className={
                  liked
                    ? "size-3.5 fill-current text-like"
                    : "size-3.5 text-white"
                }
              />
            </Chip>
          </div>
        </>
      )}

      {mode === "rest" && (dimmed || liked) && (
        // Persistent state markers (off-hover, like the liked heart): a hidden tile keeps
        // an active AMBER Show (1-tap to show again); a liked tile keeps its rose heart.
        <div className="absolute top-1.5 right-1.5 z-10 flex items-center gap-1">
          {dimmed && (
            <span className="flex size-7 items-center justify-center rounded-full bg-black/45 backdrop-blur-sm">
              <Eye className="size-3.5 text-warning" />
            </span>
          )}
          {liked && (
            <span className="flex size-7 items-center justify-center rounded-full bg-black/45 backdrop-blur-sm">
              <Heart className="size-3.5 fill-current text-like" />
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/* ── B/C. Lightbox pill ──────────────────────────────────────────────────── */

function LightboxMock({
  status,
}: {
  status: "approved" | "pending" | "hidden" | "guest";
}) {
  const isHost = status !== "guest";
  return (
    <div className="absolute inset-0 bg-black">
      <Image
        src={PHOTOS[4]}
        alt=""
        fill
        sizes="320px"
        className="object-contain"
      />
      {/* Top scrim: close + attribution (context, not the focus here). */}
      <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-3 text-white/90">
        <span className="text-[11px]">
          {isHost ? "Maya · host" : "Photo by Alex"}
        </span>
        <span className="text-lg leading-none">×</span>
      </div>
      {/* The floating action pill. */}
      <div className="absolute inset-x-0 bottom-5 flex justify-center">
        <div
          data-dir-press
          className="flex items-center gap-3.5 rounded-full bg-black/55 px-4 py-2.5 text-white backdrop-blur-sm"
        >
          {/* enjoy group (guest + host) */}
          <Heart className="size-5 fill-current text-like" />
          <span className="-ml-2 text-xs">8</span>
          <Download className="size-5 text-save" />
          {/* Share shares the blue --save (download/save/share are not state-based). */}
          <Share2 className="size-5 text-save" />
          {/* curate group (host only) */}
          {isHost && (
            <>
              <span className="mx-0.5 h-5 w-px bg-white/25" />
              {status === "pending" ? (
                <Check className="size-5 text-success" />
              ) : status === "hidden" ? (
                <Eye className="size-5 text-warning" />
              ) : (
                <EyeOff className="size-5 text-warning" />
              )}
              <Trash2 className="size-5 text-destructive" />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── C. Guest tile ───────────────────────────────────────────────────────── */

function GuestTileMock() {
  return (
    <div className="absolute inset-0 flex flex-col px-4 pt-12">
      <p data-dir-display className="text-lg leading-snug">
        Guest gallery
      </p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">
        Hover gains Download beside Like (no moderation)
      </p>
      <div className="mt-3 columns-2 gap-[3px]">
        <div
          className="relative mb-[3px] aspect-[3/4] overflow-hidden"
          style={{ borderRadius: "var(--radius-tile)" }}
        >
          <Photo src={PHOTOS[7]} />
          <HoverLabel>on hover</HoverLabel>
          <div
            data-dir-press
            className="absolute top-1.5 right-1.5 z-10 flex items-center gap-1"
          >
            <Chip>
              <Download className="size-3.5 text-save" />
            </Chip>
            <Chip>
              <Heart className="size-3.5 fill-current text-like" />
            </Chip>
          </div>
        </div>
        <div
          className="relative mb-[3px] aspect-square overflow-hidden"
          style={{ borderRadius: "var(--radius-tile)" }}
        >
          <Photo src={PHOTOS[8]} />
        </div>
        <div
          className="relative mb-[3px] aspect-[4/5] overflow-hidden"
          style={{ borderRadius: "var(--radius-tile)" }}
        >
          <Photo src={PHOTOS[9]} />
        </div>
        <div
          className="relative mb-[3px] aspect-[3/4] overflow-hidden"
          style={{ borderRadius: "var(--radius-tile)" }}
        >
          <Photo src={PHOTOS[10]} />
        </div>
      </div>
    </div>
  );
}
