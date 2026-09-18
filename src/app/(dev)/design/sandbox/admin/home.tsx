"use client";

import { ArrowRight } from "lucide-react";

import { MetricCard } from "@/components/admin/metric-card";
import { TrendChart } from "@/components/admin/metrics-charts";
import { PageHeading } from "@/components/shared/page-heading";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { HealthPanel, type Shell } from "./chrome";
import {
  HOME_CARDS,
  KPIS,
  QUEUE,
  SURFACES,
  TREND,
  type QueueItem,
} from "./fixtures";
import { type Colour, StateDot, rowStyle } from "./state-ui";

/**
 * THE OPERATOR'S HOME, THREE WAYS, on one Tuesday's numbers.
 *
 * What a home is FOR is the question under all three. Today's card grid answers
 * "where do I click", which is the question the nav already answers twice over
 * (a dropdown at the top and a rail down the side), and it answers it with nine
 * cards that look identical whether the platform is calm or on fire: the only
 * difference the day makes is a small number on three of them. The other two
 * answer a different question. The console answers "what is wrong", the numbers
 * answer "how are we doing", and the honest trade between them is what the
 * first decision asks.
 *
 * ★ EVERY OPTION DRAWS THE SAME SIX THINGS. Two failed backend runs, one
 * account over its cap, three open reports, nine unanswered support messages
 * and two unread applications. A shape that hides one of them is losing it in
 * front of the reviewer rather than in production, which is the point.
 */

export type HomeShape = "grid" | "console" | "kpi";

export const homeOf = (v: string | undefined): HomeShape =>
  v === "grid" || v === "console" || v === "kpi" ? v : "console";

/* ── Today: a grid of the surfaces, badged ───────────────────────────────── */

function CardGrid() {
  return (
    <div className="space-y-8">
      <div>
        <PageHeading>Operations</PageHeading>
        <p className="text-sm text-muted-foreground">
          Internal tools for running Partyreel.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {HOME_CARDS.map((s) => {
          // Read off the entry rather than returned from a call: a component
          // that arrives from a function call is created during render.
          const Icon = s.icon;
          return (
            <Card key={s.href} className="h-full">
              <CardHeader>
                <div className="mb-1 flex items-center justify-between">
                  <Icon className="size-5 text-muted-foreground" />
                  {/* Today's card reveals its arrow on hover only, so a still
                      of the page is right to draw it invisible. */}
                  <ArrowRight className="size-4 text-muted-foreground opacity-0" />
                </div>
                <CardTitle className="flex items-center gap-2">
                  {s.label}
                  {s.count > 0 ? <Badge>{s.count}</Badge> : null}
                </CardTitle>
                <CardDescription>{s.blurb}</CardDescription>
              </CardHeader>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ── The console: one ranked list of what is waiting ─────────────────────── */

const KIND_LABEL: Record<QueueItem["kind"], string> = {
  job: "Jobs",
  account: "Accounts",
  report: "Reports",
  support: "Support",
  applicant: "Applicants",
};

function QueueRow({ item, colour }: { item: QueueItem; colour: Colour }) {
  const tint = rowStyle(item.level, colour);
  return (
    <li
      className={cn(
        "flex items-center gap-4 px-4 py-3 text-sm",
        tint.className,
      )}
      style={tint.style}
    >
      <StateDot level={item.level} colour={colour} />
      <span className="w-24 shrink-0 text-xs text-muted-foreground">
        {KIND_LABEL[item.kind]}
      </span>
      <span className="min-w-0 flex-1">
        <span className="font-medium">{item.what}</span>
        <span className="ml-2 text-muted-foreground">{item.detail}</span>
      </span>
      <span className="w-16 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
        {item.waiting}
      </span>
      <span className="w-36 shrink-0 text-right text-xs font-medium underline underline-offset-4">
        {item.action}
      </span>
    </li>
  );
}

function Console({ colour }: { colour: Colour }) {
  const quiet = SURFACES.filter((s) => s.count === 0 && s.href !== "/admin");
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <PageHeading>Needs you now</PageHeading>
          <p className="text-sm text-muted-foreground">
            Everything open across the platform, worst first. Six things, two of
            them costing storage every hour.
          </p>
        </div>
        <span className="text-xs text-muted-foreground">
          Read at 14:22, refreshes on every visit
        </span>
      </div>

      <ul className="divide-y rounded-xl border bg-card">
        {QUEUE.map((item) => (
          <QueueRow key={item.id} item={item} colour={colour} />
        ))}
      </ul>

      <div>
        <p className="mb-2 text-xs tracking-wide text-muted-foreground uppercase">
          Quiet right now
        </p>
        <div className="flex flex-wrap gap-2">
          {quiet.map((s) => (
            <span
              key={s.href}
              className="rounded-md border px-2.5 py-1 text-xs text-muted-foreground"
            >
              {s.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── The numbers first, the queue beneath ────────────────────────────────── */

function Numbers({ colour }: { colour: Colour }) {
  return (
    <div className="space-y-6">
      <div>
        <PageHeading>Operations</PageHeading>
        <p className="text-sm text-muted-foreground">
          Where the platform stands, and what is waiting on you.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {KPIS.map((k) => (
          <MetricCard
            key={k.label}
            label={k.label}
            value={k.value}
            sub={k.sub}
          />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Scans and album views</CardTitle>
          <CardDescription>The last fourteen days.</CardDescription>
        </CardHeader>
        <div className="px-6 pb-4">
          <TrendChart
            data={TREND}
            height={160}
            series={[
              {
                key: "scans",
                label: "QR scans",
                color: "var(--color-chart-2)",
              },
              {
                key: "views",
                label: "Album views",
                color: "var(--color-chart-4)",
              },
            ]}
          />
        </div>
      </Card>

      <div>
        <p className="mb-2 text-sm font-medium">Waiting on you</p>
        <ul className="divide-y rounded-xl border bg-card">
          {QUEUE.map((item) => (
            <QueueRow key={item.id} item={item} colour={colour} />
          ))}
        </ul>
      </div>
    </div>
  );
}

/**
 * The home, wearing the health answer: the panel appears above the page only
 * when the strip is neither portal-wide nor switched off, so the three health
 * answers are three real places for the same sentence and never two copies of
 * it on one screen.
 */
export function AdminHome({ home, shell }: { home: HomeShape; shell: Shell }) {
  return (
    <div className="space-y-6">
      {shell.health === "home" ? <HealthPanel colour={shell.colour} /> : null}
      {home === "grid" ? <CardGrid /> : null}
      {home === "console" ? <Console colour={shell.colour} /> : null}
      {home === "kpi" ? <Numbers colour={shell.colour} /> : null}
    </div>
  );
}
