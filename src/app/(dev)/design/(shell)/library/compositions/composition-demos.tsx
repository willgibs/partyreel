"use client";

import { useState } from "react";
import { ShieldAlert, Undo2 } from "lucide-react";

import { AdminRail } from "@/components/admin/admin-rail";
import { DestructiveSheet } from "@/components/admin/destructive-sheet";
import { HealthBand } from "@/components/admin/health-band";
import { QueueList } from "@/components/admin/queue-list";
import { StatusPicker } from "@/components/admin/triage-status-control";
import {
  AddNoteLink,
  ClosedLine,
  ClosedLog,
  NoteField,
  ReasonLine,
  useVerdictNote,
} from "@/components/app/report-review";
import { FilterChips } from "@/components/app/dashboard/filter-chips";
import { StorageMeter } from "@/components/app/dashboard/storage-meter";
import { MediaTile } from "@/components/app/media-grid";
import { ReviewRoom } from "@/components/app/event-feed/review-room";
import { DoorPage } from "@/components/app/event-settings/door-page";
import type { SettingsPage } from "@/components/app/event-settings/settings-pages";
import { SettingsRows } from "@/components/app/event-settings/settings-rows";
import {
  SettingsProvider,
  type SettingsWrites,
} from "@/components/app/event-settings/settings-state";
import { hostEvent, NO_COUNTS } from "@/components/app/event-settings/testing/host-event";
import { AddsPage } from "@/components/app/event-settings/adds-page";
import { EventPage } from "@/components/app/event-settings/event-page";
import { ReelPage } from "@/components/app/event-settings/reel-page";
import type { ReviewWrites } from "@/components/app/event-feed/use-review-triage";
import { ProPriceList } from "@/components/app/pricing/pro-price-list";
import { QrPresetPicker } from "@/components/app/qr-preset-picker";
import { largestFirst } from "@/components/app/storage/storage-list-rules";
import {
  StorageSourceProvider,
  type StorageSource,
} from "@/components/app/storage/storage-source";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { PlanFacts } from "@/lib/billing/plan-facts";
import {
  heldMessage,
  holdReasonFor,
  holdTouches,
  type HoldScope,
  REPORT_NOTE_MAX,
  REPORT_WORDS,
  type ReportWord,
  WAY_BACK_LINE,
} from "@/lib/admin/reports";
import type { QrStyleKey } from "@/lib/constants/qr-presets";
import { GIGABYTE, planById } from "@/lib/constants/tiers";
import { marketingImage } from "@/lib/constants/marketing-media";
import type { StorageItem } from "@/lib/db/queries/storage-list";
import { buildOperatorQueue } from "@/lib/admin/queue";
import type { FilterValue } from "@/lib/dashboard/filters";
import { formatAdminTimestamp } from "@/lib/format/admin-time";
import type { JobHealthReport } from "@/lib/jobs/health-summary";
import { operatorRemovalTouches } from "@/lib/moderation/operator-actions";

import { SAMPLE, SAMPLE_MEDIA } from "@/app/(dev)/design/reference/sample-data";

// A pending set for the review-surface probe (force pending + unique ids to fill the queue).
const SAMPLE_PENDING = [...SAMPLE_MEDIA, ...SAMPLE_MEDIA].map((m, i) => ({
  ...m,
  id: `pending-${i}`,
  status: "pending" as const,
}));

/**
 * The CONTROLLED product components for the Compositions gallery: the ones that
 * take an onChange handler or a hook, so they need client state to be live.
 * Everything else in the family renders from static sample props in
 * gallery-demos.tsx.
 *
 * Each demo returns bare content now (the gallery round, 2026-09-12): the Stage
 * supplies the frame, the label and the light-and-dark split, and the specimen
 * that mounts the demo carries its label and hint.
 */

export function FilterChipsDemo() {
  const [active, setActive] = useState<FilterValue>("all");
  return <FilterChips active={active} onChange={setActive} trashCount={3} />;
}

export function QrPresetPickerDemo() {
  const [value, setValue] = useState<QrStyleKey>("classic");
  return (
    <QrPresetPicker
      value={value}
      onChange={setValue}
      joinUrl={SAMPLE.joinUrl}
    />
  );
}

// THE REVIEW ROOM, WHOLE AND INERT: the real room (its grid, the peek's verdict, the keys once a tile
// has focus, the bar, the verdict's toast with its Undo) over writes that answer after the round trip
// a real one costs and change nothing, so a reviewer here can never approve anyone's upload. "A guest
// sends one" plays a server render that holds one more waiting upload, which is how the room's line
// ("1 new") is seen without a live album behind it. Never claims a key pressed with nothing focused:
// the Library holds other specimens, and a second copy (the light-and-dark split) would fight it.
const ROUND_TRIP_MS = 320;
const answered = () =>
  new Promise<{ ok: true }>((resolve) =>
    setTimeout(() => resolve({ ok: true }), ROUND_TRIP_MS),
  );
const DEMO_WRITES: ReviewWrites = {
  approve: answered,
  reject: answered,
  undo: answered,
};

export function ReviewSectionDemo() {
  const [items, setItems] = useState(SAMPLE_PENDING);
  function guestSendsOne() {
    setItems((prev) => {
      const next = SAMPLE_MEDIA[prev.length % SAMPLE_MEDIA.length];
      return [
        { ...next, id: `arrived-${prev.length}`, status: "pending" as const },
        ...prev,
      ];
    });
  }
  return (
    <div className="space-y-3">
      <ReviewRoom
        eventId="demo"
        moderationOn
        pendingItems={items}
        writes={DEMO_WRITES}
        claimPage={false}
      />
      <Button type="button" variant="ghost" size="sm" onClick={guestSendsOne}>
        A guest sends one
      </Button>
    </div>
  );
}

// WHAT'S USING SPACE, OVER AN INERT ACCOUNT (storage-wiring): the real storage meter, whose popover
// opens the size list, and a Pro host's six prices, whose Too small flips to the refusal and opens
// the same list with the goal strip. The account is a videographer on Pro's 500 GB monthly size,
// 110.8 GB across four events (a handful of long videos are most of it). The
// source answers after a real round trip's pause and changes nothing: a reviewer here can never
// remove anyone's photograph, and the strip's switch stops at a note instead of Stripe. (The six
// rows' own Switch is the product's button, which a signed-out Library sends to sign in.)
const STORAGE_EVENTS = [
  {
    id: "demo-wedding-maya",
    name: "Maya & Theo’s wedding",
    videos: [9.4, 8.7, 7.9, 6.2, 5.8, 4.4, 3.1],
    photos: 210,
  },
  {
    id: "demo-wedding-jordan",
    name: "Jordan & Lee’s wedding",
    videos: [8.1, 6.6, 5.2, 3.9, 2.7],
    photos: 160,
  },
  {
    id: "demo-wedding-sam",
    name: "Sam & Alex’s wedding",
    videos: [7.4, 5.5, 4.8, 3.3, 2.2],
    photos: 120,
  },
  {
    id: "demo-birthday-ivy",
    name: "Ivy turns one",
    videos: [1.9, 1.1],
    photos: 36,
  },
] as const;

const STORAGE_STILLS = [
  "wedding-golden",
  "reception-hall",
  "wedding-arch",
  "party-dj",
  "wedding-toast",
  "reception-table",
  "festival-lights",
  "party-balloons",
].map((id) => marketingImage(id).src);

const STORAGE_PEOPLE: StorageItem["by"][] = [
  { name: null, isHost: true, isVerified: true },
  { name: "Priya Anand", isHost: false, isVerified: true },
  { name: "Tom R.", isHost: false, isVerified: false },
  { name: "Grace", isHost: false, isVerified: true },
];

const STORAGE_ITEMS: StorageItem[] = STORAGE_EVENTS.flatMap((event, e) => [
  ...event.videos.map(
    (gb, i): StorageItem => ({
      id: `${event.id}-v${i}`,
      eventId: event.id,
      type: "video",
      bytes: Math.round(gb * GIGABYTE),
      durationSeconds: 240 + ((i * 377 + e * 91) % 1300),
      createdAt: `2026-0${4 + e}-1${i % 9}T19:30:00.000000+00:00`,
      // A video's tile is its preview (the frame the upload grabbed); a still stands in.
      url: STORAGE_STILLS[(i + e) % STORAGE_STILLS.length],
      previewUrl: STORAGE_STILLS[(i + e) % STORAGE_STILLS.length],
      by: STORAGE_PEOPLE[i % 2],
    }),
  ),
  ...Array.from(
    { length: event.photos },
    (_, i): StorageItem => ({
      id: `${event.id}-p${i}`,
      eventId: event.id,
      type: "photo",
      bytes: (18 + ((i * 7 + e) % 13)) * 1024 ** 2,
      durationSeconds: null,
      createdAt: `2026-0${4 + e}-1${i % 9}T20:${String(i % 60).padStart(2, "0")}:00.000000+00:00`,
      url: STORAGE_STILLS[(i * 3 + e) % STORAGE_STILLS.length],
      previewUrl: null,
      by: STORAGE_PEOPLE[i % STORAGE_PEOPLE.length],
    }),
  ),
]).sort(largestFirst);

const STORAGE_STORED = STORAGE_ITEMS.reduce((sum, i) => sum + i.bytes, 0);
const STORAGE_PAGE = 40;

const afterPause = <T,>(value: T) =>
  new Promise<T>((resolve) => setTimeout(() => resolve(value), ROUND_TRIP_MS));

const DEMO_STORAGE: StorageSource = {
  read: (ask) => {
    const {
      eventId = null,
      after = null,
      withOverview = false,
    } = (ask ?? {}) as {
      eventId?: string | null;
      after?: { bytes: number; id: string } | null;
      withOverview?: boolean;
    };
    const pool = STORAGE_ITEMS.filter(
      (item) => eventId === null || item.eventId === eventId,
    );
    const start = after
      ? pool.findIndex((i) => largestFirst(i, { ...after }) > 0)
      : 0;
    const items = start === -1 ? [] : pool.slice(start, start + STORAGE_PAGE);
    const last = items[items.length - 1];
    return afterPause({
      ok: true as const,
      items,
      next:
        last && start + STORAGE_PAGE < pool.length
          ? { bytes: last.bytes, id: last.id }
          : null,
      overview: withOverview
        ? {
            storedBytes: STORAGE_STORED,
            events: STORAGE_EVENTS.map((event) => {
              const own = STORAGE_ITEMS.filter((i) => i.eventId === event.id);
              return {
                id: event.id,
                name: event.name,
                bytes: own.reduce((sum, i) => sum + i.bytes, 0),
                count: own.length,
              };
            }).sort((a, b) => b.bytes - a.bytes),
          }
        : null,
    });
  },
  remove: (items) =>
    afterPause({
      ok: true as const,
      removed: Array.isArray(items) ? items.length : 0,
    }),
  restore: (ids) =>
    afterPause({
      ok: true as const,
      restored: Array.isArray(ids) ? (ids as string[]) : [],
      refused: [],
      message: null,
    }),
  // A plain note in place of Stripe's confirm page (`already_on_plan` is the one code the
  // strip's toast reads as a note rather than a failure).
  switchPlan: () =>
    afterPause({
      kind: "error" as const,
      code: "already_on_plan",
      message:
        "The Library stops here: in the product this opens Stripe’s confirm page.",
    }),
};

const PRIYA_FACTS: PlanFacts = {
  tier: "pro",
  hasBilling: true,
  passExpiry: null,
  activeBytes: STORAGE_STORED,
  standbyBytes: Math.round(3.2 * GIGABYTE),
  capBytes: planById("pro_500").storageBytes,
  currentPlanId: "pro_500",
  changeBlocked: null,
};

export function StorageListDemo() {
  const cap = planById("pro_500").storageBytes;
  return (
    <StorageSourceProvider source={DEMO_STORAGE}>
      <div className="w-full max-w-xl space-y-6">
        <StorageMeter
          storageUsed={STORAGE_STORED}
          storageCap={cap}
          storagePct={Math.round((STORAGE_STORED / cap) * 100)}
          standbyBytes={PRIYA_FACTS.standbyBytes}
          overBudget={false}
          passExpiry={null}
          planName="Pro"
          hasBilling
          isEventPass={false}
          tier="pro"
        />
        <div className="rounded-float border bg-popover p-4">
          <ProPriceList facts={PRIYA_FACTS} returnTo="/account" />
        </div>
      </div>
    </StorageSourceProvider>
  );
}

/**
 * THE OPERATIONS PORTAL'S SHELL (admin-wiring, 2026-09-20).
 *
 * ★ THIS IS THE ONLY AUTOMATED EYE ON THE ADMIN. Every /admin route is behind
 * `requireAdmin()` plus AAL2 on its own host, so `lab:smoke` can never reach
 * one and neither can a lane on its own port: the portal is the one surface in
 * the product nothing but a human with a second factor can open. These three
 * mount the REAL rail, band and queue with fixtures, credential-free, so the
 * shell's shape is proved on every crawl. The `admin` board drew them from one
 * Tuesday and the fixtures are that Tuesday.
 *
 * ★ THE BAR IS NOT HERE, ON PURPOSE. It is the one piece of the shell that
 * carries a server action: its operator menu holds a real `signOutAction`
 * form, and a gallery page with a live sign-out in it would clear the session
 * of whoever opened the library. The rail, the band, the queue, the table and
 * the sheet are the parts that can be shown safely.
 */
const OPS_COUNTS = { support: 9, applicants: 2, reports: 3, jobs: 2 };

const OPS_BAD_DAY: JobHealthReport = {
  readable: true,
  unhealthy: [
    { id: "purge_cron", label: "Purge sweep", health: "failed" },
    { id: "backup_reconcile", label: "Backup reconcile", health: "missed" },
  ],
  pausedCount: 1,
  heartbeatAgeMs: 10 * 60 * 60 * 1000,
};

const OPS_UNREADABLE: JobHealthReport = {
  readable: false,
  unhealthy: [],
  pausedCount: 0,
  heartbeatAgeMs: null,
};

const OPS_QUEUE = buildOperatorQueue({
  health: OPS_BAD_DAY,
  reports: { count: 3, oldestAtMs: 0 - 5 * 3_600_000 },
  support: { count: 9, oldestAtMs: 0 - 31 * 3_600_000 },
  applicants: { count: 2, oldestAtMs: 0 - 70 * 3_600_000 },
  nowMs: 0,
});

export function AdminRailDemo() {
  // The rail reads `usePathname`, which inside the library is the library's own
  // path, so no row is current here. That is the resting state and it is the
  // honest one to show.
  return (
    <div className="flex h-[26rem] overflow-hidden rounded-float border bg-background">
      <div className="contents lg:contents">
        <AdminRail counts={OPS_COUNTS} onOpenPalette={() => {}} />
      </div>
      <div className="flex-1 p-6">
        <p className="text-caption text-muted-foreground">
          232 pixels of permanent structure: every surface, its part of the
          portal, and its pending count, all readable without a click.
        </p>
      </div>
    </div>
  );
}

export function AdminHealthBandDemo() {
  return (
    <div className="w-full overflow-hidden rounded-float border bg-background">
      <HealthBand health={OPS_BAD_DAY} />
      <HealthBand health={OPS_UNREADABLE} />
      <p className="px-4 py-3 text-caption text-muted-foreground">
        On a good day neither of these renders at all, which is why the band
        costs nothing to carry on eleven surfaces that are not the console.
      </p>
    </div>
  );
}

export function AdminQueueDemo() {
  return <QueueList items={OPS_QUEUE} />;
}

/**
 * THE SHEET, AND REPORTS' OWN CARD (admin-triage r1, `verdict=note`): `report-review.tsx`'s
 * `OpenReportCard` hard-wires the real Server Actions (`dismissReportAction`, `actionReportAction`,
 * `holdFromReportAction`), so it is redrawn here from its own exported pieces (`ReasonLine`,
 * `NoteField`, `AddNoteLink`, `ClosedLog`, `ClosedLine`, `useVerdictNote`) and `StatusPicker`, over
 * writes that answer after a round trip and change nothing — Review and Storage's own convention,
 * so a reviewer here can never touch anyone's report. Remove… opens `DestructiveSheet` with its
 * note OPTIONAL (a verdict's own reason, left blank or filled); Hold for forensics opens the second,
 * whose note is REQUIRED (the confirm waits for a line, as an unmatched typed identifier does).
 */
const REPORT_TOUCHES = operatorRemovalTouches({
  kind: "photo",
  eventName: "Priya & Sam's baby shower",
  from: "album",
  wayBack: "undo",
});
const REPORT_HOLD_SCOPE: HoldScope = {
  kind: "photo",
  eventName: "Priya & Sam's baby shower",
  others: 2,
  uploader: "guest",
};
const REPORT_DEMO_ID = "8f21e3a0-9b44-4c1a-9e77-2d6f0c9a4b21";

export function AdminReportCardDemo() {
  const [asking, setAsking] = useState<"verdict" | "hold" | null>(null);
  const note = useVerdictNote();
  const item = SAMPLE_MEDIA[0];

  return (
    <div className="w-full max-w-md space-y-4">
      <Card data-report-id={REPORT_DEMO_ID}>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="min-w-0 break-words">
              Priya &amp; Sam&rsquo;s baby shower
            </CardTitle>
            <StatusPicker
              status={"open" as ReportWord}
              words={REPORT_WORDS}
              moves={["dismissed", "actioned"]}
              moveLabel={(next) =>
                next === "actioned" ? "Actioned…" : "Dismissed"
              }
              onPick={() => {}}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {formatAdminTimestamp("2026-09-27T21:14:00.000Z")} · item reported
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="aspect-square w-40 overflow-hidden rounded-lg bg-black/10">
            <MediaTile item={item} />
          </div>
          <ReasonLine reason="The third photo from the top is of my child, and nobody asked us before posting it." />
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setAsking("hold")}
            >
              <ShieldAlert />
              Hold for forensics
            </Button>
            <span className="text-caption text-muted-foreground">
              Sets the hold, preserves the evidence and keeps this report open.
            </span>
          </div>
          {note.open ? (
            <NoteField
              id={`${REPORT_DEMO_ID}-note`}
              value={note.text}
              onChange={note.setText}
            />
          ) : null}
        </CardContent>
        <CardFooter className="flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm">
            Dismiss
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => setAsking("verdict")}
          >
            Remove…
          </Button>
          {note.open ? null : <AddNoteLink onPress={note.show} />}
        </CardFooter>
      </Card>

      <ClosedLog lede={WAY_BACK_LINE}>
        <ClosedLine
          lead={
            <div className="size-8 shrink-0 overflow-hidden rounded bg-muted">
              <MediaTile item={SAMPLE_MEDIA[1]} playBadge="none" />
            </div>
          }
          status="actioned"
          note="Cropped out of frame before the album reopened"
          where="Jordan & Lee's wedding"
          resolvedAt="2026-09-20T18:04:00.000Z"
          end={
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0"
              aria-label="Undo: restore the item and reopen the report"
            >
              <Undo2 />
              <span className="hidden sm:inline">Undo</span>
            </Button>
          }
        />
      </ClosedLog>

      <DestructiveSheet
        open={asking === "verdict"}
        onOpenChange={(open) => setAsking(open ? "verdict" : null)}
        title="Remove this photo?"
        lede="It leaves the album and the host's Deleted now, and the report closes as Actioned."
        verb="Remove"
        touches={REPORT_TOUCHES}
        severity="reversible"
        note={{
          label: "Note",
          defaultValue: note.text,
          placeholder: "Why, in one line",
          hint: "Kept on the report with the verdict. Only this portal reads it.",
          maxLength: REPORT_NOTE_MAX,
        }}
        successMessage="Removed, and the report is actioned."
        onConfirm={answered}
      />
      <DestructiveSheet
        open={asking === "hold"}
        onOpenChange={(open) => setAsking(open ? "hold" : null)}
        title="Hold and preserve this photo?"
        lede="It stays out of every purge until the hold is released from Forensics, and this report stays open."
        verb="Set hold and preserve"
        touches={holdTouches(REPORT_HOLD_SCOPE)}
        severity="reversible"
        note={{
          label: "Reason, on the record",
          required: true,
          defaultValue: holdReasonFor(REPORT_DEMO_ID),
          placeholder: "e.g. report reference, CyberTipline filing",
          hint: "Written on each hold and in the forensic audit log.",
          maxLength: REPORT_NOTE_MAX,
        }}
        successMessage={heldMessage(1 + REPORT_HOLD_SCOPE.others)}
        onConfirm={answered}
      />
    </div>
  );
}

/* ── SETTINGS (event-settings r1), on one wedding, its writes inert ─────────────────────────────── */

/** A round trip that changes nothing, then the answer each write gives when it lands. */
const settle = <T,>(value: T) =>
  new Promise<T>((resolve) => setTimeout(() => resolve(value), 350));

const SETTINGS_WRITES: SettingsWrites = {
  updateEvent: async () => settle({ ok: true as const }),
  setDoor: async (_id, door) =>
    settle({
      ok: true as const,
      emailHeld: door === "approve" || door === "invite",
      admitted: door === "open" ? 2 : 0,
    }),
  setReel: async (input) =>
    settle({
      ok: true as const,
      defaults: {
        showReel: input.showReel ?? true,
        styleId: input.styleId ?? null,
        holdSec: input.holdSec ?? null,
      },
    }),
  setProfile: async () => settle({ ok: true as const }),
};

const WEDDING = hostEvent({
  name: "Maya & Jay's Wedding",
  event_date: "2026-10-10",
  description: "Add everything from the ceremony too.",
});

/**
 * Settings at rest and one level in, drawn inline (never in the popup, which would cover the page):
 * the four rows, and whichever page a row opens, with the back row up.
 */
export function SettingsDemo({ tier = "pro" }: { tier?: "free" | "pro" }) {
  const [page, setPage] = useState<SettingsPage | null>(null);
  return (
    <SettingsProvider
      event={WEDDING}
      tier={tier}
      // A Public album holds nobody at its door (turning Public lets everyone waiting in).
      counts={{ ...NO_COUNTS, in: 31, invited: 24 }}
      pendingCount={3}
      social={{ displayInProfile: false, hostHasSlug: true }}
      reelSample={null}
      writes={SETTINGS_WRITES}
    >
      <div className="max-w-md space-y-4 rounded-xl bg-popover p-4 text-popover-foreground shadow-layer">
        {page ? (
          <button
            type="button"
            onClick={() => setPage(null)}
            className="text-sm text-muted-foreground underline underline-offset-4"
          >
            Back to Settings
          </button>
        ) : (
          <p className="font-heading text-card-title">Settings</p>
        )}
        {page === "door" ? (
          <DoorPage guestsHref="#guests" />
        ) : page === "adds" ? (
          <AddsPage />
        ) : page === "reel" ? (
          <ReelPage />
        ) : page === "event" ? (
          <EventPage />
        ) : (
          <SettingsRows onOpenPage={setPage} />
        )}
      </div>
    </SettingsProvider>
  );
}

/** The door's page on its own, a Private album letting each person in, two waiting. */
export function DoorPageDemo() {
  return (
    <SettingsProvider
      event={hostEvent({ ...WEDDING, visibility: "private", door: "approve" })}
      tier="pro"
      counts={{ ...NO_COUNTS, in: 31, waiting: 2, invited: 24 }}
      pendingCount={0}
      social={null}
      reelSample={null}
      writes={SETTINGS_WRITES}
    >
      <div className="max-w-md rounded-xl bg-popover p-4 text-popover-foreground shadow-layer">
        <DoorPage guestsHref="#guests" />
      </div>
    </SettingsProvider>
  );
}
