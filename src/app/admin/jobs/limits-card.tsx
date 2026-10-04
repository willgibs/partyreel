import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { BadgeTone } from "@/lib/admin/tone";
import { formatAdminTimestamp } from "@/lib/format/admin-time";
import {
  CRITICAL_DAYS,
  CRITICAL_SHARE,
  LEVEL_RANK,
  LEVEL_WORD,
  LIMITS_STALE_MS,
  WARN_DAYS,
  WARN_SHARE,
  daysLeftWords,
  formatMeasure,
  rateWords,
  usedWords,
  type Level,
  type StoredLimits,
  type StoredMeter,
} from "@/lib/jobs/limits-watch";
import {
  METERS,
  NOT_WATCHED,
  VENDORS,
  VENDOR_ORDER,
  VERCEL_CPU_CALIBRATED,
  type MeterDef,
} from "@/lib/jobs/limits-watch-limits";
import { cn } from "@/lib/utils";

import { AttentionLine } from "./attention-line";

/**
 * THE PLAN LIMITS' CARD, BESIDE THE SPEND WATCH'S (admin-observability.md, "Plan limits"): every vendor's meter against
 * its plan's limit, each with its bar and its words, as the spend watch's last run took them. Presentation only: the
 * page reads the run (`readLatestLimits`) and hands it here, so a specimen or a test renders it from plain data.
 *
 * ★ NO METER IS DRAWN AS A NUMBER IT IS NOT: one that could not be read says "No reading" and why and has no bar (a
 * failed read in the failure tone, since it is why the run failed; a gap, a credential not provisioned or a vendor
 * that reports none, in words and no tone), a floor says "at least", a computed meter says "estimated", and an
 * unreadable run or a stale one says so in words rather than drawing a calm card.
 */

export type LatestLimits = {
  limits: StoredLimits;
  startedAt: string;
  status: string;
};

/** One map for a level's chip and its bar, so the two cannot disagree. */
const LEVEL_BADGE: Record<Level, BadgeTone> = {
  ok: "success",
  warn: "warning",
  critical: "destructive",
};

function worstLevel(limits: StoredLimits): Level {
  let worst: Level = "ok";
  for (const m of Object.values(limits.meters)) {
    if (m.state === "read" && LEVEL_RANK[m.level] > LEVEL_RANK[worst]) {
      worst = m.level;
    }
  }
  return worst;
}

/**
 * The card's headline chip: the worst level; else that a meter's read failed; else that some meters that COULD be read
 * have no reading yet (a card of mostly gaps is never a green OK); else OK. A meter the vendor's API cannot answer
 * (`unavailable`) is a standing limit of the watch, said on its row and counted in the header, and never keeps the
 * chip from ever reading OK.
 */
function Headline({ limits }: { limits: StoredLimits | null }) {
  if (!limits) return <Badge variant="outline">Not read yet</Badge>;
  const worst = worstLevel(limits);
  if (worst !== "ok") {
    return <Badge variant={LEVEL_BADGE[worst]}>{LEVEL_WORD[worst]}</Badge>;
  }
  const meters = METERS.map((m) => limits.meters[m.id]);
  if (meters.some((m) => m?.state === "none" && m.cause === "failed")) {
    return <Badge variant="destructive">No reading</Badge>;
  }
  const blind = meters.some(
    (m) => m === undefined || (m.state === "none" && m.cause === "needs"),
  );
  return blind ? (
    <Badge variant="outline">Partly read</Badge>
  ) : (
    <Badge variant="success">{LEVEL_WORD.ok}</Badge>
  );
}

/** A meter's bar: the share of its limit, in its level's light (the brand's frames, green, amber or red). */
function ShareBar({
  def,
  share,
  level,
}: {
  def: MeterDef;
  share: number;
  level: Level;
}) {
  return (
    <Progress
      value={Math.min(Math.max(share, 0), 1) * 100}
      // The brand's meter keeps its value to itself (no `aria-valuenow` reaches the bar), so the reading says it.
      aria-valuenow={Math.round(Math.min(Math.max(share, 0), 1) * 100)}
      aria-label={`${def.label}: ${Math.round(share * 100)}% of the plan's limit`}
      aria-invalid={level === "critical" ? true : undefined}
      className={cn(
        level === "warn" && "[&_[data-slot=progress-indicator]]:bg-warning",
      )}
    />
  );
}

function MeterRow({
  def,
  meter,
}: {
  def: MeterDef;
  meter: StoredMeter | undefined;
}) {
  const label = (
    <>
      <span className="font-medium">{def.label}</span>
      {def.estimated ? (
        <span className="ml-2 text-caption text-muted-foreground">
          estimated
        </span>
      ) : null}
    </>
  );
  if (!meter) {
    return (
      <li id={`limit-${def.id}`} className="space-y-1 px-3 py-2.5">
        <p className="text-sm">{label}</p>
        <p className="text-caption text-muted-foreground">Not in this run</p>
      </li>
    );
  }
  if (meter.state === "none") {
    return (
      <li
        id={`limit-${def.id}`}
        data-state="none"
        className="space-y-1 px-3 py-2.5"
      >
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <p className="text-sm">{label}</p>
          <Badge variant={meter.cause === "failed" ? "destructive" : "outline"}>
            No reading
          </Badge>
        </div>
        <p
          className={cn(
            "text-caption break-words",
            meter.cause === "failed"
              ? "text-destructive"
              : "text-muted-foreground",
          )}
        >
          {meter.why}
        </p>
        <p className="text-caption text-muted-foreground">
          Plan limit: {formatMeasure(def.measure, def.limit)} {def.per}
        </p>
      </li>
    );
  }
  const left = daysLeftWords(def, meter);
  return (
    <li
      id={`limit-${def.id}`}
      data-state="read"
      data-level={meter.level}
      className="space-y-1.5 px-3 py-2.5"
    >
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <p className="text-sm">{label}</p>
        <Badge variant={LEVEL_BADGE[meter.level]}>
          {LEVEL_WORD[meter.level]}
        </Badge>
      </div>
      <ShareBar def={def} share={meter.share} level={meter.level} />
      <p className="text-sm tabular-nums">{usedWords(def, meter)}</p>
      <p className="text-caption text-muted-foreground">
        {rateWords(def, meter)}
        {left ? ` · ${left}` : null}
      </p>
      {meter.level !== "ok" ? <AttentionLine>{def.past}</AttentionLine> : null}
      <p className="text-caption text-muted-foreground">{def.source}</p>
    </li>
  );
}

function VendorSection({
  vendor,
  limits,
}: {
  vendor: (typeof VENDOR_ORDER)[number];
  limits: StoredLimits;
}) {
  const info = VENDORS[vendor];
  const defs = METERS.filter((m) => m.vendor === vendor);
  if (defs.length === 0) return null;
  return (
    <section aria-labelledby={`limits-${vendor}`} className="space-y-2">
      <h3 id={`limits-${vendor}`} className="text-sm font-medium">
        {info.label}{" "}
        <span className="font-normal text-muted-foreground">
          {info.plan} plan
        </span>
      </h3>
      <ul className="divide-y divide-border rounded-md border border-border">
        {defs.map((def) => (
          <MeterRow key={def.id} def={def} meter={limits.meters[def.id]} />
        ))}
      </ul>
    </section>
  );
}

/**
 * The plan limits of the spend watch's last run that carried them, or what stands in their place. `nowMs` is read once
 * by the page, outside the render, so staleness is judged against one instant.
 */
export function PlanLimitsCard({
  latest,
  unreadable,
  nowMs,
}: {
  latest: LatestLimits | null;
  unreadable: string | null;
  nowMs: number;
}) {
  const limits = latest?.limits ?? null;
  const stale = limits !== null && nowMs - limits.atMs > LIMITS_STALE_MS;
  // A card of mostly gaps must not read calm: the header counts the meters that have no reading.
  const unread = limits
    ? METERS.filter((m) => limits.meters[m.id]?.state !== "read").length
    : 0;
  return (
    <Card id="plan-limits" className="scroll-mt-20">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2">
            Plan limits
            <Headline limits={unreadable ? null : limits} />
          </CardTitle>
          {limits ? (
            <p className="text-caption text-muted-foreground">
              Taken {formatAdminTimestamp(limits.atMs)}
              {unread > 0
                ? ` · ${unread} of ${METERS.length} meters have no reading`
                : null}
            </p>
          ) : null}
        </div>
        <CardDescription>
          Every vendor&apos;s meter against its plan&apos;s limit, read with the
          spend watch&apos;s run, so a slow climb is seen weeks before the
          ceiling. A warning at {Math.round(WARN_SHARE * 100)}% of a limit or{" "}
          {WARN_DAYS} days left at this week&apos;s rate, critical at{" "}
          {Math.round(CRITICAL_SHARE * 100)}% or {CRITICAL_DAYS} days; you are
          mailed once a crossing, never daily.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {unreadable ? (
          <p className="rounded-md bg-destructive/6 px-2.5 py-2 text-sm text-destructive">
            The plan limits could not be read: {unreadable}
          </p>
        ) : limits ? (
          <>
            {stale ? (
              <p className="rounded-md bg-destructive/6 px-2.5 py-2 text-sm text-destructive">
                These readings are from {formatAdminTimestamp(limits.atMs)}: the
                spend watch has not run since. Nothing below is current.
              </p>
            ) : null}
            {VENDOR_ORDER.map((vendor) => (
              <VendorSection key={vendor} vendor={vendor} limits={limits} />
            ))}
            <div className="space-y-1 text-caption text-muted-foreground">
              <p>
                The bar is the share of the plan&apos;s limit. Active CPU is
                estimated from the call count at a CPU a call read off the
                dashboard on {VERCEL_CPU_CALIBRATED}; the vendors&apos; GB are
                counted as 10^9 bytes, so a share reads high, never low.
              </p>
              {NOT_WATCHED.map((n) => (
                <p key={n.label}>
                  Not watched: {n.label}. {n.why}.
                </p>
              ))}
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            No plan-limits reading yet: the spend watch has not run since it
            learned them. Run it now, or wait for its schedule.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
