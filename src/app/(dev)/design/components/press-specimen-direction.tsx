"use client";

import type { CSSProperties, ReactNode } from "react";

import { PRESS_KIT } from "@/lib/constants/press";
import { cn } from "@/lib/utils";

import { Reveal } from "./marketing-lab-shared";
import {
  CopyButton,
  DownloadKit,
  PRESS_BOILERPLATE,
  PRESS_BOILERPLATE_SHORT,
  PRESS_COPY,
  PRESS_FACTS,
  PRESS_INK,
  PRESS_USAGE_RULES,
  formatKitBytes,
} from "./press-lab-shared";

/**
 * V2 THE SPECIMEN SHEET. The press kit as a type-foundry specimen. All paper, no ink
 * plate, no photography: the texture is type, scale and rule-work alone.
 *
 * WHY THE NAME OPENS IT AND NOT THE MARK: a giant glyph would be a shrine to artwork
 * that is being replaced before launch, and at display size the current mark is a thin
 * wire drawing, so Will would be ruling on a placeholder. The WORD is the brand and it
 * survives the change. It is also set here EXACTLY as the product sets it, which turned
 * up a real defect: shared/logo.tsx renders the name with font-semibold and never calls
 * font-heading, so the wordmark is INTER SEMIBOLD, not Urbanist, and `tracking-tight`
 * resolves to 0em by design-system ruling. The old /press caption told journalists the
 * opposite. A specimen that is wrong about its own faces is worse than no specimen.
 *
 * THE ONLY MOTION IS THE FURNITURE. The type never moves; the register's hairlines draw
 * in from the left, staggered ([data-mkt-rule] + [data-press-register] in design.css).
 * A press setting a page. Note [data-mkt-rule] is currently LAB-ONLY: it was dropped on
 * promotion to marketing.css when Direction A lost. If this direction wins, re-promoting
 * it is about four lines and revives a mechanic the site lost.
 *
 * THE MEASURE is what this direction has that V1 structurally cannot: a real 1:1 rail
 * down the register, so "minimum size 24px" is visibly 24 ticks tall. Labelled in px
 * only, never mm, because a screen ruler in millimetres is a lie at arbitrary zoom.
 */

/** The 8px tick rail. A gradient, not 200 elements. */
const RAIL =
  "bg-[repeating-linear-gradient(to_bottom,var(--border)_0_1px,transparent_1px_8px)]";

function Row({
  index,
  label,
  body,
  children,
}: {
  index: number;
  label: string;
  body: string;
  children?: ReactNode;
}) {
  return (
    <div className="relative pt-6">
      <span
        data-mkt-rule
        style={{ "--i": index } as CSSProperties}
        className="absolute inset-x-0 top-0 block h-px bg-border"
      />
      <div className="grid gap-5 sm:grid-cols-[minmax(0,13rem)_minmax(0,1fr)] sm:gap-10">
        <div className="flex min-h-[3.5rem] items-start">
          {children ?? (
            <span className="font-mono text-[11px] tracking-wider text-muted-foreground">
              {String(index + 1).padStart(2, "0")}
            </span>
          )}
        </div>
        <div className="pb-8">
          <h3 className="font-heading text-lg">{label}</h3>
          <p className="mt-1.5 max-w-prose text-sm text-pretty text-muted-foreground">
            {body}
          </p>
        </div>
      </div>
    </div>
  );
}

/** The demonstration for each rule, keyed by title so the copy stays the single source. */
function Demo({ title }: { title: string }) {
  switch (title) {
    case "The name":
      return (
        <span className="text-2xl font-semibold">
          Partyreel
          <span className="mt-1 block font-mono text-[11px] font-normal text-muted-foreground line-through decoration-foreground/40">
            PartyReel Party Reel PARTYREEL
          </span>
        </span>
      );
    case "Clear space":
      return (
        <span className="inline-flex border border-dashed border-foreground/30 p-[14px]">
          <span className="flex size-14 items-center justify-center bg-foreground">
            {/* eslint-disable-next-line @next/next/no-img-element -- static asset. */}
            <img
              src="/press/partyreel-mark-light.svg"
              alt=""
              className="size-7"
            />
          </span>
        </span>
      );
    case "Minimum size":
      // At ACTUAL size against the rail: the one spec almost no brand page shows true.
      return (
        <span className="flex items-end gap-4">
          {[24, 16].map((px) => (
            <span key={px} className="flex flex-col items-center gap-1.5">
              {/* eslint-disable-next-line @next/next/no-img-element -- static asset. */}
              <img
                src="/press/partyreel-mark-mono.svg"
                alt=""
                style={{ width: px, height: px }}
              />
              <span className="font-mono text-[10px] text-muted-foreground">
                {px}px
              </span>
            </span>
          ))}
          <span className="mb-4 font-mono text-[10px] text-muted-foreground">
            at 1:1 on this screen
          </span>
        </span>
      );
    case "Ink":
      return (
        <span className="flex items-center gap-3">
          <span className="size-14 bg-[#101010]" />
          <span className="font-mono text-[11px] text-muted-foreground">
            {PRESS_INK}
          </span>
        </span>
      );
    case "Type":
      return (
        <span className="flex items-end gap-5">
          <span className="flex flex-col">
            <span className="font-heading text-4xl leading-none">Aa</span>
            <span className="mt-1.5 font-mono text-[10px] text-muted-foreground">
              Urbanist 700
            </span>
          </span>
          <span className="flex flex-col">
            <span className="text-4xl leading-none font-semibold">Aa</span>
            <span className="mt-1.5 font-mono text-[10px] text-muted-foreground">
              Inter 600
            </span>
          </span>
        </span>
      );
    case "Quoting":
      return (
        <span className="font-heading text-5xl leading-none text-foreground/25">
          &ldquo; &rdquo;
        </span>
      );
    default:
      return (
        <span className="font-mono text-[11px] tracking-wider text-muted-foreground">
          NO
        </span>
      );
  }
}

export function PressSpecimenDirection() {
  return (
    <div className="surface-paper overflow-hidden rounded-2xl border bg-background text-foreground">
      {/* THE SPECIMEN HEAD. No centered hero: the name at size, on the top hairline,
          with the colophon hanging in the margin. Set exactly as shared/logo.tsx sets
          it (Inter semibold, tracking-tight = 0em by ruling), because this IS the
          wordmark and a specimen has to be true. */}
      <header className="px-6 pt-10 sm:px-10 sm:pt-14">
        <div className="flex flex-col gap-2 border-t border-foreground pt-4 sm:flex-row sm:items-baseline sm:justify-between">
          <p className="font-mono text-[11px] tracking-wider text-muted-foreground">
            Partyreel · Brand assets · v1 · 2026
          </p>
          <p className="font-mono text-[11px] tracking-wider text-muted-foreground">
            {PRESS_COPY.kitMeta}
          </p>
        </div>
        <p
          aria-hidden
          className="mt-6 text-[clamp(3rem,13vw,9rem)] leading-[0.9] font-semibold tracking-tight"
        >
          Partyreel
        </p>
        <div className="mt-10 grid gap-8 border-t pt-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
          <div>
            <h1 className="max-w-2xl font-heading text-4xl text-balance sm:text-5xl md:text-6xl">
              {PRESS_COPY.h1}
            </h1>
            <p className="mt-5 max-w-xl text-lg text-pretty text-muted-foreground">
              {PRESS_COPY.standfirst}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <DownloadKit />
              <CopyButton
                value={PRESS_BOILERPLATE}
                label="Copy the boilerplate"
                className="h-10 px-4"
              />
            </div>
          </div>

          {/* DOWNLOADS AS A MARGIN INDEX: foundry-quiet rows, no cards, no chips. */}
          <div className="lg:border-l lg:pl-8">
            <p className="font-mono text-[11px] tracking-wider text-muted-foreground">
              THE FILES
            </p>
            <ul className="mt-3">
              {PRESS_KIT.map((asset) => (
                <li key={asset.id}>
                  <a
                    href={asset.file}
                    download
                    className="flex items-baseline gap-3 border-b py-2 font-mono text-[11px] text-muted-foreground transition-colors duration-150 ease-[var(--dir-ease)] hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    <span className="truncate">
                      {asset.file.split("/").pop()}
                    </span>
                    <span className="ml-auto shrink-0 tabular-nums">
                      {formatKitBytes(asset.bytes)}
                    </span>
                    <span aria-hidden className="shrink-0">
                      &darr;
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </header>

      {/* THE REGISTER, against the 1:1 rail. */}
      <Reveal>
        <section
          data-press-register
          className="mt-14 grid grid-cols-[10px_minmax(0,1fr)] gap-6 px-6 pb-4 sm:px-10"
        >
          <div className={cn("border-r", RAIL)} aria-hidden />
          <div>
            <p className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
              {PRESS_COPY.rulesLabel}
            </p>
            <div className="mt-6">
              {PRESS_USAGE_RULES.map((rule, i) => (
                <Row
                  key={rule.title}
                  index={i}
                  label={rule.title}
                  body={rule.body}
                >
                  <Demo title={rule.title} />
                </Row>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      {/* THE TEXT SETTING: the boilerplate presented as type, with a hanging mono label. */}
      <section className="px-6 py-12 sm:px-10">
        <div className="grid gap-6 border-t pt-8 sm:grid-cols-[minmax(0,10rem)_minmax(0,1fr)] sm:gap-10">
          <div className="flex flex-col gap-2">
            <p className="font-mono text-[11px] tracking-wider text-muted-foreground">
              {PRESS_COPY.boilerplateLabel.toUpperCase()}
            </p>
            <CopyButton
              value={PRESS_BOILERPLATE}
              label="Copy"
              className="self-start"
            />
          </div>
          <div className="max-w-prose">
            <p className="text-lg leading-8 text-pretty">{PRESS_BOILERPLATE}</p>
          </div>
        </div>
        <div className="mt-8 grid gap-6 border-t pt-8 sm:grid-cols-[minmax(0,10rem)_minmax(0,1fr)] sm:gap-10">
          <div className="flex flex-col gap-2">
            <p className="font-mono text-[11px] tracking-wider text-muted-foreground">
              {PRESS_COPY.shortLabel.toUpperCase()}
            </p>
            <CopyButton
              value={PRESS_BOILERPLATE_SHORT}
              label="Copy"
              className="self-start"
            />
          </div>
          <p className="max-w-prose text-pretty text-muted-foreground">
            {PRESS_BOILERPLATE_SHORT}
          </p>
        </div>
      </section>

      {/* THE COLOPHON. */}
      <section className="px-6 pb-14 sm:px-10">
        <div className="border-t pt-8">
          <p className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
            {PRESS_COPY.factsLabel}
          </p>
          <dl className="mt-5 grid max-w-4xl gap-x-10 sm:grid-cols-2">
            {PRESS_FACTS.map(({ label, value }) => (
              <div key={label} className="flex gap-4 border-b py-2.5">
                <dt className="w-28 shrink-0 text-sm font-medium">{label}</dt>
                <dd
                  className={cn(
                    "text-sm text-pretty text-muted-foreground",
                    /^[\d$]|@|\.com/.test(value) && "font-mono text-[13px]",
                  )}
                >
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="mt-12 max-w-xl">
          <h2 className="font-heading text-2xl text-balance sm:text-3xl">
            {PRESS_COPY.closeHeading}
          </h2>
          <p className="mt-3 text-pretty text-muted-foreground">
            {PRESS_COPY.closeBody}
          </p>
          <p className="mt-5">
            <a
              href="mailto:help@partyreel.com"
              className="text-base font-medium underline decoration-current/30 underline-offset-4 transition-colors duration-150 hover:decoration-current"
            >
              help@partyreel.com
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}
