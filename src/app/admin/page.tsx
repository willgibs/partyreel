import Link from "next/link";

import { MetricCard } from "@/components/admin/metric-card";
import { QueueList } from "@/components/admin/queue-list";
import { Sparkline } from "@/components/admin/sparkline";
import { PageHeading } from "@/components/shared/page-heading";
import { buildAdminKpis } from "@/lib/admin/kpi";
import { readOperatorQueue } from "@/lib/admin/queue-data";
import { requireAdmin } from "@/lib/auth/admin-context";
import { getPlatformDbMetrics } from "@/lib/db/queries/metrics";

export const dynamic = "force-dynamic";

/**
 * THE OPERATOR'S HOME (`home=kpi`, Will 2026-09-20: "The numbers first, the
 * queue beneath").
 *
 * Four figures with a fortnight's change, one line of signups under the first,
 * and everything waiting on the operator beneath them, worst first. The nine
 * badged cards this replaces answered "where do I click", which is what the
 * rail and the palette now answer twice over, and they drew the same page
 * whether the platform was calm or on fire: the only difference the day made
 * was a small number on three of them.
 *
 * ★ IT READS THE DATABASE HALF ONLY. `getPlatformDbMetrics()` is the split
 * /admin/metrics also reads; the live Stripe call stays on that page. The
 * landing page of a console must not wait on a third party that is allowed to
 * be slow and allowed to fail, and revenue is not one of the four figures.
 * Every figure is counted in the database (`admin_metrics_snapshot()` and head
 * counts), never the length of a list PostgREST could have cut at 1,000 rows.
 */
export default async function AdminHomePage() {
  const ctx = await requireAdmin();
  if (ctx.aal !== "aal2") return null;

  const [metrics, queue] = await Promise.all([
    getPlatformDbMetrics(),
    readOperatorQueue(),
  ]);

  const kpis = buildAdminKpis(metrics.fortnight, metrics.uploads);
  // The fortnight's signups, the same buckets /admin/metrics draws over thirty
  // days, so the line under the figure covers the span the figure's delta does.
  const trend = metrics.fortnight.signupTrend;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <PageHeading>Operations</PageHeading>
          <p className="text-working text-muted-foreground">
            Where the platform stands, and what is waiting on you.
          </p>
        </div>
        <Link
          href="/admin/metrics"
          className="text-caption font-medium underline decoration-border underline-offset-4 transition-colors duration-150 hover:decoration-foreground"
        >
          All metrics
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <MetricCard
            key={kpi.id}
            label={kpi.label}
            value={kpi.value}
            sub={kpi.sub}
            delta={kpi.delta}
          >
            {kpi.id === "accounts" ? (
              <Sparkline
                counts={trend.map((day) => day.count)}
                label="New accounts"
              />
            ) : null}
          </MetricCard>
        ))}
      </div>

      <div>
        <h2 className="mb-2 text-working font-medium">Waiting on you</h2>
        <QueueList items={queue} />
      </div>
    </div>
  );
}
