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

export function TierSection() {
  return (
    <SectionShell
      id="plans"
      width="narrow"
      eyebrow="Plans"
      heading="The free reel carries a small mark. Upgrade and it is gone."
    >
      <div className="mt-10 overflow-x-auto rounded-2xl border">
        <table className="w-full min-w-[26rem] text-sm">
          <thead>
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
              <tr key={row.tier} className="border-b last:border-0">
                <th
                  scope="row"
                  className="px-4 py-3.5 text-left font-medium whitespace-nowrap"
                >
                  {TIER_NAMES[row.tier]}
                </th>
                <td className="px-4 py-3.5 font-mono tabular-nums">
                  {MAX_REEL_SECONDS[row.tier]} seconds
                </td>
                <td className="px-4 py-3.5 text-muted-foreground">
                  {row.mark}
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
