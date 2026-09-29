"use client";

import { useState } from "react";
import { Undo2 } from "lucide-react";

import { AdminRail } from "@/components/admin/admin-rail";
import {
  ReportQueue,
  type ReportQueueWrites,
} from "@/components/admin/report-queue";
// A type only (erased at build), so the server-only query module never reaches this page.
import type { ReviewEntry } from "@/lib/db/queries/reports";
import { HealthBand } from "@/components/admin/health-band";
import { QueueList } from "@/components/admin/queue-list";
import { ClosedLine, ClosedLog } from "@/components/app/report-review";
import { FilterChips } from "@/components/app/dashboard/filter-chips";
import { StorageMeter } from "@/components/app/dashboard/storage-meter";
import { MediaTile } from "@/components/app/media-grid";
import { ReviewRoom } from "@/components/app/event-feed/review-room";
import type { ReviewWrites } from "@/components/app/event-feed/use-review-triage";
import { ProPriceList } from "@/components/app/pricing/pro-price-list";
import { QrPresetPicker } from "@/components/app/qr-preset-picker";
import { largestFirst } from "@/components/app/storage/storage-list-rules";
import {
  StorageSourceProvider,
  type StorageSource,
} from "@/components/app/storage/storage-source";
import { Button } from "@/components/ui/button";
import type { PlanFacts } from "@/lib/billing/plan-facts";
import { type HoldScope, WAY_BACK_LINE } from "@/lib/admin/reports";
import type { QrStyleKey } from "@/lib/constants/qr-presets";
import { GIGABYTE, planById } from "@/lib/constants/tiers";
import { marketingImage } from "@/lib/constants/marketing-media";
import type { StorageItem } from "@/lib/db/queries/storage-list";
import { buildOperatorQueue } from "@/lib/admin/queue";
import type { FilterValue } from "@/lib/dashboard/filters";
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
  hidAt: null,
  proof: null,
  ...over,
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
      </ClosedLog>
    </div>
  );
}
