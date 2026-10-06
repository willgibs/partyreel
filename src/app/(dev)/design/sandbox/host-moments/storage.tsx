"use client";

import { Check, TriangleAlert } from "lucide-react";

import { GraceBanner } from "@/components/app/dashboard/grace-banner";
import { StorageMeter } from "@/components/app/dashboard/storage-meter";
import { StorageList } from "@/components/app/storage/storage-list";
import {
  type StorageSource,
  StorageSourceProvider,
} from "@/components/app/storage/storage-source";
import { Button } from "@/components/ui/button";
import { GIGABYTE } from "@/lib/constants/tiers";
import type { StorageItem } from "@/lib/db/queries/storage-list";
import { formatBytesUp } from "@/lib/billing/storage-guard";
import { cn } from "@/lib/utils";

import { Dashboard } from "./chrome";
import { EVENT, LARGEST, NIGHT, OVER_BYTES, STORAGE } from "./fixtures";
import { Graft, Mark, Press } from "./scene";

/**
 * L3, OVER HER PLAN WITH A GOAL: the month after, Maya stores 105.3 GB on
 * Pro 100 GB (1.8 GB of it in Deleted), and the grace runs to November 5.
 * Her dashboard is production's head with the real `StorageMeter`; today's
 * banner is the real `GraceBanner`; the list every door opens is the real
 * `StorageList` (its body, its goal strip, its rows and its bulk bar) over an
 * inert source holding her largest items, the Library's own way of mounting
 * it. A frame presses rows to draw the list mid-choice.
 *
 * A candidate banner composes production's atoms in the banner's place; a
 * candidate goal hides production's strip (`[data-storage-goal]`) and draws
 * its own in its place, counting from the rows the frame pressed.
 */

export type BannerWay = "today" | "number" | "sweep";
export type GoalWay = "today" | "line" | "sweep";

const MB = 1024 ** 2;

const ITEMS: StorageItem[] = LARGEST.map((it, i) => ({
  id: it.id,
  eventId: it.album === EVENT.name ? EVENT.id : "hm-jays-40th",
  type: it.kind,
  bytes: Math.round(it.bytes),
  durationSeconds: it.length
    ? Number(it.length.split(":")[0]) * 60 + Number(it.length.split(":")[1])
    : null,
  createdAt: `2026-09-1${i % 9}T21:${String(10 + i * 4).padStart(2, "0")}:00.000000+00:00`,
  url: NIGHT[(i + 3) % NIGHT.length]!.src,
  previewUrl: NIGHT[(i + 3) % NIGHT.length]!.src,
  by: {
    name: it.by === "You" ? null : it.by,
    isHost: it.by === "You",
    isVerified: true,
  },
}));

/** A filler of photos under the largest, so the list scrolls as a real one does. */
const FILLER: StorageItem[] = Array.from({ length: 24 }, (_, i) => ({
  id: `hm-photo-${i}`,
  eventId: EVENT.id,
  type: "photo",
  bytes: (30 - i) * MB,
  durationSeconds: null,
  createdAt: `2026-09-12T22:${String(i + 10).padStart(2, "0")}:00.000000+00:00`,
  url: NIGHT[i % NIGHT.length]!.src,
  previewUrl: null,
  by: { name: "Priya", isHost: false, isVerified: true },
}));

const POOL = [...ITEMS, ...FILLER];
const ALBUMS_BYTES = STORAGE.storedBytes - STORAGE.deletedBytes;

const later = <T,>(value: T) =>
  new Promise<T>((resolve) => setTimeout(() => resolve(value), 240));

const INERT_STORAGE: StorageSource = {
  read: (ask) => {
    const { eventId = null, withOverview = false } = (ask ?? {}) as {
      eventId?: string | null;
      withOverview?: boolean;
    };
    const items = POOL.filter((i) => eventId === null || i.eventId === eventId);
    return later({
      ok: true as const,
      items,
      next: null,
      overview: withOverview
        ? {
            storedBytes: STORAGE.storedBytes,
            deletedBytes: STORAGE.deletedBytes,
            events: [
              {
                id: EVENT.id,
                name: EVENT.name,
                bytes: Math.round(71.2 * GIGABYTE),
                count: 1284,
              },
              {
                id: "hm-jays-40th",
                name: "Jay's 40th",
                bytes: Math.round(22.9 * GIGABYTE),
                count: 412,
              },
              {
                id: "hm-picnic",
                name: "Summer picnic",
                bytes: Math.round(6.1 * GIGABYTE),
                count: 188,
              },
              {
                id: "hm-book",
                name: "Book club",
                bytes: Math.round(3.3 * GIGABYTE),
                count: 96,
              },
            ],
          }
        : null,
    });
  },
  deleteForGood: (items) =>
    later({
      ok: true as const,
      deleted: Array.isArray(items) ? items.length : 0,
    }),
  emptyDeleted: () =>
    later({
      ok: true as const,
      items: 9,
      events: 0,
      freedBytes: STORAGE.deletedBytes,
      more: false,
    }),
  setMakeRoom: (on) => later({ ok: true as const, on: on === true }),
  switchPlan: () =>
    later({
      kind: "error" as const,
      code: "already_on_plan",
      message: "The lab stops here.",
    }),
};

const GOAL = { kind: "fit" as const, capBytes: STORAGE.capBytes };

function Meter() {
  return (
    <StorageMeter
      activeBytes={ALBUMS_BYTES}
      deletedBytes={STORAGE.deletedBytes}
      storageCap={STORAGE.capBytes}
      makeRoom
      passExpiry={null}
      planName="Pro"
      hasBilling
      isEventPass={false}
      tier="pro"
    />
  );
}

/** The sweep's own order at the deadline: Deleted first, then her largest files, until she fits. */
const SWEEP_VIDEOS = (() => {
  let need = OVER_BYTES - STORAGE.deletedBytes;
  const taken: (typeof LARGEST)[number][] = [];
  for (const it of LARGEST) {
    if (need <= 0) break;
    taken.push(it);
    need -= it.bytes;
  }
  return taken;
})();
const SWEEP_BYTES = SWEEP_VIDEOS.reduce((s, it) => s + it.bytes, 0);

/* ── the banner ────────────────────────────────────────────────────────── */

/** The banner's own place and tone (`grace-banner.tsx`'s), around a candidate's words and keys. */
function BannerShell({
  title,
  line,
  keys,
}: {
  title: string;
  line: string;
  keys: React.ReactNode;
}) {
  return (
    <div
      data-hm-read="the banner"
      className="flex flex-col gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm sm:flex-row sm:items-center"
    >
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 font-medium text-foreground">
          <TriangleAlert
            className="size-4 shrink-0 text-destructive"
            aria-hidden
          />
          {title}
        </p>
        <p className="mt-1 text-pretty text-muted-foreground">{line}</p>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">{keys}</div>
    </div>
  );
}

function Banner({ way }: { way: BannerWay }) {
  if (way === "today")
    return (
      <>
        <GraceBanner
          deadline={STORAGE.deadline}
          storageUsed={STORAGE.storedBytes}
          storageCap={STORAGE.capBytes}
          plan={{ tier: "pro", hasBilling: true }}
        />
        <Mark at="[data-grace-banner]" as="the banner" />
      </>
    );
  const open = (
    <StorageList back="Dashboard" goal={GOAL}>
      <Button size="sm">
        {way === "number"
          ? `Free ${formatBytesUp(OVER_BYTES)}`
          : "Choose instead"}
      </Button>
    </StorageList>
  );
  const plans = (
    <Button size="sm" variant="outline">
      See plans
    </Button>
  );
  if (way === "number")
    return (
      <BannerShell
        title={`${formatBytesUp(OVER_BYTES)} over ${STORAGE.plan}`}
        line={`Free it by ${STORAGE.deadline}, or choose a bigger plan. After that we'll make room for you: Deleted first, then your largest files.`}
        keys={
          <>
            {open}
            {plans}
          </>
        }
      />
    );
  return (
    <BannerShell
      title={`On ${STORAGE.deadline} we'll make room for you`}
      line={`We'll delete what's in Deleted (${formatBytesUp(STORAGE.deletedBytes)}), then your ${SWEEP_VIDEOS.length} largest videos (${formatBytesUp(SWEEP_BYTES)}), unless you choose what goes or a bigger plan first.`}
      keys={
        <>
          {open}
          {plans}
        </>
      }
    />
  );
}

export function BannerDashboard({ way }: { way: BannerWay }) {
  return (
    <StorageSourceProvider source={INERT_STORAGE}>
      <Dashboard storage={<Meter />} alert={<Banner way={way} />} />
    </StorageSourceProvider>
  );
}

/** Where every banner's door leads: the list, open on her plan's cap; the sweep's pick pressed where the banner offers it. */
export function BannerList({ way }: { way: BannerWay }) {
  return (
    <StorageSourceProvider source={INERT_STORAGE}>
      <Dashboard
        storage={<Meter />}
        over={
          <StorageList
            back="Dashboard"
            goal={GOAL}
            open
            onOpenChange={() => {}}
          />
        }
      />
      {way === "sweep"
        ? SWEEP_VIDEOS.map((v) => (
            <Press
              key={v.id}
              at={`[data-storage-row="${v.id}"] [role="checkbox"]`}
              until={`[data-storage-row="${v.id}"] [aria-checked="true"]`}
            />
          ))
        : null}
      <Mark at="[data-storage-goal]" as="the goal" />
    </StorageSourceProvider>
  );
}

/* ── the goal ──────────────────────────────────────────────────────────── */

/** The rows each goal frame presses: two videos, then enough to fit. */
export const PICKED = {
  some: LARGEST.slice(0, 2),
  enough: LARGEST.slice(0, 6),
} as const;

const HIDE_STRIP = "[data-storage-goal] { display: none !important; }";

/** Her plan's line drawn on what she stores: the over-run past it, and the part her selection takes back. */
function LineStrip({ picked }: { picked: number }) {
  const total = STORAGE.storedBytes;
  const after = total - picked;
  const fits = after <= STORAGE.capBytes;
  const pct = (b: number) => `${(b / total) * 100}%`;
  return (
    <div data-hm-read="the goal" className="border-b px-4 py-3">
      <p className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
        <span className="font-medium tabular-nums">
          {fits ? (
            <span className="inline-flex items-center gap-1.5">
              <Check className="size-4 text-success" aria-hidden />
              {`Fits ${STORAGE.plan} once these go`}
            </span>
          ) : (
            `${formatBytesUp(after - STORAGE.capBytes)} over your plan`
          )}
        </span>
        <span className="text-xs text-muted-foreground tabular-nums">
          {`${formatBytesUp(after)} of ${formatBytesUp(STORAGE.capBytes)}`}
        </span>
      </p>
      <span
        aria-hidden
        className="relative mt-2 block h-2 rounded-full bg-muted"
      >
        <span
          className="absolute inset-y-0 left-0 rounded-l-full bg-foreground/70"
          style={{ width: pct(Math.min(after, STORAGE.capBytes)) }}
        />
        {after > STORAGE.capBytes ? (
          <span
            className="absolute inset-y-0 bg-destructive"
            style={{
              left: pct(STORAGE.capBytes),
              width: pct(after - STORAGE.capBytes),
            }}
          />
        ) : null}
        <span
          className={cn(
            "absolute inset-y-0 rounded-r-full",
            "bg-[repeating-linear-gradient(135deg,var(--color-muted-foreground)_0_2px,transparent_2px_5px)] opacity-50",
          )}
          style={{ left: pct(after), width: pct(picked) }}
        />
        <span
          className="absolute -inset-y-1 w-0.5 rounded-full bg-foreground"
          style={{ left: pct(STORAGE.capBytes) }}
        />
      </span>
      <p className="mt-1.5 text-right text-micro text-muted-foreground">
        {`Your plan: ${STORAGE.plan}`}
      </p>
    </div>
  );
}

/** The gap said as what the deadline would otherwise take, shrinking as she chooses. */
function SweepStrip({
  picked,
  ids,
}: {
  picked: number;
  ids: readonly string[];
}) {
  const left = Math.max(0, OVER_BYTES - picked);
  const done = left === 0;
  let need = left - STORAGE.deletedBytes;
  let videos = 0;
  for (const it of LARGEST.filter((l) => !ids.includes(l.id))) {
    if (need <= 0) break;
    videos += 1;
    need -= it.bytes;
  }
  return (
    <div data-hm-read="the goal" className="border-b px-4 py-3">
      <p className="text-sm font-medium text-pretty">
        {done ? (
          <span className="inline-flex items-center gap-1.5">
            <Check className="size-4 text-success" aria-hidden />
            Enough chosen: nothing of yours goes on {STORAGE.deadline}
          </span>
        ) : (
          <>
            <span className="tabular-nums">{formatBytesUp(left)}</span> to go.
            Otherwise on {STORAGE.deadline}: Deleted
            {videos > 0 ? `, then ${videos} of your largest videos` : ""}.
          </>
        )}
      </p>
      <span aria-hidden className="mt-2 flex gap-1">
        {Array.from({ length: 6 }, (_, i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full",
              i < Math.round((1 - left / OVER_BYTES) * 6)
                ? done
                  ? "bg-success"
                  : "bg-foreground/70"
                : "bg-muted",
            )}
          />
        ))}
      </span>
    </div>
  );
}

export function GoalList({
  way,
  stage,
}: {
  way: GoalWay;
  stage: keyof typeof PICKED;
}) {
  const picked = PICKED[stage].reduce((s, it) => s + it.bytes, 0);
  return (
    <StorageSourceProvider source={INERT_STORAGE}>
      <Dashboard
        storage={<Meter />}
        over={
          <StorageList
            back="Dashboard"
            goal={GOAL}
            open
            onOpenChange={() => {}}
          />
        }
      />
      {PICKED[stage].map((v) => (
        <Press
          key={v.id}
          at={`[data-storage-row="${v.id}"] [role="checkbox"]`}
          until={`[data-storage-row="${v.id}"] [aria-checked="true"]`}
        />
      ))}
      {way === "today" ? (
        <Mark at="[data-storage-goal]" as="the goal" />
      ) : (
        <>
          <style>{HIDE_STRIP}</style>
          <Graft at="[data-storage-goal]" place="before">
            {way === "line" ? (
              <LineStrip picked={picked} />
            ) : (
              <SweepStrip
                picked={picked}
                ids={PICKED[stage].map((v) => v.id)}
              />
            )}
          </Graft>
        </>
      )}
    </StorageSourceProvider>
  );
}
