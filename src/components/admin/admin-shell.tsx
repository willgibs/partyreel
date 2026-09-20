"use client";

import { useState } from "react";

import { AdminBar } from "@/components/admin/admin-bar";
import { AdminPalette } from "@/components/admin/admin-palette";
import { AdminRail } from "@/components/admin/admin-rail";
import { HealthBand } from "@/components/admin/health-band";
import type { PendingCounts } from "@/lib/admin/nav";
import type { JobHealthReport } from "@/lib/jobs/health-summary";

/**
 * THE PORTAL'S CHROME, AS THE THREE ANSWERS WEARING EACH OTHER
 * (`chrome=devtool` + `nav=rail-palette` + `health=portal`, Will 2026-09-20).
 *
 * A 44px tool bar, a 232px rail at `lg`, a band under the bar on a bad day, and
 * the palette both the bar and the rail open. It replaces a 56px bar with an
 * Ops chip, a dropdown, and no health signal anywhere but /admin/jobs.
 *
 * ★ IT IS A CLIENT COMPONENT NOW, AND ONLY BECAUSE OF THE PALETTE. One piece of
 * state, `paletteOpen`, shared by three things that cannot otherwise reach each
 * other: the bar's Search button, the rail's Search row and the ⌘K listener.
 * Nothing here queries anything: every number arrives as a prop, already read
 * and reduced by the layout, so the boundary costs a shell and not a page.
 *
 * ★ THE 1280 COLUMN GOES WHEN THE RAIL ARRIVES, at `lg` and not before. The
 * product's `Container` centres a column, which is right for a page a host
 * reads and wrong beside a fixed rail: the content would start two hundred
 * pixels right of the header's first word. Below `lg` there is no rail, so the
 * page keeps a readable measure of its own.
 */
export function AdminShell({
  email,
  counts,
  health,
  env,
  children,
}: {
  email: string | null;
  counts: PendingCounts;
  health: JobHealthReport;
  /** `VERCEL_ENV`, read on the server (this side of the boundary has no env). */
  env: string | null;
  children: React.ReactNode;
}) {
  const [paletteOpen, setPaletteOpen] = useState(false);

  return (
    <div className="flex min-h-svh flex-col">
      <AdminBar
        email={email}
        alerts={counts}
        env={env}
        unhealthyJobs={health.readable ? health.unhealthy.length : null}
        onOpenPalette={() => setPaletteOpen(true)}
      />
      <HealthBand health={health} />
      <div className="flex min-h-0 flex-1">
        <AdminRail counts={counts} onOpenPalette={() => setPaletteOpen(true)} />
        <main className="min-w-0 flex-1 px-4 py-6 lg:px-6">
          <div className="mx-auto max-w-5xl lg:mx-0 lg:max-w-none">
            {children}
          </div>
        </main>
      </div>
      <AdminPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}
