import Link from "next/link";
import type { ReactNode } from "react";

import { CheckoutButton } from "@/components/app/checkout-button";
import { MatrixMark } from "@/components/marketing/matrix-mark";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { Button } from "@/components/ui/button";
import {
  ESTIMATE_BASIS_NOTE,
  EVENT_PASS_RENEWAL_PRICE_LABEL,
  friendlyCapacity,
  GATED_EVENT_SETTINGS,
  MAX_EVENTS,
  planById,
  plansForTier,
  uploadsLabel,
} from "@/lib/constants/tiers";
import { formatCount } from "@/lib/format/count";
import { INACTIVE_MONTHS, WARN_BEFORE_DAYS } from "@/lib/lifecycle/inactivity";
import { RECENTLY_DELETED_WINDOW_DAYS } from "@/lib/lifecycle/recently-deleted";
import { MAX_UPLOAD_BYTES } from "@/lib/media/limits";
import { cn, formatBytes } from "@/lib/utils";

import { clipTermsFor } from "./clip-terms";
import { RowTip } from "./row-tip";

/**
 * The full plan matrix (Resend-informed): row labels carry a tooltip where a term
 * needs one, open to a cursor's hover, a key's focus and a finger's tap (`RowTip`:
 * the words are published terms, so a phone must be able to read them); booleans
 * are the A16 marks (green check = included, muted minus = not); everything
 * numeric derives from tiers.ts / limits.ts.
 *
 * ★ EVERY LIMIT A HOST CAN MEET IS A ROW HERE, WITH ITS LINE IN HER WORDS (Will,
 * 2026-10-03: "a limit a host could meet is published"). Storage, Uploads,
 * Events, Guests, Largest file, Deleted and Kept each carry the one-sentence
 * line that says what it counts and what she can do about it; only a circuit
 * breaker no real host meets stays off the page, which the fine print under the
 * table says in one line (the Terms' "reasonable limits" are what it rests on).
 *
 * Layout: the plan header row is STICKY from lg up (the Biograph sticky-summary
 * move adapted to a matrix: names, prices and CTAs stay present while rows
 * scroll), and it follows the site header (`STICKY_HEAD`). Below sm each row
 * becomes its own block with the plan names carried inline (the /reel clip
 * table's pattern). Divider grammar (Will's note 7): dashed hairlines between
 * rows inside a group, solid rules around group headers, which sit on the
 * whisper-gray band (note 8).
 *
 * ★ THE TABLE IS DARK NOW (Will, 2026-09-20, his own answer on `sheet`: "Let's
 * make the table dark so there's not a harsh back-to-back chapter transition on
 * the table between the Find Your Plan and FAQ section now following the
 * table"). It lost its PaperChapter wrapper on the page rather than a line in
 * here: every surface in this file is a token, so the matrix simply renders in
 * whatever room it is dropped into. The one thing a token could not follow is
 * the tooltip, which PORTALS out of the page and has to carry the skin itself.
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
  // Pro's sizes and their uploads read in one order, the slider's, so a reader matches them by place.
  const proList = (values: string[]) =>
    `${values.slice(0, -1).join(", ")} or ${values[values.length - 1]}`;
  const proStorage = proList(pro.map((p) => formatBytes(p.storageBytes)));
  const proUploads = `${proList(pro.map((p) => formatBytes(p.uploadsBytes)))} a month`;
  const freePhotos = friendlyCapacity(free.storageBytes).photos;
  const passCap = friendlyCapacity(pass.storageBytes);
  const proTopCap = friendlyCapacity(pro[pro.length - 1].storageBytes);
  const perFile = formatBytes(MAX_UPLOAD_BYTES);
  const deleted = `${RECENTLY_DELETED_WINDOW_DAYS} days`;

  return [
    {
      title: "Storage, uploads and events",
      rows: [
        {
          label: "Billing",
          tip: `Yearly Pro is exactly ten months' price: ${plansForTier(
            "pro",
            "year",
          )
            .map((p) => p.priceLabel)
            .join(", ")}.`,
          values: [
            "Free forever",
            `${pass.priceLabel.replace(" one-time", " once")}, ${EVENT_PASS_RENEWAL_PRICE_LABEL}/yr to renew`,
            "Monthly or yearly, 2 months free",
          ],
        },
        {
          label: "Storage",
          tip: "Everything you and your guests keep, counted on the original files. Previews and phone-size copies are on us.",
          values: [
            formatBytes(free.storageBytes),
            `${formatBytes(pass.storageBytes)} per pass`,
            proStorage,
          ],
        },
        {
          label: "Holds about",
          // host-storage r2: an estimate names the camera it assumes, with its working.
          tip: ESTIMATE_BASIS_NOTE,
          values: [
            `${formatCount(freePhotos)} photos`,
            `${formatCount(passCap.photos)} photos or ${formatCount(Math.round(passCap.videoMinutes / 60))} h of video`,
            `up to ${formatCount(proTopCap.photos)} photos`,
          ],
        },
        {
          // The allowance a GB falls as Pro grows (Ladder A), so Pro's sizes print in the slider's order.
          label: "Uploads",
          tip: "What you and your guests can add, deletions included: deleting something never gives its upload back. Free and Pro count each month; a pass counts its own year, so its event can use it all in one night.",
          values: [
            uploadsLabel(free),
            `${formatBytes(pass.uploadsBytes)} per pass, over its year`,
            proUploads,
          ],
        },
        {
          label: "Events",
          tip: "Events you keep at once. Delete one to free its place, or move to Pro for as many as you like.",
          values: [
            `${MAX_EVENTS.free}`,
            "1 per pass",
            MAX_EVENTS.pro === null ? "Unlimited" : `${MAX_EVENTS.pro}`,
          ],
        },
        {
          label: "Guests",
          tip: "Everyone can join, add and view, and we never charge by the guest.",
          values: ["No limit", "No limit", "No limit"],
        },
        {
          // One row for how long each plan keeps an album, Free's rest included: a reader compares keeping, once.
          label: "Kept",
          tip: `A Free event rests in Deleted after about ${INACTIVE_MONTHS} months with no activity, and we email ${WARN_BEFORE_DAYS} days before. An album stays exactly where its QR points: no end dates.`,
          values: [
            "While in use",
            `A year, renew for ${EVENT_PASS_RENEWAL_PRICE_LABEL}`,
            "While subscribed",
          ],
        },
      ],
    },
    {
      title: "Photos and video",
      rows: [
        { label: "Photo uploads", values: [true, true, true] },
        {
          label: "Video uploads",
          tip: "Guests and hosts alike, and one switch keeps an album to photos. Free events are photos only.",
          values: [false, true, true],
        },
        {
          label: "Largest file",
          tip: "The biggest single photo or video. You can set a smaller one for an event.",
          values: [perFile, perFile, perFile],
        },
        {
          label: "Verified-email guests",
          tip: "On by default: guests confirm a one-tap email code before uploading. You can allow unverified display names per event instead.",
          values: [true, true, true],
        },
      ],
    },
    {
      // `reel-story` r1 `pricing=renamed`: the clip row describes the CLIP a
      // viewer makes from the reel, never the live reel, which plays with no
      // cap and no mark on every plan. Its length and its mark share the row
      // (`clipTermsFor`): every plan's length is the same, so a length row of
      // its own read "60 seconds" three times and compared nothing.
      title: "The reel",
      rows: [
        {
          label: "Clips",
          tip: "The longest clip anyone can make from your event's reel, and whether it carries the small mark. The reel itself runs as long as the album, and the reel and the screen carry no mark on any plan.",
          values: [
            clipTermsFor("free"),
            clipTermsFor("event_pass"),
            clipTermsFor("pro"),
          ],
        },
        {
          label: "Photos and album",
          tip: "Full resolution, never watermarked, on any plan. Only a free event's clips carry a mark.",
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
        // On every plan since the free/pro shift; read from the one list that gates them. The doors
        // (2026-09-29) put every other gate beside the password, gated by no plan.
        {
          label: "Every gate",
          tip: "A password, letting each guest in, an invite list, or only people already in.",
          values: [!GATED_EVENT_SETTINGS.includes("password"), true, true],
        },
        {
          label: "Custom link name",
          values: [!GATED_EVENT_SETTINGS.includes("custom_slug"), true, true],
        },
        {
          label: "Public host page",
          tip: "Claim /u/you and list the events you host, free on every plan. Guests never need one.",
          values: [true, true, true],
        },
      ],
    },
    {
      title: "Safety net",
      rows: [
        {
          // trash-in-storage: Deleted counts in storage, and the setting that makes room is its other half.
          label: "Deleted",
          tip: `Deleted items wait ${RECENTLY_DELETED_WINDOW_DAYS} days so you can bring them back, and they count in your storage until they leave. With Make room from Deleted on, the oldest go first when an upload needs the room.`,
          values: [deleted, deleted, deleted],
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

/**
 * ★ THE PLAN HEAD FOLLOWS THE SITE HEADER (build 38's red-team: with the bar scrolled away the head stayed 4rem down,
 * and rows ran visibly through the band above it). The header leaves by a transform and keeps `--mkt-header-h`, so the
 * head rests on that knob and takes the top of the screen the moment the header is out of the way: the condition is
 * the header's own hide rule, escapes and all (focus inside it, a nav panel open, the phone sheet open: the bar stays
 * then, and so does the head under it), which `comparison-table.test.ts` holds to header-shell.tsx's text. `header ~ *`
 * reaches the page's `main`, the header's later sibling that holds the matrix; anywhere else (a lab frame) no header
 * precedes it and the head rests on the knob, as it always did.
 *
 * The head moves on the header's arrival clock both ways: coming back they travel together, and leaving the head is
 * ahead of the bar and under its glass, so no gap shows between them. Reduced motion keeps the move and drops the slide,
 * as the header does. Spelled out in one constant for the Tailwind scanner, which reads source text, and for the four
 * cells that wear it, so they can never differ.
 */
const STICKY_HEAD = cn(
  "lg:sticky lg:top-[var(--mkt-header-h)] lg:z-10",
  "lg:motion-safe:transition-[top] lg:motion-safe:duration-150 lg:motion-safe:ease-emphasis",
  "lg:[header[data-hidden]:not(:focus-within):not(:has([data-slot=navigation-menu-trigger][data-state=open])):not(:has([data-slot=sheet-trigger][data-state=open]))_~_*_&]:top-0",
);

// The glyphs live in matrix-mark.tsx, shared with the blog's comparison tables.
function CellContent({ value }: { value: CellValue }) {
  if (typeof value === "boolean") return <MatrixMark value={value} />;
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
      <RowTip label={row.label} tip={row.tip} />
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
      subhead="The full sheet. Hover or tap a row name for the fine print in plain words."
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
                  className={cn(
                    "bg-background px-4 py-4 align-bottom text-xs font-medium tracking-[0.08em] text-muted-foreground uppercase",
                    STICKY_HEAD,
                  )}
                >
                  What you get
                </th>
                {PLAN_COLUMNS.map((name, i) => (
                  <th
                    key={name}
                    scope="col"
                    className={cn(
                      "bg-background px-4 py-4 align-bottom",
                      STICKY_HEAD,
                    )}
                  >
                    <div className="flex flex-col items-start gap-2">
                      <span className="font-heading text-card-title">
                        {name}
                      </span>
                      <span className="text-xs font-medium text-muted-foreground tabular-nums">
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
                    className="bg-muted/40 px-4 py-2 text-left text-label font-medium text-muted-foreground uppercase max-sm:block"
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
        {/* ★ THE FAIR-USE LINE (Ladder A): the table is every limit a host meets, so the one thing
            behind it, a breaker for scripts, is said once, in the table's own fine print, resting on
            the Terms' "reasonable limits on upload volume" and their bar on getting around a plan's
            limits. The second text step: a reader acts on it. */}
        <p className="mx-auto mt-5 max-w-3xl text-center text-xs text-pretty text-muted-foreground">
          Every plan is for real events. The limits in this table are the ones a
          host meets; behind them we watch only for automated abuse (scripts,
          never parties), which we may slow or pause, as our{" "}
          <Link
            href="/terms"
            className="underline decoration-muted-foreground/40 underline-offset-4 hover:text-foreground"
          >
            Terms
          </Link>{" "}
          describe.
        </p>
      </Reveal>
    </SectionShell>
  );
}
