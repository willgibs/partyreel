import Image from "next/image";
import { Calendar, Images, Plus, ScanLine } from "lucide-react";

import { COVER_PHOTO, PHOTOS } from "../screens/sample-photos";
import { Variant } from "./variant-frame";

/**
 * Touchpoint: the HOST DASHBOARD composition (Phase 5 S0). Same protocol as
 * host-event: the pieces are ratified (the stat-forward V3 event card, the
 * storage meter, the four personal tabs); this round picks how the HOME
 * surface arranges them. Emil contract: crisp + fast; tab/filter switches
 * instant; the only colored thing on a card is the thing needing action.
 */
export function HostDashboardVariants() {
  return (
    <div aria-hidden className="grid gap-8 py-4 md:grid-cols-2 xl:grid-cols-3">
      <Variant
        n={1}
        name="Cards-first"
        rationale="The current bones, every piece upgraded: header + the storage card + tabs + the stat-forward card grid. Familiar hierarchy; storage stays a first-class citizen (it IS the business model)."
      >
        <div className="absolute inset-0 flex flex-col overflow-hidden px-4 pt-12">
          <DashHeader />
          <StorageCard />
          <TabsRow />
          <div className="mt-2.5 space-y-2.5 overflow-hidden">
            <EventCardV3 pending={6} />
            <EventCardV3 name="Album release party" date="July 2" items={41} />
          </div>
        </div>
      </Variant>

      <Variant
        n={2}
        name="Ambient storage"
        rationale="Storage demotes to a slim meter under the header (telemetry, not a hero) - events lead the page and a second card fits above the fold. The meter goes amber only when it matters."
      >
        <div className="absolute inset-0 flex flex-col overflow-hidden px-4 pt-12">
          <DashHeader />
          <AmbientMeter />
          <TabsRow />
          <div className="mt-2.5 space-y-2.5 overflow-hidden">
            <EventCardV3 pending={6} />
            <EventCardV3 name="Album release party" date="July 2" items={41} />
          </div>
        </div>
      </Variant>

      <Variant
        n={3}
        name="Single feed"
        rationale="Tabs become FILTER CHIPS over one continuous feed: events, then your uploads as masonry clusters, in one scroll. Least chrome; everything is one stream. Filter switches instant, no animation."
      >
        <div className="absolute inset-0 flex flex-col overflow-hidden px-4 pt-12">
          <DashHeader />
          <AmbientMeter />
          <div className="mt-3 flex gap-1.5 text-[10px] font-medium">
            <span className="flex h-6 items-center rounded-full bg-foreground px-2.5 text-background">
              All
            </span>
            {["Events", "Uploads", "Likes", "Trash"].map((c) => (
              <span
                key={c}
                className="flex h-6 items-center rounded-full border border-border px-2.5 text-muted-foreground"
              >
                {c}
              </span>
            ))}
          </div>
          <div className="mt-2.5 space-y-2.5 overflow-hidden">
            <EventCardV3 pending={6} />
            <p className="pt-1 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
              Your uploads
            </p>
            <div className="columns-3 gap-[3px]">
              {PHOTOS.slice(3, 9).map((src, i) => (
                <div
                  key={src}
                  className={`relative mb-[3px] overflow-hidden ${
                    ["aspect-square", "aspect-[3/4]", "aspect-[4/5]"][i % 3]
                  }`}
                  style={{ borderRadius: "var(--radius-tile)" }}
                >
                  <Image
                    src={src}
                    alt=""
                    fill
                    sizes="100px"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </Variant>
    </div>
  );
}

/* ── Shared pieces ───────────────────────────────────────────────────────── */

function DashHeader() {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <p data-dir-display className="text-xl leading-snug">
          Dashboard
        </p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          2 of 3 events
        </p>
      </div>
      <button
        data-dir-press
        className="flex h-8 shrink-0 items-center gap-1 rounded-[var(--radius-action-sm)] bg-primary px-2.5 text-[11px] font-semibold text-primary-foreground"
      >
        <Plus className="size-3.5" />
        New event
      </button>
    </div>
  );
}

function StorageCard() {
  return (
    <div data-dir-card className="mt-3 p-3">
      <div className="flex items-baseline justify-between">
        <p className="text-[11px] font-semibold">Storage</p>
        <p className="text-[10px] text-muted-foreground">1.2 GB of 5 GB</p>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full w-1/4 rounded-full bg-foreground" />
      </div>
      <p className="mt-1.5 text-[9px] text-muted-foreground">
        Plus 180 MB in Trash
      </p>
    </div>
  );
}

function AmbientMeter() {
  return (
    <div className="mt-2.5 flex items-center gap-2">
      <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
        <div className="h-full w-1/4 rounded-full bg-foreground/70" />
      </div>
      <p className="shrink-0 text-[9px] text-muted-foreground">1.2 / 5 GB</p>
    </div>
  );
}

function TabsRow() {
  return (
    <div className="mt-3 flex items-center gap-1 border-b border-border/70 text-[12px] font-medium">
      <span className="border-b-2 border-foreground pb-1.5 text-foreground">
        Events
      </span>
      {["Uploads", "Likes", "Trash"].map((t) => (
        <span key={t} className="px-2.5 pb-1.5 text-muted-foreground">
          {t}
        </span>
      ))}
    </div>
  );
}

/** The RATIFIED stat-forward card (touchpoint 7 V3), in composition context. */
function EventCardV3({
  name = "Maya & Jay's Wedding",
  date = "June 14",
  items = 128,
  pending = 0,
}: {
  name?: string;
  date?: string;
  items?: number;
  pending?: number;
}) {
  return (
    <div
      className="relative aspect-[16/10] overflow-hidden rounded-xl"
      style={{ contain: "paint" }}
    >
      <Image src={COVER_PHOTO} alt="" fill sizes="320px" className="object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
      <span className="absolute top-2.5 left-2.5 flex items-center justify-center rounded-[var(--radius-tile)] bg-white p-1 shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
        <ScanLine className="size-5 text-black" />
      </span>
      {pending > 0 && (
        <span
          className="absolute top-2.5 right-2.5 rounded-full px-2.5 py-1 text-[10px] font-semibold"
          style={{
            background: "var(--warning)",
            color: "var(--warning-foreground)",
          }}
        >
          {pending} to review
        </span>
      )}
      <div className="absolute inset-x-0 bottom-0 p-3 text-white">
        <p data-dir-display className="text-base leading-snug">
          {name}
        </p>
        <div className="mt-1.5 flex items-center gap-1.5 text-[9px] font-medium">
          <span className="flex h-5 items-center gap-1 rounded-full border border-white/30 bg-black/25 px-2 backdrop-blur-sm">
            <Calendar className="size-2.5" />
            {date}
          </span>
          <span className="flex h-5 items-center gap-1 rounded-full border border-white/30 bg-black/25 px-2 backdrop-blur-sm">
            <Images className="size-2.5" />
            {items} items
          </span>
          <span className="flex h-5 items-center rounded-full border border-white/30 bg-black/25 px-2 backdrop-blur-sm">
            Open
          </span>
        </div>
      </div>
    </div>
  );
}
