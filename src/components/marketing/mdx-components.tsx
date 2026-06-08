import { Info, Lightbulb, TriangleAlert } from "lucide-react";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

import { AlbumFrame } from "@/components/marketing/frames";
import { slugify } from "@/lib/content/help";
import { planById } from "@/lib/constants/tiers";
import { MAX_UPLOAD_BYTES } from "@/lib/media/limits";
import { cn, formatBytes } from "@/lib/utils";

// Components available to every MDX article (help now, blog later). next-mdx-remote v6
// strips {expressions} (blockJS, on by default) but PRESERVES JSX components — so the
// inline "spec" components below are how articles reference live limits/tiers numbers
// (never hard-code a cap; CLAUDE.md). Everything else is prose, styled by `prose-help`.

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
    <div className={cn("my-6 flex gap-3 rounded-xl border p-4", box)}>
      <Icon className={cn("mt-0.5 size-5 shrink-0", icon)} aria-hidden />
      {/* Trim the first/last child margins so the box hugs its prose content. */}
      <div className="text-sm [&>:first-child]:mt-0 [&>:last-child]:mb-0">
        {title && <p className="font-medium text-foreground">{title}</p>}
        {children}
      </div>
    </div>
  );
}

// ── AlbumShowcase — drop the shared media frame into an article (decorative) ─────
export function AlbumShowcase({
  label,
  caption,
}: {
  label?: string;
  caption?: string;
}) {
  return (
    <figure className="not-prose my-8">
      <AlbumFrame label={label} />
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

// `scroll-mt-24` so a TOC/anchor jump clears the sticky h-16 header (otherwise the
// heading lands flush under it — caught in live testing).
function H2({ children }: { children?: ReactNode }) {
  return (
    <h2 id={slugify(toText(children))} className="scroll-mt-24">
      {children}
    </h2>
  );
}

function H3({ children }: { children?: ReactNode }) {
  return (
    <h3 id={slugify(toText(children))} className="scroll-mt-24">
      {children}
    </h3>
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
  UploadSize,
  FreeStorage,
  EventPassStorage,
  EventPassPrice,
  ProPrice,
};
