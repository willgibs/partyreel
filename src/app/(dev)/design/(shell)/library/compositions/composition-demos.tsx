"use client";

import { useState } from "react";

import { AdminRail } from "@/components/admin/admin-rail";
import { HealthBand } from "@/components/admin/health-band";
import { QueueList } from "@/components/admin/queue-list";
import { FilterChips } from "@/components/app/dashboard/filter-chips";
import { ReviewSection } from "@/components/app/event-feed/review-section";
import { useReviewTriage } from "@/components/app/event-feed/use-review-triage";
import { QrPresetPicker } from "@/components/app/qr-preset-picker";
import type { QrStyleKey } from "@/lib/constants/qr-presets";
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

// The inline review section (the event feed's triage surface that replaced the pop-up takeover):
// a hydration probe for the review island + its select mode. The bulk approve/hide need auth, so
// they no-op (revert + toast) here; the value is the rendered grid + the select-mode choreography.
export function ReviewSectionDemo() {
  const triage = useReviewTriage({
    eventId: "demo",
    items: SAMPLE_PENDING,
    moderationOn: true,
  });
  return (
    <ReviewSection
      triage={triage}
      onEnableModeration={() => {}}
      enabling={false}
    />
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
