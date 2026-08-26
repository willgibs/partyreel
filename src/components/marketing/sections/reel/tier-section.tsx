import Link from "next/link";

import { SectionShell } from "@/components/marketing/system/section-shell";
import { MAX_REEL_SECONDS, TIER_NAMES, type Tier } from "@/lib/constants/tiers";

/**
 * /reel section 5 — the watermark + tier story (QUIET). The small table the IA ruled:
 * lengths come from MAX_REEL_SECONDS and names from TIER_NAMES (tiers.ts is the app-side
 * pricing single-source; hardcoding a 30 or 60 here is exactly the drift the DRY table
 * exists to prevent). The footnote keeps this claim from colliding with the trust
 * strip's "No watermarks": photos and the album are unmarked on EVERY tier; only the
 * free reel carries the mark.
 */

const ROWS: { tier: Tier; mark: string }[] = [
  { tier: "free", mark: "Small partyreel.com mark" },
  { tier: "pro", mark: "None" },
  { tier: "event_pass", mark: "None" },
];

/** The column name repeated inside a cell for the stacked mobile layout only
 *  (display:none from sm up, so the desktop table is byte-identical). */
function RowLabel({ children }: { children: string }) {
  return (
    <span className="font-sans text-xs tracking-[0.08em] text-muted-foreground uppercase sm:hidden">
      {children}
    </span>
  );
}

export function TierSection() {
  return (
    <SectionShell
      id="plans"
      width="narrow"
      eyebrow="Plans"
      heading="The free reel carries a small mark. Upgrade and it is gone."
    >
      {/* PER-PLAN ROWS ON A PHONE (R4/A5): the 26rem minimum ran past a 375px
          screen, so the watermark column and the table's right border were cut
          off mid-word. Below sm each plan becomes its own block with the column
          name carried inline (the head row is hidden there, so nothing is left
          unlabelled); from sm up the markup renders as the identical table. */}
      <div className="mt-10 overflow-x-auto rounded-2xl border">
        <table className="w-full text-sm sm:min-w-[26rem]">
          <thead className="max-sm:hidden">
            <tr className="border-b text-left text-xs tracking-[0.08em] text-muted-foreground uppercase">
              <th scope="col" className="px-4 py-3 font-medium">
                Plan
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Reel length
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Watermark
              </th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr
                key={row.tier}
                className="border-b last:border-0 max-sm:block max-sm:py-2"
              >
                <th
                  scope="row"
                  className="px-4 py-3.5 text-left font-medium whitespace-nowrap max-sm:block max-sm:pt-2 max-sm:pb-1"
                >
                  {TIER_NAMES[row.tier]}
                </th>
                <td className="px-4 py-3.5 font-mono tabular-nums max-sm:flex max-sm:items-baseline max-sm:justify-between max-sm:gap-4 max-sm:py-1">
                  {/* The value is ONE span on purpose: as bare text nodes the
                      number and "seconds" became separate flex items below sm
                      and justify-between blew them apart. */}
                  <RowLabel>Reel length</RowLabel>
                  <span>{MAX_REEL_SECONDS[row.tier]} seconds</span>
                </td>
                <td className="px-4 py-3.5 text-muted-foreground max-sm:flex max-sm:items-baseline max-sm:justify-between max-sm:gap-4 max-sm:py-1">
                  <RowLabel>Watermark</RowLabel>
                  <span className="max-sm:text-right">{row.mark}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-5 text-center text-sm text-pretty text-muted-foreground">
        Photos and your album never carry a watermark, on any plan. Only the
        free reel does, and upgrading removes it from your next render.
      </p>
      <div className="mt-6 flex justify-center">
        <Link
          href="/pricing"
          className="mkt-learn inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground"
        >
          See full pricing
          <span className="mkt-learn-chevron inline-flex" aria-hidden>
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            >
              <path className="mkt-learn-arm mkt-learn-arm-top" d="M6 4L10 8" />
              <path className="mkt-learn-arm mkt-learn-arm-bot" d="M10 8L6 12" />
            </svg>
          </span>
        </Link>
      </div>
    </SectionShell>
  );
}
