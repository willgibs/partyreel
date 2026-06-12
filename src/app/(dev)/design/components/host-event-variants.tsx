import Image from "next/image";
import {
  Check,
  ChevronRight,
  Eye,
  EyeOff,
  Images,
  QrCode,
  ScanLine,
  Settings,
  Trash2,
} from "lucide-react";

import { EVENT_NAME, PHOTOS } from "../screens/sample-photos";
import { Variant } from "./variant-frame";

/**
 * Touchpoint: the HOST EVENT PAGE composition (Phase 5 S0). Phase 1 ratified
 * the COMPONENTS (stat-forward cards, masonry, card-section forms); this
 * round picks the PAGE ARCHITECTURE they compose into - the surface Will
 * flagged as the weakest in the app. All three variants share the same
 * ingredients (identity header, share/QR, the amber review queue, the
 * masonry gallery, settings) and differ ONLY in how they're arranged.
 *
 * Emil contract (annotated per variant): the host app is a high-frequency
 * management tool - press feedback only on repeated actions, no stagger
 * theater, instant tab/filter switches; motion spends nothing here.
 */
export function HostEventVariants() {
  return (
    <div aria-hidden className="grid gap-8 py-4 md:grid-cols-2 xl:grid-cols-3">
      <Variant
        n={1}
        name="Gallery-first"
        rationale="The host sees what guests see: the gallery IS the page under the identity header. Management lives in one compact COMMAND STRIP (share, the amber review chip, settings) - tools as an overlay on the event, not a wall in front of it. Motion: press feedback only."
      >
        <div className="absolute inset-0 flex flex-col overflow-hidden px-4 pt-12">
          <HostHeader />
          <CommandStrip />
          <div className="mt-3 min-h-0 flex-1 overflow-hidden">
            <Masonry count={8} withBadges />
          </div>
        </div>
      </Variant>

      <Variant
        n={2}
        name="Command center"
        rationale="The working dashboard of one event: a stat-tile strip (pending in amber), the condensed share row, and the review queue as an inline shelf - everything actionable above the fold, the gallery below. Motion: numbers never animate; approve is instant."
      >
        <div className="absolute inset-0 flex flex-col overflow-hidden px-4 pt-12">
          <HostHeader compact />
          <StatTiles />
          <ShareRow />
          <ReviewShelf />
          <p className="mt-3 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
            Gallery
          </p>
          <div className="mt-1.5 min-h-0 flex-1 overflow-hidden">
            <Masonry count={6} />
          </div>
        </div>
      </Variant>

      <Variant
        n={3}
        name="Tabbed surfaces"
        rationale="Each job gets a full surface: Overview (stats + share + queue) / Gallery / Settings as page tabs - settings finally breathe, the queue can grow, deep-linkable. Motion: tab switches are INSTANT (no slide), per the management-tool contract."
      >
        <div className="absolute inset-0 flex flex-col overflow-hidden px-4 pt-12">
          <HostHeader compact />
          <div className="mt-3 flex items-center gap-1 border-b border-border/70 pb-0 text-[12px] font-medium">
            <span className="border-b-2 border-foreground pb-1.5 text-foreground">
              Overview
            </span>
            <span className="px-2.5 pb-1.5 text-muted-foreground">Gallery</span>
            <span className="px-2.5 pb-1.5 text-muted-foreground">
              Settings
            </span>
          </div>
          <div className="mt-3 space-y-3 overflow-hidden">
            <StatTiles />
            <ShareRow />
            <div>
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                  Needs review
                </p>
                <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                  See all <ChevronRight className="size-2.5" />
                </span>
              </div>
              <div className="mt-1.5">
                <ReviewShelf bare />
              </div>
            </div>
          </div>
        </div>
      </Variant>
    </div>
  );
}

/* ── Shared composition pieces (hand-built; mirror the ratified specs) ───── */

function HostHeader({ compact }: { compact?: boolean }) {
  return (
    <div>
      <p
        data-dir-display
        className={compact ? "text-lg leading-snug" : "text-xl leading-snug"}
      >
        {EVENT_NAME}
      </p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">
        June 14, 2026 · Open · 128 items
      </p>
    </div>
  );
}

/** V1's single management surface: share / review / settings as chips. */
function CommandStrip() {
  return (
    <div className="mt-3 flex items-center gap-1.5">
      <button
        data-dir-press
        className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-action-sm)] bg-primary text-[11px] font-semibold text-primary-foreground"
      >
        <QrCode className="size-3.5" />
        Share
      </button>
      <button
        data-dir-press
        className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-action-sm)] px-2 text-[11px] font-semibold"
        style={{
          background: "var(--warning)",
          color: "var(--warning-foreground)",
        }}
      >
        6 to review
      </button>
      <button
        data-dir-press
        aria-label="Settings"
        className="flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-action-sm)] border border-border bg-card text-muted-foreground"
      >
        <Settings className="size-4" />
      </button>
    </div>
  );
}

/** V2/V3's stat strip: the pending tile is the ONE colored number. */
function StatTiles() {
  const tiles = [
    { label: "Items", value: "128" },
    { label: "To review", value: "6", warn: true },
    { label: "Scans", value: "342" },
    { label: "Views", value: "89" },
  ];
  return (
    <div className="mt-3 grid grid-cols-4 gap-1.5">
      {tiles.map((t) => (
        <div
          key={t.label}
          data-dir-card
          className="px-2 py-2 text-center"
        >
          <p
            className="text-[15px] font-semibold leading-none"
            style={t.warn ? { color: "var(--warning-foreground)" } : undefined}
          >
            {t.warn ? (
              <span
                className="rounded-full px-1.5 py-0.5"
                style={{ background: "var(--warning)" }}
              >
                {t.value}
              </span>
            ) : (
              t.value
            )}
          </p>
          <p className="mt-1 text-[9px] text-muted-foreground">{t.label}</p>
        </div>
      ))}
    </div>
  );
}

/** The condensed share row: mini QR + link + copy (the suite opens on tap). */
function ShareRow() {
  return (
    <div data-dir-card className="mt-2 flex items-center gap-2.5 p-2.5">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-tile)] bg-white p-1 ring-1 ring-border">
        <ScanLine className="size-5 text-black" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[11px] font-medium">
          partyreel.com/e/maya-and-jay
        </p>
        <p className="text-[9px] text-muted-foreground">
          QR, link and printable card
        </p>
      </div>
      <button
        data-dir-press
        className="h-7 shrink-0 rounded-[var(--radius-action-sm)] border border-border px-2.5 text-[10px] font-medium"
      >
        Copy
      </button>
    </div>
  );
}

/** The pending queue as a horizontal shelf: approve/hide inline, instant. */
function ReviewShelf({ bare }: { bare?: boolean }) {
  return (
    <div className={bare ? "" : "mt-2"}>
      {!bare && (
        <p className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
          Needs review · 6
        </p>
      )}
      <div className="mt-1.5 flex gap-1.5 overflow-hidden">
        {PHOTOS.slice(2, 5).map((src) => (
          <div
            key={src}
            className="relative aspect-square w-[31%] shrink-0 overflow-hidden"
            style={{ borderRadius: "var(--radius-tile)" }}
          >
            <Image src={src} alt="" fill sizes="100px" className="object-cover" />
            <div className="absolute inset-x-0 bottom-0 flex justify-center gap-1 bg-gradient-to-t from-black/60 to-transparent p-1">
              <span className="flex size-5 items-center justify-center rounded-full bg-white/90">
                <Check className="size-3 text-black" />
              </span>
              <span className="flex size-5 items-center justify-center rounded-full bg-black/50">
                <EyeOff className="size-3 text-white" />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** The ratified masonry, host edition: no stagger (management tool). */
function Masonry({ count, withBadges }: { count: number; withBadges?: boolean }) {
  const ratios = ["aspect-[3/4]", "aspect-square", "aspect-[4/5]", "aspect-[3/4]"];
  return (
    <div className="columns-2 gap-[3px]">
      {PHOTOS.slice(0, count).map((src, i) => (
        <div
          key={src}
          className={`relative mb-[3px] overflow-hidden ${ratios[i % 4]}`}
          style={{ borderRadius: "var(--radius-tile)" }}
        >
          <Image src={src} alt="" fill sizes="160px" className="object-cover" />
          {withBadges && i === 1 && (
            <span
              className="absolute top-1 left-1 rounded-full px-1.5 py-0.5 text-[8px] font-semibold"
              style={{
                background: "var(--warning)",
                color: "var(--warning-foreground)",
              }}
            >
              pending
            </span>
          )}
          {withBadges && i === 2 && (
            <div className="absolute top-1 right-1 flex gap-0.5">
              <span className="flex size-4.5 items-center justify-center rounded-full bg-black/50">
                <Eye className="size-2.5 text-white" />
              </span>
              <span className="flex size-4.5 items-center justify-center rounded-full bg-black/50">
                <Trash2 className="size-2.5 text-white" />
              </span>
            </div>
          )}
        </div>
      ))}
      <div
        className="relative mb-[3px] flex aspect-square items-center justify-center border border-border/70 bg-muted/60"
        style={{ borderRadius: "var(--radius-tile)" }}
      >
        <Images className="size-4 text-muted-foreground/40" />
      </div>
    </div>
  );
}
