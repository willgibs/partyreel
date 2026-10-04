"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import { ImageUp, Play, QrCode, Undo2 } from "lucide-react";

import {
  AtTheDoor,
  type DoorActs,
  type DoorPerson,
} from "@/app/(app)/dashboard/[eventId]/guests/at-the-door";
import {
  InvitedSection,
  type InviteActs,
  type InvitedPerson,
} from "@/app/(app)/dashboard/[eventId]/guests/invited-section";
import { AdminRail } from "@/components/admin/admin-rail";
import {
  ReportQueue,
  type ReportQueueWrites,
} from "@/components/admin/report-queue";
// A type only (erased at build), so the server-only query module never reaches this page.
import type { ReviewEntry } from "@/lib/db/queries/reports";
import { HealthBand } from "@/components/admin/health-band";
import {
  DistributionChartLazy,
  TrendChartLazy,
} from "@/components/admin/metrics-charts.lazy";
import { QueueList } from "@/components/admin/queue-list";
import { ClosedLine, ClosedLog } from "@/components/app/report-review";
import { StorageMeter } from "@/components/app/dashboard/storage-meter";
import { MediaTile } from "@/components/app/media-grid";
import { ReviewRoom } from "@/components/app/event-feed/review-room";
import { EventChecklist } from "@/components/app/event-feed/checklist";
import { DoorPage } from "@/components/app/event-settings/door-page";
import { SettingsNext } from "@/components/app/event-settings/event-settings-sheet";
import type { SettingsPage } from "@/components/app/event-settings/settings-pages";
import { SettingsRows } from "@/components/app/event-settings/settings-rows";
import {
  SettingsProvider,
  type SettingsWrites,
} from "@/components/app/event-settings/settings-state";
import {
  hostEvent,
  NO_COUNTS,
} from "@/components/app/event-settings/testing/host-event";
import { AddsPage } from "@/components/app/event-settings/adds-page";
import { EventPage } from "@/components/app/event-settings/event-page";
import { ReelPage } from "@/components/app/event-settings/reel-page";
import type { ReviewWrites } from "@/components/app/event-feed/use-review-triage";
import { HostAddProvider } from "@/components/app/host-add-provider";
import { ProPriceList } from "@/components/app/pricing/pro-price-list";
import { QrPresetPicker } from "@/components/app/qr-preset-picker";
import {
  EventCardsRow,
  type RoomCard,
} from "@/components/app/event-feed/event-cards-row";
import { HubCover } from "@/components/app/event-feed/event-hub-head";
import { reviewCardFace } from "@/components/app/event-feed/room-card";
import type { ReelCardData } from "@/components/app/event-feed/reel-card";
import { EventCodeDoor } from "@/components/app/share/event-code-door";
import { EventShareProvider } from "@/components/app/share/event-share-provider";
import { StorageChart } from "@/components/app/storage/storage-chart";
import { largestFirst } from "@/components/app/storage/storage-list-rules";
import {
  StorageSourceProvider,
  type StorageSource,
} from "@/components/app/storage/storage-source";
import {
  AlbumCover,
  type HeadStill,
  HeadStills,
} from "@/components/guest/event-experience-head";
import { GuestActionDock } from "@/components/guest/guest-action-dock";
import { Button } from "@/components/ui/button";
import type { PlanFacts } from "@/lib/billing/plan-facts";
import {
  addressStrikes,
  type ClosedStrike,
  closedStrikeWords,
  type HoldScope,
  WAY_BACK_LINE,
} from "@/lib/admin/reports";
import type { QrStyleKey } from "@/lib/constants/qr-presets";
import { GIGABYTE, planById } from "@/lib/constants/tiers";
import { marketingImage } from "@/lib/constants/marketing-media";
import type { StorageItem } from "@/lib/db/queries/storage-list";
import type { Door } from "@/lib/event/door/door";
import type { ReadyFacts } from "@/lib/events/readiness";
import { buildOperatorQueue } from "@/lib/admin/queue";
import type { JobHealthReport } from "@/lib/jobs/health-summary";

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
// holds the storage chart and opens the size list, and a Pro host's six prices, whose Too small flips
// to the refusal and opens the same list with the goal strip. The account is a videographer on Pro's
// 500 GB monthly size, 110.8 GB across four events (a handful of long videos are most of it) and
// 3.2 GB in Deleted, which her plan holds too (trash-in-storage). The source answers after a real
// round trip's pause and changes nothing: a reviewer here can never delete anyone's photograph, empty
// anyone's Deleted or change anyone's setting, and the strip's switch stops at a note instead of
// Stripe. (The six rows' own Switch is the product's button, which a signed-out Library sends to sign in.)
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

/** Her events' bytes, and her Deleted's: the cap holds both. */
const STORAGE_ALBUMS = STORAGE_ITEMS.reduce((sum, i) => sum + i.bytes, 0);
const STORAGE_DELETED = Math.round(3.2 * GIGABYTE);
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
            storedBytes: STORAGE_ALBUMS + STORAGE_DELETED,
            deletedBytes: STORAGE_DELETED,
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
  deleteForGood: (items) =>
    afterPause({
      ok: true as const,
      deleted: Array.isArray(items) ? items.length : 0,
    }),
  emptyDeleted: () =>
    afterPause({
      ok: true as const,
      items: 14,
      events: 0,
      freedBytes: STORAGE_DELETED,
      more: false,
    }),
  setMakeRoom: (on) => afterPause({ ok: true as const, on: on === true }),
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
  storedBytes: STORAGE_ALBUMS + STORAGE_DELETED,
  deletedBytes: STORAGE_DELETED,
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
          activeBytes={STORAGE_ALBUMS}
          deletedBytes={STORAGE_DELETED}
          storageCap={cap}
          makeRoom
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
 * The inert source around a specimen the gallery declares inline (the storage meter's popover holds
 * the chart, whose switch and Empty Deleted would otherwise reach the real Server Functions).
 */
export function InertStorage({ children }: { children: ReactNode }) {
  return (
    <StorageSourceProvider source={DEMO_STORAGE}>
      {children}
    </StorageSourceProvider>
  );
}

/**
 * THE STORAGE CHART'S STATES (trash-in-storage): the chart the storage meter's popover holds, drawn
 * alone over Pro 100 GB at the four moments that matter. Empty; half used with some in Deleted; and
 * full, the same 70 GB of albums and 30 GB in Deleted, once with Make room from Deleted on (an upload
 * takes its room from Deleted, so nothing is in trouble) and once with it off (an upload is refused
 * until she empties Deleted, so it warns and names that fix). The inert source answers the switch and
 * Empty Deleted after a pause and changes nothing.
 */
const CHART_STATES = {
  empty: { activeBytes: 0, deletedBytes: 0, makeRoom: true },
  half: {
    activeBytes: 41 * GIGABYTE,
    deletedBytes: 8.5 * GIGABYTE,
    makeRoom: true,
  },
  "full-on": {
    activeBytes: 70 * GIGABYTE,
    deletedBytes: 30 * GIGABYTE,
    makeRoom: true,
  },
  "full-off": {
    activeBytes: 70 * GIGABYTE,
    deletedBytes: 30 * GIGABYTE,
    makeRoom: false,
  },
} as const;

export function StorageChartDemo({
  state,
}: {
  state: keyof typeof CHART_STATES;
}) {
  const figures = CHART_STATES[state];
  return (
    <StorageSourceProvider source={DEMO_STORAGE}>
      <div
        data-chart-state={state}
        className="w-full max-w-80 rounded-float border bg-popover p-4"
      >
        <StorageChart
          {...figures}
          capBytes={planById("pro_100").storageBytes}
        />
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
 * REPORTS' OWN QUEUE, THE REAL ONE (admin-triage r2, `look=grid`): `ReportQueue` over a Saturday night of reports
 * and writes that answer after a round trip and change nothing (`ReportQueueWrites`, Review and Storage's own
 * convention), so a reviewer here can never touch anyone's report. Harm in front (the worst covered until View
 * once), the sweep's ticks and its one Dismiss, the report whole on Space or a press with every verb (Remove…'s
 * note optional, Hold for forensics' reason required, Take it down too ON), Ask for proof with its thread, and at
 * 375 a phone's two acts. The closed log sits under it, as on the page.
 */
const QUEUE_ANSWER = <T,>(value: T) =>
  new Promise<T>((resolve) => setTimeout(() => resolve(value), ROUND_TRIP_MS));

const QUEUE_WRITES: ReportQueueWrites = {
  dismiss: async (id) =>
    QUEUE_ANSWER({ ok: true as const, reportIds: [id], restored: false }),
  dismissMany: async (ids) =>
    QUEUE_ANSWER({ ok: true as const, reportIds: ids, restored: false }),
  reopenMany: async () => QUEUE_ANSWER({ ok: true as const }),
  action: async () => QUEUE_ANSWER({ ok: true as const }),
  askProof: async () => QUEUE_ANSWER({ ok: true as const }),
  takeDown: async () =>
    QUEUE_ANSWER({ ok: true as const, at: "2026-09-27T22:50:00.000Z" }),
  undoTakeDown: async () => QUEUE_ANSWER({ ok: true as const }),
  holdScope: async () =>
    QUEUE_ANSWER({ ok: true as const, scope: REPORT_HOLD_SCOPE }),
  hold: async () => QUEUE_ANSWER({ ok: true as const }),
};

const REPORT_HOLD_SCOPE: HoldScope = {
  kind: "photo",
  eventName: "Priya & Sam's baby shower",
  others: 2,
  uploader: "guest",
};

const QUEUE_EVENT = {
  id: "e-shower",
  name: "Priya & Sam's baby shower",
  host: "priya.n@outlook.com",
  uploads: 176,
  guests: 52,
};

function queueEntry(
  n: number,
  kind: ReviewEntry["kind"],
  reports: ReviewEntry["reports"],
  over: Partial<ReviewEntry> = {},
): ReviewEntry {
  const m = SAMPLE_MEDIA[n % SAMPLE_MEDIA.length];
  return {
    key: `item:${m.id}-${n}`,
    reportId: reports[0].id,
    subject: "item",
    lane: kind === "other" ? "sweep" : "front",
    kind,
    newestAt: reports[0].createdAt,
    reports,
    event: QUEUE_EVENT,
    media: {
      id: `${m.id}-${n}`,
      type: m.type,
      url: m.url,
      previewUrl: m.previewUrl ?? null,
      standing: "live",
      held: false,
      hidden: false,
    },
    uploader: {
      name: "Arjun",
      verified: false,
      isHost: false,
      more: 6,
      otherReports: 2,
      held: 0,
    },
    ...over,
  };
}

const queueReport = (
  n: number,
  over: Partial<ReviewEntry["reports"][number]> = {},
): ReviewEntry["reports"][number] => ({
  id: `8f21e3a0-9b44-4c1a-9e77-${String(n).padStart(12, "0")}`,
  reason: null,
  createdAt: `2026-09-27T2${n % 4}:1${n % 6}:00.000Z`,
  kind: "other",
  signedIn: false,
  canAsk: false,
  byHost: false,
  hidAt: null,
  strikes: null,
  proof: null,
  ...over,
  // A report that can be asked was sent from a confirmed address.
  confirmed: over.confirmed ?? over.canAsk ?? false,
});

const QUEUE_ENTRIES: ReviewEntry[] = [
  queueEntry(
    0,
    "child",
    [
      queueReport(1, {
        kind: "child",
        signedIn: true,
        canAsk: true,
        hidAt: "2026-09-27T22:12:00.000Z",
        reason: "A child in this one should not be here like this.",
        // Its address already holds two strikes, so this Dismiss would be the third (crumbs-33).
        strikes: addressStrikes(
          {
            live: 2,
            barred: false,
            lapses: ["2027-02-20T21:05:00.000Z", "2026-12-02T19:30:00.000Z"],
          },
          { strikes: 3, freshLapsesAt: "2027-03-26T22:12:00.000Z" },
          1,
        ),
      }),
    ],
    {
      media: {
        id: "c0",
        type: "photo",
        url: SAMPLE_MEDIA[0].url,
        previewUrl: SAMPLE_MEDIA[0].previewUrl ?? null,
        standing: "operator",
        held: false,
        hidden: true,
      },
    },
  ),
  queueEntry(1, "private", [
    queueReport(2, {
      kind: "private",
      signedIn: true,
      canAsk: true,
      reason:
        "My driving licence is on the table in this one and you can read my address on it.",
    }),
  ]),
  queueEntry(2, "consent", [
    queueReport(3, {
      kind: "consent",
      signedIn: true,
      canAsk: true,
      reason:
        "The third photo from the top is of my child, and nobody asked us before posting it.",
      proof: {
        askedAt: "2026-09-27T22:52:00.000Z",
        question:
          "Which photo is it, and is there anything that shows she's yours?",
        answeredAt: "2026-09-27T23:06:00.000Z",
        answer:
          "The one of the toast; the bride is my sister-in-law and can confirm.",
      },
    }),
  ]),
  queueEntry(3, "other", [queueReport(4, { reason: "wrong event" })]),
  queueEntry(4, "other", [queueReport(5, { reason: "blurry" })]),
  queueEntry(5, "other", [
    queueReport(6, { reason: "please delete this one", signedIn: true }),
    queueReport(7, { reason: "I look awful in this one, can you delete it" }),
  ]),
  queueEntry(6, "other", [queueReport(8)], {
    key: "album:e-shower",
    subject: "album",
    media: null,
    uploader: null,
  }),
];

/**
 * A dismissed child-abuse report's closed line, in each state its strike can be in (crumbs-36): the words are the
 * production function's own (`closedStrikeWords`), over fixed readings, so the Library draws what the portal draws.
 * The row's Undo is inert here, like every write on this page.
 */
const UNDO_BUTTON = (
  <Button
    type="button"
    variant="outline"
    size="sm"
    className="shrink-0"
    aria-label="Undo: reopen the report"
  >
    <Undo2 />
    <span className="hidden sm:inline">Undo</span>
  </Button>
);

function strikeLine(
  strike: ClosedStrike,
  canUndo: boolean,
): { state: ClosedStrike["state"]; words: string } {
  return { state: strike.state, words: closedStrikeWords(strike, { canUndo }) };
}

const STRIKE_LINES: {
  note: string;
  resolvedAt: string;
  strike: ReturnType<typeof strikeLine>;
  undo: boolean;
}[] = [
  {
    // Inside its reopen window: the strike counts, and Undo takes it back.
    note: "A family photo, not harm",
    resolvedAt: "2026-09-26T08:30:00.000Z",
    strike: strikeLine(
      {
        state: "live",
        at: "2027-03-25T08:30:00.000Z",
        live: 2,
        bar: 3,
        barredUntil: null,
      },
      true,
    ),
    undo: true,
  },
  {
    // Past the product's 30 days, the address barred: a strike's dismissal reopens for as long as the strike counts
    // (Will's #60), so its Undo stays and still takes the strike back.
    note: "Duplicate of an earlier dismissal",
    resolvedAt: "2026-08-02T21:10:00.000Z",
    strike: strikeLine(
      {
        state: "live",
        at: "2027-01-29T21:10:00.000Z",
        live: 3,
        bar: 3,
        barredUntil: "2026-12-02T19:30:00.000Z",
      },
      true,
    ),
    undo: true,
  },
  {
    note: "No reason given",
    resolvedAt: "2026-03-01T10:00:00.000Z",
    strike: strikeLine(
      { state: "lapsed", at: "2026-08-28T10:00:00.000Z" },
      false,
    ),
    undo: false,
  },
  {
    note: "Reported by an unconfirmed address",
    resolvedAt: "2026-09-27T19:45:00.000Z",
    strike: strikeLine({ state: "none" }, false),
    undo: true,
  },
];

export function AdminReportCardDemo() {
  return (
    <div className="w-full space-y-4">
      <ReportQueue entries={QUEUE_ENTRIES} proofOn writes={QUEUE_WRITES} />

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
        {STRIKE_LINES.map((line) => (
          <ClosedLine
            key={line.note}
            lead={
              <span
                aria-hidden
                className="size-8 shrink-0 rounded border border-dashed"
              />
            }
            status="dismissed"
            note={line.note}
            where="Jordan & Lee's wedding"
            resolvedAt={line.resolvedAt}
            strike={line.strike}
            end={line.undo ? UNDO_BUTTON : undefined}
          />
        ))}
      </ClosedLog>
    </div>
  );
}

/**
 * /admin/metrics' two charts at counts past 1,000 (crumbs-41): the real `TrendChart` and `DistributionChart`, lazily
 * loaded as the page loads them, over fixed counts chosen where an axis's own rounded ticks outgrow the data's labels
 * (a Free count of 3,000 ticks 2.3K; views near 99K tick 100K). The portal cannot be signed into on localhost, so
 * this is the only place the charts can be seen at a scale the test data never reaches.
 */
const VIEWS_TREND = Array.from({ length: 14 }, (_, i) => ({
  day: `2026-09-${String(17 + i).padStart(2, "0")}`,
  views: 41_000 + Math.round((i * 58_400) / 13 / 1_000) * 1_000,
  scans: 2_000 + (i % 3) * 1_000,
}));

export function AdminMetricsChartsDemo() {
  return (
    <div className="grid w-full gap-6 lg:grid-cols-2">
      <TrendChartLazy
        data={VIEWS_TREND}
        series={[
          { key: "views", label: "Views", color: "var(--color-foreground)" },
          { key: "scans", label: "Scans", color: "var(--color-brand)" },
        ]}
      />
      <DistributionChartLazy
        data={[
          { label: "Free", value: 3_000 },
          { label: "Event Pass", value: 12 },
          { label: "Pro", value: 1, color: "var(--color-brand)" },
        ]}
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
 * THE WEDDING'S READINESS, as the hub would read it: one photo in (the reel one short), its date and its
 * note written, and the code never opened, so the steps show ticks and steps still open side by side.
 */
const WEDDING_READY: ReadyFacts = {
  door: "open",
  hasPassword: false,
  guestsIn: 31,
  invited: 24,
  acceptingUploads: true,
  approved: 1,
  playable: 1,
  showReel: true,
  liveReelEnabled: true,
  eventDate: "2026-10-10",
  description: "Add everything from the ceremony too.",
  opened: 0,
  storagePct: 12,
};

/**
 * Settings at rest and one level in, drawn inline (never in the popup, which would cover the page):
 * the steps, and whichever page a step opens, with the back row up and Next at its foot. The fifth
 * step's door is the hub's code card; here, with no hub behind it, it comes back to the steps.
 */
export function SettingsDemo({ tier = "pro" }: { tier?: "free" | "pro" }) {
  const [page, setPage] = useState<SettingsPage | null>(null);
  const backToSteps = () => setPage(null);
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
          <SettingsRows
            onOpenPage={setPage}
            ready={WEDDING_READY}
            onOpenCode={backToSteps}
          />
        )}
        {page ? (
          <SettingsNext page={page} onNext={setPage} onOpenCode={backToSteps} />
        ) : null}
      </div>
    </SettingsProvider>
  );
}

/* ── THE CHECKLIST AT THE HUB'S HEAD (event-ready r1), Maya's 30th at two moments ─────────────────── */

/** Maya's 30th an hour after Create: named and styled, nothing else touched. */
const FRESH_30TH: ReadyFacts = {
  door: "open",
  hasPassword: false,
  guestsIn: 0,
  invited: 0,
  acceptingUploads: true,
  approved: 0,
  playable: 0,
  showReel: true,
  liveReelEnabled: true,
  eventDate: null,
  description: null,
  opened: 0,
  storagePct: 4,
};

const CHECKLIST_MOMENTS = {
  /** The whole list: the album is still empty. */
  fresh: FRESH_30TH,
  /** Three photos in and the date set, the code never opened: folded to one line over the album. */
  seeded: {
    ...FRESH_30TH,
    approved: 3,
    playable: 3,
    eventDate: "2026-10-10",
  },
  /** Ready for guests, the welcome's note still worth writing, and the account's shelf running short. */
  short: {
    ...FRESH_30TH,
    eventDate: "2026-10-10",
    opened: 6,
    storagePct: 91,
  },
} satisfies Record<string, ReadyFacts>;

/**
 * The checklist as the hub draws it under the cards, on production's own providers (the code card's
 * Invite, the album's uploader, Settings' pages) with no hub behind them: its doors answer and open
 * nothing here. Show unfolds the folded line, and Fold folds it back.
 */
export function ChecklistDemo({
  moment,
}: {
  moment: keyof typeof CHECKLIST_MOMENTS;
}) {
  return (
    <EventShareProvider initialSheet={null}>
      <HostAddProvider>
        <EventChecklist
          eventId="demo"
          facts={CHECKLIST_MOMENTS[moment]}
          over={false}
          plan={{ tier: "free", hasBilling: false }}
        />
      </HostAddProvider>
    </EventShareProvider>
  );
}

/** The code's five doors, as the hub's header wears them. */
const CODE_DOORS: readonly {
  id: string;
  title: string;
  door: Door;
  acceptingUploads: boolean;
  waiting: number;
}[] = [
  {
    id: "public",
    title: "Public",
    door: "open",
    acceptingUploads: true,
    waiting: 0,
  },
  {
    id: "approve",
    title: "You let each in, 2 waiting",
    door: "approve",
    acceptingUploads: true,
    waiting: 2,
  },
  {
    id: "password",
    title: "A password",
    door: "password",
    acceptingUploads: true,
    waiting: 0,
  },
  {
    id: "only-me",
    title: "Only me",
    door: "private",
    acceptingUploads: true,
    waiting: 0,
  },
  {
    id: "paused",
    title: "Uploads paused",
    door: "open",
    acceptingUploads: false,
    waiting: 0,
  },
];

/**
 * The hub's code in each of five doors, its corner mark's tooltip on hover or focus and a tap. Pressing a
 * code would open the hub's code card, which is not mounted here.
 */
export function CodeDoorDemo() {
  return (
    <EventShareProvider initialSheet={null}>
      <div className="flex flex-wrap gap-x-8 gap-y-6">
        {CODE_DOORS.map((d) => (
          <figure key={d.id} data-code-door-demo={d.id} className="space-y-3">
            <EventCodeDoor
              eventName="Maya's 30th"
              joinUrl="https://partyreel.com/e/3f0c1d2e4a5b6c7d8e9f0a1b2c3d4e5f"
              qrStyle="classic"
              door={d.door}
              acceptingUploads={d.acceptingUploads}
              waiting={d.waiting}
            />
            <figcaption className="text-xs text-muted-foreground">
              {d.title}
            </figcaption>
          </figure>
        ))}
      </div>
    </EventShareProvider>
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

/* ── THE GUESTS ROOM'S DOOR (event-settings r1), on the same wedding, its acts inert ──────────── */

const DOOR_ACTS: DoorActs = {
  letIn: async () => settle({ ok: true as const, admitted: 1 }),
  decline: async () => settle({ ok: true as const, blockId: "demo-block" }),
  letBackIn: async () => settle({ ok: true as const, restored: 0, noRoom: 0 }),
};

const INVITE_ACTS: InviteActs = {
  add: async (input) => {
    const emails = (input as { emails?: string[] }).emails ?? [];
    return settle({
      ok: true as const,
      result: {
        added: emails.length,
        already: 0,
        invalid: 0,
        overCap: 0,
        total: INVITED.length + emails.length,
        admitted: 0,
      },
    });
  },
  remove: async () => settle({ ok: true as const }),
};

const WAITING: DoorPerson[] = [
  {
    guestId: "demo-door-1",
    userId: "demo-user-1",
    name: "Priya Shah",
    email: "priya@example.com",
    asked: "5 minutes ago",
    seed: "priya",
  },
  {
    guestId: "demo-door-2",
    userId: "demo-user-2",
    name: null,
    email: "tom.okafor@example.com",
    asked: "just now",
    seed: "tom",
  },
  {
    guestId: "demo-door-3",
    userId: "demo-user-3",
    name: "Ines Moreau",
    email: "ines@example.com",
    asked: "yesterday",
    seed: "ines",
  },
];

const INVITED: InvitedPerson[] = [
  { email: "aunt.rosa@example.com", joined: true },
  { email: "sam.lee@example.com", joined: true },
  { email: "jules@example.com", joined: false },
  { email: "the.chens@example.com", joined: false },
];

/** At the door, three waiting: Let in and Decline answer after a round trip and change nothing. */
export function AtTheDoorDemo() {
  return (
    <div className="max-w-2xl">
      <AtTheDoor
        eventId="demo-event"
        people={WAITING}
        total={WAITING.length}
        acts={DOOR_ACTS}
      />
    </div>
  );
}

/** Invited, the invite list being the door: type or paste addresses; the saves answer and change nothing. */
export function InvitedDemo() {
  return (
    <div className="max-w-2xl">
      <InvitedSection
        eventId="demo-event"
        invited={INVITED}
        listIsTheDoor
        acts={INVITE_ACTS}
      />
    </div>
  );
}

/* ── THE EVENT'S HEAD (`event-header` r1: `guest=cover`, `host=shared`, `stays=shutter`) ──────── */

/** The cover's photographs, the bootstrap stills a party's reel would open on (bible 9: no new asset). */
const COVER_STILLS: HeadStill[] = [
  "wedding-toast",
  "reception-hall",
  "wedding-golden",
  "wedding-arch",
].map((id) => ({ id, tile: marketingImage(id).src }));

/**
 * THE ALBUM'S COVER, as a guest walks into it: the real composition (`AlbumCover`) on the bootstrap
 * stills, its actions the real atoms (Add photos on the photograph, the reel's and Invite's glass
 * rounds). Nothing is wired: a press goes nowhere. `empty` is the first guest of the night: the house
 * light, nothing to dissolve through, and Add the first photo.
 */
export function AlbumCoverDemo({ empty = false }: { empty?: boolean }) {
  return (
    <div className="overflow-hidden rounded-xl border">
      <AlbumCover
        ground={empty ? null : <HeadStills stills={COVER_STILLS} />}
        name="Maya & Jay"
        host={{ name: "Maya", avatarUrl: null, seed: "library-maya" }}
        date="2026-09-12"
        description="Everything from the day, in one place. Add whatever you took, whenever you get to it."
        mediaCount={empty ? 0 : 214}
        guestCount={empty ? 0 : 31}
        actions={
          <>
            <Button
              variant="on-photo"
              size="cta"
              className="min-w-0 flex-1 md:flex-none"
            >
              <ImageUp /> {empty ? "Add the first photo" : "Add photos"}
            </Button>
            {!empty && (
              <Button
                variant="glass"
                size="icon-cta"
                aria-label="Watch the highlight reel"
              >
                <Play className="fill-current" />
              </Button>
            )}
            <Button variant="glass" size="icon-cta" aria-label="Invite">
              <QrCode />
            </Button>
          </>
        }
      />
    </div>
  );
}

/**
 * MAYA'S HEAD: the real composition (`HubCover`) on the same stills, under the share provider its code
 * reads (a press opens nothing here), with her numbers on it and the code on its white mat. `before` is
 * the week before: nothing in the album, the house light.
 */
export function HubCoverDemo({ before = false }: { before?: boolean }) {
  return (
    <EventShareProvider initialSheet={null}>
      <div className="overflow-hidden rounded-xl border px-3 sm:px-5">
        <HubCover
          name="Maya & Jay"
          date="2026-09-12"
          counts={
            before
              ? { album: 0, guests: 0, views: 0 }
              : { album: 214, guests: 31, views: 486 }
          }
          prettyUrl="https://partyreel.com/e/maya-and-jay"
          eventLink="https://partyreel.com/e/3f0c1d2e4a5b6c7d8e9f0a1b2c3d4e5f"
          code={{
            qrStyle: "classic",
            door: before ? "open" : "approve",
            acceptingUploads: true,
            waiting: before ? 0 : 2,
          }}
          stills={before ? [] : COVER_STILLS}
          toBar={false}
        />
      </div>
    </EventShareProvider>
  );
}

/**
 * WHAT STAYS once the cover has scrolled away: the real cluster (`GuestActionDock`), held inside its
 * frame (a transform makes the frame the cluster's containing block, so its `fixed` foot stands at the
 * frame's foot rather than the page's), over the album's photographs. Press the shutter for a run of the
 * Library's own.
 */
export function WhatStaysDemo() {
  return (
    <div className="relative h-80 [transform:translateZ(0)] overflow-hidden rounded-xl border">
      <div className="grid grid-cols-3 gap-1 p-1">
        {[...COVER_STILLS, ...COVER_STILLS, ...COVER_STILLS].map((still, i) => (
          <span
            key={i}
            className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-tile)]"
          >
            <Image
              src={still.tile}
              alt=""
              fill
              sizes="200px"
              className="object-cover"
            />
          </span>
        ))}
      </div>
      <WhatStaysCluster />
    </div>
  );
}

function WhatStaysCluster() {
  const [sending, setSending] = useState(0);
  const press = () => {
    setSending(3);
    window.setTimeout(() => setSending(2), 900);
    window.setTimeout(() => setSending(1), 1800);
    window.setTimeout(() => setSending(0), 2700);
  };
  return (
    <GuestActionDock
      hidden={false}
      uploadingCount={sending}
      onAdd={press}
      more
      invite={
        <Button
          variant="outline"
          size="icon-cta"
          aria-label="Invite"
          className="bg-background shadow-layer"
        >
          <QrCode />
        </Button>
      }
      twin={
        <Button
          variant="outline"
          size="icon-cta"
          aria-label="Watch the highlight reel"
          className="bg-background shadow-layer"
        >
          <Play className="fill-current" />
        </Button>
      }
    />
  );
}

const HUB_CARDS: RoomCard[] = [
  { id: "review", ...reviewCardFace(true, 8) },
  { id: "guests", value: "2 waiting", amber: true, count: 2 },
  { id: "settings", value: "Private · You let in" },
];

const HUB_REEL: ReelCardData = {
  state: "live",
  have: 2,
  of: 2,
  stills: COVER_STILLS.map((s) => s.tile),
  stillIds: COVER_STILLS.map((s) => s.id),
  viewHref: "#",
  moderated: true,
  pending: 8,
};

/**
 * THE HEAD, THEN THE BAND: Maya's head and the real room cards under it, then a stretch of album to
 * scroll. Scroll the Library past the head and the band sticks under the bar as it does on the hub,
 * leading with the head's face and the name and closing on the code as a chip (`EventCardsRow`).
 */
export function HubBandDemo() {
  return (
    <EventShareProvider initialSheet={null}>
      <HostAddProvider>
        <div className="px-3 sm:px-5">
          <HubCover
            name="Maya & Jay"
            date="2026-09-12"
            counts={{ album: 214, guests: 31, views: 486 }}
            prettyUrl="https://partyreel.com/e/maya-and-jay"
            eventLink="https://partyreel.com/e/3f0c1d2e4a5b6c7d8e9f0a1b2c3d4e5f"
            code={{
              qrStyle: "classic",
              door: "approve",
              acceptingUploads: true,
              waiting: 2,
            }}
            stills={COVER_STILLS}
            toBar={false}
          />
          <div className="mt-6 space-y-6">
            <EventCardsRow
              eventId="library-hub"
              cards={HUB_CARDS}
              reel={HUB_REEL}
              moderationOn
              head={{ name: "Maya & Jay", stills: COVER_STILLS }}
            />
            <div
              data-hub-band-album=""
              className="grid grid-cols-3 gap-1 sm:grid-cols-5"
            >
              {Array.from(
                { length: 30 },
                (_, i) => COVER_STILLS[i % COVER_STILLS.length]!,
              ).map((still, i) => (
                <span
                  key={i}
                  className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-tile)]"
                >
                  <Image
                    src={still.tile}
                    alt=""
                    fill
                    sizes="240px"
                    className="object-cover"
                  />
                </span>
              ))}
            </div>
          </div>
        </div>
      </HostAddProvider>
    </EventShareProvider>
  );
}
