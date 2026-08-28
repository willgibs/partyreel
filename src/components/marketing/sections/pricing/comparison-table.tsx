import { Check, Minus } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { CheckoutButton } from "@/components/app/checkout-button";
import { portalSkinProps } from "@/components/marketing/chrome/portal-skin";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  EVENT_PASS_RENEWAL_PRICE_LABEL,
  friendlyCapacity,
  MAX_EVENTS,
  MAX_REEL_SECONDS,
  planById,
  plansForTier,
} from "@/lib/constants/tiers";
import { MAX_UPLOAD_BYTES } from "@/lib/media/limits";
import { formatBytes } from "@/lib/utils";

/**
 * The full plan matrix (Resend-informed): row labels carry a hover/focus
 * tooltip where a term needs one; booleans are the A16 marks (green check =
 * included, muted minus = not); everything numeric derives from tiers.ts /
 * limits.ts. Ingress caps stay OFF this table by design (ADR-0021: unmarketed,
 * and the content-policy test hard-fails the build if the numbers appear).
 *
 * Layout: the plan header row is STICKY from lg up (the Biograph sticky-summary
 * move adapted to a matrix: names, prices and CTAs stay present while rows
 * scroll). Below sm each row becomes its own block with the plan names carried
 * inline (the reel tier-section pattern). Divider grammar (Will's note 7):
 * dashed hairlines between rows inside a group, solid rules around group
 * headers, which sit on the whisper-gray band (note 8).
 */

type CellValue = boolean | string;

type MatrixRow = {
  label: string;
  tip?: string;
  values: [CellValue, CellValue, CellValue]; // Free · Event Pass · Pro
};

type MatrixGroup = { title: string; rows: MatrixRow[] };

function buildGroups(): MatrixGroup[] {
  const free = planById("free");
  const pass = planById("event_pass");
  const pro = plansForTier("pro");
  const proStorage = pro.map((p) => formatBytes(p.storageBytes)).join(", ");
  const freePhotos = friendlyCapacity(free.storageBytes).photos;
  const passCap = friendlyCapacity(pass.storageBytes);
  const proTopCap = friendlyCapacity(pro[pro.length - 1].storageBytes);
  const perFile = formatBytes(MAX_UPLOAD_BYTES);

  return [
    {
      title: "Events and storage",
      rows: [
        {
          label: "Events",
          tip: "Events that exist at once. Deleting an event frees its slot, and deleted events wait 30 days in the trash.",
          values: [
            `${MAX_EVENTS.free}`,
            "1 per pass",
            MAX_EVENTS.pro === null ? "Unlimited" : `${MAX_EVENTS.pro}`,
          ],
        },
        {
          label: "Storage",
          tip: "Your total across events. Plans are sized by storage, never per guest.",
          values: [
            formatBytes(free.storageBytes),
            `${formatBytes(pass.storageBytes)} per pass`,
            proStorage,
          ],
        },
        {
          label: "Holds about",
          tip: "A friendly estimate from typical phone photos and 1080p video.",
          values: [
            `${freePhotos.toLocaleString()} photos`,
            `${passCap.photos.toLocaleString()} photos or ${Math.round(passCap.videoMinutes / 60)} h of video`,
            `up to ${proTopCap.photos.toLocaleString()} photos`,
          ],
        },
        {
          label: "Event lifetime",
          tip: "No end dates by design: an album stays exactly where its QR points.",
          values: [
            "Until you delete it",
            `About a year, renew for ${EVENT_PASS_RENEWAL_PRICE_LABEL}`,
            "Until you delete it",
          ],
        },
        {
          label: "Idle cleanup",
          tip: "A Free event untouched for about six months gets a 14-day email warning, then moves to the 30-day trash.",
          values: ["After ~6 months idle", "Not while the pass is live", "Never"],
        },
      ],
    },
    {
      title: "Uploads",
      rows: [
        { label: "Photo uploads", values: [true, true, true] },
        {
          label: "Video uploads",
          tip: "Guests and hosts alike. Free events are photos only.",
          values: [false, true, true],
        },
        {
          label: "Per-file limit",
          tip: "Photos and videos alike, on every plan. Size is the only per-file gate.",
          values: [perFile, perFile, perFile],
        },
        {
          label: "Verified-email guests",
          tip: "On by default: guests confirm a one-tap email code before uploading. You can allow anonymous uploads per event.",
          values: [true, true, true],
        },
      ],
    },
    {
      title: "The reel",
      rows: [
        {
          label: "Reel length",
          values: [
            `${MAX_REEL_SECONDS.free} seconds`,
            `${MAX_REEL_SECONDS.event_pass} seconds`,
            `${MAX_REEL_SECONDS.pro} seconds`,
          ],
        },
        {
          label: "Reel watermark",
          values: ["Small mark", "None", "None"],
        },
        {
          label: "Photos and album",
          tip: "Full resolution, never watermarked, on any plan. Only the free reel carries a mark.",
          values: ["Never marked", "Never marked", "Never marked"],
        },
      ],
    },
    {
      title: "Sharing and privacy",
      rows: [
        { label: "QR code and one link", values: [true, true, true] },
        {
          label: "Live album",
          tip: "The album fills in while the event is still going.",
          values: [true, true, true],
        },
        { label: "Password lock", values: [false, true, true] },
        { label: "Custom link name", values: [false, true, true] },
        {
          label: "Public host page",
          tip: "Claim /u/you and list the events you host. Guests never need one.",
          values: [false, true, true],
        },
      ],
    },
    {
      title: "Safety net",
      rows: [
        {
          label: "30-day trash",
          tip: "Anything you delete can be restored, exactly as it was, for 30 days.",
          values: [true, true, true],
        },
        {
          label: "Download everything",
          tip: "A full-quality zip of the album, for hosts and guests.",
          values: [true, true, true],
        },
      ],
    },
  ];
}

const PLAN_COLUMNS = ["Free", "Event Pass", "Pro"] as const;

function CellContent({ value }: { value: CellValue }) {
  if (value === true) {
    return (
      <>
        <Check
          className="inline size-4 text-success"
          strokeWidth={2}
          aria-hidden
        />
        <span className="sr-only">Included</span>
      </>
    );
  }
  if (value === false) {
    return (
      <>
        <Minus
          className="inline size-4 text-muted-foreground/50"
          strokeWidth={2}
          aria-hidden
        />
        <span className="sr-only">Not included</span>
      </>
    );
  }
  return <span>{value}</span>;
}

/** The plan name repeated inside a cell for the stacked mobile layout only. */
function RowLabel({ children }: { children: string }) {
  return (
    <span className="font-sans text-xs tracking-[0.08em] text-muted-foreground uppercase sm:hidden">
      {children}
    </span>
  );
}

function LabelCell({ row }: { row: MatrixRow }) {
  if (!row.tip) {
    return (
      <th
        scope="row"
        className="px-4 py-3 text-left font-medium max-sm:block max-sm:pt-3 max-sm:pb-1"
      >
        {row.label}
      </th>
    );
  }
  return (
    <th
      scope="row"
      className="px-4 py-3 text-left font-medium max-sm:block max-sm:pt-3 max-sm:pb-1"
    >
      <Tooltip>
        <TooltipTrigger className="cursor-help text-left font-medium underline decoration-muted-foreground/40 decoration-dotted underline-offset-4">
          {row.label}
        </TooltipTrigger>
        {/* Portaled → carries the paper skin itself (THE PORTAL RULE). */}
        <TooltipContent {...portalSkinProps("paper")} side="top">
          <span className="max-w-60 text-pretty">{row.tip}</span>
        </TooltipContent>
      </Tooltip>
    </th>
  );
}

export function ComparisonTable() {
  const groups = buildGroups();
  const pass = planById("event_pass");
  const proFrom = plansForTier("pro")[0];

  const headerCtas: ReactNode[] = [
    <Button key="free" asChild size="sm" variant="outline" className="h-8">
      <Link href="/login">Start free</Link>
    </Button>,
    <CheckoutButton
      key="pass"
      planId="event_pass"
      variant="outline"
      className="h-8"
    >
      Buy a pass
    </CheckoutButton>,
    <CheckoutButton key="pro" planId={proFrom.id} className="h-8">
      Get Pro
    </CheckoutButton>,
  ];
  const headerPrices = [
    planById("free").priceLabel,
    pass.priceLabel,
    `from ${proFrom.priceLabel}`,
  ];

  return (
    <SectionShell
      id="compare"
      eyebrow="Compare"
      heading="Every plan, side by side."
      subhead="The full sheet. Hover a row name for the fine print in plain words."
    >
      <Reveal className="mx-auto mt-12 max-w-5xl">
        <div
          data-mkt-reveal
          className="rounded-2xl border max-lg:overflow-x-auto"
        >
          <table className="w-full text-sm sm:min-w-[42rem]">
            <thead className="max-sm:hidden">
              <tr className="border-b text-left">
                <th
                  scope="col"
                  className="bg-background px-4 py-4 align-bottom text-xs font-medium tracking-[0.08em] text-muted-foreground uppercase lg:sticky lg:top-[var(--mkt-header-h)] lg:z-10"
                >
                  What you get
                </th>
                {PLAN_COLUMNS.map((name, i) => (
                  <th
                    key={name}
                    scope="col"
                    className="bg-background px-4 py-4 align-bottom lg:sticky lg:top-[var(--mkt-header-h)] lg:z-10"
                  >
                    <div className="flex flex-col items-start gap-2">
                      <span className="font-heading text-base">{name}</span>
                      <span className="font-mono text-xs font-medium tabular-nums text-muted-foreground">
                        {headerPrices[i]}
                      </span>
                      {headerCtas[i]}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            {groups.map((group) => (
              <tbody key={group.title}>
                <tr className="border-y">
                  <th
                    colSpan={4}
                    scope="colgroup"
                    className="bg-muted/40 px-4 py-2 text-left text-[10px] font-medium tracking-[0.14em] text-muted-foreground uppercase max-sm:block"
                  >
                    {group.title}
                  </th>
                </tr>
                {group.rows.map((row) => (
                  <tr
                    key={row.label}
                    className="border-b border-dashed last:border-0 max-sm:block max-sm:border-solid max-sm:py-1"
                  >
                    <LabelCell row={row} />
                    {row.values.map((value, i) => (
                      <td
                        key={PLAN_COLUMNS[i]}
                        className="px-4 py-3 text-muted-foreground max-sm:flex max-sm:items-baseline max-sm:justify-between max-sm:gap-4 max-sm:py-1"
                      >
                        <RowLabel>{PLAN_COLUMNS[i]}</RowLabel>
                        <span className="max-sm:text-right">
                          <CellContent value={value} />
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            ))}
          </table>
        </div>
      </Reveal>
    </SectionShell>
  );
}
