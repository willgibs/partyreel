"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarPlus,
  Check,
  ChevronDown,
  CircleDashed,
  Clapperboard,
  DoorOpen,
  HardDrive,
  ImagePlus,
  LayoutGrid,
  ListChecks,
  ListFilter,
  type LucideIcon,
  MessageSquareText,
  PauseCircle,
  Printer,
  QrCode,
  Rows3,
  ScanLine,
  Share2,
} from "lucide-react";

import { NextStepBand } from "@/components/app/dashboard/next-step-band";
import { StorageMeter } from "@/components/app/dashboard/storage-meter";
import { EventCard } from "@/components/app/event-card";
import { EventCardQr } from "@/components/app/event-card-qr";
import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";
import { EVENT_CARD_GRID } from "@/components/app/dashboard/event-card-grid";
import { GIGABYTE } from "@/lib/constants/tiers";
import {
  foldNextSteps,
  nextStepForEvent,
  type NextStep,
  resolveNextSteps,
} from "@/lib/dashboard/next-step";
import { uploadsLabel } from "@/lib/events/visibility-labels";
import { formatCount } from "@/lib/format/count";
import { GLASS_MARK } from "@/lib/glass";
import { cn } from "@/lib/utils";

import { HostPage } from "./app";
import { type DashEvent, SITE, TODAY } from "./fixtures";
import { type Job, type JobKind, nextJob, readyWord } from "./readiness";

/**
 * THE PULSE, QUOTED: `/dashboard` as the page composes it (the heading and its
 * count, What needs you, the storage line, Your events), fed Maya's three
 * events on one day.
 *
 * Today's band is production's `NextStepBand` over production's own rule
 * (`resolveNextSteps`), so "Nothing, as today" is exactly what she gets. The
 * two candidates draw the same chips in the band's own classes (quoted: the
 * chip and its tones are the band's private constants) because they carry
 * kinds the band has no glyph for yet, fed by the board's one function
 * (`nextJob`, `readyWord`). The cards are production's `EventCard` with its QR
 * chip; each option puts its line in the card's top-right slot, the slot the
 * amber review chip already holds, so one card says one thing.
 */

const CHIP =
  "group flex h-9 items-center gap-2 rounded-full border px-3.5 text-sm font-medium outline-none transition-[background-color,transform] duration-150 ease-emphasis active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-ring/50 motion-reduce:active:scale-100";

const TONES = {
  waiting: "border-transparent bg-warning/15 text-warning hover:bg-warning/20",
  warning: "border-warning/40 text-warning hover:bg-warning/10",
  quiet:
    "border-border text-muted-foreground hover:text-foreground hover:bg-muted/40",
} as const;

/** A glyph for every kind of job: production's six, and the checklist's. */
const ICONS: Record<JobKind, LucideIcon> = {
  door: DoorOpen,
  review: ListChecks,
  paused: PauseCircle,
  reel: Clapperboard,
  print: Printer,
  storage: HardDrive,
  "door-shut": DoorOpen,
  photos: ImagePlus,
  welcome: MessageSquareText,
  code: ScanLine,
  invite: QrCode,
  album: Share2,
};

type Chip = {
  key: string;
  kind: JobKind | "ready" | "left";
  label: string;
  tone: NextStep["tone"];
};

function ChipView({ chip }: { chip: Chip }) {
  const Icon =
    chip.kind === "ready"
      ? Check
      : chip.kind === "left"
        ? CircleDashed
        : ICONS[chip.kind];
  return (
    <Link href="#" className={cn(CHIP, TONES[chip.tone])}>
      <Icon
        className={cn(
          "size-4 shrink-0",
          chip.kind === "ready" && "text-success",
        )}
        aria-hidden
      />
      {chip.label}
      <ArrowRight
        className="size-3.5 shrink-0 opacity-0 transition-[opacity,translate] duration-150 ease-emphasis group-hover:translate-x-0.5 group-hover:opacity-70 motion-reduce:transition-none"
        aria-hidden
      />
    </Link>
  );
}

/** A band of chips, folded past three by tone, as the band folds. */
function Band({ chips }: { chips: readonly Chip[] }) {
  const { head, rest } = foldNextSteps(chips as unknown as NextStep[]);
  const shown = head as unknown as Chip[];
  return (
    <section aria-label="What needs you">
      <ul className="flex flex-wrap items-center gap-2">
        {shown.map((c) => (
          <li key={c.key}>
            <ChipView chip={c} />
          </li>
        ))}
        {rest.length > 0 && (
          <li>
            <span className="flex h-9 items-center gap-1.5 rounded-full border border-dashed border-border px-3.5 text-sm font-medium text-muted-foreground">
              {`+${rest.length} more`}
              <ChevronDown className="size-3.5 shrink-0" aria-hidden />
            </span>
          </li>
        )}
      </ul>
    </section>
  );
}

export type NeedsVariant = "quiet" | "job" | "count";

const STORAGE_CAP = 100 * GIGABYTE;

/** Each option's words for one event, in the card's top-right slot. */
function cardLine(
  variant: NeedsVariant,
  e: DashEvent,
): { text: string; tone: NextStep["tone"]; icon: LucideIcon | null } | null {
  if (variant === "quiet") return null;
  const waiting = nextStepForEvent(e, TODAY);
  if (variant === "job") {
    const job: Job | null = waiting ?? nextJob(e, TODAY);
    return job
      ? { text: job.short, tone: job.tone, icon: ICONS[job.kind] }
      : null;
  }
  if (waiting)
    return {
      text: waiting.short,
      tone: waiting.tone,
      icon: ICONS[waiting.kind],
    };
  const word = readyWord(e);
  return {
    text: word.short,
    tone: "quiet",
    icon: word.short.startsWith("Ready") ? Check : CircleDashed,
  };
}

/** The band for an option, over the day's events. */
function BandFor({
  variant,
  events,
  storagePct,
}: {
  variant: NeedsVariant;
  events: readonly DashEvent[];
  storagePct: number;
}) {
  if (variant === "quiet") {
    const steps = resolveNextSteps({
      events: [...events],
      storagePct,
      today: TODAY,
    });
    return <NextStepBand steps={steps} />;
  }
  const chips: Chip[] = events.flatMap((e): Chip[] => {
    const waiting = nextStepForEvent(e, TODAY);
    if (variant === "job" || waiting) {
      const job: Job | null = waiting ?? nextJob(e, TODAY);
      return job
        ? [{ key: e.id, kind: job.kind, label: job.label, tone: job.tone }]
        : [];
    }
    const word = readyWord(e);
    return [
      {
        key: e.id,
        kind: word.short.startsWith("Ready") ? "ready" : "left",
        label: word.label,
        tone: "quiet",
      },
    ];
  });
  return <Band chips={chips} />;
}

/** The dashboard on one day, in one option's way. */
export function Dashboard({
  variant,
  events,
  storagePct,
}: {
  variant: NeedsVariant;
  events: readonly DashEvent[];
  storagePct: number;
}) {
  return (
    <HostPage>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <PageHeading>Dashboard</PageHeading>
            <p className="text-sm text-muted-foreground">
              {`${events.length} of Unlimited events used`}
            </p>
          </div>
          <Button asChild tabIndex={-1}>
            <Link href="#">
              <CalendarPlus /> New event
            </Link>
          </Button>
        </div>

        <BandFor variant={variant} events={events} storagePct={storagePct} />

        <StorageMeter
          storageUsed={Math.round((storagePct / 100) * STORAGE_CAP)}
          storageCap={STORAGE_CAP}
          storagePct={storagePct}
          standbyBytes={0}
          overBudget={false}
          passExpiry={null}
          planName="Pro"
          hasBilling
          isEventPass={false}
          tier="pro"
        />

        <section aria-label="Your events" className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <h2 className="font-heading text-subsection">Your events</h2>
            <div className="flex items-center gap-1.5">
              <Button variant="ghost" size="sm" tabIndex={-1}>
                <ListFilter /> All events
              </Button>
              <span className="flex overflow-hidden rounded-md border">
                <span className="flex size-7 items-center justify-center bg-muted">
                  <LayoutGrid className="size-3.5" />
                </span>
                <span className="flex size-7 items-center justify-center text-muted-foreground">
                  <Rows3 className="size-3.5" />
                </span>
              </span>
            </div>
          </div>
          <ul className={EVENT_CARD_GRID}>
            {events.map((e) => {
              const line = cardLine(variant, e);
              const Icon = line?.icon ?? null;
              return (
                <li key={e.id}>
                  <EventCard
                    href="#"
                    name={e.name}
                    coverUrl={e.cover?.src ?? null}
                    // The card's own stills layer: its lazy cover image waits on a
                    // scroll a portalled frame never sends, so the stills draw it.
                    living={
                      e.stills.length > 1
                        ? { id: e.id, stills: e.stills.map((p) => p.src) }
                        : undefined
                    }
                    dateLabel={e.dateLabel}
                    itemsLabel={`${formatCount(e.approved)} ${e.approved === 1 ? "item" : "items"}`}
                    // Paused, never Closed (the door's word): production's one helper says it.
                    statusLabel={uploadsLabel(e.acceptingUploads)}
                    // Today's card keeps its own amber chip; a candidate's line takes the slot.
                    pendingCount={variant === "quiet" ? e.pending : 0}
                    qrSlot={
                      <EventCardQr
                        eventId={e.id}
                        eventName={e.name}
                        qrToken="3f0c1d2e4a5b6c7d8e9f0a1b2c3d4e5f"
                        qrStyle="classic"
                        siteUrl={SITE}
                      />
                    }
                    action={
                      line ? (
                        <span
                          data-er-card-job=""
                          className={cn(
                            "flex h-5 items-center gap-1 rounded-full px-2 text-[10px] font-semibold",
                            line.tone === "quiet"
                              ? cn(GLASS_MARK, "text-white")
                              : "",
                          )}
                          style={
                            line.tone === "quiet"
                              ? undefined
                              : {
                                  background: "var(--warning)",
                                  color: "var(--warning-foreground)",
                                }
                          }
                        >
                          {Icon ? (
                            <Icon className="size-3" aria-hidden />
                          ) : null}
                          {line.text}
                        </span>
                      ) : undefined
                    }
                  />
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </HostPage>
  );
}
