"use client";

import Image from "next/image";
import { type CSSProperties } from "react";

import { Caption } from "@/components/marketing/system/caption";
import { cn } from "@/lib/utils";

import { routeOutcome, type BridgePost } from "./bridge";
import { candidate, candidateSrc } from "./candidates";
import { MANIFEST_BY_ID, type Route } from "./kit";
import { master } from "./shoot";

/**
 * THE TWO PRODUCTION GEOMETRIES, AND THE PROVENANCE LINE UNDER THEM (lifted out
 * of board.tsx at the migration wave, 2026-09-15; the drawing is unchanged).
 *
 * "Does this frame survive where it lands" is a geometry question, so the two
 * plate shapes here are the production ones rather than a square thumbnail: the
 * blog card's 4:5 with the slug-derived rung of the crop ladder, and the share
 * card's 1200x630 CENTRE crop, which ignores the ladder entirely.
 *
 * ★ BOTH ROWS OF A COMPARISON ARE DRAWN AT THE SAME RUNG. The candidate used to
 * be drawn centred, which made a side by side a comparison of two different
 * things. `coverFor` derives object-position from the SLUG alone, so neither an
 * applied block (a `content` swap leaves object-position where it was) nor the
 * wiring round's frontmatter edit moves it: a candidate lands at the post's own
 * rung, and the offsite post's frame really is cut at 62% 50%. Drawing it centred
 * flattered every candidate by exactly what the real card takes off its side.
 *
 * ★ AND THE PROVENANCE LINE SITS UNDER THE PLATE, NEVER ON IT. The plate is the
 * real card; the annotation is board chrome, and the whole point of the section
 * is that the two are not the same thing (the kit's specimen rule, one layer
 * out).
 */

export function Tag({
  tone,
  children,
}: {
  tone: "gap" | "named" | "ours" | "face" | "empty";
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-1.5 py-px text-[10px] font-medium",
        tone === "gap" && "bg-destructive/10 text-destructive",
        tone === "face" && "bg-destructive/15 text-destructive",
        tone === "named" && "bg-muted text-muted-foreground",
        tone === "empty" &&
          "border border-dashed border-border text-muted-foreground",
        tone === "ours" && "bg-foreground text-background",
      )}
    >
      {children}
    </span>
  );
}

export function CandidateLine({ keyName }: { keyName: string }) {
  const c = candidate(keyName);
  return (
    <div className="mt-1.5 space-y-0.5">
      <div className="flex flex-wrap items-center gap-1">
        <Tag tone="named">CC0 1.0</Tag>
        {c.people === "identifiable" ? (
          <Tag tone="face">A face, no release</Tag>
        ) : (
          <Tag tone="named">
            {c.people === "none" ? "Nobody in frame" : "Nobody recognisable"}
          </Tag>
        )}
        {c.staged === 2 && <Tag tone="named">Second search</Tag>}
      </div>
      <p className="text-[10px] leading-snug text-muted-foreground tabular-nums">
        {c.author}, Wikimedia Commons, retrieved 2026-09-14
      </p>
      {c.caution && (
        <p className="rounded border border-destructive/30 bg-destructive/5 px-1.5 py-1 text-[10px] leading-snug text-destructive">
          {c.caution}
        </p>
      )}
    </div>
  );
}

/** Mirrors post-card.tsx: aspect-4/5, object-cover, the coverFor object-position,
 *  the bottom scrim, white type. Not the component itself, because PostCard is a
 *  Link that would navigate out of the lab and it cannot swap its own source.
 *
 *  ★ `full` IS THE REAL CARD, `sheet` IS A THUMBNAIL OF IT. Measured on the
 *  running blog at 1440: the library card is 320 by 400 with a 16 px gutter,
 *  three across, its title `text-lg` (18 px) over a `p-5` block with the byline
 *  under it. The contact sheet runs plates at about 220 px, where 18 px type
 *  would be a different composition, so the sheet steps the type down and drops
 *  the byline and the stage does not. The tag chips in the real card's top left
 *  are the one thing neither draws (the board holds no tag data, and inventing
 *  two would be a worse lie than leaving the corner empty). */
export function CardPlate({
  src,
  title,
  crop,
  slate,
  full = false,
  titleRef,
}: {
  src: string | null;
  title: string;
  crop: string;
  slate?: string;
  /** Draw it at the real card's type and padding, for the stage. */
  full?: boolean;
  /** The kit's useLineCount ref, for the one plate that reports its own wrap. */
  titleRef?: React.RefObject<HTMLElement | null>;
}) {
  return (
    <div className="relative aspect-4/5 overflow-hidden bg-muted">
      {src ? (
        <Image
          src={src}
          alt=""
          fill
          sizes={full ? "320px" : "(max-width: 640px) 45vw, 220px"}
          className="object-cover"
          style={{ objectPosition: crop }}
        />
      ) : (
        <div
          className={cn(
            "absolute inset-0 grid place-items-center bg-[repeating-linear-gradient(135deg,transparent,transparent_7px,var(--border)_7px,var(--border)_8px)] text-center",
            full ? "p-5" : "p-3",
          )}
        >
          <Caption
            className={cn("leading-snug", full ? "text-xs" : "text-[10px]")}
          >
            {slate ?? "Nothing to show"}
          </Caption>
        </div>
      )}
      {src && (
        <>
          <span
            aria-hidden
            className="absolute inset-0 bg-linear-to-t from-black/85 via-black/40 to-black/10"
          />
          <span
            className={cn(
              "absolute inset-x-0 bottom-0 flex flex-col",
              full ? "gap-2 p-5" : "p-3",
            )}
          >
            <span
              ref={titleRef as React.RefObject<HTMLSpanElement | null>}
              className={cn(
                "line-clamp-2 font-heading leading-tight text-balance text-white",
                full ? "text-lg" : "text-[13px]",
              )}
            >
              {title}
            </span>
            {full && (
              <span className="text-xs text-white/65">
                <span className="font-medium text-white">Partyreel Team</span>
              </span>
            )}
          </span>
        </>
      )}
    </div>
  );
}

/** Mirrors blog/[slug]/opengraph-image.tsx at 1200x630: a flat 30 percent base, a
 *  two-stop gradient, the mark top left, the title and byline bottom left.
 *  ★ Sizes are cqw of 1200 so the mock is geometrically exact at any width, and
 *  ★ the cover carries NO object-position, because the real card does not either:
 *  the share image is always the middle of a frame composed for a 4:5 ladder. */
export function SharePlate({
  src,
  title,
  slate,
}: {
  src: string | null;
  title: string;
  slate?: string;
}) {
  const cq = (px: number) => `${((px / 1200) * 100).toFixed(3)}cqw`;
  return (
    <div
      className="relative aspect-[40/21] overflow-hidden bg-[#0d0d0d]"
      style={{ containerType: "inline-size" }}
    >
      {src ? (
        <Image
          src={src}
          alt=""
          fill
          sizes="(max-width: 640px) 92vw, 420px"
          className="object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-[repeating-linear-gradient(135deg,transparent,transparent_7px,#1f1f1f_7px,#1f1f1f_8px)]" />
      )}
      <span aria-hidden className="absolute inset-0 bg-black/30" />
      <span
        aria-hidden
        className="absolute inset-0 bg-linear-to-t from-black/90 to-transparent to-60%"
      />
      <span
        className="absolute flex items-center"
        style={{ top: cq(80), left: cq(80), gap: cq(20) }}
      >
        <span
          className="grid place-items-center bg-[#fafafa]"
          style={{ width: cq(56), height: cq(56), borderRadius: cq(14) }}
        />
        <span style={{ fontSize: cq(28), color: "#e4e4e7" }}>
          Partyreel Blog
        </span>
      </span>
      <span
        className="absolute inset-x-0 bottom-0 flex flex-col"
        style={{ padding: `0 ${cq(80)} ${cq(80)}`, gap: cq(22) }}
      >
        <span
          className="font-heading font-bold text-[#fafafa]"
          style={{
            fontSize: cq(58),
            lineHeight: 1.08,
            letterSpacing: "-0.02em",
          }}
        >
          {title}
        </span>
        <span style={{ fontSize: cq(28), color: "#d4d4d8" }}>
          {slate ?? "Will Gibson"}
        </span>
      </span>
    </div>
  );
}

/** The route's outcome (bridge.ts, shared with the sheet and the tests) plus the
 *  master frame the slate names, which only the board needs. */
export function whatReplaces(post: BridgePost, route: Route) {
  const out = routeOutcome(post, route);
  return out.kind === "ours"
    ? { kind: "ours" as const, master: master(post.shot) }
    : out;
}

export function PostRow({
  post,
  route,
  geometry,
  index,
}: {
  post: BridgePost;
  route: Route;
  geometry: "card" | "share";
  index: number;
}) {
  const current = MANIFEST_BY_ID.get(post.cover);
  const next = whatReplaces(post, route);
  const Plate = geometry === "card" ? CardPlate : SharePlate;
  const slate =
    next.kind === "ours"
      ? `To be shot, ${next.master.code}: ${next.master.subject}`
      : post.candidate
        ? undefined
        : post.why;

  if (!current) return null;

  return (
    <div className="flex flex-col">
      <div
        className={cn(
          "grid gap-2",
          geometry === "card" ? "grid-cols-2" : "grid-cols-1",
        )}
      >
        <div>
          <Caption className="mb-1 block text-[10px]">Today</Caption>
          {geometry === "card" ? (
            <CardPlate src={current.src} title={post.title} crop={post.crop} />
          ) : (
            <SharePlate src={current.src} title={post.title} />
          )}
          <p className="mt-1 text-[10px] leading-snug text-muted-foreground tabular-nums">
            {post.cover} at {geometry === "card" ? post.crop : "centre"}
          </p>
        </div>
        <div
          key={`${route}-${next.kind}`}
          data-mkt-develop
          style={{ "--i": index % 4 } as CSSProperties}
        >
          <Caption className="mb-1 block text-[10px]">
            {next.kind === "ours" ? "Shot" : "Bridge"}
          </Caption>
          {next.kind === "licensed" && next.key ? (
            <>
              <Plate
                src={candidateSrc(next.key)}
                title={post.title}
                crop={post.crop}
              />
              <CandidateLine keyName={next.key} />
            </>
          ) : (
            <Plate
              src={null}
              title={post.title}
              crop={post.crop}
              slate={slate}
            />
          )}
        </div>
      </div>
      <p className="mt-2 text-[11px] leading-tight font-medium">{post.title}</p>
      <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
        <span className="uppercase">{post.vertical}</span>. {post.why}
      </p>
    </div>
  );
}
