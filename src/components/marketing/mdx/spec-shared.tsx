import { ChevronRight, Info, Lightbulb, TriangleAlert } from "lucide-react";
import Link from "next/link";
import {
  Children,
  cloneElement,
  isValidElement,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
} from "react";

import Image from "next/image";

import { BrowserFrame } from "@/components/marketing/frames";
import { Check, Checklist } from "@/components/marketing/help/checklist";
import { MatrixMark } from "@/components/marketing/matrix-mark";
import { HeadingAnchor } from "@/components/marketing/reading/heading-anchor";
import { HEADING_SCROLL_MT } from "@/components/marketing/reading/heading-contract";
import { Kbd } from "@/components/shared/kbd";
import { Badge } from "@/components/ui/badge";
import { marketingImage } from "@/lib/constants/marketing-media";
import { slugify } from "@/lib/content/help";
import {
  AVG_PHOTO_BYTES,
  EVENT_PASS_RENEWAL_PRICE_LABEL,
  MAX_EVENTS,
  MAX_REEL_SECONDS,
  type PlanId,
  TIER_NAMES,
  type Tier,
  VIDEO_BYTES_PER_MIN,
  formatCapacity,
  formatLimit,
  planById,
  plansForTier,
  videosAllowedForTier,
} from "@/lib/constants/tiers";
import { TEASER_LIMIT } from "@/lib/events/gallery-access";
import { UNLOCK_TTL_SECONDS } from "@/lib/events/unlock-token";
import { INACTIVE_DAYS, WARN_BEFORE_DAYS } from "@/lib/lifecycle/inactivity";
import { OVER_CAP_GRACE_DAYS } from "@/lib/lifecycle/over-cap";
import { RECENTLY_DELETED_WINDOW_DAYS } from "@/lib/lifecycle/recently-deleted";
import { RENEWAL_NUDGE_DAYS } from "@/lib/lifecycle/renewal";
import { MAX_UPLOAD_BYTES, MIN_UPLOAD_CAP_BYTES } from "@/lib/media/limits";
import { STYLE_CATALOG } from "@/lib/reel/engine/style-registry";
import { cn, formatBytes } from "@/lib/utils";
import { MIN_PASSWORD_LENGTH } from "@/lib/validation/auth";
import { EVENT_PASSWORD_MIN_LENGTH } from "@/lib/validation/event";

// THE SHARED HALF OF THE MDX VOCABULARY (the operating model, 2026-09-02). Every
// MDX surface (help, blog) renders through ONE map, composed in
// ../mdx-components.tsx from this file plus the lane files spec-help.tsx and
// spec-blog.tsx. This file is Orchestrator-owned and grows only by PROMOTION:
// a lane adds a component to its own file, and when a second surface needs it
// the Orchestrator moves it here at integration. Three tracks edited the old
// single file in one evening; two of them shipped the same number under one
// name with different renderings. The rule that settled it: spec components
// render the BARE number ("45", "30"), and the prose says the unit.
//
// Components available to every MDX article (help now, blog later). next-mdx-remote v6
// strips {expressions} (blockJS, on by default) but PRESERVES JSX components — so the
// inline "spec" components below are how articles reference live limits/tiers numbers
// (a hard-coded cap goes stale the day the tier changes). Everything else is prose,
// styled by `prose-help`.
//
// ★ BOUNDARY RULE: this module imports slugify from help.ts, which reaches
// node:fs through the collection loader — NOTHING client-side may ever import
// `mdxComponents` (the article pages that consume it are server components).

// ── Inline spec values (single-sourced from limits.ts / tiers.ts) ───────────────
// The universal per-upload ceiling (photos + videos; size is the only gate).
export const UploadSize = () => <>{formatBytes(MAX_UPLOAD_BYTES)}</>;
// The original help-center trio, kept as ALIASES of the generic pair below so the two
// dialects can never disagree (help articles still use these names).
export const FreeStorage = () => <PlanStorage id="free" />;
export const EventPassStorage = () => <PlanStorage id="event_pass" />;
export const EventPassPrice = () => <PlanPrice id="event_pass" />;
export const ProPrice = () => <PlanPrice id="pro_100" />;

// ── The wider spec family (the blog library, 2026-09) ───────────────────────────
// Naming convention: a name ending in a UNIT (Seconds, Days, Size) renders the bare numeral or
// formatted size and the author writes the unit; a name for a THING (PlanStorage, PlanPrice,
// CapacityEstimate) renders the formatted label. No `bytes` props anywhere: a literal byte
// count in MDX is exactly the drift this family exists to prevent.
/** The reel length for a tier as a bare number ("30" / "60"); the prose says the unit. */
export const ReelSeconds = ({ tier = "free" }: { tier?: Tier }) => (
  <>{MAX_REEL_SECONDS[tier]}</>
);
export const ReelStyleCount = () => <>{STYLE_CATALOG.length}</>;
export const RecoveryWindowDays = () => <>{RECENTLY_DELETED_WINDOW_DAYS}</>;
export const InactiveDays = () => <>{INACTIVE_DAYS}</>;
export const InactiveWarningDays = () => <>{WARN_BEFORE_DAYS}</>;
export const OverCapGraceDays = () => <>{OVER_CAP_GRACE_DAYS}</>;
export const RenewalNudgeDays = () => <>{RENEWAL_NUDGE_DAYS}</>;
export const TeaserCount = () => <>{TEASER_LIMIT}</>;
/** Events that may exist on a tier; `pro` renders the unlimited word. */
export const EventLimit = ({ tier = "free" }: { tier?: Tier }) => (
  <>{formatLimit(MAX_EVENTS[tier])}</>
);
export const PlanStorage = ({ id }: { id: PlanId }) => (
  <>{formatBytes(planById(id).storageBytes)}</>
);
export const PlanPrice = ({ id }: { id: PlanId }) => (
  <>{planById(id).priceLabel}</>
);
export const EventPassRenewalPrice = () => (
  <>{EVENT_PASS_RENEWAL_PRICE_LABEL}</>
);
/** The rule-of-thumb sizes behind every capacity estimate ("about 4 MB a photo"). */
export const PhotoAverageSize = () => <>{formatBytes(AVG_PHOTO_BYTES)}</>;
export const VideoMinuteSize = () => <>{formatBytes(VIDEO_BYTES_PER_MIN)}</>;
/** "19,200 photos or 9 hours of video" for a plan; photos only where the tier has no video
 *  (so `plan="free"` renders the photo count alone, with no second component to reach for). */
export const CapacityEstimate = ({ plan }: { plan: PlanId }) => {
  const p = planById(plan);
  return (
    <>
      {formatCapacity(p.storageBytes, { video: videosAllowedForTier(p.tier) })}
    </>
  );
};

// ── Comparison-table marks: the SAME glyphs as the /pricing matrix (matrix-mark.tsx) ──
// Anything other than a plain yes/no (Partial, Free only, By default) is written as words.
export const Yes = () => <MatrixMark value label="Yes" />;
export const No = () => <MatrixMark value={false} label="No" />;

// ── Tables (the blog's comparison posts). GFM tables already render as <table> inside
// `prose-help` with hairline rows from --tw-prose-td-borders; these overrides add the
// register and the phone behaviour. The WRAPPER scrolls, bleeding to the viewport edge on
// phones so a four-column matrix gets the full width; the label column stays on one line so
// a row keeps its name while the reader scrolls the values. No sticky first column: that
// needs an opaque ground matching the paper chapter, and the pricing matrix does without it
// too. The header register is pricing's (0.08em), not the eyebrow's, since column heads
// are often proper nouns. Numerals are tabular Inter, never mono (the R6 mono rule: mono
// is for numerals that align in a column; these cells mix words and figures).
function MdxTable(props: ComponentProps<"table">) {
  return (
    <div className="-mx-4 my-8 [scrollbar-width:thin] overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <table {...props} className="my-0 w-full min-w-[32rem] text-sm" />
    </div>
  );
}
// `align` arrives from a GFM `|:---:|` / `|---:|` column; the utility only fills in when the author
// left a column unaligned, so a right-aligned numeric column keeps its heads over its figures.
function MdxTh(props: ComponentProps<"th">) {
  return (
    <th
      {...props}
      className={cn(
        "px-3 py-2 align-bottom text-xs font-medium tracking-[0.08em] text-muted-foreground uppercase first:pl-0 last:pr-0",
        !props.align && "text-left",
      )}
    />
  );
}
function MdxTd(props: ComponentProps<"td">) {
  return (
    <td
      {...props}
      className="px-3 py-2.5 align-top text-muted-foreground tabular-nums first:pl-0 first:font-medium first:whitespace-nowrap first:text-foreground last:pr-0"
    />
  );
}

export const FreePrice = () => <>{planById("free").priceLabel}</>;

// The help-catalog round (2026-09-01) widened the family so no marketed limit,
// price, or lifecycle window is ever typed into an article. Each reads ONE
// constant; the content-policy fence stays the guard against literals.
/** "100 GB, 500 GB, or 2 TB": the Pro storage sizes, from the plan list. */
export const ProPlans = () => {
  const sizes = plansForTier("pro").map((p) => formatBytes(p.storageBytes));
  const last = sizes.pop();
  return (
    <>
      {sizes.join(", ")}, or {last}
    </>
  );
};
export const RecoveryDays = () => <>{RECENTLY_DELETED_WINDOW_DAYS} days</>;
/** "one event" / "unlimited events" for a tier. */
export const MaxEvents = ({ tier = "free" }: { tier?: Tier }) => {
  const max = MAX_EVENTS[tier];
  if (max === null) return <>unlimited events</>;
  return <>{max === 1 ? "one event" : `${max} events`}</>;
};
export const UploadCapFloor = () => <>{formatBytes(MIN_UPLOAD_CAP_BYTES)}</>;
/** "about 6 months": the free-tier inactivity window, from the day count. */
export const InactivityMonths = () => (
  <>about {Math.round(INACTIVE_DAYS / 30)} months</>
);
/** "about a year": the Event Pass term. */
export const EventPassTerm = () => {
  const days = planById("event_pass").termDays ?? 365;
  return <>{days >= 360 && days <= 370 ? "about a year" : `${days} days`}</>;
};
/** The EVENT (album) password floor. */
export const PasswordMinLength = () => <>{EVENT_PASSWORD_MIN_LENGTH}</>;
/** The ACCOUNT password floor (a different rule from the album password). */
export const AccountPasswordMinLength = () => <>{MIN_PASSWORD_LENGTH}</>;
/** "12 hours": how long a guest's password unlock lasts. */
export const UnlockHours = () => (
  <>{Math.round(UNLOCK_TTL_SECONDS / 3600)} hours</>
);
/** The tier name as marketed ("Pro", "Event Pass"). */
export const TierName = ({ tier = "pro" }: { tier?: Tier }) => (
  <>{TIER_NAMES[tier]}</>
);

// ── PlanBadge: the quiet entitlement pill ──────────────────────────────────────
// An OUTLINE pill with no fill and no glyph, so it never reads as UiLabel's
// filled "quoted control" chip. One per section at most; the In-short card's
// "Applies to" line carries the entitlement once, this is the inline reminder.
type BadgeTier = Tier | "paid";

const BADGE_LABEL: Record<BadgeTier, string> = {
  free: TIER_NAMES.free,
  pro: TIER_NAMES.pro,
  event_pass: TIER_NAMES.event_pass,
  paid: `${TIER_NAMES.pro} & ${TIER_NAMES.event_pass}`,
};

export function PlanBadge({ tier = "paid" }: { tier?: BadgeTier }) {
  // The design system's outline Badge, re-sized to sit on a prose baseline
  // (Badge's fixed h-5 fights the line box inside a paragraph).
  return (
    <Badge
      variant="outline"
      className="h-auto px-2 py-px align-baseline text-[0.8em] leading-5"
    >
      {BADGE_LABEL[tier]}
    </Badge>
  );
}

// ── Path: "where to find it" ──────────────────────────────────────────────────
// The first-five-seconds question of any how-to, answered as a breadcrumb row
// of chips. Authored as plain text with › between segments
// (<Path>Dashboard › Your event › Settings</Path>); children are flattened
// through toText first because a bolded segment arrives as an array. Reading
// furniture on a high-frequency surface: no motion.
export function Path({ children }: { children: ReactNode }) {
  const segments = toText(children)
    .split("›")
    .map((s) => s.trim())
    .filter(Boolean);
  return (
    <ol
      aria-label="Where to find it"
      className="not-prose my-4 flex flex-wrap items-center gap-1.5 text-sm"
    >
      {segments.map((segment, i) => (
        <li key={`${segment}-${i}`} className="flex items-center gap-1.5">
          {i > 0 && (
            <ChevronRight
              aria-hidden
              className="size-3.5 text-muted-foreground"
            />
          )}
          <span className="rounded-md border bg-card px-2 py-1 font-medium text-foreground">
            {segment}
          </span>
        </li>
      ))}
    </ol>
  );
}

// ── Callout — the main richness add for long-form ───────────────────────────────
// Grayscale + brand only (the destructive token is the one system "alert" color);
// no off-palette colors, per the design system.
type CalloutType = "info" | "tip" | "warning";

const CALLOUT: Record<
  CalloutType,
  { Icon: typeof Info; box: string; icon: string }
> = {
  info: {
    Icon: Info,
    box: "border-border bg-muted/40",
    icon: "text-muted-foreground",
  },
  tip: {
    Icon: Lightbulb,
    box: "border-brand/30 bg-brand/5",
    icon: "text-brand",
  },
  warning: {
    Icon: TriangleAlert,
    box: "border-destructive/30 bg-destructive/5",
    icon: "text-destructive",
  },
};

export function Callout({
  type = "info",
  title,
  children,
}: {
  type?: CalloutType;
  title?: string;
  children: ReactNode;
}) {
  const { Icon, box, icon } = CALLOUT[type];
  return (
    <div className={cn("my-6 flex gap-3.5 rounded-xl border p-4", box)}>
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border bg-card">
        <Icon className={cn("size-4", icon)} aria-hidden />
      </span>
      {/* Trim the first/last child margins so the box hugs its prose content. */}
      <div className="text-sm [&>:first-child]:mt-0 [&>:last-child]:mb-0">
        {title && <p className="font-medium text-foreground">{title}</p>}
        {children}
      </div>
    </div>
  );
}

// ── AlbumShowcase — a real album moment inside an article (decorative) ──────────
// Eight manifest photographs in the browser frame: the media-is-the-color rule
// applied to long-form (the old gray placeholder tiles read as wireframe).
const SHOWCASE_IMAGE_IDS = [
  "party-balloons",
  "wedding-golden",
  "concert-confetti",
  "reception-table",
  "party-dj",
  "wedding-toast",
  "festival-lights",
  "reception-hall",
] as const;

export function AlbumShowcase({
  label,
  caption,
}: {
  label?: string;
  caption?: string;
}) {
  return (
    <figure className="not-prose my-8">
      <BrowserFrame label={label}>
        <div
          aria-hidden
          className="grid grid-cols-4 gap-[var(--gap-gallery)] overflow-hidden rounded-lg"
        >
          {SHOWCASE_IMAGE_IDS.map((id) => {
            const img = marketingImage(id);
            return (
              <span
                key={id}
                className="relative block aspect-square overflow-hidden rounded-[var(--radius-tile)]"
              >
                <Image
                  src={img.src}
                  alt=""
                  fill
                  sizes="180px"
                  className="object-cover"
                />
              </span>
            );
          })}
        </div>
      </BrowserFrame>
      {caption && (
        <figcaption className="mt-3 text-center text-sm text-muted-foreground">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

// Flatten heading children to plain text so we can derive a stable anchor id that
// matches `extractHeadings` (the on-this-page TOC) exactly.
function toText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(toText).join("");
  if (node && typeof node === "object" && "props" in node) {
    return toText((node as { props: { children?: ReactNode } }).props.children);
  }
  return "";
}

// HeadingAnchor lives in reading/heading-anchor.tsx since the legal round (the
// legal shell is not MDX and emits the same markup); HEADING_SCROLL_MT stays in
// reading/heading-contract.ts, the import-free leaf the ToC island can share.

function H2({ children }: { children?: ReactNode }) {
  const id = slugify(toText(children));
  return (
    <h2 id={id} className={cn("group", HEADING_SCROLL_MT)}>
      {children}
      <HeadingAnchor id={id} />
    </h2>
  );
}

function H3({ children }: { children?: ReactNode }) {
  const id = slugify(toText(children));
  return (
    <h3 id={id} className={cn("group", HEADING_SCROLL_MT)}>
      {children}
      <HeadingAnchor id={id} />
    </h3>
  );
}

// ── Steps — numbered procedures with a tabular numeral rail ─────────────────────
// Numerals stay on the UI (sans) face with tabular-nums for alignment; no mono
// anywhere. Steps injects the index so authors never hand-number.
type StepProps = { index?: number; title: string; children?: ReactNode };

export function Step({ index = 1, title, children }: StepProps) {
  return (
    <li className="group relative flex gap-4 pb-7 last:pb-0">
      {/* The connector: from below this numeral to the next one; none after the last. */}
      <span
        aria-hidden
        className="absolute top-8 bottom-0 left-[13px] w-px bg-border group-last:hidden"
      />
      <span className="z-10 flex size-7 shrink-0 items-center justify-center rounded-full border bg-card text-[11px] text-muted-foreground tabular-nums">
        {String(index).padStart(2, "0")}
      </span>
      <div className="min-w-0 pt-0.5 text-sm leading-6">
        <p className="font-medium text-foreground">{title}</p>
        {children && (
          <div className="mt-1 text-muted-foreground [&>:first-child]:mt-0 [&>:last-child]:mb-0">
            {children}
          </div>
        )}
      </div>
    </li>
  );
}

export function Steps({ children }: { children: ReactNode }) {
  const items = Children.toArray(children);
  return (
    <ol className="not-prose my-6 flex flex-col">
      {items.map((child, i) =>
        isValidElement<StepProps>(child)
          ? cloneElement(child as ReactElement<StepProps>, { index: i + 1 })
          : child,
      )}
    </ol>
  );
}

// ── UiLabel — a quoted app string ("Approve all") as a chip (R6) ───────────────
// The mock-fidelity rule made visible: readers should recognize these exact
// words in the product.
export function UiLabel({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-md border bg-muted px-1.5 py-0.5 text-[0.85em] font-medium whitespace-nowrap text-foreground">
      {children}
    </span>
  );
}

// Internal links route through Next <Link> (client nav); external links open safely.
function MdxLink({ href = "", children, ...props }: ComponentProps<"a">) {
  if (href.startsWith("/")) {
    return <Link href={href}>{children}</Link>;
  }
  const isExternal = href.startsWith("http");
  return (
    <a
      href={href}
      {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      {...props}
    >
      {children}
    </a>
  );
}

// The shared half of the map; mdx-components.tsx composes it with the lane files.
export const sharedComponents = {
  a: MdxLink,
  h2: H2,
  h3: H3,
  Callout,
  AlbumShowcase,
  Steps,
  Step,
  Kbd,
  UiLabel,
  PlanBadge,
  Path,
  Checklist,
  Check,
  UploadSize,
  FreeStorage,
  EventPassStorage,
  FreePrice,
  EventPassPrice,
  ProPrice,
  ReelSeconds,
  ReelStyleCount,
  RecoveryWindowDays,
  InactiveDays,
  InactiveWarningDays,
  OverCapGraceDays,
  RenewalNudgeDays,
  TeaserCount,
  EventLimit,
  PlanStorage,
  PlanPrice,
  EventPassRenewalPrice,
  PhotoAverageSize,
  VideoMinuteSize,
  CapacityEstimate,
  Yes,
  No,
  table: MdxTable,
  th: MdxTh,
  td: MdxTd,
  ProPlans,
  RecoveryDays,
  MaxEvents,
  UploadCapFloor,
  InactivityMonths,
  EventPassTerm,
  PasswordMinLength,
  AccountPasswordMinLength,
  UnlockHours,
  TierName,
};
