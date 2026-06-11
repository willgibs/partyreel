"use client";

/**
 * Lazy entries for the admin metrics charts (Phase 3 code split): recharts is
 * the heaviest client dep in the app (~60-80KB) and only /admin/metrics uses
 * it. ssr:false is illegal in an RSC page, so this client wrapper owns the
 * dynamic() calls; fixed-height skeleton fallbacks match the chart frames so
 * the swap is layout-stable.
 */
import dynamic from "next/dynamic";

import { Skeleton } from "@/components/ui/skeleton";

export type {
  DistributionDatum,
  TrendSeries,
} from "@/components/admin/metrics-charts";

export const TrendChartLazy = dynamic(
  () => import("@/components/admin/metrics-charts").then((m) => m.TrendChart),
  { ssr: false, loading: () => <Skeleton className="h-64 w-full" /> },
);

export const DistributionChartLazy = dynamic(
  () =>
    import("@/components/admin/metrics-charts").then(
      (m) => m.DistributionChart,
    ),
  { ssr: false, loading: () => <Skeleton className="h-64 w-full" /> },
);
