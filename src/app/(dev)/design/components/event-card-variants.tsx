import Image from "next/image";
import { Calendar, ChevronRight, Images, QrCode } from "lucide-react";

import { StyledQr } from "@/components/app/styled-qr";
import { QR_PRESETS } from "@/lib/constants/qr-presets";

import { PHOTOS } from "../screens/sample-photos";
import { Variant } from "./variant-frame";

const EVENTS = [
  {
    cover: PHOTOS[0],
    name: "Maya & Jay's Wedding",
    date: "June 14",
    status: "Live now",
    meta: "212 items · 96 QR scans",
    pending: 3,
  },
  {
    cover: PHOTOS[8],
    name: "Marlowe Launch Party",
    date: "May 30",
    status: "Open",
    meta: "100 items · 41 QR scans",
    pending: 0,
  },
];

/**
 * Touchpoint: the host event card, the dashboard's atomic unit. The same two
 * events in three densities; pick by how many events a real host juggles.
 */
export function EventCardVariants() {
  return (
    <div aria-hidden className="grid gap-8 py-4 lg:grid-cols-3">
      <Variant
        n={1}
        name="Cover-led"
        rationale="The photo sells the event: big cover, info below. Generous, scannable at 2-6 events, the current idiom."
        framed={false}
      >
        <div className="space-y-4">
          {EVENTS.map((e) => (
            <div key={e.name} data-dir-card className="overflow-hidden p-0">
              <div className="relative aspect-[16/9]">
                <Image src={e.cover} alt="" fill sizes="340px" className="object-cover" />
                {e.pending > 0 && <PendingChip n={e.pending} />}
              </div>
              <div className="flex items-start justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{e.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {e.date} · {e.meta}
                  </p>
                </div>
                <StatusChip label={e.status} />
              </div>
            </div>
          ))}
        </div>
      </Variant>

      <Variant
        n={2}
        name="Compact row"
        rationale="List density: thumbnail, facts, status, go. Calm at any event count; the photo whispers instead of leads."
        framed={false}
      >
        <div data-dir-card className="divide-y divide-border overflow-hidden p-0">
          {[...EVENTS, { ...EVENTS[0], name: "Nguyen Reunion", date: "April 2", status: "Closed", meta: "58 items · 22 QR scans", pending: 0, cover: PHOTOS[5] }].map((e) => (
            <div key={e.name} className="flex items-center gap-3 p-3">
              <div className="relative size-12 shrink-0 overflow-hidden rounded-[var(--radius-tile)]">
                <Image src={e.cover} alt="" fill sizes="48px" className="object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{e.name}</p>
                <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                  {e.date} · {e.meta}
                </p>
              </div>
              {e.pending > 0 && (
                <span className="shrink-0 rounded-full bg-foreground px-2 py-0.5 text-[10px] font-medium text-background">
                  {e.pending}
                </span>
              )}
              <StatusChip label={e.status} />
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </div>
          ))}
        </div>
      </Variant>

      <Variant
        n={3}
        name="Stat-forward overlay (selected, revised)"
        rationale="THE SELECTED SPEC: one surface, the name and numbers in the photo's light. Meta pills carry subtle icons, needs-review wears the warning state so it can't be missed, and the REAL event QR sits top-left - too small to scan, obviously begging to be tapped open into the QR + share suite."
        framed={false}
      >
        <div className="space-y-4">
          {EVENTS.map((e) => (
            <div
              key={e.name}
              data-dir-card
              className="relative aspect-[16/10] overflow-hidden p-0"
            >
              <Image src={e.cover} alt="" fill sizes="340px" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
              {/* The REAL event QR, tiny on purpose: tapping it opens the
                  QR + share suite (the same one the event page offers). */}
              <button
                data-dir-press
                aria-label="QR and sharing"
                className="absolute top-2.5 left-2.5 rounded-[var(--radius-tile)] bg-white p-1 shadow-[0_4px_12px_rgba(0,0,0,0.3)]"
              >
                <StyledQr
                  value="https://partyreel.com/e/maya-and-jay"
                  size={30}
                  style={QR_PRESETS.classic.options}
                />
              </button>
              {e.pending > 0 && <PendingChip n={e.pending} />}
              <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                <p data-dir-display className="text-lg leading-snug">
                  {e.name}
                </p>
                <div className="mt-2 flex items-center gap-1.5 text-[10px] font-medium">
                  <span className="flex h-5 items-center gap-1 rounded-full border border-white/30 bg-black/25 px-2 backdrop-blur-sm">
                    <Calendar className="size-2.5" />
                    {e.date}
                  </span>
                  <span className="flex h-5 items-center gap-1 rounded-full border border-white/30 bg-black/25 px-2 backdrop-blur-sm">
                    <Images className="size-2.5" />
                    {e.meta.split(" · ")[0]}
                  </span>
                  <span className="flex h-5 items-center rounded-full border border-white/30 bg-black/25 px-2 backdrop-blur-sm">
                    {e.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Variant>
    </div>
  );
}

/* Needs-review wears the WARNING state (round-7): the one thing on a card
   that wants action should be the one colored thing on it. */
function PendingChip({ n }: { n: number }) {
  return (
    <span
      className="absolute top-2.5 right-2.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{
        background: "var(--warning)",
        color: "var(--warning-foreground)",
      }}
    >
      {n} to review
    </span>
  );
}

function StatusChip({ label }: { label: string }) {
  return (
    <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
      {label}
      <QrCode className="size-3" />
    </span>
  );
}
