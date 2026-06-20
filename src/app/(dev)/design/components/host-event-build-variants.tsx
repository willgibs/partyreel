import Image from "next/image";
import {
  Globe,
  Images,
  ImageUp,
  QrCode,
  ScanLine,
  Settings,
  Users,
} from "lucide-react";

import { EVENT_NAME, PHOTOS } from "../screens/sample-photos";
import {
  HostReviewDemo,
  HostSettingsTransitionDemo,
} from "./host-event-build-demos";
import { Variant } from "./variant-frame";

/**
 * Touchpoint: the GALLERY-FIRST EVENT PAGE, build round (Phase 5 S3·3b). The
 * composition DIRECTION is ratified (`host-event` + `host-event-page` decision
 * 1) - gallery-first under a minimal editorial header, Share = PRIMARY, review
 * as its own teaser, settings as a dedicated route with Deleted behind it. This
 * round is the EXECUTION CRAFT plus the ONE open fork (the review surface), in
 * four groups:
 *
 *   A. Editorial header - how the icon sub-stats, date, and the subtle config
 *      status (visibility + accepting-uploads) sit together. Two treatments.
 *   B. Command strip - the responsive Share / Add / Settings, mobile (stacked)
 *      vs the wider one-row layout.
 *   C. Review surface (INTERACTIVE, pick one) - the pending teaser opens into
 *      either an in-page expansion or a focused review mode; both carry the same
 *      bulk-select, so the surface is the only variable.
 *   D. Settings page (INTERACTIVE) - the dedicated route, the crossfade feel,
 *      and the Deleted bin behind it.
 *
 * Emil management-tool contract: the host app is high-frequency, so moderation
 * is INSTANT (no entrance/stagger theater). The ONE place motion is spent is the
 * settings route transition (the ratified "view-transition feel"). NO production
 * imports - hand-built from sample-photos + lucide.
 */
export function HostEventBuildVariants() {
  return (
    <div className="space-y-12 py-4">
      <Group
        eyebrow="A. Editorial header"
        blurb="The ratified header carries identity then a quiet meta line. This round adds what was specified but never drawn: the icon sub-stats (items / contributors / views) and the subtle config status (visibility + whether uploads are open). Two ways to seat the status."
      >
        <Variant
          n={1}
          name="Status row"
          rationale="Stats on one line, then a separate status row of small bordered chips (Open, Accepting uploads). Clearest grouping: counts read as counts, state reads as state. Costs one extra line."
        >
          <PhonePage>
            <HeaderStatusRow />
            <StripStacked />
            <GallerySlice />
          </PhonePage>
        </Variant>

        <Variant
          n={2}
          name="Inline meta"
          rationale="Everything folds into one wrapped meta line: visibility, accepting dot, date, then the icon counts. Most compact, maximum room for the gallery; the status is quieter (no chips)."
        >
          <PhonePage>
            <HeaderInline />
            <StripStacked />
            <GallerySlice />
          </PhonePage>
        </Variant>
      </Group>

      <Group
        eyebrow="B. Command strip"
        blurb="Share is the host's job-to-be-done, so it leads. Review has left the strip for its own teaser, so the strip is just Share / Add / Settings. It reflows by width: stacked on a phone, one row when there's room."
      >
        <Variant
          n={1}
          name="Mobile (stacked)"
          rationale="Share full-width on top (the primary), then Add (flex) + Settings (icon) on the second row. Thumb-friendly, Share unmissable."
        >
          <PhonePage>
            <MiniHeaderStatic />
            <StripStacked />
            <GallerySlice />
          </PhonePage>
        </Variant>

        <Variant
          n={2}
          name="Desktop (one row)"
          framed={false}
          rationale="With width, the three collapse into a single row: Share primary, Add beside it, Settings pushed to the far right. Same three controls, no new vocabulary."
        >
          <WideStrip />
        </Variant>
      </Group>

      <Group
        live
        eyebrow="C. Review surface (interactive - pick one)"
        blurb="The genuinely-new interaction. The pending teaser (faded right edge, only when reviews exist) opens into one of two forms. TAP 'Review all', then tap photos to select and Approve / Hide, or Approve all. Toasts fire live. The only difference between the two is the surface - the bulk-select is identical, so judge the feel."
      >
        <Variant
          n={1}
          name="In-page expansion"
          rationale="The teaser expands in place: the header + strip stay above, so you never leave the page. Select inline, the bulk bar pins to the bottom, Done collapses back to the gallery. Lightest-weight, most cohesive with the page."
        >
          <HostReviewDemo mode="inline" />
        </Variant>

        <Variant
          n={2}
          name="Focused review mode"
          rationale="Review all opens a full takeover with its own header (Review N + back); the page is hidden behind. Most focus for a big pending queue, a clear 'I'm reviewing now' mode, one more layer to dismiss."
        >
          <HostReviewDemo mode="focused" />
        </Variant>
      </Group>

      <Group
        live
        single
        eyebrow="D. Settings page + Deleted (interactive)"
        blurb="Settings is a dedicated route (ratified), and it's the ONE place motion is spent: a lean crossfade gives the 'view-transition feel'. Deleted lives behind it (the retrieval path is where a host looks). TAP Settings, then the Deleted row, then back."
      >
        <Variant
          n={1}
          name="Dedicated route + crossfade"
          rationale="A real route push (native back, full height, deep-linkable), softened by a crossfade. Deleted sits at the bottom of settings, one tap to the recovery bin. The form decomposition + dirty-guard are S4."
        >
          <HostSettingsTransitionDemo />
        </Variant>
      </Group>
    </div>
  );
}

/* ── Layout scaffolding ──────────────────────────────────────────────────── */

function Group({
  eyebrow,
  blurb,
  live,
  single,
  children,
}: {
  eyebrow: string;
  blurb: string;
  live?: boolean;
  single?: boolean;
  children: React.ReactNode;
}) {
  const gridClassName = single
    ? "mt-5 max-w-sm"
    : "mt-5 grid gap-8 md:grid-cols-2";
  return (
    <section>
      <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
        {eyebrow}
      </p>
      <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{blurb}</p>
      {/* Static mocks are decorative (aria-hidden); the interactive groups must
          stay operable, so they keep their real semantics. */}
      <div {...(live ? {} : { "aria-hidden": true })} className={gridClassName}>
        {children}
      </div>
    </section>
  );
}

/** The phone canvas: a full-bleed column (status-bar inset at top). */
function PhonePage({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden px-4 pt-12">
      {children}
    </div>
  );
}

/* ── A. Header treatments ─────────────────────────────────────────────────── */

function HeaderStatusRow() {
  return (
    <div>
      <p data-dir-display className="text-xl leading-snug">
        {EVENT_NAME}
      </p>
      <div className="mt-1 flex items-center gap-2.5 text-[11px] text-muted-foreground">
        <span>June 14</span>
        <span className="flex items-center gap-1">
          <Images className="size-3" />
          128
        </span>
        <span className="flex items-center gap-1">
          <Users className="size-3" />
          24
        </span>
        <span className="flex items-center gap-1">
          <ScanLine className="size-3" />
          342
        </span>
      </div>
      <div className="mt-1.5 flex items-center gap-1.5 text-[10px]">
        <span className="flex items-center gap-1 rounded-full border border-border px-1.5 py-0.5 text-muted-foreground">
          <Globe className="size-2.5" />
          Open
        </span>
        <span className="flex items-center gap-1 rounded-full border border-border px-1.5 py-0.5 text-muted-foreground">
          <span
            className="size-1.5 rounded-full"
            style={{ background: "var(--success)" }}
          />
          Accepting uploads
        </span>
      </div>
    </div>
  );
}

function HeaderInline() {
  return (
    <div>
      <p data-dir-display className="text-xl leading-snug">
        {EVENT_NAME}
      </p>
      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <Globe className="size-2.5" />
          Open
        </span>
        <Dot />
        <span className="flex items-center gap-1">
          <span
            className="size-1.5 rounded-full"
            style={{ background: "var(--success)" }}
          />
          Accepting
        </span>
        <Dot />
        <span>June 14</span>
        <Dot />
        <span className="flex items-center gap-1">
          <Images className="size-2.5" />
          128
        </span>
        <span className="flex items-center gap-1">
          <Users className="size-2.5" />
          24
        </span>
        <span className="flex items-center gap-1">
          <ScanLine className="size-2.5" />
          342
        </span>
      </div>
    </div>
  );
}

function MiniHeaderStatic() {
  return (
    <div>
      <p data-dir-display className="text-lg leading-snug">
        {EVENT_NAME}
      </p>
      <p className="mt-0.5 text-[10px] text-muted-foreground">
        June 14 · Open · 128 items
      </p>
    </div>
  );
}

function Dot() {
  return (
    <span aria-hidden className="text-muted-foreground/50">
      ·
    </span>
  );
}

/* ── B. Command strips ────────────────────────────────────────────────────── */

function StripStacked() {
  return (
    <div className="mt-3 space-y-1.5">
      <button
        data-dir-press
        className="flex h-9 w-full items-center justify-center gap-1.5 rounded-[var(--radius-action-sm)] bg-primary text-[11px] font-semibold text-primary-foreground"
      >
        <QrCode className="size-3.5" />
        Share
      </button>
      <div className="flex items-center gap-1.5">
        <button
          data-dir-press
          className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-action-sm)] border border-border bg-card text-[11px] font-medium"
        >
          <ImageUp className="size-3.5" />
          Add photos
        </button>
        <button
          data-dir-press
          aria-label="Settings"
          className="flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-action-sm)] border border-border bg-card text-muted-foreground"
        >
          <Settings className="size-4" />
        </button>
      </div>
    </div>
  );
}

function WideStrip() {
  return (
    <div className="rounded-2xl border border-border bg-card/40 p-4">
      <p className="mb-3 text-[11px] text-muted-foreground">
        Wider viewport: the three collapse into one row.
      </p>
      <div className="flex items-center gap-2">
        <button
          data-dir-press
          className="flex h-10 items-center justify-center gap-2 rounded-[var(--radius-action)] bg-primary px-5 text-sm font-semibold text-primary-foreground"
        >
          <QrCode className="size-4" />
          Share
        </button>
        <button
          data-dir-press
          className="flex h-10 items-center justify-center gap-2 rounded-[var(--radius-action)] border border-border bg-card px-5 text-sm font-medium"
        >
          <ImageUp className="size-4" />
          Add photos
        </button>
        <div className="flex-1" />
        <button
          data-dir-press
          aria-label="Settings"
          className="flex size-10 items-center justify-center rounded-[var(--radius-action)] border border-border bg-card text-muted-foreground"
        >
          <Settings className="size-4" />
        </button>
      </div>
    </div>
  );
}

/* ── Shared gallery slice (the page body, in miniature) ───────────────────── */

function GallerySlice() {
  const ratios = ["aspect-[3/4]", "aspect-square", "aspect-[4/5]", "aspect-[3/4]"];
  return (
    <div className="mt-3 min-h-0 flex-1 overflow-hidden">
      <div className="columns-2 gap-[3px]">
        {PHOTOS.slice(0, 6).map((src, i) => (
          <div
            key={src}
            className={`relative mb-[3px] overflow-hidden ${ratios[i % 4]}`}
            style={{ borderRadius: "var(--radius-tile)" }}
          >
            <Image
              src={src}
              alt=""
              fill
              sizes="160px"
              className="object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
