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
import { Variant } from "./variant-frame";

/**
 * Touchpoint: the GALLERY ACTION MODEL (Phase 5 S3·S0.5), cross-surface (guest +
 * host). Will's direction: the host moderation controls (today always-visible)
 * move to a HOVER reveal that matches the guest like-button's elegance, and the
 * action set unifies - host hover gains Like + Download (beside approve/hide/
 * remove); the guest hover gains Download; the host LIGHTBOX gains the full set
 * (like / download / approve-hide / remove) + Share. Likes are one unified concept
 * (a host like = a normal like).
 *
 * Static mocks can't hover, so each tile is LABELED "rest" vs "on hover" and the
 * revealed state is drawn at full opacity. Resting keeps only a subtle STATUS dot
 * (pending stays glanceable without hovering); actions live in the reveal.
 *
 * Emil: hover-reveal on the guest pattern (opacity+transform, ~150ms, desktop via
 * the md: breakpoint, press feedback only); moderation is press-only (no entrance
 * theater). Remove always stays behind a confirm; like/hide/approve are reversible.
 */
export function GalleryActionsVariants() {
  return (
    <div className="space-y-12 py-4">
      <Group
        eyebrow="A. Host tile: actions on hover"
        blurb="The host gallery keeps its polish at rest (media + a quiet status dot for what needs review); hovering reveals the controls, the way the guest like button does. Three arrangements of the revealed set (approve/hide · remove · like · download)."
      >
        <Variant
          n={1}
          name="Twin corner clusters"
          rationale="Moderation top-right, view-actions (like + download) bottom-right - the guest like position. Two small clusters, each a subtle corner reveal; the photo stays unobscured. Cleanest separation of 'curate' vs 'enjoy'."
        >
          <TileBoard arrangement="twin" />
        </Variant>

        <Variant
          n={2}
          name="Single bottom rail"
          rationale="One slim rail slides up from the bottom on hover with every action in a row (like · download · hide · remove). One predictable place; reads like the lightbox pill, so the gallery and the viewer feel consistent."
        >
          <TileBoard arrangement="rail" />
        </Variant>

        <Variant
          n={3}
          name="Top rail (evolved 3a)"
          rationale="The shipped 3a top bar, now hover-revealed, with like + download added at the left. Least change from what's live; familiar, but the top strip competes with the status dot more than the corner split."
        >
          <TileBoard arrangement="top" />
        </Variant>
      </Group>

      <Group
        eyebrow="B. Host lightbox: the full action set"
        blurb="The custom viewer (lightbox) carries the same actions as a clear, accessible alternative to the hover. Today the host viewer has like + download only; this adds approve/hide + remove + Share. Two pill layouts."
      >
        <Variant
          n={1}
          name="One pill"
          rationale="Every action in a single floating pill (like · count · download · hide · remove · share). Compact and familiar (it extends today's guest pill); fine until the action count climbs."
        >
          <LightboxMock layout="one" />
        </Variant>

        <Variant
          n={2}
          name="Grouped: enjoy | curate"
          rationale="A divider splits the viewer actions (like · download · share) from the moderation actions (hide · remove). Signals 'these change what guests see' vs 'these are just for you'; scales as moderation grows. My pick."
        >
          <LightboxMock layout="grouped" />
        </Variant>
      </Group>

      <Group
        eyebrow="C. Guest parity"
        blurb="The same language on the guest surface: the guest tile hover gains Download beside Like (today it's like-only); the guest lightbox already carries like · download · share (shown for parity). One action vocabulary everywhere."
      >
        <Variant
          n={1}
          name="Guest tile + viewer"
          rationale="Guest hover = like + download (the host's minus moderation). The viewer pill is unchanged. The host experience is the guest experience plus the curate actions - one system, two roles."
        >
          <GuestParityMock />
        </Variant>
      </Group>
    </div>
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

/* ── Action atoms (mirror the guest like-button tile style) ──────────────── */

function ActionIcon({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "primary" | "danger";
}) {
  const toneClass =
    tone === "primary"
      ? "bg-white text-black"
      : tone === "danger"
        ? "bg-black/45 text-white"
        : "bg-black/45 text-white";
  return (
    <span
      className={`flex size-7 items-center justify-center rounded-full backdrop-blur-sm ${toneClass}`}
    >
      {children}
    </span>
  );
}

/** A "resting" status dot (pending stays glanceable without hovering). */
function StatusDot({ tone }: { tone: "pending" | "hidden" }) {
  return (
    <span
      className="absolute top-2 left-2 z-10 size-2.5 rounded-full ring-2 ring-black/30"
      style={{
        background:
          tone === "pending" ? "var(--warning)" : "rgba(255,255,255,0.85)",
      }}
    />
  );
}

function HoverLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="absolute bottom-1.5 left-1.5 z-20 rounded-full bg-black/55 px-1.5 py-0.5 text-[8px] font-medium tracking-wide text-white/90 uppercase backdrop-blur-sm">
      {children}
    </span>
  );
}

function Photo({ src }: { src: string }) {
  return <Image src={src} alt="" fill sizes="160px" className="object-cover" />;
}

/* ── A. Host tile arrangements ───────────────────────────────────────────── */

function TileBoard({ arrangement }: { arrangement: "twin" | "rail" | "top" }) {
  return (
    <div className="absolute inset-0 flex flex-col px-4 pt-12">
      <p data-dir-display className="text-lg leading-snug">
        Maya &amp; Jay&apos;s Wedding
      </p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">
        Hover a tile to reveal its actions
      </p>
      <div className="mt-3 columns-2 gap-[3px]">
        {/* The first tile shows the REVEALED (hover) state. */}
        <Tile src={PHOTOS[0]} ratio="aspect-[3/4]" revealed arrangement={arrangement} status="approved" />
        <Tile src={PHOTOS[1]} ratio="aspect-square" status="pending" />
        <Tile src={PHOTOS[2]} ratio="aspect-[4/5]" status="approved" />
        <Tile src={PHOTOS[3]} ratio="aspect-[3/4]" status="hidden" />
        <Tile src={PHOTOS[5]} ratio="aspect-square" status="approved" />
        <Tile src={PHOTOS[6]} ratio="aspect-[4/5]" status="approved" />
      </div>
    </div>
  );
}

function Tile({
  src,
  ratio,
  status,
  revealed,
  arrangement,
}: {
  src: string;
  ratio: string;
  status: "approved" | "pending" | "hidden";
  revealed?: boolean;
  arrangement?: "twin" | "rail" | "top";
}) {
  return (
    <div
      className={`relative mb-[3px] overflow-hidden ${ratio}`}
      style={{ borderRadius: "var(--radius-tile)" }}
    >
      <Photo src={src} />
      {status === "pending" && !revealed && <StatusDot tone="pending" />}
      {status === "hidden" && !revealed && <StatusDot tone="hidden" />}

      {revealed && (
        <>
          <HoverLabel>on hover</HoverLabel>
          {arrangement === "twin" && <TwinClusters status={status} />}
          {arrangement === "rail" && <BottomRail status={status} />}
          {arrangement === "top" && <TopRail status={status} />}
        </>
      )}
    </div>
  );
}

/** Moderation top-right, view-actions bottom-right (the guest like position). */
function TwinClusters({ status }: { status: "approved" | "pending" | "hidden" }) {
  return (
    <>
      <div data-dir-press className="absolute top-1.5 right-1.5 z-10 flex gap-1">
        {status === "pending" && (
          <ActionIcon tone="primary">
            <Check className="size-3.5" />
          </ActionIcon>
        )}
        <ActionIcon>
          {status === "hidden" ? (
            <Eye className="size-3.5" />
          ) : (
            <EyeOff className="size-3.5" />
          )}
        </ActionIcon>
        <ActionIcon tone="danger">
          <Trash2 className="size-3.5" />
        </ActionIcon>
      </div>
      <div
        data-dir-press
        className="absolute right-1.5 bottom-1.5 z-10 flex gap-1"
      >
        <ActionIcon>
          <Heart className="size-3.5" />
        </ActionIcon>
        <ActionIcon>
          <Download className="size-3.5" />
        </ActionIcon>
      </div>
    </>
  );
}

/** One slim rail up from the bottom on hover. */
function BottomRail({ status }: { status: "approved" | "pending" | "hidden" }) {
  return (
    <div
      data-dir-press
      className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-center gap-2.5 bg-gradient-to-t from-black/65 to-transparent px-2 pt-6 pb-2"
    >
      <Heart className="size-4 text-white" />
      <Download className="size-4 text-white" />
      {status === "pending" ? (
        <Check className="size-4 text-white" />
      ) : status === "hidden" ? (
        <Eye className="size-4 text-white" />
      ) : (
        <EyeOff className="size-4 text-white" />
      )}
      <Trash2 className="size-4 text-white" />
    </div>
  );
}

/** The shipped 3a top bar, hover-revealed, with like+download added at the left. */
function TopRail({ status }: { status: "approved" | "pending" | "hidden" }) {
  return (
    <div
      data-dir-press
      className="absolute inset-x-0 top-0 z-10 flex items-center justify-between bg-gradient-to-b from-black/65 to-transparent px-1.5 pt-1.5 pb-5"
    >
      <div className="flex gap-1.5">
        <Heart className="size-4 text-white" />
        <Download className="size-4 text-white" />
      </div>
      <div className="flex gap-1.5">
        {status === "pending" ? (
          <Check className="size-4 text-white" />
        ) : status === "hidden" ? (
          <Eye className="size-4 text-white" />
        ) : (
          <EyeOff className="size-4 text-white" />
        )}
        <Trash2 className="size-4 text-white" />
      </div>
    </div>
  );
}

/* ── B. Host lightbox pill ───────────────────────────────────────────────── */

function LightboxMock({ layout }: { layout: "one" | "grouped" }) {
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
        <span className="text-[11px]">Maya · host</span>
        <span className="text-lg leading-none">×</span>
      </div>
      {/* The floating action pill. */}
      <div className="absolute inset-x-0 bottom-5 flex justify-center">
        {layout === "one" ? (
          <div className="flex items-center gap-3.5 rounded-full bg-black/55 px-4 py-2.5 text-white backdrop-blur-sm">
            <Heart className="size-5" />
            <span className="-ml-2 text-xs">8</span>
            <Download className="size-5" />
            <EyeOff className="size-5" />
            <Trash2 className="size-5" />
            <Share2 className="size-5" />
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-full bg-black/55 px-4 py-2.5 text-white backdrop-blur-sm">
            <Heart className="size-5" />
            <span className="-ml-1.5 text-xs">8</span>
            <Download className="size-5" />
            <Share2 className="size-5" />
            <span className="mx-0.5 h-5 w-px bg-white/25" />
            <EyeOff className="size-5" />
            <Trash2 className="size-5" />
          </div>
        )}
      </div>
    </div>
  );
}

/* ── C. Guest parity ─────────────────────────────────────────────────────── */

function GuestParityMock() {
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
            className="absolute right-1.5 bottom-1.5 z-10 flex gap-1"
          >
            <ActionIcon>
              <Heart className="size-3.5" />
            </ActionIcon>
            <ActionIcon>
              <Download className="size-3.5" />
            </ActionIcon>
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
      <p className="mt-2 text-[10px] text-muted-foreground">
        Viewer pill (unchanged): like · download · share
      </p>
    </div>
  );
}
