import { Check, Info, Lightbulb, Link2, TriangleAlert } from "lucide-react";
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
import { Kbd } from "@/components/shared/kbd";
import { marketingImage } from "@/lib/constants/marketing-media";
import { slugify } from "@/lib/content/help";
import { planById } from "@/lib/constants/tiers";
import { MAX_UPLOAD_BYTES } from "@/lib/media/limits";
import { cn, formatBytes } from "@/lib/utils";

// Components available to every MDX article (help now, blog later). next-mdx-remote v6
// strips {expressions} (blockJS, on by default) but PRESERVES JSX components — so the
// inline "spec" components below are how articles reference live limits/tiers numbers
// (never hard-code a cap; CLAUDE.md). Everything else is prose, styled by `prose-help`.
//
// ★ BOUNDARY RULE: this module imports slugify from help.ts, which reaches
// node:fs through the collection loader — NOTHING client-side may ever import
// `mdxComponents` (the article pages that consume it are server components).

// ── Inline spec values (single-sourced from limits.ts / tiers.ts) ───────────────
// The universal per-upload ceiling (photos + videos; size is the only gate).
export const UploadSize = () => <>{formatBytes(MAX_UPLOAD_BYTES)}</>;
export const FreeStorage = () => (
  <>{formatBytes(planById("free").storageBytes)}</>
);
export const EventPassStorage = () => (
  <>{formatBytes(planById("event_pass").storageBytes)}</>
);
export const EventPassPrice = () => <>{planById("event_pass").priceLabel}</>;
export const ProPrice = () => <>{planById("pro_100").priceLabel}</>;

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

// The scroll margin rides --mkt-header-h (the one chrome-height knob; same calc as
// SectionShell) so a TOC/anchor jump clears the sticky header even if its height is
// ever retuned (the old hardcoded scroll-mt-24 silently coupled to h-16).
const HEADING_SCROLL_MT = "scroll-mt-[calc(var(--mkt-header-h,4rem)+1rem)]";

// The copy-link affordance (R6): server-rendered markup only — a real anchor
// (no-JS still jumps) that the ONE HeadingAnchorsDelegate island upgrades to
// copy-the-deep-link + the icon-swap check (the 09-icon-swap recipe). Trailing
// inline so it never disturbs heading wrap; opacity-revealed on heading hover
// or its own focus.
function HeadingAnchor({ id }: { id: string }) {
  return (
    <a
      href={`#${id}`}
      data-anchor-copy={id}
      aria-label="Copy link to this section"
      className="ml-2 inline-flex rounded-md align-baseline text-muted-foreground opacity-0 transition-opacity duration-150 group-hover:opacity-100 hover:text-foreground focus-visible:opacity-100"
    >
      <span className="mkt-icon-swap" data-state="a" aria-hidden>
        <Link2 className="mkt-icon size-4" data-icon="a" />
        <Check className="mkt-icon size-4 text-success" data-icon="b" />
      </span>
    </a>
  );
}

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

// ── Steps — numbered procedures with the mono numeral rail (R6) ────────────────
// Numerals are mono BY RULING (mono is for numerals/tabular alignment only);
// everything else stays the UI face. Steps injects the index so authors never
// hand-number.
type StepProps = { index?: number; title: string; children?: ReactNode };

export function Step({ index = 1, title, children }: StepProps) {
  return (
    <li className="group relative flex gap-4 pb-7 last:pb-0">
      {/* The connector: from below this numeral to the next one; none after the last. */}
      <span
        aria-hidden
        className="absolute top-8 bottom-0 left-[13px] w-px bg-border group-last:hidden"
      />
      <span className="z-10 flex size-7 shrink-0 items-center justify-center rounded-full border bg-card font-mono text-[11px] text-muted-foreground">
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

// Passed to <MDXRemote components={mdxComponents} />.
export const mdxComponents = {
  a: MdxLink,
  h2: H2,
  h3: H3,
  Callout,
  AlbumShowcase,
  Steps,
  Step,
  Kbd,
  UiLabel,
  UploadSize,
  FreeStorage,
  EventPassStorage,
  EventPassPrice,
  ProPrice,
};
